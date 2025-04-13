import { motion } from 'framer-motion';

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-20 relative overflow-hidden">
            <div className="absolute inset-0   z-0"></div>
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-4">
                        How Omneon Works
                    </h2>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                        Live on IOTA Rebased Testnet. Smarter DeFi lending and borrowing.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div>
                        <ol className="relative border-l border-purple-500">
                            {/* Steps */}
                            <li className="mb-10 ml-6">
                                <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">1</span>
                                <h3 className="text-xl font-bold text-white mb-2">Deposit Assets</h3>
                                <p className="text-gray-300">Supply your crypto assets to the protocol and start earning interest instantly.</p>
                            </li>
                            <li className="mb-10 ml-6">
                                <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">2</span>
                                <h3 className="text-xl font-bold text-white mb-2">Link Your Email</h3>
                                <p className="text-gray-300">Receive essential updates and personalized reports powered by AI.</p>
                            </li>
                            <li className="mb-10 ml-6">
                                <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">3</span>
                                <h3 className="text-xl font-bold text-white mb-2">Borrow Assets</h3>
                                <p className="text-gray-300">Borrow from the protocol with adaptive interest rates based on pool utilization.</p>
                            </li>
                            <li className="mb-10 ml-6">
                                <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">4</span>
                                <h3 className="text-xl font-bold text-white mb-2">Stay Protected</h3>
                                <p className="text-gray-300">Let AI monitor liquidation risks and alert you before your health factor gets critical.</p>
                            </li>

                        </ol>
                    </div>

                    <div className="relative"> 
                        {/* Floating UI elements */}
                        <motion.div
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
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HowItWorks