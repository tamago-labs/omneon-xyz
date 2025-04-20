"use client";

import { Puff } from 'react-loading-icons'
import React, { useState, useCallback, useReducer, useEffect } from "react";
import { getCurrentUser, signIn } from "aws-amplify/auth";
import { motion } from "framer-motion";
import {
  Bell,
  Settings,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Wallet,
  Link,
  Mail,
  MailOpen,
  CheckCircle,
  Calendar,
  Shield,
  Clock,
  ToggleLeft,
  X,
  Edit,
  Info,
  RefreshCw,
} from "lucide-react";
import { useCurrentAccount, useIotaClientQuery } from "@iota/dapp-kit";
import useAccount from "@/hooks/useAccount";

import type { Schema } from "../../amplify/data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";

const client = generateClient<Schema>({
  authMode: "userPool",
});

const NotificationsContainer = () => {
  const { loadProfile, updateIsActive, updateWalletAddress } = useAccount();

  const account = useCurrentAccount();
  const address = account && account.address;

  const [values, dispatch] = useReducer(
    (curVal: any, newVal: any) => ({ ...curVal, ...newVal }),
    {
      user: undefined,
      isActive: true,
      isQuiteHours: false,
      walletAddress: undefined,
      errorMessage: undefined,
      loading: false,
      completed: false
    }
  );

  const [profile, setProfile] = useState<any>(undefined);

  const { loading, errorMessage, completed, user, isActive, isQuiteHours, walletAddress } = values;

  useEffect(() => {
    user && loadProfile(user.loginId).then(setProfile);
  }, [user]);

  useEffect(() => {
    if (profile) {
      dispatch({
        isActive: profile.isActive,
        walletAddress: profile?.walletAddress,
      });
    }
  }, [profile]);

  useEffect(() => {
    (async () => {
      try {
        const { username, userId, signInDetails } = await getCurrentUser();
        dispatch({
          user: {
            username,
            userId,
            ...signInDetails,
          },
        });
      } catch (e) {
        console.log(e);
        dispatch({
          user: undefined,
        });
      }
    })();
  }, []);

  const [showLinkModal, setShowLinkModal] = useState(false);

  const handleIsActive = useCallback(() => {
    updateIsActive(profile.id, !isActive);
    dispatch({
      isActive: !isActive,
    });
  }, [isActive, profile]);

  const shownAddress = walletAddress ? walletAddress : address;

  const handleLinkWallet = useCallback(() => {
    const isValidAddress = /^0x[a-fA-F0-9]{64}$/.test(shownAddress || "");

    if (!isValidAddress) {
      alert("Invalid wallet address");
      dispatch({
        walletAddress: undefined,
      });
      return;
    }

    updateWalletAddress(profile.id, shownAddress);

    dispatch({
      walletAddress: shownAddress,
    });

    setShowLinkModal(false);
  }, [profile, shownAddress]);

  const onSendTest = useCallback(async () => {
    dispatch({ errorMessage: undefined });

    if (!profile || !profile.email) {
      dispatch({ errorMessage: "Can't find your email" });
      return
    }

    const isValidAddress = /^0x[a-fA-F0-9]{64}$/.test(profile?.walletAddress || "");

    if (!isValidAddress) {
      dispatch({ errorMessage: "Invalid wallet address" });
      return;
    }

    dispatch({ loading: true });
    try {
      const { data } = await client.queries.SendEmail({
        userId: profile?.email,
        walletAddress: profile?.walletAddress,
      });
      console.log(data);
      dispatch({ loading: false, completed: true });  
    } catch (error: any) {
      console.log(error);
      dispatch({ loading: false });
      dispatch({ errorMessage: error.message });
    }
  }, [profile]);

  console.log("profile:", profile);

  return (
    <div className="min-h-screen  text-white">
      <div className="container mx-auto ">
        <h1 className="text-3xl font-bold mb-2">Personalized Notifications</h1>
        <p className="text-gray-300 mb-8">
          Setup intelligent notifications that monitors and notifies you about
          your assets
        </p>

        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-5">
            <Mail className="w-[240px] h-[240px]" />
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:flex-1">
              <h2 className="text-xl font-bold mb-6">Notification Delivery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 grid-5">
                {/* Email Configuration */}
                <div className=" ">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Mail size={18} className="mr-2 text-blue-400" />
                    Email Address
                  </h3>

                  <div className="flex items-center">
                    <p className="text-gray-300">{user?.loginId}</p>
                    {profile?.isVerified && (
                      <span className="ml-2 text-green-400 flex items-center text-sm">
                        <CheckCircle size={14} className="mr-1" /> Verified
                      </span>
                    )}
                    {/* <p className="text-yellow-400 my-auto">No wallet linked</p> */}
                  </div>

                  {!profile?.isVerified ? (
                    <div className="mr-6 my-2    ">
                      <p className="text-sm text-yellow-300">
                        <strong className="text-yellow-300">
                          Email not verified:
                        </strong>{" "}
                        Please check your inbox for the verification email.
                        Contact us if you didn’t receive it.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">
                      We'll send important notifications about your positions
                      and platform updates to this email address.
                    </p>
                  )}
                </div>

                {/* Wallet Configuration */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Wallet size={18} className="mr-2 text-purple-400" />
                    Linked Wallet
                  </h3>

                  {walletAddress ? (
                    <div className="flex items-center">
                      <p className="text-gray-300 font-mono bg-gray-700/50 px-3 py-1 rounded">
                        {walletAddress.substring(0, 6)}...
                        {walletAddress.substring(walletAddress.length - 4)}
                      </p>
                      <button
                        className="ml-3 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-md text-sm transition-colors"
                        onClick={() => setShowLinkModal(true)}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex space-x-2">
                      <p className="text-yellow-400 my-auto">
                        No wallet linked
                      </p>
                      <button
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center transition-colors"
                        onClick={() => setShowLinkModal(true)}
                      >
                        <Link size={16} className="mr-2" />
                        Link Wallet
                      </button>
                    </div>
                  )}

                  <p className="text-sm text-gray-400 mt-2">
                    Linking your wallet allows us to send position-specific
                    notifications relevant to your account.
                  </p>
                </div>
                <div className=" col-span-2 my-4">
                  <div className="flex flex-col  ">
                    <div className="flex items-center justify-between   p-4 px-0">
                      <div>
                        <h4 className="font-medium">Notifications Active</h4>
                        <p className="text-sm text-gray-400">
                          Turn on/off all notifications
                        </p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          id="notificationsActive"
                          className="sr-only peer"
                          onClick={handleIsActive}
                          checked={isActive}
                        />
                        <label
                          htmlFor="notificationsActive"
                          className="relative w-12 h-6 bg-gray-600 rounded-full flex items-center cursor-pointer peer-checked:bg-blue-600"
                        >
                          <span
                            className={`absolute ${!isActive ? "left-1" : "right-1"
                              } w-4 h-4 bg-white rounded-full transition-all peer-checked:left-7`}
                          ></span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 px-0">
                      <div>
                        <h4 className="font-medium">Quiet Hours</h4>
                        <p className="text-sm text-gray-400">
                          Only critical alerts during specified hours
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <input
                            type="checkbox"
                            id="quietHours"
                            className="sr-only peer"
                            onClick={() =>
                              dispatch({
                                isQuiteHours: !isQuiteHours,
                              })
                            }
                            checked={isQuiteHours}
                          />
                          <label
                            htmlFor="quietHours"
                            className="relative w-12 h-6 bg-gray-600 rounded-full flex items-center cursor-pointer peer-checked:bg-blue-600"
                          >
                            <span
                              className={`absolute ${!isQuiteHours ? "left-1" : "right-1"
                                } w-4 h-4 bg-white rounded-full transition-all peer-checked:left-7`}
                            ></span>
                          </label>
                        </div>
                        <select className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white">
                          <option value="22-08">10 PM - 8 AM</option>
                          <option value="23-07">11 PM - 7 AM</option>
                          <option value="00-06">12 AM - 6 AM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-1/3 mt-8 md:mt-0">
              <div className=" bg-gray-600/10 backdrop-blur-sm rounded-xl border border-gray-700 p-6 ">
                <h3 className="text-lg font-semibold   mb-4">
                  What You’ll Receive
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="text-indigo-400" />
                    <span className="ml-2 text-gray-300  ">
                      Get alerts when your health factor drops below safe
                      thresholds.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-indigo-400" />
                    <span className="ml-2  text-gray-300  ">
                      Receive daily summaries of your positions, written in a
                      human-friendly format.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-indigo-400" />
                    <span className="ml-2  text-gray-300  ">
                      Stay informed with protocol updates and insights our AI
                      thinks you shouldn’t miss.
                    </span>
                  </li>
                </ul>

                {/* <div className="mt-6 pt-6 border-t border-indigo-100">
                  <h3 className="text-lg font-semibold mb-2">
                    Have Questions?
                  </h3>
                  <p className="text-gray-200 text-sm mb-4">
                    Want to permanently delete your account or have any
                    questions? Contact us at{" "}
                    <a
                      href="mailto:support@tamagolabs.com"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      support@tamagolabs.com
                    </a>{" "}
                  </p>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* Test Panel */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-4">Test Notifications</h2>
          <p className="text-gray-300 mb-4">
            Send a test notification to verify your email is properly configured
          </p>

          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-full md:w-auto">
              <select className="w-full md:w-64 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white">
                <option value="">Select notification type...</option>
                <option value="health-factor">Health Factor Alert</option>
                <option value="weekly-summary">
                  Protocol Updates & Insights
                </option>
              </select>
            </div>

            <button disabled={loading} onClick={onSendTest} className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
             
              {loading
                                ?
                                <div className="flex w-[150px]">
<Puff
                                    stroke="#fff"
                                    className="w-5 h-5 mx-auto"
                                /> 
                                </div>
                                :
                                <>
                                      Send Test Notification
                                </>
                            }
            </button>

          </div>
           {errorMessage && (
                        <p className="text-sm  mt-2 text-secondary">
                            {errorMessage}
                        </p>
                    )}
        </div>
      </div>

      {/* Link Wallet Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Link Wallet Address</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setShowLinkModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Wallet Address</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono"
                placeholder="0x..."
                value={shownAddress}
                onChange={(e) => {
                  dispatch({
                    walletAddress: e.target.value,
                  });
                }}
              />
              <p className="text-sm text-gray-400 mt-2">
                Enter the address of the wallet you use with Omneon
              </p>
            </div>

            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
              <p className="text-sm text-gray-300">
                <strong className="text-blue-300">Important:</strong> Make sure
                you're using the correct wallet address. We'll use this to match
                your account with your on-chain positions.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                className={`flex-1 px-4 py-3 bg-purple-600 rounded-lg transition-colors ${!shownAddress
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-purple-700"
                  }`}
                disabled={!shownAddress}
                onClick={handleLinkWallet}
              >
                Link Wallet
              </button>
              <button
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                onClick={() => setShowLinkModal(false)}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {completed && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Test Email Sent Successfully</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => dispatch({
                  completed: false
                })}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Your test notification is on its way. If you don’t see it soon, check your spam folder.</label>
              
            </div>

             

            <div className="flex space-x-3">
              
              <button
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                onClick={() => dispatch({
                  completed: false
                })}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default NotificationsContainer;
