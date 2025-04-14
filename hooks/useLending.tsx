import { IotaClient } from "@iota/iota-sdk/client";
import { Transaction } from "@iota/iota-sdk/transactions";
import { useIotaClient, useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { useCallback } from "react";
import BigNumber from "bignumber.js"


const useLending = () => {

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
                    onError: () => {
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

    const fetchBalances = useCallback(async (address: any) => {

        let output: any = []

        for (let coinType of ["0x2::iota::IOTA", "0xefb2c53fc575e4e02e0e562139b87e4f454d95e6ec65d8f53acb75093b6b64ef::mock_vusd::MOCK_VUSD"]) {
            const data = await client.getBalance({
                owner: address,
                coinType
            }) 
            const amount = parseAmount(BigNumber(data?.totalBalance), 9) 
            output.push(amount)
        }

        return output
    }, [client])

    const parseAmount = (input: any, decimals: number) => {
        return (Number(input) / 10 ** decimals)
    }

    return {
        faucet,
        fetchBalances
    }
}

export default useLending