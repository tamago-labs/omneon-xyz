
import { Transaction } from "@iota/iota-sdk/transactions";
import { useIotaClient, useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { useCallback } from "react";
import BigNumber from "bignumber.js"
import COINS from "../data/coins.json"
import MARKETS from "../data/markets.json"
import { usePrice } from "./usePrice";
import { IotaPriceServiceConnection, IotaPythClient } from "@pythnetwork/pyth-iota-js";

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
            target: `0x655e417ba886bafd6c12a04c923035ea380fc56173c98b2d7689695334e5c504::mock_vusd::mint`,
            arguments: [
                tx.object("0x9d988c1ac6290ea0a0192c54760d6c71039366079ba3928caa665fa6b8707a21"),
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
                target: `0x655e417ba886bafd6c12a04c923035ea380fc56173c98b2d7689695334e5c504::lending::supply`,
                typeArguments: [borrow_asset_type, collateral_asset_type],
                arguments: [
                    tx.object("0xe6d05de1fd9e56b68e95eafc6fe06d9bdd7171d1be18f634745aca2ed942b114"),
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
                        target: `0x655e417ba886bafd6c12a04c923035ea380fc56173c98b2d7689695334e5c504::lending::supply`,
                        typeArguments: [borrow_asset_type, collateral_asset_type],
                        arguments: [
                            tx.object("0xe6d05de1fd9e56b68e95eafc6fe06d9bdd7171d1be18f634745aca2ed942b114"),
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
                        target: `0x655e417ba886bafd6c12a04c923035ea380fc56173c98b2d7689695334e5c504::lending::supply`,
                        typeArguments: [borrow_asset_type, collateral_asset_type],
                        arguments: [
                            tx.object("0xe6d05de1fd9e56b68e95eafc6fe06d9bdd7171d1be18f634745aca2ed942b114"),
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
            coinType: `0x655e417ba886bafd6c12a04c923035ea380fc56173c98b2d7689695334e5c504::lending::SHARE<${borrow_asset_type}, ${collateral_asset_type}>`
        })

        const coinToBuy = data && data[0] && data[0].coinObjectId

        if (coinToBuy) {

            // object == amount
            if (BigNumber(data[0].balance).eq((BigNumber(amount).multipliedBy(10 ** 9)))) {

                tx.moveCall({
                    target: `0x655e417ba886bafd6c12a04c923035ea380fc56173c98b2d7689695334e5c504::lending::withdraw`,
                    typeArguments: [borrow_asset_type, collateral_asset_type],
                    arguments: [
                        tx.object("0xe6d05de1fd9e56b68e95eafc6fe06d9bdd7171d1be18f634745aca2ed942b114"),
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
                    target: `0x655e417ba886bafd6c12a04c923035ea380fc56173c98b2d7689695334e5c504::lending::withdraw`,
                    typeArguments: [borrow_asset_type, collateral_asset_type],
                    arguments: [
                        tx.object("0xe6d05de1fd9e56b68e95eafc6fe06d9bdd7171d1be18f634745aca2ed942b114"),
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
            id: "0xe6d05de1fd9e56b68e95eafc6fe06d9bdd7171d1be18f634745aca2ed942b114",
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
                utilizationRate: utilizationRatio * 100
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
                target: `0x655e417ba886bafd6c12a04c923035ea380fc56173c98b2d7689695334e5c504::lending::borrow`,
                typeArguments: [borrow_asset_type, collateral_asset_type],
                arguments: [
                    tx.object("0xe6d05de1fd9e56b68e95eafc6fe06d9bdd7171d1be18f634745aca2ed942b114"),
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
                        target: `0x655e417ba886bafd6c12a04c923035ea380fc56173c98b2d7689695334e5c504::lending::borrow`,
                        typeArguments: [borrow_asset_type, collateral_asset_type],
                        arguments: [
                            tx.object("0xe6d05de1fd9e56b68e95eafc6fe06d9bdd7171d1be18f634745aca2ed942b114"),
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
                        target: `0x655e417ba886bafd6c12a04c923035ea380fc56173c98b2d7689695334e5c504::lending::borrow`,
                        typeArguments: [borrow_asset_type, collateral_asset_type],
                        arguments: [
                            tx.object("0xe6d05de1fd9e56b68e95eafc6fe06d9bdd7171d1be18f634745aca2ed942b114"),
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

    const updateCurrentPrice = useCallback(async (borrow_asset_type: string, collateral_asset_type: string) => {

        if (!currentAccount) {
            return
        }

        const connection = new IotaPriceServiceConnection("https://hermes.pyth.network");

        const priceIDs = [
            "c7b72e5d860034288c9335d4d325da4272fe50c92ab72249d58f6cbba30e4c44", // IOTA/USD price ID
        ];
 
        const wormholeStateId = "0x8bc490f69520a97ca1b3de864c96aa2265a0cf5d90f5f3f016b2eddf0cf2af2b";
        const pythStateId = "0x68dda579251917b3db28e35c4df495c6e664ccc085ede867a9b773c8ebedc2c1";

        const iotaClient: any = client
        const pythClient = new IotaPythClient(iotaClient, pythStateId, wormholeStateId);
        const tx: any = new Transaction();
        tx.setGasBudget(50000000);

        const newFeeds = [];
        const existingFeeds = [];
        for (const feed of priceIDs) {
            if ((await pythClient.getPriceFeedObjectId(feed)) == undefined) {
                newFeeds.push(feed);
            } else {
                existingFeeds.push(feed);
            }
        }
        console.log({
            newFeeds,
            existingFeeds,
        });

        if (existingFeeds.length > 0) {
            const updateData = await connection.getPriceFeedsUpdateData(existingFeeds);
            const priceInfoObjectIds = await pythClient.updatePriceFeeds(tx, updateData, existingFeeds);
            console.log("priceInfoObjectIds#1: ", priceInfoObjectIds)

            tx.moveCall({
                target: `0x655e417ba886bafd6c12a04c923035ea380fc56173c98b2d7689695334e5c504::lending::update_current_price`,
                typeArguments: [borrow_asset_type, collateral_asset_type],
                arguments: [
                    tx.object("0xe6d05de1fd9e56b68e95eafc6fe06d9bdd7171d1be18f634745aca2ed942b114"),
                    tx.object("0x6"),
                    tx.object(priceInfoObjectIds[0])
                ],
            });

            const params = {
                transaction: tx
            }
            await signWallet(params);

        }
        if (newFeeds.length > 0) {
            // Create an object this time
            const updateData = await connection.getPriceFeedsUpdateData(newFeeds);
            await pythClient.createPriceFeed(tx, updateData);

            const params = {
                transaction: tx
            }
            await signWallet(params);

        }


    }, [currentAccount, client])

    return {
        faucet,
        loadPools,
        updateCurrentPrice,
        fetchBalances,
        supply,
        withdraw,
        borrow
    }
}

export default useLending