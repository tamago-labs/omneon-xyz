"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from 'framer-motion';

import AOS from 'aos';
import 'aos/dist/aos.css';

import '@iota/dapp-kit/dist/index.css';

import { IotaClientProvider, WalletProvider } from '@iota/dapp-kit';
import Loading from "@/components/Loading";
import { getFullnodeUrl } from '@iota/iota-sdk/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const networks = {
    devnet: { url: getFullnodeUrl('devnet') },
    testnet: { url: getFullnodeUrl('testnet') },
};

export function Providers({ children }: any) {

    const canvasRef = useRef(null);

    useEffect(() => {
        AOS.init({
            once: true,
        });
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <IotaClientProvider networks={networks} defaultNetwork="testnet">
                <WalletProvider>
                    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
                        {children}
                    </div>
                </WalletProvider>
            </IotaClientProvider>
        </QueryClientProvider>

    );
}

