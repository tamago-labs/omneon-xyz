import { useState, useReducer, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Info, AlertTriangle } from "lucide-react";
import useLending from "@/hooks/useLending";
import { Puff } from 'react-loading-icons'
import { usePrice } from "@/hooks/usePrice"; 

const RepayModal = ({ close, balances, increaseTick, activeMarket }: any) => {

    const { toUSD } = usePrice()
    const { repay } = useLending()

     const [values, dispatch] = useReducer(
        (curVal: any, newVal: any) => ({ ...curVal, ...newVal }),
        {
            errorMessage: undefined,
            loading: false
        }
    )

    const { errorMessage, loading } = values

    const onRepay = useCallback(async () => {

        dispatch({ errorMessage: undefined })
        dispatch({ loading: true })
        try {

            const txId = await repay( activeMarket.activePosition.borrowAmount, activeMarket.borrow_asset_type, activeMarket.collateral_asset_type)

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

    }, [repay, activeMarket])
 

    const balance = balances ? (activeMarket.id === 0 ? balances[1] : balances[0]) : 0
    const balanceValue =  balances ? (activeMarket.id === 0 ? toUSD("VUSD", balances[1], activeMarket.currentPrice) : toUSD("IOTA", balances[0], activeMarket.currentPrice)) : 0

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Repay {activeMarket.borrow_asset}</h3>
                    <button
                        className="text-gray-400 hover:text-white"
                        onClick={close}
                    >
                        <X />
                    </button>
                </div>
                <div className="space-y-4">
                     {/* Repay Info Section */}
      <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Outstanding Debt</span>
          <div className="flex flex-col items-end">
            <span className="text-white font-medium">{activeMarket?.activePosition?.borrowAmount || 0} {activeMarket.borrow_asset}</span>
            <span className="text-gray-400 text-sm">~${activeMarket?.activePosition?.borrowValue?.toLocaleString() || 0}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Current Health Factor</span>
          <span className={`font-medium ${
            activeMarket?.activePosition?.healthFactor >= 2 ? 'text-green-500' : 
            activeMarket?.activePosition?.healthFactor >= 1.5 ? 'text-blue-500' : 
            activeMarket?.activePosition?.healthFactor >= 1.2 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {activeMarket?.activePosition?.healthFactor?.toFixed(2) || '0.00'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Wallet Balance</span>
          <div className="flex flex-col items-end">
            <span className="text-white">{balance || 0} {activeMarket.borrow_asset}</span>
            <span className="text-gray-400 text-sm">~${balanceValue || 0}</span>
          </div>
        </div>
      </div>
      {/* Warning/Info Message */}
      {activeMarket?.activePosition?.borrowAmount > balance ? (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-sm text-red-300">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>You don't have enough {activeMarket.borrow_asset} in your wallet to repay your full debt. Please add more funds to your wallet.</p>
          </div>
        </div>
      ) : (
        <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 text-sm text-blue-300">
          <div className="flex items-start">
            <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>This will repay your entire debt of {activeMarket?.activePosition?.borrowAmount || 0} {activeMarket.borrow_asset} and close your position.</p>
          </div>
        </div>
      )}
      
      {/* Notice Section */}
      <div className="text-center text-gray-400 text-sm">
        <p>Currently, only full repayment is supported.</p>
        <p>Partial repayment will be available in future updates.</p>
      </div>
       
      <div className="flex space-x-3">
                        <button
                            className={`flex-1 cursor-pointer px-4 py-3 bg-blue-600 rounded-lg transition-colors ${activeMarket?.activePosition?.borrowAmount > balance || !activeMarket?.activePosition?.borrowAmount
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-blue-700'
                                }`}
                            disabled={activeMarket?.activePosition?.borrowAmount > balance || !activeMarket?.activePosition?.borrowAmount} 
                            onClick={onRepay}
                        >
                            {loading
                                ?
                                <Puff
                                    stroke="#fff"
                                    className="w-5 h-5 mx-auto"
                                />
                                :
                                <>
                                    Repay Now
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

export default RepayModal