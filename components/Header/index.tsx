import { Loader } from "react-feather"


const Header = () => {
    return (
        <nav className="flex justify-between items-center mb-16">
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center mr-2">
                    <Loader className="text-white" />
                </div>
                <span className="text-white text-xl font-bold">Omneon</span>
            </div>

            <div className="hidden md:flex space-x-[50px] text-gray-300">
                <a href="#features" className="hover:text-white transition-colors">
                    Dashboard
                </a>
                <a href="#features" className="hover:text-white transition-colors">
                    Markets
                </a>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                    Analytics
                </a>
                <a href="#tokenomics" className="hover:text-white transition-colors">Leaderboard</a> 
            </div>

            <button className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                Connect Wallet
            </button>
        </nav>
    )
}

export default Header