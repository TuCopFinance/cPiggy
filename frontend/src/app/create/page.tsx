// app/create/page.tsx

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, type Address } from "viem";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Info, Loader2, Shield, Zap, TrendingUp, Lock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ConnectButton } from "@/components/ConnectButton";

// ABIs and Deployed Addresses
import PiggyBankABI from "../../../lib/artifacts/contracts/cPiggyBank.sol/PiggyBank.json";
import deployedAddresses from "../../../lib/deployedAddresses.json";

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
  const [investmentType, setInvestmentType] = useState<'diversify' | 'fixed'>('diversify');
  
  // Diversify investment state
  const [amount, setAmount] = useState("100000");
  const [duration, setDuration] = useState(30);
  const [safeMode, setSafeMode] = useState(true);
  
  // Fixed terms state
  const [fixedAmount, setFixedAmount] = useState("100000");
  const [fixedDuration, setFixedDuration] = useState(30);
  const [monthlyRates] = useState<Record<number, number>>({ 30: 1.25, 60: 1.5, 90: 2.0 });
  
  const { t, currentLocale, setLocale } = useLanguage();

  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Compound interest calculation function
  const calculateCompoundInterest = (principal: number, monthlyRate: number, months: number) => {
    const monthlyRateDecimal = monthlyRate / 100;
    const compoundAmount = principal * Math.pow(1 + monthlyRateDecimal, months);
    const interestEarned = compoundAmount - principal;
    return { compoundAmount, interestEarned };
  };

  // Format number with proper thousands and decimal separators
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

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
    if (investmentType === 'diversify') {
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
      } catch (err) {
        if(err instanceof Error)
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Fixed terms mockup - just show success message
      setIsLoading(true);
      setTimeout(() => {
        setIsSuccess(true);
        setTxHash('0x1234567890abcdef...'); // Mock hash
        setIsLoading(false);
      }, 2000);
    }
  };

  const buttonText = isLoading
    ? t('create.processing')
    : investmentType === 'diversify'
    ? (needsApproval ? `${t('create.approve')} ${formatNumber(parseFloat(amount))} cCOP` : t('create.createPiggy'))
    : t('create.createFixedTerm');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-100 p-3">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-3 right-3">
        <LanguageSwitcher 
          currentLocale={currentLocale} 
          onLocaleChange={setLocale} 
        />
      </div>
      
      {/* Compact Wallet Info - Top Left */}
      {address && (
        <div className="absolute top-3 left-3">
          <ConnectButton compact={true} />
        </div>
      )}
      
      <div className="w-full max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-pink-700 transition-colors mb-3">
          <ArrowLeft size={20} />
          <span className="font-medium">{t('common.back')} {t('navigation.home')}</span>
        </Link>
        
        {/* Investment Type Selection */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-4 mb-4">
          <h1 className="text-2xl font-bold text-center text-pink-800 tracking-tight mb-4">
            {t('create.title')}
          </h1>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setInvestmentType('diversify')}
              className={`p-3 rounded-lg border-2 transition-all ${
                investmentType === 'diversify'
                  ? 'border-pink-500 bg-pink-50 shadow-md'
                  : 'border-gray-200 bg-white/80 hover:border-pink-300'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <TrendingUp className={`w-6 h-6 mb-1 ${
                  investmentType === 'diversify' ? 'text-pink-600' : 'text-gray-500'
                }`} />
                <h3 className="text-sm font-bold mb-1">{t('create.diversifyInvestments')}</h3>
                <p className="text-xs text-gray-600">{t('create.diversifyDescription')}</p>
              </div>
            </button>
            
            <button
              onClick={() => setInvestmentType('fixed')}
              className={`p-3 rounded-lg border-2 transition-all ${
                investmentType === 'fixed'
                  ? 'border-pink-500 bg-pink-50 shadow-md'
                  : 'border-gray-200 bg-white/80 hover:border-pink-300'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <Lock className={`w-6 h-6 mb-1 ${
                  investmentType === 'fixed' ? 'text-pink-600' : 'text-gray-500'
                }`} />
                <h3 className="text-sm font-bold mb-1">{t('create.createFixedTerms')}</h3>
                <p className="text-xs text-gray-600">{t('create.fixedTermsDescription')}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Investment Forms */}
        <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-6 space-y-6">
          
          {investmentType === 'diversify' ? (
            // Diversify Investment Form
            <>
              {/* Amount Input */}
              <div className="space-y-2">
                <label htmlFor="deposit-amount" className="block font-semibold text-gray-700">1. {t('create.depositAmount')}</label>
                <div className="relative">
                    <input id="deposit-amount" type="number" className="w-full border-2 border-gray-200 bg-white/50 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100,000" min="0"/>
                    <span className="absolute right-4 top-2.5 text-gray-500 font-medium">cCOP</span>
                </div>
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <label className="block font-semibold text-gray-700">2. {t('create.lockDuration')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map(d => (
                    <Button type="button" key={d} onClick={() => setDuration(d)} variant={duration === d ? 'default' : 'outline'} className={`py-4 text-sm rounded-lg transition-all ${duration === d ? 'bg-pink-600 text-white shadow-md' : 'bg-white/80 text-gray-700'}`}>
                      {d} {t('create.days')}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="block font-semibold text-gray-700">3. {t('create.chooseMode')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <div onClick={() => setSafeMode(true)} className={`cursor-pointer p-3 border-2 rounded-lg text-center transition-all ${safeMode ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white/80'}`}>
                    <Shield className="mx-auto w-6 h-6 text-green-600 mb-1" />
                    <p className="font-semibold text-green-700 text-sm">{t('create.safeMode')}</p>
                    <p className="text-xs text-gray-500">{t('create.lowerRisk')}</p>
                  </div>
                  <div onClick={() => setSafeMode(false)} className={`cursor-pointer p-3 border-2 rounded-lg text-center transition-all ${!safeMode ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white/80'}`}>
                    <Zap className="mx-auto w-6 h-6 text-purple-600 mb-1" />
                    <p className="font-semibold text-purple-700 text-sm">{t('create.standardMode')}</p>
                    <p className="text-xs text-gray-500">{t('create.higherGrowth')}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Fixed Terms Form
            <>
              {/* Warning Banner */}
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-800 text-sm mb-1">{t('create.warningNotImplemented')}</h4>
                    <p className="text-amber-700 text-xs">{t('create.warningDescription')}</p>
                  </div>
                </div>
              </div>
              
              {/* Amount Input */}
              <div className="space-y-2">
                <label htmlFor="fixed-amount" className="block font-semibold text-gray-700">1. {t('create.depositAmount')}</label>
                <div className="relative">
                    <input id="fixed-amount" type="number" className="w-full border-2 border-gray-200 bg-white/50 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} placeholder="100,000" min="0"/>
                    <span className="absolute right-4 top-2.5 text-gray-700 font-medium">cCOP</span>
                </div>
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <label className="block font-semibold text-gray-700">2. {t('create.lockDuration')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map(d => (
                    <Button type="button" key={d} onClick={() => setFixedDuration(d)} variant={fixedDuration === d ? 'default' : 'outline'} className={`py-4 text-sm rounded-lg transition-all ${fixedDuration === d ? 'bg-pink-600 text-white shadow-md' : 'bg-white/80 text-gray-700'}`}>
                      {d} {t('create.days')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Monthly Rate Display */}
              <div className="space-y-2">
                <label className="block font-semibold text-gray-700">3. {t('create.monthlyRate')}</label>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-700">{monthlyRates[fixedDuration].toFixed(2)}%</div>
                      <div className="text-xs text-green-600">APY</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-700">
                        {formatNumber(calculateCompoundInterest(parseFloat(fixedAmount), monthlyRates[fixedDuration], fixedDuration / 30).interestEarned)}
                      </div>
                      <div className="text-xs text-green-600">{t('create.estReturn')}</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-700">
                        {formatNumber(calculateCompoundInterest(parseFloat(fixedAmount), monthlyRates[fixedDuration], fixedDuration / 30).compoundAmount)}
                      </div>
                      <div className="text-xs text-green-600">{t('create.totalAtMaturity')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-blue-800 text-sm mb-2">{t('create.fixedTermsFeatures')}:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• {t('create.guaranteedAPY')}</li>
                  <li>• {t('create.interestPaidAtMaturity')}</li>
                  <li>• {t('create.fullyBacked')}</li>
                </ul>
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full bg-pink-600 hover:bg-pink-700 text-white py-4 text-lg font-bold rounded-lg shadow-lg shadow-pink-500/50 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:shadow-none"
            disabled={isLoading || (investmentType === 'diversify' && parsedAmount === 0n)}
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {buttonText}
          </Button>

          {/* Feedback Messages */}
          {needsApprovalMessage && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <Info className="w-5 h-5"/>
              <div>
                {t('create.approvalSent')}
                <a href={`https://celoscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline ml-1">{t('create.viewTx')}</a>
              </div>
            </div>
          )}
          {isSuccess && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5"/>
              <div>
                {investmentType === 'diversify' ? t('create.piggyCreated') : t('create.fixedTermCreated')}
                <a href={`https://celoscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline ml-1">{t('create.viewTx')}</a>
              </div>
            </div>
          )}
          {error && <p className="text-red-600 text-sm text-center break-words">⚠️ {t('common.error')}: {error}</p>}
        </form>
      </div>
    </div>
  );
}