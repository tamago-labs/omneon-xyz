import { Transaction } from "@iota/iota-sdk/transactions";
import {
  useIotaClient,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@iota/dapp-kit";
import { useCallback } from "react";
import BigNumber from "bignumber.js";
import COINS from "../data/coins.json";
import POOLS from "../data/staking_pools.json";
import { usePrice } from "./usePrice"

const useStaking = () => {

  const { toUSD } = usePrice()

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

  // Function to calculate APY for staking pools
  const calculateAPY = (emissionRate: number, assetPrice: number) => {
    // emissionRate: tokens per second per staked token (scaled down by 10000)
    // tokenPrice: price of OMN token in USD
    // assetPrice: price of the staked asset in USD
    // totalStaked: total amount of assets staked in the pool

    // Scale down emission rate (we scaled it up by 10000 in contract)
    const actualEmissionRate = emissionRate

    // Calculate tokens earned per token per year
    const secondsInYear = 365 * 24 * 60 * 60; // 31,536,000
    const tokensPerYearPerToken = actualEmissionRate * secondsInYear;

    // Calculate USD value of rewards per year per USD staked
    const rewardsValuePerYear = tokensPerYearPerToken * 0.00015;

    // Calculate APY as percentage
    const apy = (rewardsValuePerYear / assetPrice) * 100;

    return apy.toFixed(2); // Return with 2 decimal places
  }

  const loadPools = useCallback(
    async () => {
      const { data } = await client.getObject({
        id: "0x9cc7f40a3375a4dee8a6a95b99dace6c50564910b2c607c66d9241ced461946c",
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

      const tableId = content.fields.total_staked.fields.id.id;

      let dynamicFieldPage = await client.getDynamicFields({
        parentId: tableId,
      });

      let output = []
      let count = 0;

      for (let entry of dynamicFieldPage.data) {
        const { objectId } = entry;
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
        const value = result.data.content.fields.value;
        const pool = POOLS[count]

        const totalStaked = `${BigNumber(value).dividedBy(10 ** 9)}`
        const totalStakedValue = toUSD(pool.id === 0 ? "VUSD" : "IOTA", Number(totalStaked))

        const apy = calculateAPY(pool.emission_rate, totalStakedValue)

        output.push({
          ...pool,
          totalStaked,
          totalStakedValue,
          apy
        })

        count = count + 1
      }

      return output;
    },
    [client]
  );

  const stake = useCallback(async (amount: number, asset_type: string) => {

    if (!currentAccount) {
      return;
    }

    const tx = new Transaction();
    tx.setGasBudget(50000000);

    const { data } = await client.getCoins({
      owner: currentAccount.address,
      coinType: asset_type,
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
          target: `0x05b4c48658ea6aa63c9e847f6421cf7e903f9ae58eb5233597e460ad869fda7f::omneon::stake`,
          typeArguments: [asset_type],
          arguments: [
            tx.object(
              "0x9cc7f40a3375a4dee8a6a95b99dace6c50564910b2c607c66d9241ced461946c"
            ),
            tx.object(coinToBuy),
            tx.object("0x6"),
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
          target: `0x05b4c48658ea6aa63c9e847f6421cf7e903f9ae58eb5233597e460ad869fda7f::omneon::stake`,
          typeArguments: [asset_type],
          arguments: [
            tx.object(
              "0x9cc7f40a3375a4dee8a6a95b99dace6c50564910b2c607c66d9241ced461946c"
            ),
            splited_coin,
            tx.object("0x6"),
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

  }, [currentAccount])

  const loadPositions = useCallback(async (staker_address: string) => {

    const { data } = await client.getOwnedObjects({
      owner: staker_address,
      options: {
        showType: true
      },
      filter: {
        MatchAny: [
          {
            StructType: "0x05b4c48658ea6aa63c9e847f6421cf7e903f9ae58eb5233597e460ad869fda7f::omneon::StakingPosition<0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::SHARE<0x2::iota::IOTA, 0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::mock_vusd::MOCK_VUSD>>"
          },
          {
            StructType: "0x05b4c48658ea6aa63c9e847f6421cf7e903f9ae58eb5233597e460ad869fda7f::omneon::StakingPosition<0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::lending::SHARE<0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::mock_vusd::MOCK_VUSD, 0x2::iota::IOTA>>"
          }
        ],
      }
    })

    let output: any = []

    for (let position of data) {
      if (position.data) {
        const result: any = await client.getObject({
          id: position.data.objectId,
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
        const totalStaked = `${BigNumber(result.data.content.fields.share_coin).dividedBy(10 ** 9)}`
        const totalPaid = 0 // Fix this

        const totalRewards = calculateRewards(0.01, totalPaid, Number(totalStaked))

        output.push({
          objectId: result.data.objectId,
          type: result.data.content.type,
          totalStaked,
          totalRewards
        })
      }

    }

    return output

  }, [])

  const unstake = useCallback(async (asset_type: string, positionId: string) => {

    const tx = new Transaction();
    tx.setGasBudget(50000000);

    tx.moveCall({
      target: `0x05b4c48658ea6aa63c9e847f6421cf7e903f9ae58eb5233597e460ad869fda7f::omneon::unstake`,
      typeArguments: [asset_type],
      arguments: [
        tx.object(
          "0x9cc7f40a3375a4dee8a6a95b99dace6c50564910b2c607c66d9241ced461946c"
        ),
        tx.object(positionId),
        tx.object("0x6"),
      ],
    });

    const params = {
      transaction: tx,
    };
    return await signWallet(params);

  }, [currentAccount])

  const claim = useCallback(async (asset_type: string, positionId: string) => {

    const tx = new Transaction();
    tx.setGasBudget(50000000);

    tx.moveCall({
      target: `0x05b4c48658ea6aa63c9e847f6421cf7e903f9ae58eb5233597e460ad869fda7f::omneon::claim`,
      typeArguments: [asset_type],
      arguments: [
        tx.object(
          "0x9cc7f40a3375a4dee8a6a95b99dace6c50564910b2c607c66d9241ced461946c"
        ),
        tx.object(positionId),
        tx.object("0x6"),
      ],
    });

    const params = {
      transaction: tx,
    };
    return await signWallet(params);
  }, [currentAccount])

  const calculateRewards = (ratePerToken: number, totalPaid: number, totalStaked: number) => {
    const delta = ratePerToken - totalPaid
    return totalStaked * delta
  }

  return {
    loadPools,
    loadPositions,
    stake,
    claim,
    unstake
  }
}

export default useStaking