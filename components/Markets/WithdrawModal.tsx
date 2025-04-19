import { useState, useReducer, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import useLending from "@/hooks/useLending";
import { Puff } from 'react-loading-icons'
import { usePrice } from "@/hooks/usePrice";

const WithdrawModal = ({ close, balances, increaseTick, activeMarket }: any) => {

    const { toUSD } = usePrice()

    const { withdraw } = useLending()

    const [values, dispatch] = useReducer(
        (curVal: any, newVal: any) => ({ ...curVal, ...newVal }),
        {
            errorMessage: undefined,
            loading: false
        }
    )

    const { errorMessage, loading } = values

    const [amount, setAmount] = useState<number>(0);

    const onWithdraw = useCallback(async () => {
        dispatch({ errorMessage: undefined })

        if (0.1 > amount) {
            dispatch({ errorMessage: "Minimum amount is 0.1" })
            return
        }

        dispatch({ loading: true })
        try {

            const txId = await withdraw(amount, activeMarket.borrow_asset_type, activeMarket.collateral_asset_type)

            dispatch({ loading: false })

            if (txId) {
                close()
                setTimeout(() => {
                    increaseTick()
                }, 2000)
            } else {
                throw new Error("Unknown error. Possibly rejection.")
            }

        } catch (error: any) {
            console.log(error)
            dispatch({ loading: false })
            dispatch({ errorMessage: error.message })
        }
    }, [amount, withdraw, activeMarket])

    const balance = balances ? (activeMarket.id === 0 ? balances[2] : balances[3]) : 0

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Withdraw {activeMarket.borrow_asset} </h3>
                    <button
                        className="text-gray-400 hover:text-white"
                        onClick={close}
                    >
                        <X />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="mb-6">
                        <label className="block text-gray-300 mb-2">Amount to Withdraw</label>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                            />
                            <button
                                className="absolute right-3 top-3 text-sm bg-blue-600 px-2 py-1 rounded-md"
                                onClick={() => setAmount(balance ? Number(balance) : 0)}
                            >
                                MAX
                            </button>
                        </div>
                        <div className="mt-2 flex flex-row text-sm text-gray-400">
                            <div className=" ">
                                {activeMarket.id === 0 && <>Balance: {balance ? balance.toFixed(4) : 0} Share vUSD</>}
                                {activeMarket.id === 1 && <>Balance: {balance ? balance.toFixed(4) : 0} Share IOTA</>}
                            </div>
                            <div className="ml-auto">
                                ~${  activeMarket.id === 0 ? (toUSD("VUSD", amount)).toFixed(2) : (toUSD("IOTA", amount, activeMarket.currentPrice)).toFixed(2) }
                            </div>
                        </div>

                    </div>

                    <div className="flex space-x-3">
                        <button
                            className={`flex-1 cursor-pointer px-4 py-3 bg-blue-600 rounded-lg transition-colors ${!amount || parseFloat(`${amount}`) <= 0
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-blue-700'
                                }`}
                            disabled={!amount || parseFloat(`${amount}`) <= 0}
                            onClick={onWithdraw}
                        >
                            {loading
                                ?
                                <Puff
                                    stroke="#fff"
                                    className="w-5 h-5 mx-auto"
                                />
                                :
                                <>
                                    Confirm Withdraw
                                </>
                            }
                        </button>
                        <button
                            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            onClick={close}
                        >
                            Cancel
                        </button>
                    </div>
                    {errorMessage && (
                        <p className="text-sm text-center mt-2 text-secondary">
                            {errorMessage}
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default WithdrawModal