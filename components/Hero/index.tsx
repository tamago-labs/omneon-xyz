
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ConnectButton, useCurrentAccount } from '@iota/dapp-kit';


const Hero = () => {
    return (
        <div className="flex-grow mt-0 sm:mt-[60px] flex flex-col md:flex-row items-center">

            <div className="md:w-2/5 flex justify-center">
                <div className="relative w-full">
                    {/* Animated data streams */}
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute top-[40px] left-4/5 w-full h-4 -translate-x-1/2 -translate-y-1/2" style={{ transform: `translate(-50%, -50%) rotate(${i * 60}deg)` }}>
                            <motion.div
                                className="w-1/2 h-full overflow-hidden origin-right"
                                style={{ position: 'absolute', right: '50%' }}
                            >
                                <motion.div
                                    className="h-full w-20 bg-gradient-to-r from-transparent to-blue-400/40"
                                    initial={{ x: '100%' }}
                                    animate={{ x: '0%' }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.5,
                                        ease: "easeInOut"
                                    }}
                                />
                            </motion.div>

                            <motion.div
                                className="w-1/2 h-full overflow-hidden origin-left"
                                style={{ position: 'absolute', left: '50%' }}
                            >
                                <motion.div
                                    className="h-full w-20 bg-gradient-to-r from-purple-400/40 to-transparent"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '0%' }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.5 + 0.3,
                                        ease: "easeInOut"
                                    }}
                                />
                            </motion.div>
                        </div>
                    ))}
 
                </div>
            </div>
            <div className="md:w-3/5 mb-12 md:mb-0">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-3xl md:text-6xl max-w-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 leading-tight mb-6">
                        Decentralized Lending with AI-Personalized Intelligence
                    </h1>
                    <p className="text-base md:text-lg text-gray-300 mb-8 max-w-3xl">
                        A decentralized money market protocol on IOTA Rebased with AI-powered alerts that let you know when your loan or collateral needs attention
                    </p>
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <Link href="/markets">
                            <button className="px-8 py-3 cursor-pointer rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                                Get Started
                            </button>
                        </Link>
                        <Link href="https://docs-v1.omneon.xyz" target="_blank">
                            <button className="px-8 py-3 rounded-full border cursor-pointer border-purple-500 text-white font-medium hover:bg-purple-500/10 transition-all">
                                Learn More
                            </button>
                        </Link> 


                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default Hero