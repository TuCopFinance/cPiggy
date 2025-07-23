// app/dashboard/page.tsx

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatEther, type Address } from "viem";
import Link from "next/link";
import { ArrowLeft, PiggyBank, Clock, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react";

// ABIs and Deployed Addresses
import PiggyBankABI from "../../../lib/artifacts/contracts/cPiggyBank.sol/PiggyBank.json";
import deployedAddresses from "../../../../Contracts/deployedAddresses.json";

// Define the type for a single Piggy based on the contract's struct
interface Piggy {
  owner: Address;
  cCOPAmount: bigint;
  startTime: bigint;
  duration: bigint;
  safeMode: boolean;
  initialUSDAmount: bigint;
  claimed: boolean;
}

/**
 * PiggyCard Component
 * Renders a single piggy bank with its details and actions.
 */
function PiggyCard({ piggy, index }: { piggy: Piggy; index: number }) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // State for handling claim transaction
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const piggyBankAddress = deployedAddresses.PiggyBank as Address;

  // --- 1. Fetch the current value of this specific piggy ---
  const { data: currentValue, isLoading: isValueLoading } = useReadContract({
    address: piggyBankAddress,
    abi: PiggyBankABI.abi,
    functionName: 'getPiggyValue',
    args: [address!, BigInt(index)],
    query: {
      enabled: !!address && !piggy.claimed && !claimSuccess, // Only fetch for active piggies
      refetchInterval: 15000, // Refetch every 15 seconds to get live value
    },
  });

  // --- 2. Determine if the piggy is ready to be claimed ---
  const claimTimestamp = Number(piggy.startTime + piggy.duration);
  const nowInSeconds = Date.now() / 1000;
  const isClaimable = !piggy.claimed && nowInSeconds >= claimTimestamp;
  const timeLeft = claimTimestamp - nowInSeconds;

  const handleClaim = async () => {
    if (!isClaimable) return;
    setIsClaiming(true);
    setClaimError(null);
    setClaimSuccess(false);
    try {
      await writeContractAsync({
        address: piggyBankAddress,
        abi: PiggyBankABI.abi,
        functionName: 'claim',
        args: [BigInt(index)],
      });
      setClaimSuccess(true);
    } catch (e: any) {
      setClaimError(e.message);
    } finally {
      setIsClaiming(false);
    }
  };

  // Helper to format time
  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return "Ready to Claim";
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m left`;
  };
  
  const getStatus = () => {
    if (piggy.claimed || claimSuccess) return { text: "Claimed", color: "text-green-600", icon: <CheckCircle className="w-4 h-4" /> };
    if (isClaimable) return { text: "Ready to Claim", color: "text-blue-600", icon: <PiggyBank className="w-4 h-4" /> };
    return { text: "Active", color: "text-yellow-600", icon: <Clock className="w-4 h-4" /> };
  };
  const status = getStatus();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 space-y-4 transition-all hover:shadow-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-pink-700">Piggy #{index + 1}</h3>
        <span className={`flex items-center gap-1 text-sm font-medium ${status.color}`}>
          {status.icon} {status.text}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-gray-500">Current Value</p>
          <p className="font-semibold text-lg text-gray-800">
            {isValueLoading
  ? "Loading..."
  : `${formatEther(typeof currentValue === 'bigint' ? currentValue : 0n).substring(0, 8)} cCOP`}

          </p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500">Initial Deposit (cCOP)</p>
          <p className="font-semibold text-lg text-gray-800">{formatEther(piggy.cCOPAmount).substring(0, 8)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500">Time Left</p>
          <p className="font-semibold text-gray-800">{formatTimeLeft(timeLeft)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500">Mode</p>
          <p className={`font-semibold ${piggy.safeMode ? 'text-green-700' : 'text-red-700'}`}>
            {piggy.safeMode ? "Safe" : "Standard"}
          </p>
        </div>
      </div>

      {!piggy.claimed && !claimSuccess && (
        <Button
          className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400"
          onClick={handleClaim}
          disabled={!isClaimable || isClaiming}
        >
          {isClaiming ? "Claiming..." : "Claim Piggy"}
        </Button>
      )}

      {claimSuccess && <p className="text-green-600 text-center text-sm">✅ Successfully claimed!</p>}
      {claimError && <p className="text-red-500 text-center text-sm break-words">⚠️ {claimError}</p>}
    </div>
  );
}

/**
 * Main Dashboard Page Component
 */
export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const piggyBankAddress = deployedAddresses.PiggyBank as Address;

  const { data: piggies, isLoading, error, refetch } = useReadContract({
    address: piggyBankAddress,
    abi: PiggyBankABI.abi,
    functionName: 'getUserPiggies',
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-pink-800">My Piggies</h1>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {!isConnected ? (
          <div className="text-center py-16">
            <p className="text-gray-600">Please connect your wallet to see your piggies.</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-16">
            <p className="text-gray-600">Fetching your piggies...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
            <p className="text-red-700 font-semibold">Could not fetch your piggies.</p>
            <p className="text-red-600 text-sm break-words">{error.message}</p>
          </div>
        ) : piggies && (piggies as Piggy[]).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(piggies as Piggy[]).map((piggy, index) => (
              <PiggyCard key={index} piggy={piggy} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border rounded-lg">
            <PiggyBank className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">No Piggies Found</h2>
            <p className="text-gray-500 mt-2">You haven't created any piggies yet.</p>
            <Link href="/create" className="mt-4 inline-block">
              <Button className="bg-pink-600 hover:bg-pink-700">Create Your First Piggy</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}