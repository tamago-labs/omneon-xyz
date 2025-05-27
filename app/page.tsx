"use client";

import { useState, useEffect, useRef } from "react";

import { motion } from 'framer-motion';
import Hero from "@/components/Hero";
import Banner from "@/components/Banner";
import HowItWorks from "@/components/HowItWorks";
import About from "@/components/About";
import CTA from "@/components/CTA";


export default function App() {


  return (
    <main>
      <Hero />
      <Banner />
      <HowItWorks />
      <About />
      <CTA/>
      
    </main >
  );
}
