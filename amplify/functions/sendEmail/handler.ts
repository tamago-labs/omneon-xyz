import type { Handler } from 'aws-lambda';
import type { Schema } from "../../data/resource"
import { ChatAnthropic } from "@langchain/anthropic"
import { AIMessage, BaseMessage, ChatMessage, HumanMessage } from "@langchain/core/messages"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getFullnodeUrl, IotaClient } from '@iota/iota-sdk/client';
import MARKETS from "../../../data/markets.json"
import BigNumber from "bignumber.js";

const sesClient = new SESClient({ region: "ap-southeast-1" });


const llm = new ChatAnthropic({
    temperature: 0.7,
    model: "claude-3-5-sonnet-latest",
    apiKey: process.env.ANTHROPIC_API_KEY,
})
 
export const handler: Schema["SendEmail"]["functionHandler"] = async (event) => {

    const { userId, walletAddress } = event.arguments

    const payload = await getMarketData(walletAddress || "")

    console.log("market data: ", payload)

    const agent: any = await setupAgent()

    const output = await agent.invoke(
        {
            messages: [
                {
                    role: 'user',
                    content: `Please summarize the following JSON data into a clear and concise email format suitable for user notifications. \n${JSON.stringify(payload)}`
                }
            ]
        }
    )

    const finalized = parseLangchain(output.messages)

    console.log("final messages :", finalized)

    const content = finalized[finalized.length - 1]?.content;

    console.log("content: ", content)

    const recipient = userId || "";
    const subject = `Your Omneon Updates ${(new Date().toDateString())}`;
    const body = content;

    const command = new SendEmailCommand({
        Source: "hello@omneon.xyz",
        Destination: {
            ToAddresses: [recipient],
        },
        Message: {
            Body: {
                Html: { Data: body },
            },
            Subject: { Data: subject },
        },
    });

    let message

    try {
        const result = await sesClient.send(command);
        message = `Email sent to ${recipient}: ${result.MessageId}`
    } catch (error: any) {
        console.error(`Error sending email to ${recipient}: ${error}`);
        message = `Failed to send email to ${recipient}: ${error?.message}`
    }

    return {
        userId: userId,
        message,
        content
    }
}

const setupAgent = async () => {

    // Create React agent
    const agent = createReactAgent({
        llm,
        tools: [],
        messageModifier: [
            `You are a helpful assistant to interpret JSON data from a DeFi lending protocol and generate HTML content for sending emails to users.\n`,
            `Your role is to analyze user-specific data and present it clearly and effectively via email, helping users understand their current lending and borrowing status.\n`,
            `Core Tasks:\n`,
            `1. Summarize each market, including basic stats such as utilization rate, total supply, total borrow, and interest rates.\n`,
            `2. For any market that includes an activePosition (indicating the user has borrowed assets), provide a dedicated summary of their position:\n`,
            `  - Show borrowed amount, collateral value, and health factor.\n. `,
            `  - Clearly highlight if the health factor is below a safe threshold (e.g., <1.25), alerting the user to take action.\n`,
            `Rules:\n`,
            `- Format the output in clean, semantic HTML for email delivery.\n`,
            `- Use clear language; avoid technical jargon where possible.\n`,
            `- Emphasize critical information using simple cues like bold or colored text.\n`,
            `- Do not hallucinate data — only report what is present in the JSON.\n`
        ].join("")
    })

    return agent
}


const parseLangchain = (messages: any) => {
    let finalized: any = []

    messages.map((msg: any) => {
        const role = msg?.additional_kwargs && Object.keys(msg?.additional_kwargs).length === 0 ? "user" : "assistant"

        if (msg?.tool_call_id) {
            finalized.push({
                content: [
                    {
                        type: "tool_result",
                        tool_use_id: msg.tool_call_id,
                        content: msg.kwargs?.content || msg.content,
                    }
                ],
                role: "user",
                id: msg.kwargs?.id || msg.id
            })
        } else {
            finalized.push({
                role,
                content: msg.kwargs?.content || msg.content,
                id: msg.kwargs?.id || msg.id
            })
        }
    })
    return finalized
}

