"use client"

import React, { useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, Clock, Filter } from 'lucide-react';

const AnalyticsContainer = () => {


// Mock data for demonstration
const tvlHistoryData = [
    { date: 'Jan 1', tvl: 1200000 },
    { date: 'Jan 8', tvl: 1450000 },
    { date: 'Jan 15', tvl: 1380000 },
    { date: 'Jan 22', tvl: 1520000 },
    { date: 'Jan 29', tvl: 1680000 },
    { date: 'Feb 5', tvl: 1750000 },
    { date: 'Feb 12', tvl: 1900000 },
    { date: 'Feb 19', tvl: 2100000 },
    { date: 'Feb 26', tvl: 2250000 },
    { date: 'Mar 5', tvl: 2380000 },
    { date: 'Mar 12', tvl: 2420000 },
  ];
  
  const utilizationData = [
    { date: 'Jan 1', utilization: 65 },
    { date: 'Jan 8', utilization: 68 },
    { date: 'Jan 15', utilization: 72 },
    { date: 'Jan 22', utilization: 70 },
    { date: 'Jan 29', utilization: 75 },
    { date: 'Feb 5', utilization: 72 },
    { date: 'Feb 12', utilization: 78 },
    { date: 'Feb 19', utilization: 80 },
    { date: 'Feb 26', utilization: 76 },
    { date: 'Mar 5', utilization: 74 },
    { date: 'Mar 12', utilization: 77 },
  ];
  
  const interestRateData = [
    { date: 'Jan 1', supply: 3.2, borrow: 5.8 },
    { date: 'Jan 8', supply: 3.5, borrow: 6.2 },
    { date: 'Jan 15', supply: 3.7, borrow: 6.5 },
    { date: 'Jan 22', supply: 3.6, borrow: 6.3 },
    { date: 'Jan 29', supply: 3.8, borrow: 6.7 },
    { date: 'Feb 5', supply: 3.7, borrow: 6.5 },
    { date: 'Feb 12', supply: 4.0, borrow: 7.1 },
    { date: 'Feb 19', supply: 4.2, borrow: 7.4 },
    { date: 'Feb 26', supply: 4.0, borrow: 7.0 },
    { date: 'Mar 5', supply: 3.9, borrow: 6.8 },
    { date: 'Mar 12', supply: 4.1, borrow: 7.2 },
  ];
  
  const suppliedAssetsData = [
    { name: 'IOTA', value: 35 },
    { name: 'USDC', value: 25 },
    { name: 'ETH', value: 20 },
    { name: 'BTC', value: 15 },
    { name: 'DAI', value: 5 },
  ];
  
  const borrowedAssetsData = [
    { name: 'IOTA', value: 15 },
    { name: 'USDC', value: 40 },
    { name: 'ETH', value: 30 },
    { name: 'BTC', value: 10 },
    { name: 'DAI', value: 5 },
  ];
  
  const liquidationsData = [
    { date: 'Jan', value: 35000 },
    { date: 'Feb', value: 42000 },
    { date: 'Mar', value: 28000 },
  ];
  
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];

  const [timeframe, setTimeframe] = useState('3m');
  
  // Format currency values
  const formatCurrency = (value: any) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg">
          <p className="text-gray-300 mb-1">{label}</p>
          {payload.map((entry:any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.name.includes('TVL') || entry.name.includes('Value') 
                ? formatCurrency(entry.value) 
                : entry.name.includes('Rate') || entry.name.includes('APY') || entry.name.includes('APR')
                  ? `${entry.value}%`
                  : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

    return (
        <div className="min-h-screen   text-white">
      <div className="container mx-auto ">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-gray-300">Protocol statistics and market trends</p>
          </div>
          
          <div className="flex items-center mt-4 md:mt-0">
            <span className="text-gray-400 mr-2">Timeframe:</span>
            <div className="flex bg-gray-800/50 rounded-lg p-1">
              <button 
                className={`px-3 py-1 rounded-md text-sm transition-colors ${timeframe === '1m' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                onClick={() => setTimeframe('1m')}
              >
                1M
              </button>
              <button 
                className={`px-3 py-1 rounded-md text-sm transition-colors ${timeframe === '3m' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                onClick={() => setTimeframe('3m')}
              >
                3M
              </button>
              <button 
                className={`px-3 py-1 rounded-md text-sm transition-colors ${timeframe === '1y' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                onClick={() => setTimeframe('1y')}
              >
                1Y
              </button>
              <button 
                className={`px-3 py-1 rounded-md text-sm transition-colors ${timeframe === 'all' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                onClick={() => setTimeframe('all')}
              >
                All
              </button>
            </div>
          </div>
        </div>
        
        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400">Total Value Locked</h3>
              <DollarSign size={20} className="text-blue-400" />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(2420000)}</div>
            <div className="flex items-center mt-2 text-green-400 text-sm">
              <TrendingUp size={16} className="mr-1" />
              <span>+12.4% this month</span>
            </div>
          </div>
          
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400">Protocol Utilization</h3>
              <Activity size={20} className="text-purple-400" />
            </div>
            <div className="text-2xl font-bold">77%</div>
            <div className="flex items-center mt-2 text-green-400 text-sm">
              <TrendingUp size={16} className="mr-1" />
              <span>+3% this month</span>
            </div>
          </div>
          
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400">Active Users</h3>
              <Users size={20} className="text-pink-400" />
            </div>
            <div className="text-2xl font-bold">1,247</div>
            <div className="flex items-center mt-2 text-green-400 text-sm">
              <TrendingUp size={16} className="mr-1" />
              <span>+22% this month</span>
            </div>
          </div>
          
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400">Liquidations (30d)</h3>
              <Clock size={20} className="text-red-400" />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(28000)}</div>
            <div className="flex items-center mt-2 text-red-400 text-sm">
              <TrendingDown size={16} className="mr-1" />
              <span>-33% this month</span>
            </div>
          </div>
        </div>
        
        {/* TVL Chart */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">Total Value Locked</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={tvlHistoryData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis 
                  stroke="#9CA3AF"
                  tickFormatter={(value) => formatCurrency(value).replace(',000', 'K').replace(',000,000', 'M')}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="tvl" 
                  name="TVL" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#tvlGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Interest Rates and Utilization Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-6">Interest Rates</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={interestRateData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="supply" 
                    name="Supply APY" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="borrow" 
                    name="Borrow APR" 
                    stroke="#f97316" 
                    strokeWidth={2} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-6">Utilization Rate</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={utilizationData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="utilizationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="utilization" 
                    name="Utilization Rate" 
                    stroke="#8b5cf6" 
                    fillOpacity={1} 
                    fill="url(#utilizationGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Asset Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-6">Supplied Assets Distribution</h2>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={suppliedAssetsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {suppliedAssetsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-6">Borrowed Assets Distribution</h2>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={borrowedAssetsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {borrowedAssetsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Liquidations */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">Liquidations History</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={liquidationsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis 
                  stroke="#9CA3AF"
                  tickFormatter={(value) => formatCurrency(value).replace(',000', 'K')}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Liquidation Value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Protocol Health */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-6">Protocol Health Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Collateralization Ratio</h3>
              <div className="flex items-center">
                <div className="w-full bg-gray-700 rounded-full h-4 mr-4">
                  <div 
                    className="bg-green-500 h-4 rounded-full" 
                    style={{ width: '215%' }}
                  ></div>
                </div>
                <span className="font-medium">215%</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Average collateralization across all positions
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Reserve Factor</h3>
              <div className="flex items-center">
                <div className="w-full bg-gray-700 rounded-full h-4 mr-4">
                  <div 
                    className="bg-blue-500 h-4 rounded-full" 
                    style={{ width: '10%' }}
                  ></div>
                </div>
                <span className="font-medium">10%</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Percentage of interest going to protocol reserves
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Protocol Coverage</h3>
              <div className="flex items-center">
                <div className="w-full bg-gray-700 rounded-full h-4 mr-4">
                  <div 
                    className="bg-purple-500 h-4 rounded-full" 
                    style={{ width: '28%' }}
                  ></div>
                </div>
                <span className="font-medium">28%</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Protocol reserves as percentage of total borrows
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
} 

export default AnalyticsContainer