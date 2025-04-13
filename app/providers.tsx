"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from 'framer-motion';

import AOS from 'aos';
import 'aos/dist/aos.css';

import Loading from "@/components/Loading";

export function Providers({ children }: any) {

    const canvasRef = useRef(null);
 
    useEffect(() => {
        AOS.init({
            once: true,
        });
    }, []);
  
    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
             
            {children}
        </div>
    );
}

