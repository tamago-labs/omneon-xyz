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
  Gift
} from "lucide-react";
import { Puff } from 'react-loading-icons'
import { useCurrentAccount } from '@iota/dapp-kit';
import STAKING_POOLS from "../../data/staking_pools.json"
import useStaking from "../../hooks/useStaking"
import useLending from "../../hooks/useLending"
import { RefreshCw } from 'react-feather';

const StakingContainer = () => {

  const { loadPools, stake, loadPositions, unstake, claim } = useStaking()
  const [assets, setAssets] = useState<any>([]);
  const [positions, setPositions] = useState<any>([])

  const { fetchBalances } = useLending()

  const account = useCurrentAccount()
  const address = account && account.address

  const [values, dispatch] = useReducer(
    (curVal: any, newVal: any) => ({ ...curVal, ...newVal }),
    {
      balances: undefined,
      tick: 1,
      errorMessage: undefined,
      loading: false,
      unstakeLoading: false,
      claimLoading: false,
      actionType: null // 'stake', 'unstake', 'claim'
    }
  )

  const { balances, tick, errorMessage, loading, unstakeLoading, claimLoading, actionType } = values

  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [isUnstakeModalOpen, setIsUnstakeModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");

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

  console.log("assets:", assets)

  useEffect(() => {
    address && loadPositions(address).then(setPositions)
  }, [tick, address])

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

  const openUnstakeModal = (asset: any, position: any) => {
    setSelectedAsset(asset);
    setSelectedPosition(position);
    setIsUnstakeModalOpen(true);
  };

  const openClaimModal = (asset: any, position: any) => {
    setSelectedAsset(asset);
    setSelectedPosition(position);
    setIsClaimModalOpen(true);
  };

  const closeModals = () => {
    setIsStakeModalOpen(false);
    setIsUnstakeModalOpen(false);
    setIsClaimModalOpen(false);
    setSelectedAsset(null);
    setSelectedPosition(null);
    dispatch({ 
      errorMessage: undefined,
      actionType: null,
      loading: false,
      unstakeLoading: false,
      claimLoading: false
    });
  };

  const onStake = useCallback(async () => {
    dispatch({ errorMessage: undefined, actionType: 'stake' })

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

  const onUnstake = useCallback(async () => {
    dispatch({ errorMessage: undefined, actionType: 'unstake' })
    dispatch({ unstakeLoading: true })
    
    try {
      const txId = await unstake(selectedAsset.coin_type, selectedPosition.objectId)

      dispatch({ unstakeLoading: false })

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
      dispatch({ unstakeLoading: false })
      dispatch({ errorMessage: error.message })
    }
  }, [unstake, selectedAsset, selectedPosition])

  const onClaim = useCallback(async () => {
    dispatch({ errorMessage: undefined, actionType: 'claim' })
    dispatch({ claimLoading: true })
    
    try {
      const txId = await claim(selectedAsset.coin_type, selectedPosition.objectId)

      dispatch({ claimLoading: false })

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
      dispatch({ claimLoading: false })
      dispatch({ errorMessage: error.message })
    }
  }, [claim, selectedAsset, selectedPosition])
 

  let totalStakedValue = 0

  assets.map((item: any) => {
    totalStakedValue = totalStakedValue + Number(item.totalStakedValue)
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
            <p className="text-blue-300 mb-1">OMN In Circulation</p>
            <h2 className="text-2xl font-bold">10M OMN</h2>
          </div>
        </motion.div>
      </div>

      {/* Staking Pools */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {assets.length === 0 && (
            <div className="px-6 py-8   text-gray-400">
              <RefreshCw className=' text-white animate-spin' size={20} />
            </div>
          )}
          {assets.map((asset: any, index: number) => {

            const position = positions.length > 0 ? findStakingByType(positions, asset.coin_type) : undefined

            return (<motion.div
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
                <div className="  gap-4 grid grid-cols-3 flex-grow text-right">
                  <div>
                    <p className="text-blue-300 text-sm">Available to Stake</p>
                    <p className="font-medium">
                      {(balances && balances[index + 2]) ? Number(balances[index + 2]).toLocaleString() : 0} {asset.symbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-sm">Your Staked</p>
                    <p className="font-medium">
                      {position ? Number(position.totalStaked).toLocaleString() : 0} {asset.symbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-sm">Earned</p>
                    <p className="font-medium">
                      {position ? Number(position.totalRewards).toLocaleString() : 0} OMN
                    </p>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">

                <div className="mr-auto ml-0 flex">
                  <div className="mt-auto">
                    <p className="text-blue-300 text-sm">Pool Staked: {asset.totalStaked} {asset.symbol}</p>

                  </div>
                </div>

                <button
                  onClick={() => openStakeModal(asset)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Stake
                </button>
                
                {position && (
                  <>
                    <button
                      onClick={() => openClaimModal(asset, position)}
                      disabled={!position || Number(position.totalRewards) === 0}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg hover:from-green-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Claim
                    </button>
                    
                    <button
                      onClick={() => openUnstakeModal(asset, position)}
                      className="px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-600 transition-all"
                    >
                      Unstake
                    </button>
                  </>
                )}
              </div>
            </motion.div>)
          })}
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
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              {errorMessage && actionType === 'stake' && (
                <p className="text-sm text-center mt-2 text-secondary">
                  {errorMessage}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unstake Modal */}
      <AnimatePresence>
        {isUnstakeModalOpen && selectedAsset && selectedPosition && (
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
              <div className="flex items-center mb-4">
                <UnlockIcon className="text-blue-400 mr-2" size={24} />
                <h3 className="text-2xl font-bold">
                  Unstake All {selectedAsset.symbol}
                </h3>
              </div>
              
              <div className="mb-6 bg-blue-800 bg-opacity-30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-300">Staked Amount:</span>
                  <span className="text-white font-bold">{Number(selectedPosition.totalStaked).toLocaleString()} {selectedAsset.symbol}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-300">Pending Rewards:</span>
                  <span className="text-green-400 font-bold">{Number(selectedPosition.totalRewards).toLocaleString()} OMN</span>
                </div>
                <div className="border-t border-blue-600 pt-2 mt-2">
                  <p className="text-blue-200 text-sm">
                    This will unstake all your tokens and claim all pending rewards.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={onUnstake}
                  disabled={unstakeLoading}
                  className="flex-1 px-4 py-3 bg-blue-700 rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {unstakeLoading ? (
                    <Puff stroke="#fff" className="w-5 h-5 mx-auto" />
                  ) : (
                    'Confirm Unstake'
                  )}
                </button>
                <button
                  onClick={closeModals}
                  className="flex-1 px-4 py-3 bg-blue-800 rounded-lg hover:bg-blue-700 transition-all"
                >
                  Cancel
                </button>
              </div>
              
              {errorMessage && actionType === 'unstake' && (
                <p className="text-sm text-center mt-2 text-secondary">
                  {errorMessage}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Modal */}
      <AnimatePresence>
        {isClaimModalOpen && selectedAsset && selectedPosition && (
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
              <div className="flex items-center mb-4">
                <Gift className="text-green-400 mr-2" size={24} />
                <h3 className="text-2xl font-bold">
                  Claim Rewards
                </h3>
              </div>
              
              <div className="mb-6 bg-blue-800 bg-opacity-30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-300">Pending Rewards:</span>
                  <span className="text-green-400 font-bold text-xl">{Number(selectedPosition.totalRewards).toLocaleString()} OMN</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-300">USD Value:</span>
                  <span className="text-white font-bold">${(Number(selectedPosition.totalRewards) * 0.00015).toFixed(4)}</span>
                </div>
                <div className="border-t border-blue-600 pt-2 mt-2">
                  <p className="text-blue-200 text-sm">
                    This will claim your rewards without unstaking your tokens.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={onClaim}
                  disabled={claimLoading || Number(selectedPosition.totalRewards) === 0}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg hover:from-green-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claimLoading ? (
                    <Puff stroke="#fff" className="w-5 h-5 mx-auto" />
                  ) : (
                    'Claim Rewards'
                  )}
                </button>
                <button
                  onClick={closeModals}
                  className="flex-1 px-4 py-3 bg-blue-800 rounded-lg hover:bg-blue-700 transition-all"
                >
                  Cancel
                </button>
              </div>
              
              {errorMessage && actionType === 'claim' && (
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

function findStakingByType(data: any, input: string) {
  // Normalize x by removing all spaces
  const xNormalized = input.replace(/\s+/g, '');


  for (const item of data) {
    // Match the inner type inside StakingPosition<>
    const match = item.type.replace(/\s+/g, '').match(/StakingPosition<(.+)>/);
    if (match && match[1] === xNormalized) {
      return item;
    }
  }
  return null;
}

export default StakingContainer;
