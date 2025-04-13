
import { motion } from 'framer-motion';
import Link from 'next/link';

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

                    {/* Floating UI elements */}
                    {/* <motion.div
                        className="absolute top-6 left-1/2 -translate-x-1/2 w-40 h-16 rounded-lg bg-white/5 backdrop-blur-sm border p-3 border-white/10 "
                        animate={{
                            y: [6, 10, 6],
                            opacity: [0.7, 0.9, 0.7]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        <div className="w-4/5 h-3 bg-purple-400/30 rounded-full mb-2" />
                        <div className="w-2/3 h-3 bg-blue-400/50 rounded-full" />
                    </motion.div>

                    <motion.div
                        className="absolute bottom-6 left-16 w-36 h-16 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-3"
                        animate={{
                            y: [-6, -10, -6],
                            opacity: [0.7, 0.9, 0.7]
                        }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                    >
                        <div className="w-full h-3 bg-purple-400/30 rounded-full mb-2" />
                        <div className="w-2/3 h-3 bg-blue-400/50 rounded-full" />
                    </motion.div>

                    <motion.div
                        className="absolute bottom-20 right-16 w-32 h-16 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-3"
                        animate={{
                            y: [-20, -24, -20],
                            opacity: [0.7, 0.9, 0.7]
                        }}
                        transition={{ duration: 3.5, repeat: Infinity, delay: 0.8 }}
                    >
                        <div className="w-1/3 h-3 bg-blue-400/50 rounded-full mb-2" />
                        <div className="w-3/4 h-3 bg-gradient-to-r from-blue-400/40 to-purple-400/40 rounded-full" />
                    </motion.div> */}
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
                        <Link href="/dashboard">
                            <button className="px-8 py-3 cursor-pointer rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                                Get Started
                            </button>
                        </Link>
                        <Link href="https://github.com/tamago-labs/omneon-xyz" target="_blank">
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