"use client";

import { useState, useEffect, useRef } from "react";

import { motion } from 'framer-motion';
import Hero from "@/components/Hero";
import Banner from "@/components/Banner";
import HowItWorks from "@/components/HowItWorks";
import About from "@/components/About";

export default function App() {


  return (
    <main>
      <Hero />
      <Banner />
      <HowItWorks/>
      <About/>

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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Social media cards */}
          </div>
        </div>
      </section>
    </main>
  );
}