const getMarketData = async (walletAddress: string) => {

    const rpcUrl = getFullnodeUrl('testnet');
    const client = new IotaClient({ url: rpcUrl });

    const { data } = await client.getObject({
        id: "0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87",
        options: {
            showType: false,
            showOwner: false,
            showPreviousTransaction: false,
            showDisplay: false,
            showContent: true,
            showBcs: false,
            showStorageRebate: false,
        },
    });

    const content: any = data?.content;

    if (!content) {
        return []
    }

    const tableId = content.fields.pools.fields.id.id;
    const dynamicFieldPage = await client.getDynamicFields({
        parentId: tableId,
    });

    let count = 0;
    let output = [];

    for (let pool of dynamicFieldPage.data) {
        const { objectId } = pool;
        const result: any = await client.getObject({
            id: objectId,
            options: {
                showType: false,
                showOwner: false,
                showPreviousTransaction: false,
                showDisplay: false,
                showContent: true,
                showBcs: false,
                showStorageRebate: false,
            },
        });
        const fields = result.data.content.fields.value.fields;

        let totalSupply = 0;
        let totalBorrow = 0;

        const currentPrice = Number(fields.current_price) / 10000;
        const market =
            fields.share_supply.type ===
                "0x2::balance::Supply<0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::SHARE<0x2::iota::IOTA, 0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::mock_vusd::MOCK_VUSD>>"
                ? MARKETS[1]
                : MARKETS[0];

        if (market.id === 0) {
            totalSupply = toUSD(
                "VUSD",
                Number(`${BigNumber(fields.total_supply).dividedBy(10 ** 9)}`),
                currentPrice
            );
            totalBorrow = toUSD(
                "VUSD",
                Number(`${BigNumber(fields.total_borrows).dividedBy(10 ** 9)}`),
                currentPrice
            );
        } else if (market.id === 1) {
            totalSupply = toUSD(
                "IOTA",
                Number(`${BigNumber(fields.total_supply).dividedBy(10 ** 9)}`),
                currentPrice
            );
            totalBorrow = toUSD(
                "IOTA",
                Number(`${BigNumber(fields.total_borrows).dividedBy(10 ** 9)}`),
                currentPrice
            );
        }

        const liquidity = totalSupply - totalBorrow;
        const utilizationRatio =
            totalSupply > 0 ? totalBorrow / totalSupply : 0;

        let activePosition = undefined;

        if (walletAddress) {
            // add debt position
            const tableId = fields.debt_positions.fields.id.id;
            const dynamicFieldPage = await client.getDynamicFields({
                parentId: tableId,
            });
            const thisPosition: any = dynamicFieldPage.data.find(
                (item: any) => item.name.value === walletAddress
            );

            if (thisPosition) {
                const userPosition: any = await client.getObject({
                    id: thisPosition.objectId,
                    options: {
                        showType: false,
                        showOwner: false,
                        showPreviousTransaction: false,
                        showDisplay: false,
                        showContent: true,
                        showBcs: false,
                        showStorageRebate: false,
                    },
                });
                const userFields = userPosition.data.content.fields.value.fields;

                const collateralAmount = Number(
                    `${BigNumber(userFields.collateral_amount).dividedBy(10 ** 9)}`
                );
                let collateralValue = 0;
                let borrowValue = 0;
                if (market.id === 0) {
                    collateralValue = toUSD(
                        "IOTA",
                        Number(
                            `${BigNumber(userFields.collateral_amount).dividedBy(
                                10 ** 9
                            )}`
                        ),
                        currentPrice
                    );
                    borrowValue = toUSD(
                        "VUSD",
                        Number(
                            `${BigNumber(userFields.debt_amount).dividedBy(10 ** 9)}`
                        ),
                        currentPrice
                    );
                } else if (market.id === 1) {
                    collateralValue = toUSD(
                        "VUSD",
                        Number(
                            `${BigNumber(userFields.collateral_amount).dividedBy(
                                10 ** 9
                            )}`
                        ),
                        currentPrice
                    );
                    borrowValue = toUSD(
                        "IOTA",
                        Number(
                            `${BigNumber(userFields.debt_amount).dividedBy(10 ** 9)}`
                        ),
                        currentPrice
                    );
                }
                const borrowRate = Number(userFields.borrow_rate_snapshot) / 100;
                const borrowAmount = Number(
                    `${BigNumber(userFields.debt_amount).dividedBy(10 ** 9)}`
                );
                const liquidationThreshold =
                    Number(userFields.liquidation_threshold_snapshot) / 10000;

                const liquidationThresholdValue =
                    collateralValue * liquidationThreshold;
                const healthFactor = liquidationThresholdValue / borrowValue;

                activePosition = {
                    borrowRate,
                    borrowAmount,
                    borrowValue,
                    collateralValue,
                    collateralAmount,
                    liquidationThreshold,
                    healthFactor,
                };

            }
        }

        output.push({
            marketName: market.marketName,
            borrowAsset: market.borrow_asset,
            collateralAsset: market.collateral_asset,
            ltv: Number(fields.ltv) / 10000,
            liquidationThreshold: Number(fields.liquidation_threshold) / 10000,
            borrowRate: Number(fields.current_borrow_rate) / 100,
            supplyRate: Number(fields.current_supply_rate) / 100,
            totalSupply,
            totalBorrow,
            liquidity,
            utilizationRate: utilizationRatio * 100,
            currentPrice,
            activePosition,
        });

        count = count + 1;
    }

    return output;
}

const toUSD = (symbol: string, amount: number, currentPrice: number = 0.16): number => {
    return amount * ( symbol === "IOTA" ? currentPrice : 1 )
  };