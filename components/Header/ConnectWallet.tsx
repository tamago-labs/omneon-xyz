
import { ConnectButton, useCurrentAccount } from '@iota/dapp-kit';
// import { Bell } from 'react-feather';
// import Link from 'next/link';

const ConnectWallet = () => {



    return (
        <div className='flex flex-row space-x-6'>
            {/* <button className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                Connect Wallet
            </button> */}
            {/* <Link href="/notifications" className='my-auto text-gray-300 hover:text-white'>
                <Bell   />
            </Link> */}

            <ConnectButton
                className='cursor-pointer my-auto'
            />
        </div>
    )
}

export default ConnectWallet