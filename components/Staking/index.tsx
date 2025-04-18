"use client"


import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LockIcon, UnlockIcon, Clock, ChevronRight, Award, TrendingUp, Calendar, AlertCircle } from 'lucide-react';


const StakingContainer = () => {

    // Mock data for demonstration
    const stakingPools = [
        {
            id: 'iota-pool',
            name: 'IOTA Share',
            icon: '🔷',
            apy: 18.5,
            totalStaked: 1250000,
            userStaked: 500,
            userStakedValue: 1500,
            earned: 125,
            lockPeriods: [
                { days: 30, bonus: 0 },
                { days: 90, bonus: 5 },
                { days: 180, bonus: 12 },
                { days: 365, bonus: 25 },
            ]
        },
        {
            id: 'usdc-pool',
            name: 'USDC Share',
            icon: '💵',
            apy: 15.2,
            totalStaked: 2450000,
            userStaked: 1350,
            userStakedValue: 1350,
            earned: 85,
            lockPeriods: [
                { days: 30, bonus: 0 },
                { days: 90, bonus: 5 },
                { days: 180, bonus: 12 },
                { days: 365, bonus: 25 },
            ]
        },
        {
            id: 'eth-pool',
            name: 'ETH Share',
            icon: '⬙',
            apy: 22.4,
            totalStaked: 1850000,
            userStaked: 0,
            userStakedValue: 0,
            earned: 0,
            lockPeriods: [
                { days: 30, bonus: 0 },
                { days: 90, bonus: 5 },
                { days: 180, bonus: 12 },
                { days: 365, bonus: 25 },
            ]
        }
    ];

    const userWallet = {
        'IOTA Share': 250,
        'USDC Share': 500,
        'ETH Share': 0.2
    };

    const omneonStats = {
        price: 2.45,
        totalStaked: 3820000,
        aprRange: [15.2, 22.4],
        marketCap: 24500000,
        circulating: 10000000
    };

    const [activePool, setActivePool] = useState(null);
    const [stakeAmount, setStakeAmount] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [showStakeModal, setShowStakeModal] = useState(false);

    // Format currency values
    const formatCurrency = (value: any) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const handleStakeClick = (pool: any) => {
        setActivePool(pool);
        setSelectedPeriod(pool.lockPeriods[0]);
        setStakeAmount('');
        setShowStakeModal(true);
    };

    const handleStakeSubmit = () => {
        // Here you would implement the actual staking logic
        setShowStakeModal(false);
        // Reset state
        setActivePool(null);
        setStakeAmount('');
        setSelectedPeriod(null);
    };

    const calculateReward = (amount: any, apy: any, days: any) => {
        if (!amount || isNaN(amount)) return 0;
        return (parseFloat(amount) * (apy / 100) * (days / 365)).toFixed(2);
    };

    const getEffectiveApy = (baseApy: any, bonus: any) => {
        return (baseApy * (1 + bonus / 100)).toFixed(1);
    };

    return (
        <div className="min-h-screen  text-white">
            <div className="container mx-auto ">
                <h1 className="text-3xl font-bold mb-2">Staking</h1>
                <p className="text-gray-300 mb-8">Lock your share tokens to earn Omneon Token rewards</p>

    
                {/* <div className="mb-8 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
                        <div className="flex items-center mb-4 md:mb-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3 text-xl font-bold">Ω</div>
                            <div>
                                <h2 className="text-xl font-bold">Omneon Token</h2>
                                <p className="text-gray-400">Current Price: ${omneonStats.price}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="bg-gray-700/30 rounded-lg px-4 py-2">
                                <p className="text-sm text-gray-400">Total Staked</p>
                                <p className="font-semibold">{formatCurrency(omneonStats.totalStaked)}</p>
                            </div>

                            <div className="bg-gray-700/30 rounded-lg px-4 py-2">
                                <p className="text-sm text-gray-400">APR Range</p>
                                <p className="font-semibold">{omneonStats.aprRange[0]}% - {omneonStats.aprRange[1]}%</p>
                            </div>

                            <div className="bg-gray-700/30 rounded-lg px-4 py-2">
                                <p className="text-sm text-gray-400">Market Cap</p>
                                <p className="font-semibold">{formatCurrency(omneonStats.marketCap)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
                        <div className="flex items-start">
                            <div className="text-blue-400 mr-2"><AlertCircle size={18} /></div>
                            <div>
                                <p className="text-sm text-gray-300">
                                    Staking your share tokens helps secure the protocol and earns you Omneon Token rewards.
                                    Longer lock periods provide APY bonuses. Your share tokens continue to earn lending interest while staked.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                
                <h2 className="text-xl font-bold mb-4">Available Staking Pools</h2>
                <div className="grid grid-cols-1 gap-4 mb-8">
                    {stakingPools.map((pool) => (
                        <div key={pool.id} className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                                     
                                    <div className="flex items-center mb-4 md:mb-0">
                                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mr-3 text-xl">
                                            {pool.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">{pool.name}</h3>
                                            <div className="flex items-center text-green-400 text-sm">
                                                <TrendingUp size={14} className="mr-1" />
                                                <span>Base APY: {pool.apy}%</span>
                                            </div>
                                        </div>
                                    </div>

                                   
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 md:mb-0">
                                        <div>
                                            <p className="text-xs text-gray-400">Total Staked</p>
                                            <p className="font-medium">{formatCurrency(pool.totalStaked)}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400">Your Stake</p>
                                            <p className="font-medium">{pool.userStaked > 0 ? pool.userStaked : '-'}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400">Value</p>
                                            <p className="font-medium">{pool.userStakedValue > 0 ? formatCurrency(pool.userStakedValue) : '-'}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400">Earned</p>
                                            <p className="font-medium text-purple-400">{pool.earned > 0 ? `${pool.earned} OMNN` : '-'}</p>
                                        </div>
                                    </div>

                                    
                                    <div className="flex space-x-2 w-full md:w-auto">
                                        {pool.userStaked > 0 && (
                                            <button
                                                className="flex-1 md:flex-none px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center transition-colors"
                                            >
                                                <Award size={16} className="mr-2" />
                                                Claim
                                            </button>
                                        )}

                                        {userWallet[pool.name] > 0 && (
                                            <button
                                                className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors"
                                                onClick={() => handleStakeClick(pool)}
                                            >
                                                <LockIcon size={16} className="mr-2" />
                                                Stake
                                            </button>
                                        )}

                                        {pool.userStaked > 0 && (
                                            <button
                                                className="flex-1 md:flex-none px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                                            >
                                                <UnlockIcon size={16} className="mr-2" />
                                                Unstake
                                            </button>
                                        )}
                                    </div>
                                </div>

                               
                                {pool.userStaked > 0 && (
                                    <div className="mt-6 pt-4 border-t border-gray-700">
                                        <h4 className="text-sm font-medium mb-3 flex items-center">
                                            <Clock size={14} className="mr-2" />
                                            Lock Period: 90 days (ends Oct 12, 2025)
                                        </h4>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-purple-500 h-2 rounded-full"
                                                style={{ width: '30%' }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between mt-1 text-xs text-gray-400">
                                            <span>30% complete</span>
                                            <span>63 days remaining</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                             
                            {pool.userStaked > 0 && (
                                <div className="bg-gray-700/30 px-6 py-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium">Reward Boost Tiers</h4>
                                        <span className="text-xs text-purple-300">5% Boost Active</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {pool.lockPeriods.map((period) => (
                                            <div
                                                key={period.days}
                                                className={`text-center p-2 rounded-md text-xs ${period.days === 90 ? 'bg-purple-600/30 border border-purple-500/50' : 'bg-gray-800/50'}`}
                                            >
                                                <div className="font-medium">{period.days} Days</div>
                                                <div className="text-gray-400">+{period.bonus}% APY</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-8">
                    <h2 className="text-xl font-bold mb-6">How Staking Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-700/30 rounded-lg p-4 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center mb-4">
                                <LockIcon size={20} className="text-blue-300" />
                            </div>
                            <h3 className="font-medium mb-2">1. Lock Your Tokens</h3>
                            <p className="text-sm text-gray-300">
                                Stake your share tokens for a fixed period to earn Omneon rewards. Longer lock periods provide higher APY bonuses.
                            </p>
                        </div>

                        <div className="bg-gray-700/30 rounded-lg p-4 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-purple-900/50 flex items-center justify-center mb-4">
                                <TrendingUp size={20} className="text-purple-300" />
                            </div>
                            <h3 className="font-medium mb-2">2. Earn Rewards</h3>
                            <p className="text-sm text-gray-300">
                                Rewards accrue continuously while your tokens are staked. Your share tokens continue to earn lending interest simultaneously.
                            </p>
                        </div>

                        <div className="bg-gray-700/30 rounded-lg p-4 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-pink-900/50 flex items-center justify-center mb-4">
                                <Award size={20} className="text-pink-300" />
                            </div>
                            <h3 className="font-medium mb-2">3. Claim & Compound</h3>
                            <p className="text-sm text-gray-300">
                                Claim rewards anytime without ending your stake. Restaking rewards compounds your earnings for maximum growth.
                            </p>
                        </div>
                    </div>
                </div>

                
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
                    <h2 className="text-xl font-bold mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <div className="bg-gray-700/30 rounded-lg p-4">
                            <h3 className="font-medium mb-2">Can I withdraw before my lock period ends?</h3>
                            <p className="text-sm text-gray-300">
                                Early withdrawals are subject to a penalty that decreases over time. You'll forfeit a portion of your unclaimed rewards depending on how much time remains in your lock period.
                            </p>
                        </div>

                        <div className="bg-gray-700/30 rounded-lg p-4">
                            <h3 className="font-medium mb-2">Do I still earn lending interest while staking?</h3>
                            <p className="text-sm text-gray-300">
                                Yes! Your share tokens continue to accrue lending interest even while staked. Staking rewards are additional earnings on top of your regular lending APY.
                            </p>
                        </div>

                        <div className="bg-gray-700/30 rounded-lg p-4">
                            <h3 className="font-medium mb-2">How are reward rates determined?</h3>
                            <p className="text-sm text-gray-300">
                                Base APY rates are calculated based on protocol revenue allocation and adjusted periodically by governance. Lock period bonuses are fixed multipliers that increase your effective APY.
                            </p>
                        </div>
                    </div>
                </div> */}
            </div>

            
            {/* {showStakeModal && activePool && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Stake {activePool.name}</h3>
                            <button
                                className="text-gray-400 hover:text-white"
                                onClick={() => setShowStakeModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-300 mb-2">Amount to Stake</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                                    placeholder="Enter amount"
                                    value={stakeAmount}
                                    onChange={(e) => setStakeAmount(e.target.value)}
                                />
                                <button
                                    className="absolute right-3 top-3 text-sm bg-blue-600 px-2 py-1 rounded-md"
                                    onClick={() => setStakeAmount(userWallet[activePool.name].toString())}
                                >
                                    MAX
                                </button>
                            </div>
                            <div className="text-sm text-gray-400 mt-2">
                                Balance: {userWallet[activePool.name]} {activePool.name}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-300 mb-2">Lock Period</label>
                            <div className="grid grid-cols-4 gap-2">
                                {activePool.lockPeriods.map((period) => (
                                    <button
                                        key={period.days}
                                        className={`p-2 rounded-md text-center text-sm transition-colors ${selectedPeriod && selectedPeriod.days === period.days
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        onClick={() => setSelectedPeriod(period)}
                                    >
                                        <div>{period.days} Days</div>
                                        <div className="text-xs text-gray-400">+{period.bonus}%</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {stakeAmount && selectedPeriod && (
                            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-300">Base APY:</span>
                                    <span>{activePool.apy}%</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-300">Bonus:</span>
                                    <span>+{selectedPeriod.bonus}%</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-300">Effective APY:</span>
                                    <span className="text-green-400 font-medium">
                                        {getEffectiveApy(activePool.apy, selectedPeriod.bonus)}%
                                    </span>
                                </div>
                                <div className="border-t border-gray-600 my-2 pt-2 flex justify-between">
                                    <span className="text-gray-300">Estimated Reward:</span>
                                    <span className="text-purple-400 font-medium">
                                        ~{calculateReward(
                                            stakeAmount,
                                            getEffectiveApy(activePool.apy, selectedPeriod.bonus),
                                            selectedPeriod.days
                                        )} OMNN
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <button
                                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                onClick={() => setShowStakeModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={`flex-1 px-4 py-3 bg-blue-600 rounded-lg transition-colors ${!stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > userWallet[activePool.name]
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-blue-700'
                                    }`}
                                disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > userWallet[activePool.name]}
                                onClick={handleStakeSubmit}
                            >
                                Confirm Stake
                            </button>
                        </div>
                    </motion.div>
                </div>
            )} */}
        </div>
    )
}

export default StakingContainer