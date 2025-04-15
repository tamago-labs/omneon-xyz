import { useState, useReducer, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import useLending from "@/hooks/useLending";
import { Puff } from 'react-loading-icons'
import { usePrice } from "@/hooks/usePrice";


const BorrowModal = ({ close, balances, increaseTick, activeMarket }: any) => {

    const { toUSD } = usePrice()
    const { borrow } = useLending()

    const [values, dispatch] = useReducer(
        (curVal: any, newVal: any) => ({ ...curVal, ...newVal }),
        {
            errorMessage: undefined,
            loading: false,
            collateralAmount: 0,
            maxBorrowAmount: 0,
            borrowAmount: 0
        }
    )

    const { collateralAmount, errorMessage, loading, maxBorrowAmount, borrowAmount } = values


    const onBorrow = useCallback(async () => {

        dispatch({ errorMessage: undefined })

        if (0.1 > collateralAmount) {
            dispatch({ errorMessage: "Minimum collateral amount is 0.1" })
            return
        }

        if (0.1 > borrowAmount) {
            dispatch({ errorMessage: "Minimum borrow amount is 0.1" })
            return
        }

        dispatch({ loading: true })
        try {

            const txId = await borrow(collateralAmount, borrowAmount, activeMarket.borrow_asset_type, activeMarket.collateral_asset_type)

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

    }, [collateralAmount, borrowAmount, borrow, activeMarket])

    const balance = balances ? (activeMarket.id === 0 ? balances[0] : balances[1]) : 0

    console.log("active market:", activeMarket)

    let heathFactor = 0

    if (borrowAmount > 0 && activeMarket) {
        const liquidation_threshold_value = collateralAmount * activeMarket.conversionRate * activeMarket.liquidationThreshold
        heathFactor = liquidation_threshold_value / borrowAmount
    }


    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Borrow {activeMarket.borrow_asset}</h3>
                    <button
                        className="text-gray-400 hover:text-white"
                        onClick={close}
                    >
                        <X />
                    </button>
                </div>
                <div className="space-y-4">
                    {/* Collateral Asset Selector */}
                    <div className="mb-6">
                        <label className="block text-gray-300 mb-2">Select Collateral Asset</label>
                        <div className="relative">
                            <div className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white flex items-center justify-between cursor-pointer">
                                <div className="flex items-center space-x-2">
                                    <img src={activeMarket.id === 0 ? "./images/iota-icon.png" : "./images/vusd-icon.png"} className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">

                                    </img>
                                    <span>
                                        {activeMarket.collateral_asset}
                                    </span>
                                </div>
                                <div className="text-gray-400 text-sm">
                                    {/* This will be replaced with more options in the future */}
                                    Only option available
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Collateral Input Section */}
                    <div className="mb-6">
                        <label className="block text-gray-300 mb-2">Collateral Amount ({activeMarket.collateral_asset})</label>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                                placeholder="Enter collateral amount"
                                value={collateralAmount}
                                onChange={(e) => {
                                    let amount = Number(e.target.value)
                                    dispatch({
                                        collateralAmount: amount,
                                        borrowAmount: 0,
                                        maxBorrowAmount: amount * activeMarket.conversionRate * activeMarket.ltv
                                    })
                                }}
                            />
                            <button
                                className="absolute cursor-pointer right-3 top-3 text-sm bg-blue-600 px-2 py-1 rounded-md"
                                onClick={() => {
                                    dispatch({
                                        collateralAmount: balance ? Number(balance) : 0,
                                        borrowAmount: 0,
                                        maxBorrowAmount: Number(balance) * activeMarket.conversionRate * activeMarket.ltv
                                    })
                                }}
                            >
                                MAX
                            </button>
                        </div>
                        <div className="mt-2 flex flex-row text-sm text-gray-400">
                            <div className="">
                                Balance: {balance || 0}{` ${activeMarket.collateral_asset}`}
                            </div>
                            <div className="ml-auto">
                                ~${activeMarket.id === 1 ? (toUSD("VUSD", collateralAmount)).toFixed(2) : (toUSD("IOTA", collateralAmount)).toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Borrow Amount Slider Section */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-gray-300">Amount to Borrow </label>
                            <span className="text-white font-medium">{borrowAmount.toLocaleString()} {activeMarket.borrow_asset}</span>
                        </div>

                        <input
                            type="range"
                            min="0"
                            max={maxBorrowAmount || 100}
                            step="0.1"
                            value={borrowAmount}
                            onChange={(e) => {
                                dispatch({
                                    borrowAmount: Number(e.target.value)
                                })
                            }}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />

                        <div className="mt-2 flex justify-between text-xs text-gray-400">
                            <span>0 {activeMarket.borrow_asset}</span>
                            <span>{maxBorrowAmount.toLocaleString() || 100} {activeMarket.borrow_asset}</span>
                        </div>

                        <div className="mt-2 flex flex-row text-sm text-gray-400">
                            {/* <div className="">
                                Available to Borrow: {availableToBorrow || 0} USDT
                            </div>
                            <div className="ml-auto">
                                ~${availableToBorrowValue || 0}
                            </div> */}
                        </div>

                        <div className="mt-3 flex justify-center">
                            <div className="flex space-x-3">
                                <button
                                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-md"
                                    onClick={() => dispatch({
                                        borrowAmount: maxBorrowAmount ? Number(maxBorrowAmount) * 0.25 : 25
                                    })}
                                >
                                    25%
                                </button>
                                <button
                                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-md"
                                    onClick={() => dispatch({
                                        borrowAmount: maxBorrowAmount ? Number(maxBorrowAmount) * 0.5 : 50
                                    })}
                                >
                                    50%
                                </button>
                                <button
                                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-md"
                                    onClick={() => dispatch({
                                        borrowAmount: maxBorrowAmount ? Number(maxBorrowAmount) * 0.75 : 75
                                    })}
                                >
                                    75%
                                </button>
                                <button
                                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-md"
                                    onClick={() => dispatch({
                                        borrowAmount: maxBorrowAmount ? Number(maxBorrowAmount) : 100
                                    })}
                                >
                                    MAX
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Borrow Information Section */}
                    <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Borrow APR</span>
                            {/* <span className="text-white">{borrowApy || 0}%</span> */}
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Maximum LTV</span>
                            <span className="text-white">{(activeMarket.ltv * 100) || 0}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Health Factor</span>
                            <span className="text-white">{heathFactor.toFixed(2)}</span>
                        </div>

                    </div>

                    {/* Action Button */}
                    {/* <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
                   
                    >
                        Borrow {activeMarket.borrow_asset}
                    </button> */}
                    <div className="flex space-x-3 mt-6">
                        <button
                            className={`flex-1 cursor-pointer px-4 py-3 bg-blue-600 rounded-lg transition-colors ${!borrowAmount || parseFloat(`${borrowAmount}`) <= 0
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-blue-700'
                                }`}
                            disabled={!borrowAmount || parseFloat(`${borrowAmount}`) <= 0}
                            onClick={onBorrow}
                        >
                            {loading
                                ?
                                <Puff
                                    stroke="#fff"
                                    className="w-5 h-5 mx-auto"
                                />
                                :
                                <>
                                    Confirm Borrow
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

export default BorrowModal