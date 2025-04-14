import { motion } from 'framer-motion';
import { X } from "react-feather"
import { useEffect, useCallback, useReducer, useContext } from "react"
import { Puff } from 'react-loading-icons'
import { useCurrentAccount, useIotaClientQuery } from '@iota/dapp-kit';
import useLending from '@/hooks/useLending';


const FaucetModal = ({ close, increaseTick }: any) => {

    const {  faucet } = useLending()

    const account = useCurrentAccount()
    const address = account && account.address

    const [values, dispatch] = useReducer(
        (curVal: any, newVal: any) => ({ ...curVal, ...newVal }),
        {
            name: undefined,
            errorMessage: undefined,
            loading: false
        }
    )

    const { name, errorMessage, loading } = values

    useEffect(() => {
        if (address) {
            dispatch({ name: address })
        }
    }, [address])

    const onMint = useCallback(async () => {

        dispatch({ errorMessage: undefined })

        if (!name || name.length !== 66) {
            dispatch({ errorMessage: "Invalid address" })
            return
        }

        dispatch({ loading: true })
        try {

            const txId = await faucet(name)

            dispatch({ loading: false })

            if (txId) {
                close()
                setTimeout(() => {
                    increaseTick()
                }, 2000)
            } else {
                throw new Error("Unknown error. Possibly rejection.")
            }

        } catch (error: any) {
            console.log(error)
            dispatch({ loading: false })
            dispatch({ errorMessage: error.message })
        }
    }, [name, address, faucet])

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full "
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">vUSD Faucet</h3>

                    <button
                        className="text-gray-400 hover:text-white"
                        onClick={close}
                    >
                        <X />
                    </button>
                </div>
                <div>
                    <div className="py-2 pt-0 ">
                        <h2 className="my-2 mt-0">Your wallet address:</h2>
                        <input type="text" value={name} onChange={(e) => dispatch({ name: e.target.value })} id="asset" className={`block w-full p-2  rounded-lg text-base bg-[#141F32] border border-gray-600 placeholder-gray text-white focus:outline-none`} />
                    </div>
                    <div className={`mt-4 grid grid-cols-1 gap-2`}>

                        <button disabled={loading} onClick={onMint} type="button" className="btn w-full text-base inline-flex justify-center rounded-lg  py-2.5 px-8  cursor-pointer  text-black text-center bg-white hover:bg-white hover:scale-100 hover:text-black   ">
                            {loading
                                ?
                                <Puff
                                    stroke="#000"
                                    className="w-5 h-5"
                                />
                                :
                                <>
                                    Send 100 vUSD
                                </>
                            }
                        </button>
                    </div>
                    {errorMessage && (
                        <p className="text-sm text-center mt-2 text-secondary">
                            {errorMessage}
                        </p>
                    )}

                </div>
            </motion.div>
        </div>
    )
}

export default FaucetModal