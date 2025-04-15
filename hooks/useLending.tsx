import { IotaClient } from "@iota/iota-sdk/client";
import { Transaction } from "@iota/iota-sdk/transactions";
import { useIotaClient, useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { useCallback } from "react";
import BigNumber from "bignumber.js"
import COINS from "../data/coins.json"
import MARKETS from "../data/markets.json"
import { usePrice } from "./usePrice";

const useLending = () => {

    const { toUSD } = usePrice()

    const client = useIotaClient();

    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const currentAccount = useCurrentAccount();

    const signWallet = (params: any) => {
        return new Promise((resolve) => {
            signAndExecuteTransaction(
                {
                    ...params
                },
                {
                    onSuccess: (result) => {
                        resolve(result.digest)
                    },
                    onError: (e) => {
                        console.log(e)
                        resolve(undefined)
                    }
                },
            );
        })
    }

    const faucet = useCallback(async (recipient: string) => {

        if (!currentAccount) {
            return
        }

        const tx = new Transaction();
        tx.setGasBudget(50000000);

        tx.moveCall({
            target: `0xefb2c53fc575e4e02e0e562139b87e4f454d95e6ec65d8f53acb75093b6b64ef::mock_vusd::mint`,
            arguments: [
                tx.object("0xf6cc156ecdee81e6e9e503da7913c7fe9707d1e8a5f2d96c4f44b63981d98129"),
                tx.pure.u64(`${(BigNumber(100).multipliedBy(10 ** 9))}`),
                tx.pure.address(recipient),
            ],
        });

        const params = {
            transaction: tx
        }

        return await signWallet(params);

    }, [currentAccount])

    const supply = useCallback(async (amount: number, borrow_asset_type: string, collateral_asset_type: string) => {

        if (!currentAccount) {
            return
        }

        const tx = new Transaction();
        tx.setGasBudget(50000000);

        if (borrow_asset_type === "0x2::iota::IOTA") {

            const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(`${(BigNumber(amount).multipliedBy(10 ** 9))}`)])

            tx.moveCall({
                target: `0xefb2c53fc575e4e02e0e562139b87e4f454d95e6ec65d8f53acb75093b6b64ef::lending::supply`,
                typeArguments: [borrow_asset_type, collateral_asset_type],
                arguments: [
                    tx.object("0x655cb6076c8d68e98c3c972ed28f1491aa40025a5135039fa101993522446e52"),
                    coin
                ],
            });
            const params = {
                transaction: tx
            }

            return await signWallet(params);

        } else {

            const { data } = await client.getCoins({
                owner: currentAccount.address,
                coinType: borrow_asset_type
            })

            const coinToBuy = data && data[0] && data[0].coinObjectId

            if (coinToBuy) {

                // object == amount
                if (BigNumber(data[0].balance).eq((BigNumber(amount).multipliedBy(10 ** 9)))) {

                    tx.moveCall({
                        target: `0xefb2c53fc575e4e02e0e562139b87e4f454d95e6ec65d8f53acb75093b6b64ef::lending::supply`,
                        typeArguments: [borrow_asset_type, collateral_asset_type],
                        arguments: [
                            tx.object("0x655cb6076c8d68e98c3c972ed28f1491aa40025a5135039fa101993522446e52"),
                            tx.object(coinToBuy)
                        ],
                    });
                    const params = {
                        transaction: tx
                    }

                    return await signWallet(params);
                } else {

                    if (data.length >= 2) {
                        const baseId = data[0].coinObjectId
                        const remainingIds = data.filter((item: any, index: number) => index !== 0).map((item: any) => item.coinObjectId)
                        tx.mergeCoins(baseId, remainingIds)
                    }

                    const [splited_coin] = tx.splitCoins(coinToBuy, [`${(BigNumber(amount)).multipliedBy(BigNumber(10 ** 9))}`])
                    tx.moveCall({
                        target: `0xefb2c53fc575e4e02e0e562139b87e4f454d95e6ec65d8f53acb75093b6b64ef::lending::supply`,
                        typeArguments: [borrow_asset_type, collateral_asset_type],
                        arguments: [
                            tx.object("0x655cb6076c8d68e98c3c972ed28f1491aa40025a5135039fa101993522446e52"),
                            splited_coin
                        ],
                    });
                    const params = {
                        transaction: tx
                    }
                    return await signWallet(params);
                }

            } else {
                return undefined
            }
        }

    }, [currentAccount])

    const withdraw = useCallback(async (amount: number, borrow_asset_type: string, collateral_asset_type: string) => {

        if (!currentAccount) {
            return
        }
        const tx = new Transaction();
        tx.setGasBudget(50000000);

        const { data } = await client.getCoins({
            owner: currentAccount.address,
            coinType: `0xefb2c53fc575e4e02e0e562139b87e4f454d95e6ec65d8f53acb75093b6b64ef::lending::SHARE<${borrow_asset_type}, ${collateral_asset_type}>`
        })

        const coinToBuy = data && data[0] && data[0].coinObjectId

        if (coinToBuy) {

            // object == amount
            if (BigNumber(data[0].balance).eq((BigNumber(amount).multipliedBy(10 ** 9)))) {

                tx.moveCall({
                    target: `0xefb2c53fc575e4e02e0e562139b87e4f454d95e6ec65d8f53acb75093b6b64ef::lending::withdraw`,
                    typeArguments: [borrow_asset_type, collateral_asset_type],
                    arguments: [
                        tx.object("0x655cb6076c8d68e98c3c972ed28f1491aa40025a5135039fa101993522446e52"),
                        tx.object(coinToBuy)
                    ],
                });
                const params = {
                    transaction: tx
                }

                return await signWallet(params);
            } else {

                if (data.length >= 2) {
                    const baseId = data[0].coinObjectId
                    const remainingIds = data.filter((item: any, index: number) => index !== 0).map((item: any) => item.coinObjectId)
                    tx.mergeCoins(baseId, remainingIds)
                }

                const [splited_coin] = tx.splitCoins(coinToBuy, [`${(BigNumber(amount)).multipliedBy(BigNumber(10 ** 9))}`])
                tx.moveCall({
                    target: `0xefb2c53fc575e4e02e0e562139b87e4f454d95e6ec65d8f53acb75093b6b64ef::lending::withdraw`,
                    typeArguments: [borrow_asset_type, collateral_asset_type],
                    arguments: [
                        tx.object("0x655cb6076c8d68e98c3c972ed28f1491aa40025a5135039fa101993522446e52"),
                        splited_coin
                    ],
                });
                const params = {
                    transaction: tx
                }
                return await signWallet(params);
            }

        } else {
            return undefined
        }

    }, [currentAccount])

    const fetchBalances = useCallback(async (address: any) => {

        let output: any = []
        const coinTypeList = COINS.map((coin) => coin.coin_type)

        for (let coinType of coinTypeList) {
            const data = await client.getBalance({
                owner: address,
                coinType
            })
            const amount = parseAmount(BigNumber(data?.totalBalance), 9)
            output.push(amount)
        }

        return output
    }, [client])

    const loadPools = useCallback(async (borrower_address: string | null) => {

        const { data } = await client.getObject({
            id: "0x655cb6076c8d68e98c3c972ed28f1491aa40025a5135039fa101993522446e52",
            options: {
                "showType": false,
                "showOwner": false,
                "showPreviousTransaction": false,
                "showDisplay": false,
                "showContent": true,
                "showBcs": false,
                "showStorageRebate": false
            }
        })

        const content: any = data?.content

        if (!content) {
            return
        }

        const tableId = content.fields.pools.fields.id.id
        const dynamicFieldPage = await client.getDynamicFields({ parentId: tableId })

        console.log("dynamicFieldPage: ", dynamicFieldPage)

        let count = 0
        let output = []

        for (let pool of dynamicFieldPage.data) {
            const { objectId } = pool
            const result: any = await client.getObject({
                id: objectId,
                options: {
                    "showType": false,
                    "showOwner": false,
                    "showPreviousTransaction": false,
                    "showDisplay": false,
                    "showContent": true,
                    "showBcs": false,
                    "showStorageRebate": false
                }
            })
            const fields = result.data.content.fields.value.fields

            console.log("fields:", fields)

            if (borrower_address) {
                // add debt position
            }

            let totalSupply = 0
            let totalBorrow = 0

            if (count === 0) {
                totalSupply = toUSD("VUSD", Number(`${(BigNumber(fields.total_supply).dividedBy(10 ** 9))}`))
                totalBorrow = toUSD("VUSD", Number(`${(BigNumber(fields.total_borrows).dividedBy(10 ** 9))}`))
            } else if (count === 1) {
                totalSupply = toUSD("IOTA", Number(`${(BigNumber(fields.total_supply).dividedBy(10 ** 9))}`))
                totalBorrow = toUSD("IOTA", Number(`${(BigNumber(fields.total_borrows).dividedBy(10 ** 9))}`))
            }

            const liquidity = totalSupply - totalBorrow
            const utilizationRatio = totalSupply > 0 ? totalBorrow / totalSupply : 0



            output.push({
                ...MARKETS[count],
                ltv: Number(fields.ltv) / 10000,
                liquidationThreshold: Number(fields.liquidation_threshold) / 10000,
                conversionRate: Number(fields.override_price) / 10000,
                borrowRate: Number(fields.current_borrow_rate) / 100,
                supplyRate: Number(fields.current_supply_rate) / 100,
                totalSupply,
                totalBorrow,
                liquidity,
                utilizationRate: utilizationRatio*100
            })

            count = count + 1
        }

        return output

    }, [client])

    const borrow = useCallback(async (collateral_amount: number, borrow_amount: number, borrow_asset_type: string, collateral_asset_type: string) => {

        if (!currentAccount) {
            return
        }

        const tx = new Transaction();
        tx.setGasBudget(50000000);

        if (collateral_asset_type === "0x2::iota::IOTA") {

            const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(`${(BigNumber(collateral_amount).multipliedBy(10 ** 9))}`)])

            tx.moveCall({
                target: `0xefb2c53fc575e4e02e0e562139b87e4f454d95e6ec65d8f53acb75093b6b64ef::lending::borrow`,
                typeArguments: [borrow_asset_type, collateral_asset_type],
                arguments: [
                    tx.object("0x655cb6076c8d68e98c3c972ed28f1491aa40025a5135039fa101993522446e52"),
                    coin,
                    tx.pure.u64(`${(BigNumber(borrow_amount).multipliedBy(10 ** 9))}`)
                ],
            });
            const params = {
                transaction: tx
            }

            return await signWallet(params);

        } else {
            const { data } = await client.getCoins({
                owner: currentAccount.address,
                coinType: collateral_asset_type
            })

            const coinToBuy = data && data[0] && data[0].coinObjectId

            if (coinToBuy) {

                // object == amount
                if (BigNumber(data[0].balance).eq((BigNumber(collateral_amount).multipliedBy(10 ** 9)))) {

                    tx.moveCall({
                        target: `0xefb2c53fc575e4e02e0e562139b87e4f454d95e6ec65d8f53acb75093b6b64ef::lending::borrow`,
                        typeArguments: [borrow_asset_type, collateral_asset_type],
                        arguments: [
                            tx.object("0x655cb6076c8d68e98c3c972ed28f1491aa40025a5135039fa101993522446e52"),
                            tx.object(coinToBuy),
                            tx.pure.u64(`${(BigNumber(borrow_amount).multipliedBy(10 ** 9))}`)
                        ],
                    });
                    const params = {
                        transaction: tx
                    }

                    return await signWallet(params);
                } else {

                    if (data.length >= 2) {
                        const baseId = data[0].coinObjectId
                        const remainingIds = data.filter((item: any, index: number) => index !== 0).map((item: any) => item.coinObjectId)
                        tx.mergeCoins(baseId, remainingIds)
                    }

                    const [splited_coin] = tx.splitCoins(coinToBuy, [`${(BigNumber(collateral_amount)).multipliedBy(BigNumber(10 ** 9))}`])
                    tx.moveCall({
                        target: `0xefb2c53fc575e4e02e0e562139b87e4f454d95e6ec65d8f53acb75093b6b64ef::lending::borrow`,
                        typeArguments: [borrow_asset_type, collateral_asset_type],
                        arguments: [
                            tx.object("0x655cb6076c8d68e98c3c972ed28f1491aa40025a5135039fa101993522446e52"),
                            splited_coin,
                            tx.pure.u64(`${(BigNumber(borrow_amount).multipliedBy(10 ** 9))}`)
                        ],
                    });
                    const params = {
                        transaction: tx
                    }
                    return await signWallet(params);
                }

            } else {
                return undefined
            }
        }

    }, [currentAccount, client])

    const parseAmount = (input: any, decimals: number) => {
        return (Number(input) / 10 ** decimals)
    }

    return {
        faucet,
        loadPools,
        fetchBalances,
        supply,
        withdraw,
        borrow
    }
}

export default useLending