
import { motion } from 'framer-motion';

const Banner = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-[80px] grid grid-cols-1 md:grid-cols-3 gap-6 py-8"
        >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-purple-300 font-semibold mb-1">Adaptive Interest Model</h3>
                <p className="text-white text-xl md:text-2xl font-bold"> That Reflect Market Conditions</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-blue-300 font-semibold mb-1">Real-Time Price Feeds</h3>
                <p className="text-white text-xl md:text-2xl font-bold">Powered by Pyth Oracle</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-pink-300 font-semibold mb-1">Proactive Email Notifications</h3>
                <p className="text-white text-xl md:text-2xl font-bold">With AI To Your Inbox Everyday</p>
            </div>
        </motion.div>
    )
}

export default Banner