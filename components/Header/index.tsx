"use client"


import { Loader } from "react-feather"
import ConnectWallet from "./ConnectWallet"  
import Link from "next/link"
import { usePathname } from "next/navigation"

const Header = () => {

    const pathname = usePathname()
 
    return (
        <nav className="flex justify-between items-center mb-16">
            <Link href="/" className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center mr-2">
                    <Loader className="text-white" />
                </div>
                <span className="text-white text-xl font-bold">Omneon</span>
            </Link>

            <div className="hidden md:flex space-x-[50px] text-gray-300">
                {/* <Link href="/dashboard" className={`hover:text-white transition-colors ${ pathname === "/dashboard" && "text-white" }`}>
                    Dashboard
                </Link> */}
                <Link href="/" className={`hover:text-white transition-colors ${ pathname === "/" && "text-white" }`}>
                    Home
                </Link>
                <Link href="/markets" className={`hover:text-white transition-colors ${ pathname === "/markets" && "text-white" }`}>
                    Markets
                </Link>
                 <Link href="/staking" className={`hover:text-white transition-colors ${ pathname === "/staking" && "text-white" }`}>
                    Staking
                </Link> 
                {/* <Link href="/analytics" className={`hover:text-white transition-colors ${ pathname === "/analytics" && "text-white" }`}>
                    Analytics
                </Link> */}
                 <Link href="/notifications" className={`hover:text-white transition-colors ${ pathname === "/notifications" && "text-white" }`}>
                 Notifications
                </Link>
               
            </div>

            <ConnectWallet/>
            
        </nav>
    )
}

export default Header