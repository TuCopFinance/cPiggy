// app/create/page.tsx

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, type Address } from "viem";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Info, Loader2, Shield, Zap } from "lucide-react";

// ABIs and Deployed Addresses
import PiggyBankABI from "../../../../Contracts/artifacts/contracts/cPiggyBank.sol/PiggyBank.json";
import deployedAddresses from "../../../../Contracts/deployedAddresses.json";

// A minimal ERC20 ABI for the approve/allowance flow
const erc20Abi = [
  {
    "constant": true,
    "inputs": [
      { "name": "_owner", "type": "address" },
      { "name": "_spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_spender", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
];

export default function CreatePiggy() {
  const [amount, setAmount] = useState("10");
  const [duration, setDuration] = useState(30);
  const [safeMode, setSafeMode] = useState(true);

  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const piggyBankAddress = deployedAddresses.PiggyBank as Address;
  const cCOPAddress = deployedAddresses.Tokens.cCOP as Address;

  const parsedAmount = parseEther(amount || "0");

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: cCOPAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, piggyBankAddress],
    query: {
      enabled: !!address,
    },
  });

  // Corrected logic: user must have an address to need approval.
  const needsApproval = !!address && parsedAmount > 0n && (!allowance || (allowance as bigint) < parsedAmount);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [needsApprovalMessage, setNeedsApprovalMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (parsedAmount === 0n) return;

    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    setTxHash("");
    setNeedsApprovalMessage(false);

    try {
      await refetchAllowance(); // Always get the latest allowance

      if (needsApproval) {
        const hash = await writeContractAsync({
          address: cCOPAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [piggyBankAddress, parsedAmount],
        });
        setTxHash(hash);
        setNeedsApprovalMessage(true); // Show a persistent message instead of an alert
      } else {
        const hash = await writeContractAsync({
          address: piggyBankAddress,
          abi: PiggyBankABI.abi,
          functionName: 'deposit',
          args: [parsedAmount, BigInt(duration), safeMode],
        });
        setTxHash(hash);
        setIsSuccess(true);
        setAmount("10");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = isLoading
    ? "Processing..."
    : needsApproval
    ? `Approve ${amount} cCOP`
    : "Create My Piggy";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-100 p-4">
      <div className="w-full max-w-lg mx-auto">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-pink-700 transition-colors mb-4">
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Home</span>
        </Link>
        <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-8 space-y-8">
          <h1 className="text-3xl font-bold text-center text-pink-800 tracking-tight">
            Create Your Piggy
          </h1>

          {/* Amount Input */}
          <div className="space-y-2">
            <label htmlFor="deposit-amount" className="block font-semibold text-gray-700">1. Deposit Amount</label>
            <div className="relative">
                <input id="deposit-amount" type="number" className="w-full border-2 border-gray-200 bg-white/50 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 100" min="0"/>
                <span className="absolute right-4 top-3.5 text-gray-500 font-medium">cCOP</span>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="space-y-3">
            <label className="block font-semibold text-gray-700">2. Lock Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 90].map(d => (
                <Button type="button" key={d} onClick={() => setDuration(d)} variant={duration === d ? 'default' : 'outline'} className={`py-6 text-base rounded-lg transition-all ${duration === d ? 'bg-pink-600 text-white shadow-md' : 'bg-white/80 text-gray-700'}`}>
                  {d} days
                </Button>
              ))}
            </div>
          </div>
          
          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="block font-semibold text-gray-700">3. Choose Your Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <div onClick={() => setSafeMode(true)} className={`cursor-pointer p-4 border-2 rounded-lg text-center transition-all ${safeMode ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white/80'}`}>
                <Shield className="mx-auto w-8 h-8 text-green-600 mb-1" />
                <p className="font-semibold text-green-700">Safe Mode</p>
                <p className="text-xs text-gray-500">Lower Risk</p>
              </div>
              <div onClick={() => setSafeMode(false)} className={`cursor-pointer p-4 border-2 rounded-lg text-center transition-all ${!safeMode ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white/80'}`}>
                <Zap className="mx-auto w-8 h-8 text-purple-600 mb-1" />
                <p className="font-semibold text-purple-700">Standard</p>
                <p className="text-xs text-gray-500">Higher Growth</p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-pink-600 hover:bg-pink-700 text-white py-4 text-lg font-bold rounded-lg shadow-lg shadow-pink-500/50 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:shadow-none"
            disabled={isLoading || parsedAmount === 0n}
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {buttonText}
          </Button>

          {/* Feedback Messages */}
          {needsApprovalMessage && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <Info className="w-5 h-5"/>
              <div>
                Approval sent! Wait for confirmation, then click "Create My Piggy" again.
                <a href={`https://celoscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline ml-1">View Tx</a>
              </div>
            </div>
          )}
          {isSuccess && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5"/>
              <div>
                Piggy created successfully!
                <a href={`https://celoscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline ml-1">View Tx</a>
              </div>
            </div>
          )}
          {error && <p className="text-red-600 text-sm text-center break-words">⚠️ Error: {error}</p>}
        </form>
      </div>
    </div>
  );
}