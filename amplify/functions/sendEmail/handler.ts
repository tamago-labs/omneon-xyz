import type { Handler } from 'aws-lambda';
import type { Schema } from "../../data/resource"
import { ChatAnthropic } from "@langchain/anthropic"
import { AIMessage, BaseMessage, ChatMessage, HumanMessage } from "@langchain/core/messages"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({ region: "ap-southeast-1" });


const llm = new ChatAnthropic({
    temperature: 0.7,
    model: "claude-3-5-sonnet-latest",
    apiKey: process.env.ANTHROPIC_API_KEY,
})

const TEST_PAYLOAD = [
    {
        "id": 1,
        "marketName": "IOTA",
        "borrow_asset": "IOTA",
        "collateral_asset": "vUSD",
        "ltv": 0.8,
        "liquidationThreshold": 0.85,
        "borrowRate": 3.94,
        "supplyRate": 0.76,
        "totalSupply": 3.9910666667206,
        "totalBorrow": 1.4562,
        "liquidity": 2.5348666667206,
        "utilizationRate": 36.486486485993424,
        "currentPrice": 0.1618,
        "activePosition": {
            "borrowRate": 3.94,
            "borrowAmount": 3,
            "borrowValue": 0.4854,
            "collateralValue": 5,
            "collateralAmount": 5,
            "liquidationThreshold": 0.85,
            "healthFactor": 8.755665430572723
        }
    },
    {
        "id": 0,
        "marketName": "vUSD",
        "borrow_asset": "vUSD",
        "collateral_asset": "IOTA",
        "image": "./images/vusd-icon.png",
        "ltv": 0.75,
        "liquidationThreshold": 0.8,
        "borrowRate": 1.38,
        "supplyRate": 0.08,
        "totalSupply": 13,
        "totalBorrow": 4,
        "liquidity": 9,
        "utilizationRate": 30.76923076923077,
        "currentPrice": 0.1618,
        "activePosition": {
            "borrowRate": 1.38,
            "borrowAmount": 3,
            "borrowValue": 3,
            "collateralValue": 4.045,
            "collateralAmount": 25,
            "liquidationThreshold": 0.8,
            "healthFactor": 1.0786666666666667
        }
    }
]

export const handler: Schema["SendEmail"]["functionHandler"] = async (event) => {

    const { userId, walletAddress } = event.arguments

    const agent: any = await setupAgent(TEST_PAYLOAD)

    const output = await agent.invoke(
        {
            messages: [
                {
                    role: 'user',
                    content: `Please summarize the following JSON data into a clear and concise email format suitable for user notifications. \n${JSON.stringify(TEST_PAYLOAD)}`
                }
            ]
        }
    )

    const finalized = parseLangchain(output.messages)

    console.log("final messages :", finalized)

    const content = finalized[finalized.length - 1]?.content;

    console.log("content: ", content)

    const recipient = userId || "";
    const subject = "Test Subject";
    const body = "Hello this is a test email. Thanks.";

    const command = new SendEmailCommand({
        Source: "hello@omneon.xyz",
        Destination: {
            ToAddresses: [recipient],
        },
        Message: {
            Body: {
                Text: { Data: body },
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

const setupAgent = async (inputJson: any) => {

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