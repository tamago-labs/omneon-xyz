import { Transaction } from "@iota/iota-sdk/transactions";
import {
  useIotaClient,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@iota/dapp-kit";
import { useCallback } from "react";
import BigNumber from "bignumber.js";
import COINS from "../data/coins.json";
import MARKETS from "../data/markets.json";
import { usePrice } from "./usePrice";
import {
  IotaPriceServiceConnection,
  IotaPythClient,
} from "@pythnetwork/pyth-iota-js";

const useLending = () => {
  const { toUSD } = usePrice();

  const client = useIotaClient();

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();

  const signWallet = (params: any) => {
    return new Promise((resolve) => {
      signAndExecuteTransaction(
        {
          ...params,
        },
        {
          onSuccess: (result) => {
            resolve(result.digest);
          },
          onError: (e) => {
            console.log(e);
            resolve(undefined);
          },
        }
      );
    });
  };

  const faucet = useCallback(
    async (recipient: string) => {
      if (!currentAccount) {
        return;
      }

      const tx = new Transaction();
      tx.setGasBudget(50000000);

      tx.moveCall({
        target: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::mock_vusd::mint`,
        arguments: [
          tx.object(
            "0x9bd14ab92d3076d98dff360c08ad5e3b61dabe71889abce36628ee6e0cc28f1c"
          ),
          tx.pure.u64(`${BigNumber(100).multipliedBy(10 ** 9)}`),
          tx.pure.address(recipient),
        ],
      });

      const params = {
        transaction: tx,
      };

      return await signWallet(params);
    },
    [currentAccount]
  );

  const supply = useCallback(
    async (
      amount: number,
      borrow_asset_type: string,
      collateral_asset_type: string
    ) => {
      if (!currentAccount) {
        return;
      }

      console.log(
        "borrow: ",
        borrow_asset_type,
        "collateral:",
        collateral_asset_type
      );

      const tx = new Transaction();
      tx.setGasBudget(50000000);

      if (borrow_asset_type === "0x2::iota::IOTA") {
        const [coin] = tx.splitCoins(tx.gas, [
          tx.pure.u64(`${BigNumber(amount.toFixed(0)).multipliedBy(10 ** 9)}`),
        ]);

        tx.moveCall({
          target: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::supply`,
          typeArguments: [borrow_asset_type, collateral_asset_type],
          arguments: [
            tx.object(
              "0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87"
            ),
            coin,
          ],
        });
        const params = {
          transaction: tx,
        };

        return await signWallet(params);
      } else {
        const { data } = await client.getCoins({
          owner: currentAccount.address,
          coinType: borrow_asset_type,
        });

        const coinToBuy = data && data[0] && data[0].coinObjectId;

        if (coinToBuy) {
          // object == amount
          if (
            BigNumber(data[0].balance).eq(
              BigNumber(amount.toFixed(0)).multipliedBy(10 ** 9)
            )
          ) {
            tx.moveCall({
              target: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::supply`,
              typeArguments: [borrow_asset_type, collateral_asset_type],
              arguments: [
                tx.object(
                  "0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87"
                ),
                tx.object(coinToBuy),
              ],
            });
            const params = {
              transaction: tx,
            };

            return await signWallet(params);
          } else {
            if (data.length >= 2) {
              const baseId = data[0].coinObjectId;
              const remainingIds = data
                .filter((item: any, index: number) => index !== 0)
                .map((item: any) => item.coinObjectId);
              tx.mergeCoins(baseId, remainingIds);
            }

            const [splited_coin] = tx.splitCoins(coinToBuy, [
              `${BigNumber(amount.toFixed(0)).multipliedBy(
                BigNumber(10 ** 9)
              )}`,
            ]);
            tx.moveCall({
              target: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::supply`,
              typeArguments: [borrow_asset_type, collateral_asset_type],
              arguments: [
                tx.object(
                  "0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87"
                ),
                splited_coin,
              ],
            });
            const params = {
              transaction: tx,
            };
            return await signWallet(params);
          }
        } else {
          return undefined;
        }
      }
    },
    [currentAccount]
  );

  const withdraw = useCallback(
    async (
      amount: number,
      borrow_asset_type: string,
      collateral_asset_type: string
    ) => {
      if (!currentAccount) {
        return;
      }
      const tx = new Transaction();
      tx.setGasBudget(50000000);

      const { data } = await client.getCoins({
        owner: currentAccount.address,
        coinType: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::SHARE<${borrow_asset_type}, ${collateral_asset_type}>`,
      });

      const coinToBuy = data && data[0] && data[0].coinObjectId;

      if (coinToBuy) {
        // object == amount
        if (
          BigNumber(data[0].balance).eq(
            BigNumber(amount.toFixed(0)).multipliedBy(10 ** 9)
          )
        ) {
          tx.moveCall({
            target: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::withdraw`,
            typeArguments: [borrow_asset_type, collateral_asset_type],
            arguments: [
              tx.object(
                "0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87"
              ),
              tx.object(coinToBuy),
            ],
          });
          const params = {
            transaction: tx,
          };

          return await signWallet(params);
        } else {
          if (data.length >= 2) {
            const baseId = data[0].coinObjectId;
            const remainingIds = data
              .filter((item: any, index: number) => index !== 0)
              .map((item: any) => item.coinObjectId);
            tx.mergeCoins(baseId, remainingIds);
          }

          const [splited_coin] = tx.splitCoins(coinToBuy, [
            `${BigNumber(amount.toFixed(0)).multipliedBy(BigNumber(10 ** 9))}`,
          ]);
          tx.moveCall({
            target: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::withdraw`,
            typeArguments: [borrow_asset_type, collateral_asset_type],
            arguments: [
              tx.object(
                "0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87"
              ),
              splited_coin,
            ],
          });
          const params = {
            transaction: tx,
          };
          return await signWallet(params);
        }
      } else {
        return undefined;
      }
    },
    [currentAccount]
  );

  const fetchBalances = useCallback(
    async (address: any) => {
      let output: any = [];
      const coinTypeList = COINS.map((coin) => coin.coin_type);

      for (let coinType of coinTypeList) {
        const data = await client.getBalance({
          owner: address,
          coinType,
        });
        const amount = parseAmount(BigNumber(data?.totalBalance), 9);
        output.push(amount);
      }

      return output;
    },
    [client]
  );

  const loadPools = useCallback(
    async (borrower_address: string | null) => {
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
        return;
      }

      const tableId = content.fields.pools.fields.id.id;
      const dynamicFieldPage = await client.getDynamicFields({
        parentId: tableId,
      });

      console.log("dynamicFieldPage: ", dynamicFieldPage);

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

        console.log("fields:", fields);

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

        if (borrower_address) {
          // add debt position
          const tableId = fields.debt_positions.fields.id.id;
          const dynamicFieldPage = await client.getDynamicFields({
            parentId: tableId,
          });
          const thisPosition: any = dynamicFieldPage.data.find(
            (item: any) => item.name.value === borrower_address
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

            // console.log("userFields :", userFields)
            // console.log("activePosition :", activePosition)
          }
        }

        output.push({
          ...market,
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
    },
    [client]
  );

  const borrow = useCallback(
    async (
      collateral_amount: number,
      borrow_amount: number,
      borrow_asset_type: string,
      collateral_asset_type: string
    ) => {
      if (!currentAccount) {
        return;
      }

      const tx = new Transaction();
      tx.setGasBudget(50000000);

      if (collateral_asset_type === "0x2::iota::IOTA") {
        const [coin] = tx.splitCoins(tx.gas, [
          tx.pure.u64(
            `${BigNumber(collateral_amount.toFixed(0)).multipliedBy(10 ** 9)}`
          ),
        ]);

        tx.moveCall({
          target: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::borrow`,
          typeArguments: [borrow_asset_type, collateral_asset_type],
          arguments: [
            tx.object(
              "0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87"
            ),
            coin,
            tx.pure.u64(
              `${BigNumber(borrow_amount.toFixed(0)).multipliedBy(10 ** 9)}`
            ),
          ],
        });
        const params = {
          transaction: tx,
        };

        return await signWallet(params);
      } else {
        const { data } = await client.getCoins({
          owner: currentAccount.address,
          coinType: collateral_asset_type,
        });

        const coinToBuy = data && data[0] && data[0].coinObjectId;

        if (coinToBuy) {
          // object == amount
          if (
            BigNumber(data[0].balance).eq(
              BigNumber(collateral_amount.toFixed(0)).multipliedBy(10 ** 9)
            )
          ) {
            tx.moveCall({
              target: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::borrow`,
              typeArguments: [borrow_asset_type, collateral_asset_type],
              arguments: [
                tx.object(
                  "0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87"
                ),
                tx.object(coinToBuy),
                tx.pure.u64(
                  `${BigNumber(borrow_amount.toFixed(0)).multipliedBy(10 ** 9)}`
                ),
              ],
            });
            const params = {
              transaction: tx,
            };

            return await signWallet(params);
          } else {
            if (data.length >= 2) {
              const baseId = data[0].coinObjectId;
              const remainingIds = data
                .filter((item: any, index: number) => index !== 0)
                .map((item: any) => item.coinObjectId);
              tx.mergeCoins(baseId, remainingIds);
            }

            const [splited_coin] = tx.splitCoins(coinToBuy, [
              `${BigNumber(collateral_amount.toFixed(0)).multipliedBy(
                BigNumber(10 ** 9)
              )}`,
            ]);
            tx.moveCall({
              target: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::borrow`,
              typeArguments: [borrow_asset_type, collateral_asset_type],
              arguments: [
                tx.object(
                  "0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87"
                ),
                splited_coin,
                tx.pure.u64(
                  `${BigNumber(borrow_amount.toFixed(0)).multipliedBy(10 ** 9)}`
                ),
              ],
            });
            const params = {
              transaction: tx,
            };
            return await signWallet(params);
          }
        } else {
          return undefined;
        }
      }
    },
    [currentAccount, client]
  );

  const repay = useCallback(
    async (
      borrow_amount: number,
      borrow_asset_type: string,
      collateral_asset_type: string
    ) => {
      if (!currentAccount) {
        return;
      }

      const tx = new Transaction();
      tx.setGasBudget(50000000);

      const { data } = await client.getCoins({
        owner: currentAccount.address,
        coinType: borrow_asset_type,
      });

      const coinToBuy = data && data[0] && data[0].coinObjectId;

      if (coinToBuy) {
        const totalBalance = data
          .reduce(
            (sum, coin) => sum.plus(new BigNumber(coin.balance)),
            new BigNumber(0)
          )
          .toString();

        console.log("total balance :", totalBalance);

        if (borrow_asset_type === "0x2::iota::IOTA") {
          const [coin] = tx.splitCoins(tx.gas, [
            tx.pure.u64(
              `${BigNumber((borrow_amount * 1.15).toFixed(0)).multipliedBy(
                10 ** 9
              )}`
            ),
          ]);

          tx.moveCall({
            target: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::repay`,
            typeArguments: [borrow_asset_type, collateral_asset_type],
            arguments: [
              tx.object(
                "0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87"
              ),
              coin,
              tx.pure.bool(true),
            ],
          });
          const params = {
            transaction: tx,
          };
          return await signWallet(params);
        } else {
          if (data.length >= 2) {
            const baseId = data[0].coinObjectId;
            const remainingIds = data
              .filter((item: any, index: number) => index !== 0)
              .map((item: any) => item.coinObjectId);
            tx.mergeCoins(baseId, remainingIds);
          }

          tx.moveCall({
            target: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::repay`,
            typeArguments: [borrow_asset_type, collateral_asset_type],
            arguments: [
              tx.object(
                "0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87"
              ),
              tx.object(coinToBuy),
              tx.pure.bool(true),
            ],
          });
          const params = {
            transaction: tx,
          };
          return await signWallet(params);
        }

        // tx.moveCall({
        //     target: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::repay`,
        //     typeArguments: [borrow_asset_type, collateral_asset_type],
        //     arguments: [
        //         tx.object("0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87"),
        //         tx.object(coinToBuy),
        //         tx.pure.bool(true)
        //     ],
        // });
        // const params = {
        //     transaction: tx
        // }
        // return await signWallet(params);
      } else {
        return undefined;
      }
    },
    [currentAccount, client]
  );

  const parseAmount = (input: any, decimals: number) => {
    return Number(input) / 10 ** decimals;
  };

  const updateCurrentPrice = useCallback(
    async (borrow_asset_type: string, collateral_asset_type: string) => {
      if (!currentAccount) {
        return;
      }

      const connection = new IotaPriceServiceConnection(
        "https://hermes.pyth.network"
      );

      const priceIDs = [
        "c7b72e5d860034288c9335d4d325da4272fe50c92ab72249d58f6cbba30e4c44", // IOTA/USD price ID
      ];

      const wormholeStateId =
        "0x8bc490f69520a97ca1b3de864c96aa2265a0cf5d90f5f3f016b2eddf0cf2af2b";
      const pythStateId =
        "0x68dda579251917b3db28e35c4df495c6e664ccc085ede867a9b773c8ebedc2c1";

      const iotaClient: any = client;
      const pythClient = new IotaPythClient(
        iotaClient,
        pythStateId,
        wormholeStateId
      );
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
        const updateData = await connection.getPriceFeedsUpdateData(
          existingFeeds
        );
        const priceInfoObjectIds = await pythClient.updatePriceFeeds(
          tx,
          updateData,
          existingFeeds
        );
        console.log("priceInfoObjectIds#1: ", priceInfoObjectIds);

        tx.moveCall({
          target: `0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::update_current_price`,
          typeArguments: [borrow_asset_type, collateral_asset_type],
          arguments: [
            tx.object(
              "0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87"
            ),
            tx.object("0x6"),
            tx.object(priceInfoObjectIds[0]),
          ],
        });

        const params = {
          transaction: tx,
        };
        await signWallet(params);
      }
      if (newFeeds.length > 0) {
        // Create an object this time
        const updateData = await connection.getPriceFeedsUpdateData(newFeeds);
        await pythClient.createPriceFeed(tx, updateData);

        const params = {
          transaction: tx,
        };
        await signWallet(params);
      }
    },
    [currentAccount, client]
  );

  return {
    faucet,
    loadPools,
    updateCurrentPrice,
    fetchBalances,
    supply,
    withdraw,
    borrow,
    repay,
  };
};

export default useLending;
