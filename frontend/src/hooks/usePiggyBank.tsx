import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import  { abi }  from "../constants/Contracts"
import { PIGGYBANK_ADDRESS } from "../constants/Contracts"
import { parseEther } from 'viem'


export function usePiggyBank() {
  const { address } = useAccount()

  const { data: balance, refetch } = useReadContract({
    address: PIGGYBANK_ADDRESS,
    abi,
    functionName: 'balanceOf',
    args: [address!]
  })

  const { writeContract: deposit } = useWriteContract()
  const { writeContract: withdraw } = useWriteContract()

  const handleDeposit = () =>
    deposit({
      address: PIGGYBANK_ADDRESS,
      abi,
      functionName: 'deposit',
      value: parseEther('0.1'),
    })
  refetch()
  const handleWithdraw = () =>
    withdraw({
      address: PIGGYBANK_ADDRESS,
      abi,
      functionName: 'withdraw',
    })

  return {
    balance: balance?.toString() ?? '0',
    handleDeposit,
    handleWithdraw,
  }
}
