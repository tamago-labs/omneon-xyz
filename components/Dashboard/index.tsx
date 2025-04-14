"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Info, TrendingUp, Activity } from 'lucide-react';

const DashboardContainer = () => {

    // Mock data for demonstration
    const userData = {
        healthFactor: 1.78,
        totalSupplied: 2850,
        totalBorrowed: 1200,
        netWorth: 1650,
        liquidationThreshold: 1.1,
        suppliedAssets: [
            {
                id: 'iota',
                name: 'IOTA',
                icon: '🔷',
                amount: 500,
                value: 1500,
                apy: 2.34,
                collateral: true
            },
            {
                id: 'usdc',
                name: 'USDC',
                icon: '💵',
                amount: 1350,
                value: 1350,
                apy: 4.21,
                collateral: true
            }
        ],
        borrowedAssets: [
            {
                id: 'eth',
                name: 'ETH',
                icon: '⬙',
                amount: 0.5,
                value: 1200,
                apr: 2.45
            }
        ]
    };

    const [showRiskInfo, setShowRiskInfo] = useState(false);

    // Calculate risk level based on health factor
    const getRiskLevel = (healthFactor: any) => {
        if (healthFactor >= 2) return { level: 'Safe', color: 'bg-green-500' };
        if (healthFactor >= 1.5) return { level: 'Moderate', color: 'bg-yellow-500' };
        if (healthFactor >= 1.2) return { level: 'High', color: 'bg-orange-500' };
        return { level: 'Very High', color: 'bg-red-500' };
    };

    const riskInfo = getRiskLevel(userData.healthFactor);
    const healthFactorPercentage = Math.min((userData.healthFactor / 3) * 100, 100);

    // Format currency values
    const formatCurrency = (value: any) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };


    return (
        <div className="min-h-screen   text-white">
      <div className="container mx-auto ">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-300 mb-8">Monitor your positions and manage risk</p>
        
        {/* Health Factor Section */}
        <div className="mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center">
                  <h2 className="text-xl font-semibold mr-2">Position Health</h2>
                  <button 
                    onClick={() => setShowRiskInfo(!showRiskInfo)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Info size={18} />
                  </button>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Your liquidation threshold is {userData.liquidationThreshold.toFixed(2)}
                </p>
              </div>
              
              <div className="flex space-x-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center"
                >
                  <Activity size={16} className="mr-2" />
                  Adjust Position
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center"
                >
                  <TrendingUp size={16} className="mr-2" />
                  Improve Health
                </motion.button>
              </div>
            </div>
            
            {showRiskInfo && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-blue-900/30 border border-blue-800/50 rounded-lg p-4 mb-6"
              >
                <h3 className="font-medium mb-2">Understanding Health Factor</h3>
                <p className="text-sm text-gray-300">
                  Your health factor represents the safety of your borrowed position relative to your supplied collateral assets. A health factor below {userData.liquidationThreshold.toFixed(2)} will trigger liquidation.
                </p>
                <ul className="mt-2 text-sm text-gray-300 space-y-1">
                  <li>• Above 2.0: Safe position with low liquidation risk</li>
                  <li>• 1.5 - 2.0: Moderate risk, consider adding collateral</li>
                  <li>• 1.2 - 1.5: High risk, action recommended</li>
                  <li>• Below 1.2: Very high risk, immediate action required</li>
                </ul>
              </motion.div>
            )}
            
            <div className="bg-gray-700/30 rounded-xl p-6">
              <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${riskInfo.color} mr-2`}></div>
                    <h3 className="font-semibold text-lg">{riskInfo.level} Risk</h3>
                  </div>
                  <div className="text-3xl font-bold mt-1">
                    {userData.healthFactor.toFixed(2)}
                    <span className="text-sm text-gray-400 ml-2">Health Factor</span>
                  </div>
                </div>
                
                {userData.healthFactor < 1.5 && (
                  <div className="bg-red-900/40 border border-red-700/40 rounded-lg p-3 flex items-start">
                    <AlertTriangle size={20} className="text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-200">
                        Your position is at risk of liquidation. Consider repaying some debt or adding more collateral to improve your health factor.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${
                    healthFactorPercentage < 33 ? 'bg-red-500' : 
                    healthFactorPercentage < 66 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${healthFactorPercentage}%` }}
                ></div>
                
                {/* Liquidation threshold marker */}
                <div 
                  className="absolute top-0 h-full border-l-2 border-red-500 flex items-center"
                  style={{ left: `${(userData.liquidationThreshold / 3) * 100}%` }}
                >
                  <div className="absolute -top-6 -translate-x-1/2 text-xs text-red-400">
                    Liquidation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Financial Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center text-green-400 mb-2">
              <ArrowUpRight size={18} className="mr-2" />
              <h3 className="font-medium">Supplied</h3>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(userData.totalSupplied)}</div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">Across {userData.suppliedAssets.length} assets</span>
              <span className="text-xs text-green-400">
                +${(userData.suppliedAssets.reduce((acc, asset) => acc + (asset.value * asset.apy / 100), 0)).toFixed(2)}/day
              </span>
            </div>
          </div>
          
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center text-red-400 mb-2">
              <ArrowDownRight size={18} className="mr-2" />
              <h3 className="font-medium">Borrowed</h3>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(userData.totalBorrowed)}</div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">Across {userData.borrowedAssets.length} assets</span>
              <span className="text-xs text-red-400">
                -${(userData.borrowedAssets.reduce((acc, asset) => acc + (asset.value * asset.apr / 100), 0)).toFixed(2)}/day
              </span>
            </div>
          </div>
          
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center text-blue-400 mb-2">
              <Activity size={18} className="mr-2" />
              <h3 className="font-medium">Net Position</h3>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(userData.netWorth)}</div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">Total value</span>
              <span className="text-xs text-blue-400">
                {(userData.totalBorrowed / userData.totalSupplied * 100).toFixed(1)}% utilized
              </span>
            </div>
          </div>
        </div>
        
        {/* Supplied Assets Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Your Supplied Assets</h2>
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4 text-right">Balance</th>
                  <th className="px-6 py-4 text-right">Value</th>
                  <th className="px-6 py-4 text-right">APY</th>
                  <th className="px-6 py-4 text-right">Collateral</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {userData.suppliedAssets.map((asset) => (
                  <tr key={asset.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3 text-lg">
                          {asset.icon}
                        </div>
                        <div className="font-medium">{asset.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {asset.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(asset.value)}
                    </td>
                    <td className="px-6 py-4 text-right text-green-400">
                      {asset.apy.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      {asset.collateral ? (
                        <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-700/30 text-gray-400 rounded-full text-xs">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2 justify-end">
                        <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors">
                          Withdraw
                        </button>
                        {asset.collateral ? (
                          <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors">
                            Disable
                          </button>
                        ) : (
                          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors">
                            Use as Collateral
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Borrowed Assets Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Your Borrowed Assets</h2>
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4 text-right">Balance</th>
                  <th className="px-6 py-4 text-right">Value</th>
                  <th className="px-6 py-4 text-right">APR</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {userData.borrowedAssets.length === 0 ? (
                  <tr>
                    <td   className="px-6 py-8 text-center text-gray-400">
                      You don't have any borrowed assets.
                    </td>
                  </tr>
                ) : (
                  userData.borrowedAssets.map((asset) => (
                    <tr key={asset.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3 text-lg">
                            {asset.icon}
                          </div>
                          <div className="font-medium">{asset.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {asset.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatCurrency(asset.value)}
                      </td>
                      <td className="px-6 py-4 text-right text-red-400">
                        {asset.apr.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2 justify-end">
                          <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors">
                            Repay
                          </button>
                          <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-md text-sm transition-colors">
                            Borrow More
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Risk Management Tips */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-4">Risk Management Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
              <h3 className="font-medium mb-2">Maintain a Healthy Position</h3>
              <p className="text-sm text-gray-300">
                Aim to keep your health factor above 2.0 to protect against market volatility. The higher your health factor, the safer your position against liquidation.
              </p>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
              <h3 className="font-medium mb-2">Diversify Your Collateral</h3>
              <p className="text-sm text-gray-300">
                Using multiple assets as collateral can help mitigate risks from price volatility in any single asset.
              </p>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
              <h3 className="font-medium mb-2">Monitor Market Conditions</h3>
              <p className="text-sm text-gray-300">
                Keep an eye on market trends and volatility. Consider repaying debt or adding collateral during periods of high volatility.
              </p>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
              <h3 className="font-medium mb-2">Set Up Alerts</h3>
              <p className="text-sm text-gray-300">
                Configure notifications to alert you when your health factor drops below a certain threshold so you can take action before liquidation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
}

export default DashboardContainer