import { motion } from 'framer-motion';
import { Loader } from 'react-feather';
import Link from 'next/link';

const About = () => {
    return (
        <section id="about" className="py-20   ">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">


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
                            <span className="text-white  font-bold">
                                <Loader size={32} />
                            </span>
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
                            className="absolute bottom-8 left-8 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 w-40"
                            animate={{
                                y: [0, -5, 0],
                                opacity: [0.8, 1, 0.8]
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            <div className="text-blue-300 text-xs mb-1">Pool Utilization</div>
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
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-6">
                            The Future of DeFi on IOTA
                        </h2>
                        <p className="text-gray-300 mb-6">
                            Omneon is built by a team of Move and AI experts passionate about creating the next generation of decentralized lending protocols.
                        </p>
                        <p className="text-gray-300 mb-6">
                        By leveraging the power of AI, we enhance a lending platform that is more efficient and secure while maintaining a high degree of decentralization over user funds.
                        </p>
                        <Link href="https://github.com/tamago-labs/omneon-xyz" target="_blank">
                            <button className="px-6 py-2 cursor-pointer rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                                Learn More About Us
                            </button>
                        </Link>

                    </div>
                </div>
            </div>
        </section>
    )
}

export default About