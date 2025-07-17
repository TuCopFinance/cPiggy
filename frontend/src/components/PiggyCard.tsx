import React from 'react'

interface Props {
  balance: string
  onDeposit: () => void
  onWithdraw: () => void
}

export default function PiggyCard({ balance, onDeposit, onWithdraw }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">🐷 Piggy Bank</h2>
      <p className="text-gray-700 mb-4">Balance: {balance} CELO</p>
      <div className="flex gap-4">
        <button onClick={onDeposit} className="bg-green-500 text-white px-4 py-2 rounded-lg">Deposit</button>
        <button onClick={onWithdraw} className="bg-red-500 text-white px-4 py-2 rounded-lg">Withdraw</button>
      </div>
    </div>
  )
}
