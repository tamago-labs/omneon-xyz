"use client";

import { useState, useEffect, useRef } from "react";

import { motion } from 'framer-motion';
import Hero from "@/components/Hero";
import Banner from "@/components/Banner";
import HowItWorks from "@/components/HowItWorks";
import About from "@/components/About";
import { GitHub, Twitter } from "react-feather"

export default function App() {


  return (
    <main>
      <Hero />
      <Banner />
      <HowItWorks />
      <About />

      <section id="community" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-4">
              Join Our Community
            </h2>
            <p className="text-gray-300 max-w-3xl mx-auto">
              Be part of the Omneon ecosystem and help shape the future of DeFi on IOTA
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 mx-auto max-w-xl gap-3 sm:gap-6">
            {/* Twitter/X Card */}
            <a
              href="https://x.com/omneon_xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 backdrop-blur-sm border border-white/10  rounded-xl p-6 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <div className=" bg-gradient-to-r from-blue-400 to-purple-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Twitter className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Twitter/X</h3>
              <p className="text-blue-200 text-sm">
                Follow us for the latest news and updates
              </p>
            </a>

            <a
              href="https://github.com/tamago-labs/omneon-xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 backdrop-blur-sm border border-white/10   rounded-xl p-6 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <div className=" bg-gradient-to-r from-blue-400 to-purple-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <GitHub className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">GitHub</h3>
              <p className="text-blue-200 text-sm">
                Check out our GitHub for code
              </p>
            </a>
          </div>


        </div>
      </section>
    </main >
  );
}
