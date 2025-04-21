"use client";

import React, { useState, useCallback, useEffect, useReducer } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LockIcon,
  UnlockIcon,
  Clock,
  ChevronRight,
  Award,
  TrendingUp,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Puff } from 'react-loading-icons'
import { useCurrentAccount } from '@iota/dapp-kit';
import STAKING_POOLS from "../../data/staking_pools.json"
import useStaking from "../../hooks/useStaking"
import useLending from "../../hooks/useLending"
import { RefreshCw } from 'react-feather';

const StakingContainer = () => {

  const { loadPools, stake } = useStaking()
  const [assets, setAssets] = useState<any>([]);


  const { fetchBalances } = useLending()

  const account = useCurrentAccount()
  const address = account && account.address

  const [values, dispatch] = useReducer(
    (curVal: any, newVal: any) => ({ ...curVal, ...newVal }),
    {
      balances: undefined,
      tick: 1,
      errorMessage: undefined,
      loading: false
    }
  )

  const { balances, tick, errorMessage, loading } = values

  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  // const [isUnstakeModalOpen, setIsUnstakeModalOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  // const [unstakeAmount, setUnstakeAmount] = useState("");

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
    loadPools().then(setAssets)
  }, [tick])

  const increaseTick = useCallback(() => {
    dispatch({
      tick: tick + 1
    })
  }, [tick])

  // Modal handlers
  const openStakeModal = (asset: any) => {
    setSelectedAsset(asset);
    setStakeAmount("");
    setIsStakeModalOpen(true);
  };

  // const openUnstakeModal = (asset: any) => {
  //   setSelectedAsset(asset);
  //   setUnstakeAmount("");
  //   setIsUnstakeModalOpen(true);
  // };

  const closeModals = () => {
    setIsStakeModalOpen(false);
    // setIsUnstakeModalOpen(false);
    setSelectedAsset(null);
  };
 

  const onStake = useCallback(async () => {

    dispatch({ errorMessage: undefined })

    if (0.1 > Number(stakeAmount)) {
      dispatch({ errorMessage: "Minimum amount is 0.1" })
      return
    }

    dispatch({ loading: true })
    try {

      const txId = await stake(Number(stakeAmount), selectedAsset.coin_type)

      dispatch({ loading: false })

      if (txId) {
        closeModals()
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

  }, [stake, stakeAmount, selectedAsset])

  const handleMaxStake = () => {
    if (selectedAsset) {
      setStakeAmount(selectedAsset.balance);
    }
  };

  console.log("assets: ", assets)

  let totalStakedValue = 0

  assets.map((item:any) => {
    totalStakedValue = totalStakedValue+Number(item.totalStakedValue)
  })

  return (
    <div className="min-h-screen text-white p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-2">Staking</h1>
          <p className="text-lg text-blue-200">
            Stake your lending pool share tokens to earn OMN rewards
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-3 gap-4 mt-8 bg-gray-800/30 backdrop-blur-sm  p-6 rounded-xl  "
        >
          <div className="text-center">
            <p className="text-blue-300 mb-1">Total Value Staked</p>
            <h2 className="text-2xl font-bold">${totalStakedValue.toLocaleString()}</h2>
          </div>
          <div className="text-center">
            <p className="text-blue-300 mb-1">OMN Price</p>
            <h2 className="text-2xl font-bold">$0.00015</h2>
          </div>
          <div className="text-center">
            <p className="text-blue-300 mb-1">OMN Supply</p>
            <h2 className="text-2xl font-bold">10M OMN</h2>
          </div>
        </motion.div>
      </div>

      {/* Staking Pools */}
      <div className="max-w-4xl mx-auto">
        {/* <h2 className="text-2xl font-bold mb-6">Your Staking Positions</h2> */}

        <div className="space-y-4">
          {assets.length === 0 && (
            <div className="px-6 py-8   text-gray-400">
              <RefreshCw className=' text-white animate-spin' size={20} />
            </div>
          )}
          {assets.map((asset: any, index: number) => (
            <motion.div
              key={asset.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              className="bg-gray-800/30  rounded-xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img src={asset.image} className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3 text-lg">
                    {/* {market.icon} */}
                  </img>
                  <div>
                    <h3 className="text-xl font-semibold">{asset.name}</h3>
                    <p className="text-blue-300">APY: {asset?.apy}%</p>
                  </div>
                </div>

                {/* Asset Details */}
                <div className="grid grid-cols-2 gap-8 text-right">
                  <div>
                    <p className="text-blue-300 text-sm">Available</p>
                    <p className="font-medium">
                      {(balances && balances[index + 2]) ? Number(balances[index + 2]).toLocaleString() : 0} {asset.symbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-sm">Staked</p>
                    <p className="font-medium">
                      {asset.totalStaked} {asset.symbol}
                    </p>
                  </div>
                 {/* <div>
                    <p className="text-blue-300 text-sm">Earned</p>
                    <p className="font-medium">0 OMN</p>
                  </div>*/}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">

                <button
                  onClick={() => openStakeModal(asset)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Stake
                </button>
                <button
                  // onClick={() => openUnstakeModal(asset)}
                  className="px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-600 transition-all"
                >
                  Unstake
                </button>
                {/* <button
                  onClick={() => handleClaim(asset)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg hover:from-green-600 hover:to-teal-600 transition-all"
                >
                  Claim
                </button>*/}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stake Modal */}
      <AnimatePresence>
        {isStakeModalOpen && selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-blue-900 rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold mb-4">
                Stake {selectedAsset.symbol}
              </h3>
              <div className="mb-6">
                <p className="text-blue-300 mb-2">
                  Available: {(balances && balances[selectedAsset.id + 2]) ? Number(balances[selectedAsset.id + 2]).toLocaleString() : 0} {selectedAsset.symbol}
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full bg-blue-800 bg-opacity-50 rounded-lg py-3 px-4 text-white"
                    placeholder="Enter amount to stake"
                  />
                  <button
                    onClick={() => {
                      const max: any = (balances && balances[selectedAsset.id + 2]) ? `${Number(balances[selectedAsset.id + 2])}` : "0"
                      setStakeAmount(max)
                    }}
                    className="absolute right-2 top-2 bg-blue-700 px-2 py-1 rounded text-sm"
                  >
                    MAX
                  </button>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onStake}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                > 
                  {loading
                                ?
                                <Puff
                                    stroke="#fff"
                                    className="w-5 h-5 mx-auto"
                                />
                                :
                                <>
                                    Confirm Stake
                                </>
                            }
                </button>
                <button
                  onClick={closeModals}
                  className="flex-1 px-4 py-3 bg-blue-800 rounded-lg hover:bg-blue-700 transition-all"
                >
                  Cancel
                </button>
              </div>
              {errorMessage && (
                <p className="text-sm text-center mt-2 text-secondary">
                  {errorMessage}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};


export default StakingContainer;
