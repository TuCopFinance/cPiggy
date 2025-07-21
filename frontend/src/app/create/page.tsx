"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther } from "viem";

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
  const [amount, setAmount] = useState("1");
  const [duration, setDuration] = useState(30);
  const [safeMode, setSafeMode] = useState(true);

  const { address } = useAccount();
  // We only need the write contract hook now
  const { writeContractAsync } = useWriteContract();

  const piggyBankAddress = deployedAddresses.PiggyBank as `0x${string}`;
  const cCOPAddress = deployedAddresses.Tokens.cCOP as `0x${string}`;

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

const needsApproval = !address && parsedAmount > 0n && (!allowance || (typeof allowance === 'bigint' && allowance < parsedAmount));

  // State to track loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (parsedAmount === 0n) return;

    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    setTxHash("");

    try {
      // --- FINAL DEBUG STEP ---
      // We will manually refetch the allowance right before we decide what to do.
      const { data: currentAllowance } = await refetchAllowance();
      console.log("--- DEBUGGING DEPOSIT ---");
      console.log("Amount to Deposit (wei):", parsedAmount.toString());
      console.log("Current Allowance (wei):", currentAllowance?.toString());

      // Decide based on the freshly fetched allowance
const stillNeedsApproval = !address && parsedAmount > 0n && (!allowance || (typeof allowance === 'bigint' && allowance < parsedAmount));
      console.log("Does it still need approval?", stillNeedsApproval);
      console.log("-------------------------");


      if (stillNeedsApproval) {
        console.log("Action: Executing APPROVE");
        const hash = await writeContractAsync({
          address: cCOPAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [piggyBankAddress, parsedAmount],
        });
        setTxHash(hash);
        // Advise user to click again
        alert("Approval sent! Please wait a few seconds for it to confirm, then click 'Start Saving' again.");

      } else {
        console.log("Action: Executing DEPOSIT");
        const hash = await writeContractAsync({
          address: piggyBankAddress,
          abi: PiggyBankABI.abi,
          functionName: 'deposit',
          args: [parsedAmount, BigInt(duration), safeMode],
        });
        setTxHash(hash);
        setIsSuccess(true);
        setAmount("");
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = isLoading
    ? "Processing..."
    : needsApproval
    ? `Approve ${amount} cCOP`
    : "Start Saving";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center text-pink-700">
          Create Your Piggy
        </h1>
        <div className="space-y-2">
            <label htmlFor="deposit-amount" className="block font-medium text-gray-700">Deposit Amount (in cCOP)</label>
            <input id="deposit-amount" type="number" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 100" min="0"/>
        </div>
        <div className="space-y-2">
            <label htmlFor="lock-duration" className="block font-medium text-gray-700">Lock Duration</label>
            <select id="lock-duration" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
            </select>
        </div>
        <div className="flex items-center gap-2">
            <input id="safe-mode" type="checkbox" checked={safeMode} onChange={(e) => setSafeMode(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"/>
            <label htmlFor="safe-mode" className="text-gray-700 text-sm">Enable Safe Mode (lower FX exposure)</label>
        </div>

        <Button
          type="submit"
          className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 text-lg"
          disabled={isLoading || parsedAmount === 0n}
        >
          {buttonText}
        </Button>

        {isSuccess && <p className="text-green-600 text-sm text-center">✅ Transaction successful!</p>}
        {error && <p className="text-red-500 text-sm text-center break-words">⚠️ Error: { error.message }</p>}
      </form>
    </div>
  );
}