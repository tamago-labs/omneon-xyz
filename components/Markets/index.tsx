"use client"

import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { motion } from 'framer-motion';
import FaucetModal from './FaucetModal';
import { useCurrentAccount } from '@iota/dapp-kit';
import useLending from '@/hooks/useLending';
import { ArrowRight, RefreshCw } from 'react-feather';
import SupplyModal from './SupplyModal';
import WithdrawModal from './WithdrawModal';
import Link from 'next/link';
import BorrowModal from './BorrowModal';
import RepayModal from "./RepayModal"


enum Modal {
    None,
    Faucet,
    Supply,
    Withdraw,
    Borrow,
    Repay
}

const MarketsContainer = () => {

    const { fetchBalances, loadPools, updateCurrentPrice } = useLending()

    const account = useCurrentAccount()
    const address = account && account.address

    const [values, dispatch] = useReducer(
        (curVal: any, newVal: any) => ({ ...curVal, ...newVal }),
        {
            balances: undefined,
            tick: 1,
            loading: true,
            markets: [],
            activeMarket: undefined
        }
    )

    const { activeMarket, balances, tick, loading, markets } = values

    const [modal, setModal] = useState<Modal>(Modal.None)

    const [activeTab, setActiveTab] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'supplyApy', direction: 'desc' });
    // const [markets, setMarkets] = useState<any>([]);

    useEffect(() => {
        address && fetchBalances(address).then(
            (balances) => {
                dispatch({
                    balances
                })
            }
        )
    }, [address, tick])


    useEffect(() => {
        loadPools(address).then(
            (markets) => {
                dispatch({
                    markets,
                    loading: false
                })
            }
        )
    }, [tick, address])

    const increaseTick = useCallback(() => {
        dispatch({
            tick: tick + 1
        })
    }, [tick])

    // useEffect(() => {
    //     // Filter markets based on active tab
    //     let filteredMarkets = [...marketData];
    //     if (activeTab === 'supplied') {
    //         filteredMarkets = marketData.filter((market: any) => market.supplied > 0);
    //     } else if (activeTab === 'borrowed') {
    //         filteredMarkets = marketData.filter((market: any) => market.borrowed > 0);
    //     }

    //     // Sort markets based on sort config
    //     filteredMarkets.sort((a: any, b: any) => {
    //         if (a[sortConfig.key] < b[sortConfig.key]) {
    //             return sortConfig.direction === 'asc' ? -1 : 1;
    //         }
    //         if (a[sortConfig.key] > b[sortConfig.key]) {
    //             return sortConfig.direction === 'asc' ? 1 : -1;
    //         }
    //         return 0;
    //     });

    //     setMarkets(filteredMarkets);
    // }, [activeTab, sortConfig]);

    const requestSort = (key: any) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const formatNumber = (num: any) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    const formatCurrency = (num: any) => {
        if (num >= 1_000_000) {
            return `$${(num / 1_000_000).toFixed(1)}M`;
        } else if (num >= 1_000) {
            return `$${(num / 1_000).toFixed(1)}K`;
        } else {
            return `$${num.toFixed(2)}`;
        }
    };

    const getSortIndicator = (key: any) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    console.log("markets: ", markets)

    const onUpdatePrice = useCallback(async (activeMarket: any) => {

        try {
            await updateCurrentPrice(activeMarket.borrow_asset_type, activeMarket.collateral_asset_type)
        } catch (error: any) {
            console.log(error)
        }

    }, [updateCurrentPrice])


    return (
        <div className="min-h-screen text-white">

            {modal === Modal.Faucet && <FaucetModal balances={balances} increaseTick={increaseTick} close={() => setModal(Modal.None)} />}
            {(modal === Modal.Supply && activeMarket) && <SupplyModal balances={balances} activeMarket={activeMarket} increaseTick={increaseTick} close={() => setModal(Modal.None)} />}
            {(modal === Modal.Withdraw && activeMarket) && <WithdrawModal balances={balances} activeMarket={activeMarket} increaseTick={increaseTick} close={() => setModal(Modal.None)} />}
            {(modal === Modal.Borrow && activeMarket) && <BorrowModal balances={balances} activeMarket={activeMarket} increaseTick={increaseTick} close={() => setModal(Modal.None)} />}
            {(modal === Modal.Repay && activeMarket) && <RepayModal balances={balances} activeMarket={activeMarket} increaseTick={increaseTick} close={() => setModal(Modal.None)} />}


            <div className="container mx-auto  ">
                <h1 className="text-3xl font-bold mb-2">Markets</h1>
                <p className="text-gray-300 mb-8">Supply or borrow assets from the Omneon protocol</p>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1 w-fit mb-8">
                    <button
                        className={`px-4 py-2 rounded-md transition-all ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Markets
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md transition-all ${activeTab === 'supplied' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        onClick={() => setActiveTab('supplied')}
                    >
                        Supplied
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md transition-all ${activeTab === 'borrowed' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        onClick={() => setActiveTab('borrowed')}
                    >
                        Borrowed
                    </button>
                </div>

                {/* Markets Table */}
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                                    <th className="px-6 py-4 text-left">Asset</th>
                                    <th
                                        className="px-6 py-4 text-right cursor-pointer hover:text-white"
                                        onClick={() => requestSort('supplyApy')}
                                    >
                                        Supply APY {getSortIndicator('supplyApy')}
                                    </th>
                                    <th
                                        className="px-6 py-4 text-right cursor-pointer hover:text-white"
                                        onClick={() => requestSort('borrowApr')}
                                    >
                                        Borrow APR {getSortIndicator('borrowApr')}
                                    </th>
                                    <th
                                        className="px-6 py-4 text-right cursor-pointer hover:text-white"
                                        onClick={() => requestSort('totalSupply')}
                                    >
                                        Total Supply {getSortIndicator('totalSupply')}
                                    </th>
                                    <th
                                        className="px-6 py-4 text-right cursor-pointer hover:text-white"
                                        onClick={() => requestSort('liquidity')}
                                    >
                                        Liquidity {getSortIndicator('liquidity')}
                                    </th>
                                    <th
                                        className="px-6 py-4 text-right cursor-pointer hover:text-white"
                                        onClick={() => requestSort('utilizationRate')}
                                    >
                                        Utilization {getSortIndicator('utilizationRate')}
                                    </th>
                                    <th className="px-6 py-4 text-right">Your Position</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {markets.map((market: any) => (
                                    <motion.tr
                                        key={market.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="border-b border-gray-700/50 hover:bg-gray-700/20"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <img src={market.image} className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3 text-lg">
                                                    {/* {market.icon} */}
                                                </img>
                                                <div>
                                                    <div className="font-medium">{market.borrow_asset}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {balances && balances[market.id + 2] > 0 && (
                                                            <span className="mr-2 text-green-400">
                                                                {Number(balances[market.id + 2]).toFixed(0)} Supplied
                                                            </span>
                                                        )}
                                                        {market?.activePosition?.borrowAmount > 0 && (
                                                            <span className="text-red-400">
                                                                {market.activePosition.borrowAmount} Borrowed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-green-400">
                                                {market.supplyRate.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-red-400">
                                                {market.borrowRate.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {formatCurrency(market.totalSupply)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {formatCurrency(market.liquidity)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end">
                                                <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full"
                                                        style={{ width: `${market.utilizationRate}%` }}
                                                    ></div>
                                                </div>
                                                <span className="w-[70px] ">{market.utilizationRate.toFixed(2)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end">
                                                {market?.activePosition?.borrowAmount > 0 ? (
                                                    <>
                                                        <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                                                            <div
                                                                className={`h-2 rounded-full ${market.activePosition.healthFactor >= 2 ? 'bg-green-500' :
                                                                        market.activePosition.healthFactor >= 1.5 ? 'bg-blue-500' :
                                                                            market.activePosition.healthFactor >= 1.2 ? 'bg-yellow-500' : 'bg-red-500'
                                                                    }`}
                                                                style={{
                                                                    // Cap at 100% width, with 3.0 being full width
                                                                    width: `${Math.min(100, (market.activePosition.healthFactor / 3) * 100)}%`
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className={`w-[70px] ${market.activePosition.healthFactor >= 2 ? 'text-green-500' :
                                                                market.activePosition.healthFactor >= 1.5 ? 'text-blue-500' :
                                                                    market.activePosition.healthFactor >= 1.2 ? 'text-yellow-500' : 'text-red-500'
                                                            }`}>
                                                            {market.activePosition.healthFactor.toFixed(2)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">No debt position</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex space-x-2 justify-end">
                                                <button
                                                    onClick={() => {
                                                        dispatch({
                                                            activeMarket: market
                                                        })
                                                        setModal(Modal.Supply)
                                                    }} className="px-3 cursor-pointer py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors">
                                                    Supply
                                                </button>
                                                {balances && balances[market.id + 2] > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            dispatch({
                                                                activeMarket: market
                                                            })
                                                            setModal(Modal.Withdraw)
                                                        }}
                                                        className="px-3 cursor-pointer py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors">
                                                        Withdraw
                                                    </button>
                                                )}
                                                {!market?.activePosition?.borrowAmount && (
                                                    <button
                                                        onClick={() => {
                                                            dispatch({
                                                                activeMarket: market
                                                            })
                                                            setModal(Modal.Borrow)
                                                        }}
                                                        className="px-3 cursor-pointer py-1 bg-purple-600 hover:bg-purple-700 rounded-md text-sm transition-colors">
                                                        Borrow
                                                    </button>
                                                )}
                                                {market?.activePosition?.borrowAmount > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            dispatch({
                                                                activeMarket: market
                                                            })
                                                            setModal(Modal.Repay)
                                                        }}
                                                        className="px-3 cursor-pointer py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors">
                                                        Repay
                                                    </button>
                                                )}

                                                {/* {market.borrowed > 0 && (
                                                    <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors">
                                                        Repay
                                                    </button>
                                                )}*/}
                                                {(address && address === "0xe1e2cdde45fcf8fd38577e9da260dc6a6d542569560faf963e1f3e38a1a285c0") && (
                                                    <button onClick={() => onUpdatePrice(market)} className="px-3 py-1 cursor-pointer bg-teal-700 hover:bg-teal-600 rounded-md text-sm transition-colors">
                                                        Update Price
                                                    </button>
                                                )}

                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}

                                {markets.length === 0 && (
                                    <tr>
                                        <td className="px-6 py-8   text-gray-400">
                                            {/* No markets matching your criteria */}
                                            {loading && <RefreshCw className=' text-white animate-spin' size={20} />}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Market Details */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-800/30 flex flex-col backdrop-blur-sm rounded-xl border border-gray-700 p-6">
                        <h3 className="text-lg font-medium mb-4">
                            vUSD Faucet
                        </h3>
                        <p className="text-gray-300 text-sm">
                            Along with the IOTA native token, we also use vUSD for borrowing and lending on our platform.
                        </p>
                        <div className="flex justify-between my-4 mb-2 space-y-2 text-sm">
                            <span>Current Balance</span>
                            {address ? <span>{(balances && balances[1]) ? (balances[1]).toLocaleString() : 0} vUSD</span> : <span>Not connected</span>}
                        </div>
                        <button
                            onClick={() => setModal(Modal.Faucet)}
                            disabled={!address}
                            className={`flex-1  ${!address ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}  md:flex-none px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center transition-colors`}
                        >
                            Get Testnet vUSD
                        </button>

                    </div>

                    <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
                        <h3 className="text-lg font-medium mb-4">
                            Loan-to-Value (LTV)
                        </h3>
                        <p className="text-gray-300 text-sm mb-4">
                            Each asset has a maximum LTV, which determines how much you can borrow against your collateral.
                        </p>
                        <div className="space-y-2">
                            {markets.slice(0, 4).map((market: any) => (
                                <div key={`cf-${market.id}`} className="flex justify-between text-sm">
                                    <span>{market.borrow_asset}</span>
                                    <span>{market.ltv * 100}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-800/30 flex flex-col backdrop-blur-sm rounded-xl border border-gray-700 p-6 lg:col-span-2">
                        <h3 className="text-lg font-medium mb-4">
                            Link Your Email to Setup Personalized Alerts</h3>
                        <p className="text-gray-300 text-sm">
                            Omneon uses AI to monitor your health factor, accrued interest, and system status—then generates a personalized report delivered straight to your inbox. Stay informed and act quickly when your loan or collateral needs attention.
                        </p>
                        <Link href="/notifications" className='mt-auto mr-auto cursor-pointer'>
                            <button
                                className={`flex-1 cursor-pointer md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors`}
                            >
                                Link Now
                                <ArrowRight className='ml-1' />
                            </button>
                        </Link>

                        {/* <div className="mt-4 p-3 bg-blue-900/50 rounded-md border border-blue-700/50 text-sm">
                            <div className="flex items-start">
                                <div className="text-blue-400 mr-2">ℹ️</div>
                                <div>
                                    <strong className="text-blue-300">Protocol Safety:</strong> When borrowing, maintain a safe distance from your maximum borrowing limit to avoid liquidation risk during market volatility.
                                </div>
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MarketsContainer