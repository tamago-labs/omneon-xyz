"use client";

import { useState, useEffect, useRef } from "react";

import { motion } from 'framer-motion';
import Hero from "@/components/Hero";
import Banner from "@/components/Banner";

export default function App() {
   

  return (
    <main>
      <Hero />
      <Banner />


      <section id="how-it-works" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0   z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-4">
              How Omneon Works
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Our platform makes DeFi lending and borrowing intuitive, secure, and rewarding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <ol className="relative border-l border-purple-500">
                {/* Steps */}
                <li className="mb-10 ml-6">
                  <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">1</span>
                  <h3 className="text-xl font-bold text-white mb-2">Deposit Assets</h3>
                  <p className="text-gray-300">Supply your crypto assets to the protocol and start earning interest immediately.</p>
                </li>
                {/* Additional steps */}
              </ol>
            </div>

            <div className="relative">
              {/* Platform illustration */}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-20   ">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-6">
                The Future of DeFi on IOTA Rebased
              </h2>
              <p className="text-gray-300 mb-6">
                Omneon is built by a team of finance and AI experts passionate about creating the next generation of decentralized lending protocols.
              </p>
              <p className="text-gray-300 mb-6">
                By leveraging the power of IOTA Rebased's unique architecture and our proprietary AI models, we're creating a lending platform that's more efficient, secure, and user-friendly than traditional alternatives.
              </p>
              <button className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                Learn More About Us
              </button>
            </div>

            <div className="relative h-96 w-full overflow-hidden">
              {/* Circular track */}
              <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full border border-white/10 -translate-x-1/2 -translate-y-1/2"></div>

              {/* Center AI node */}
              <motion.div
                className="absolute top-1/2 left-1/2 w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20 shadow-lg"
                animate={{
                  boxShadow: [
                    '0 0 20px 0 rgba(99, 102, 241, 0.5)',
                    '0 0 30px 5px rgba(99, 102, 241, 0.7)',
                    '0 0 20px 0 rgba(99, 102, 241, 0.5)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span className="text-white font-bold">AI</span>
              </motion.div>

              {/* Moving data points */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10 border border-white/20"
                  initial={{
                    x: Math.cos(i * (Math.PI / 3)) * 140,
                    y: Math.sin(i * (Math.PI / 3)) * 140
                  }}
                  animate={{
                    x: [
                      Math.cos(i * (Math.PI / 3)) * 140,
                      0,
                      Math.cos((i + 3) * (Math.PI / 3)) * 140
                    ],
                    y: [
                      Math.sin(i * (Math.PI / 3)) * 140,
                      0,
                      Math.sin((i + 3) * (Math.PI / 3)) * 140
                    ],
                    opacity: [1, 0.7, 1],
                    scale: [1, 0.8, 1],
                    zIndex: [10, 30, 10]
                  }}
                  transition={{
                    duration: 6,
                    delay: i * 1,
                    repeat: Infinity,
                    repeatDelay: 6
                  }}
                >
                  <span className="text-white text-xs">{["DATA", "RISK", "LOAN", "APY", "ASSET", "USER"][i]}</span>
                </motion.div>
              ))}

              {/* Animated pulse rings */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={`ring-${i}`}
                  className="absolute top-1/2 left-1/2 rounded-full border border-indigo-500/20 -translate-x-1/2 -translate-y-1/2"
                  initial={{ width: 20, height: 20, opacity: 0.8 }}
                  animate={{
                    width: [20, 180],
                    height: [20, 180],
                    opacity: [0.7, 0],
                  }}
                  transition={{
                    duration: 3,
                    delay: i * 1,
                    repeat: Infinity,
                    repeatDelay: 0
                  }}
                />
              ))}

              {/* Floating stats */}
              <motion.div
                className="absolute bottom-8 right-8 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 w-40"
                animate={{
                  y: [0, -5, 0],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="text-blue-300 text-xs mb-1">Risk Assessment</div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-white/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                    initial={{ width: "30%" }}
                    animate={{ width: ["30%", "80%", "30%"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              <motion.div
                className="absolute top-8 left-8 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 w-40"
                animate={{
                  y: [0, 5, 0],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
              >
                <div className="text-purple-300 text-xs mb-1">Interest Rate</div>
                <div className="text-white text-lg font-semibold">5.2%</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>



      <section id="community" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-4">
              Join Our Community
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Be part of the Omneon ecosystem and help shape the future of DeFi on IOTA Move.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Social media cards */}
          </div>
        </div>
      </section>
    </main>
  );
}
