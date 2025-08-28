// app/dashboard/page.tsx

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatEther, type Address } from "viem";
import Link from "next/link";
import { ArrowLeft, PiggyBank, Clock, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ConnectButton } from "@/components/ConnectButton";

// ABIs and Deployed Addresses
import PiggyBankABI from "../../../lib/artifacts/contracts/cPiggyBank.sol/PiggyBank.json";
import deployedAddresses from "../../../lib/deployedAddresses.json";

// --- UPDATED: Piggy interface now matches the contract's struct completely ---
interface Piggy {
  owner: Address;
  initialAmount: bigint; // Added to match the struct
  cCOPAmount: bigint;
  cUSDAmount: bigint;
  cEURAmount: bigint;
  cGBPAmount: bigint; // Added cGBP
  startTime: bigint;
  duration: bigint;
  safeMode: boolean;
  claimed: boolean;
}

/**
 * PiggyCard Component
 * Renders a single piggy bank with its details and actions.
 */
function PiggyCard({ piggy, index }: { piggy: Piggy; index: number }) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { t } = useLanguage();

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const piggyBankAddress = deployedAddresses.PiggyBank as Address;

  const { data: currentValue, isLoading: isValueLoading } = useReadContract({
    address: piggyBankAddress,
    abi: PiggyBankABI.abi,
    functionName: 'getPiggyValue',
    args: [address!, BigInt(index)],
    query: {
      enabled: !!address && !piggy.claimed && !claimSuccess,
      refetchInterval: 15000,
    },
  });

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
    } catch (e) {
      if(e instanceof Error)
      setClaimError(e.message);
    } finally {
      setIsClaiming(false);
    }
  };

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return t('dashboard.readyToClaim');
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m ${t('dashboard.left')}`;
  };
  
  const getStatus = () => {
    if (piggy.claimed || claimSuccess) return { text: t('dashboard.status.claimed'), color: "text-green-600", icon: <CheckCircle className="w-4 h-4" /> };
    if (isClaimable) return { text: t('dashboard.status.readyToClaim'), color: "text-blue-600", icon: <PiggyBank className="w-4 h-4" /> };
    return { text: t('dashboard.status.active'), color: "text-yellow-600", icon: <Clock className="w-4 h-4" /> };
  };
  const status = getStatus();
  
  const formatAmount = (amount: bigint) => formatEther(amount).substring(0, 8);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 sm:p-6 space-y-3 sm:space-y-4 transition-all hover:shadow-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-lg sm:text-xl font-bold text-pink-700">{t('dashboard.piggyNumber').replace('{number}', (index + 1).toString())}</h3>
        <span className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${status.color}`}>
          {status.icon} {status.text}
        </span>
      </div>
      
      {/* --- Main Value Display --- */}
      <div className="text-center bg-slate-50 p-3 sm:p-4 rounded-lg">
        <p className="text-gray-500 text-xs sm:text-sm">{t('dashboard.currentValue')}</p>
        <p className="font-bold text-lg sm:text-2xl text-gray-800">
          {isValueLoading
            ? t('common.loading')
            : `${formatAmount(typeof currentValue === 'bigint' ? currentValue : 0n)} cCOP`}
        </p>
      </div>

      {/* --- UPDATED: Asset Breakdown now includes cGBP --- */}
      <div className="space-y-2 sm:space-y-3">
        <p className="text-xs sm:text-sm font-semibold text-gray-600">{t('dashboard.assetBreakdown')}</p>
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="text-gray-500">{t('dashboard.ccopBalance')}</span>
          <span className="font-medium text-gray-800">{formatAmount(piggy.cCOPAmount)}</span>
        </div>
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="text-gray-500">{t('dashboard.cusdBalance')}</span>
          <span className="font-medium text-gray-800">{formatAmount(piggy.cUSDAmount)}</span>
        </div>
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="text-gray-500">{t('dashboard.ceurBalance')}</span>
          <span className="font-medium text-gray-800">{formatAmount(piggy.cEURAmount)}</span>
        </div>
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="text-gray-500">{t('dashboard.cgbpBalance')}</span>
          <span className="font-medium text-gray-800">{formatAmount(piggy.cGBPAmount)}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm pt-2 border-t">
        <div className="space-y-1">
          <p className="text-gray-500">{t('dashboard.timeLeft')}</p>
          <p className="font-semibold text-gray-800">{formatTimeLeft(timeLeft)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500">{t('dashboard.mode')}</p>
          <p className={`font-semibold ${piggy.safeMode ? 'text-green-700' : 'text-purple-700'}`}>
            {piggy.safeMode ? t('create.safeMode') : t('create.standardMode')}
          </p>
        </div>
      </div>

      {!piggy.claimed && !claimSuccess && (
        <Button
          className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400"
          onClick={handleClaim}
          disabled={!isClaimable || isClaiming}
        >
          {isClaiming ? t('dashboard.claiming') : t('dashboard.claimPiggy')}
        </Button>
      )}

      {claimSuccess && <p className="text-green-600 text-center text-sm">✅ {t('dashboard.successfullyClaimed')}</p>}
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
  const { t, currentLocale, setLocale } = useLanguage();

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
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <Link href="/" className="flex items-center gap-2 text-pink-700 hover:text-pink-900 text-sm sm:text-base">
            <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
            {t('common.back')} {t('navigation.home')}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-pink-800 text-center sm:text-left">{t('dashboard.title')}</h1>
          <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-4">
            <LanguageSwitcher 
              currentLocale={currentLocale} 
              onLocaleChange={setLocale} 
            />
            <ConnectButton compact />
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading} className="h-8 w-8 sm:h-10 sm:w-10">
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {!isConnected ? (
          <div className="text-center py-16">
            <p className="text-gray-600">{t('dashboard.connectWalletMessage')}</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-16">
            <p className="text-gray-600">{t('dashboard.fetchingPiggies')}</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
            <p className="text-red-700 font-semibold">{t('dashboard.couldNotFetch')}</p>
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
            <h2 className="text-xl font-semibold text-gray-700">{t('dashboard.noPiggiesFound')}</h2>
            <p className="text-gray-500 mt-2">{t('dashboard.noPiggiesMessage')}</p>
            <Link href="/create" className="mt-4 inline-block">
              <Button className="bg-pink-600 hover:bg-pink-700">{t('dashboard.createFirstPiggy')}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
