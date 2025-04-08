
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
                <h3 className="text-purple-300 font-semibold mb-1">Decentralized Money Market</h3>
                <p className="text-white text-2xl font-bold">With Dynamic Interest Rates</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-blue-300 font-semibold mb-1">Built on IOTA Rebased</h3>
                <p className="text-white text-2xl font-bold">For Scalable & Fee-Efficient</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-pink-300 font-semibold mb-1">Real-Time Price Accuracy</h3>
                <p className="text-white text-2xl font-bold">Backed by Pyth Oracle</p>
            </div>
        </motion.div>
    )
}

export default Banner