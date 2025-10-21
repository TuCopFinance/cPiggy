"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, type Address } from "viem";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Info, Loader2, Shield, Zap, TrendingUp, Lock, AlertTriangle, ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ConnectButton } from "@/components/ConnectButton";
import { useCOPUSDRate, convertCOPtoUSD, formatUSD } from "@/hooks/useCOPUSDRate";
import { CCOPWithUSD } from "@/components/CCOPWithUSD";

// ABIs and Deployed Addresses
import PiggyBankABI from "../../../lib/artifacts/contracts/cPiggyBank.sol/PiggyBank.json";
import deployedAddresses from "../../../lib/deployedAddresses.json";

// A minimal ERC20 ABI for the approve/allowance/balance flow
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
  },
  {
    "constant": true,
    "inputs": [
      { "name": "_owner", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
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
  
  const { t, currentLocale, setLocale } = useLanguage();

  const { address } = useAccount();
  const { rate: copUsdRate, isLoading: isRateLoading } = useCOPUSDRate();
  const { writeContractAsync } = useWriteContract();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [approvalTxHash, setApprovalTxHash] = useState<string>('');
  const [mainTxHash, setMainTxHash] = useState<string>(''); // Used for both deposit and stake

  // Watch for approval transaction confirmation
  const { isLoading: isApprovalPending, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approvalTxHash as `0x${string}`,
  });

  // Watch for main transaction (deposit/stake) confirmation
  const { isLoading: isMainTxPending, isSuccess: isMainTxSuccess, isError: isMainTxError } = useWaitForTransactionReceipt({
    hash: mainTxHash as `0x${string}`,
  });
  
  // --- NEW: Centralized amount logic for both forms ---
  const activeAmount = useMemo(() => investmentType === 'diversify' ? amount : fixedAmount, [investmentType, amount, fixedAmount]);
  const parsedActiveAmount = useMemo(() => parseEther(activeAmount || "0"), [activeAmount]);

  // Format number with proper thousands and decimal separators (no decimals)
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Format balance from bigint to readable string
  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return '0';
    const balanceInEther = Number(balance) / 1e18;
    return formatNumber(balanceInEther);
  };

  const piggyBankAddress = deployedAddresses.PiggyBank as Address;
  const cCOPAddress = deployedAddresses.Tokens.cCOP as Address;

  const { data: allowance, refetch: refetchAllowance, isLoading: allowanceLoading } = useReadContract({
    address: cCOPAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, piggyBankAddress],
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  // Fetch user's cCOP balance
  const { data: ccopBalance, isLoading: isBalanceLoading } = useReadContract({
    address: cCOPAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refresh every 10 seconds
    },
  });

  // Helper function to create error message with transaction link
  const createErrorMessage = useCallback((message: string, txHash?: string) => {
    if (txHash) {
      return `${message} ${t('create.errors.checkTransaction')}: https://celoscan.io/tx/${txHash}`;
    }
    return message;
  }, [t]);

  // Automatically refresh allowance when approval is confirmed
  useEffect(() => {
    if (isApprovalSuccess) {
      refetchAllowance();
      setApprovalTxHash(''); // Reset for next use
    }
  }, [isApprovalSuccess, refetchAllowance]);

  // Handle main transaction (deposit/stake) results
  useEffect(() => {
    if (isMainTxSuccess) {
      setIsSuccess(true);
      setTxHash(mainTxHash);
      setMainTxHash(''); 
      setIsLoading(false);
      refetchAllowance();
    } else if (isMainTxError) {
      const errorMessage = createErrorMessage(t('create.errors.transactionFailed'), mainTxHash);
      setError(errorMessage);
      setIsSuccess(false);
      setMainTxHash('');
      setIsLoading(false);
      refetchAllowance();
    }
  }, [isMainTxSuccess, isMainTxError, mainTxHash, t, createErrorMessage, refetchAllowance]);

  // --- UPDATED: These functions now use the central `parsedActiveAmount` ---
  const handleDeposit = async () => {
    return writeContractAsync({
      address: piggyBankAddress,
      abi: PiggyBankABI.abi,
      functionName: 'deposit',
      args: [parsedActiveAmount, BigInt(duration), safeMode],
    });
  };

  // --- NEW: Handle Stake function for Fixed Terms ---
  const handleStake = async () => {
    return writeContractAsync({
        address: piggyBankAddress,
        abi: PiggyBankABI.abi,
        functionName: 'stake',
        args: [parsedActiveAmount, BigInt(fixedDuration)],
    });
  };

  const needsApproval = useMemo(() => {
    if (!address || parsedActiveAmount === 0n || allowanceLoading) return false;
    const currentAllowance = allowance ? BigInt(allowance.toString()) : 0n;
    return currentAllowance < parsedActiveAmount;
  }, [address, parsedActiveAmount, allowance, allowanceLoading]);

  // --- UNIFIED: handleSubmit now handles both investment types ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (parsedActiveAmount === 0n) return;

    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    setTxHash("");
    setMainTxHash("");
    setApprovalTxHash("");

    try {
      await refetchAllowance();
      await new Promise(resolve => setTimeout(resolve, 100));

      if (needsApproval) {
        const hash = await writeContractAsync({
          address: cCOPAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [piggyBankAddress, parsedActiveAmount],
        });
        setApprovalTxHash(hash);
        // The user will need to click the button again after approval.
        // The UI will update automatically.
        return; 
      } else {
        // Approval exists, proceed with the main transaction
        const mainTxFn = investmentType === 'diversify' ? handleDeposit : handleStake;
        const hash = await mainTxFn();
        setMainTxHash(hash);
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('User rejected') || err.message.includes('User denied')) {
          setError(needsApproval ? t('create.errors.approvalRejected') : t('create.errors.transactionRejected'));
        } else {
          setError(needsApproval ? t('create.errors.approvalFailed') : t('create.errors.transactionFailed'));
        }
      } else {
        setError(t('create.errors.networkError'));
      }
      setApprovalTxHash('');
    } finally {
      // Don't set isLoading to false here, the useEffect for the transaction receipt will handle it.
    }
  };
  
  // --- NEW: Correct interest calculation based on the smart contract's logic ---
  const fixedTermReturns = useMemo(() => {
    const amountNum = Number(fixedAmount) || 0;
    if (amountNum <= 0) return { rate: 0, estReturn: 0, total: 0 };

    let interestRateInBasisPoints = 0; // e.g., 125 for 1.25%
    if (fixedDuration === 30) interestRateInBasisPoints = 125;
    else if (fixedDuration === 60) interestRateInBasisPoints = 302;
    else if (fixedDuration === 90) interestRateInBasisPoints = 612;
    
    const rate = interestRateInBasisPoints / 100;
    const estReturn = (amountNum * interestRateInBasisPoints) / 10000;
    const total = amountNum + estReturn;
    
    return { rate, estReturn, total };
  }, [fixedAmount, fixedDuration]);
  

  const isApprovalInProgress = isApprovalPending || !!approvalTxHash;
  const isMainTxInProgress = isMainTxPending || !!mainTxHash;
  const isProcessing = isLoading || isApprovalInProgress || isMainTxInProgress;

  // Check if user has insufficient balance
  const hasInsufficientBalance = useMemo(() => {
    if (!address || !ccopBalance || parsedActiveAmount === 0n) return false;
    return parsedActiveAmount > (ccopBalance as bigint);
  }, [address, ccopBalance, parsedActiveAmount]);

  const buttonText = useMemo(() => {
    if (isApprovalInProgress) return t('create.awaitingApproval');
    if (isMainTxInProgress) return t('create.processing');
    if (needsApproval) return `${t('create.approve')} ${formatNumber(parseFloat(activeAmount))} cCOP`;
    return investmentType === 'diversify' ? t('create.createPiggy') : t('create.createFixedTerm');
  }, [isApprovalInProgress, isMainTxInProgress, needsApproval, activeAmount, investmentType, t]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-100 p-2 sm:p-3">
      {/* Language Switcher & Wallet Info */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
        <LanguageSwitcher currentLocale={currentLocale} onLocaleChange={setLocale} />
      </div>
      {address && (
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
          <ConnectButton compact={true} />
        </div>
      )}
      
      <div className="w-full max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-pink-700 transition-colors mb-3 text-sm sm:text-base">
          <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
          <span className="font-medium">{t('common.back')} {t('navigation.home')}</span>
        </Link>
        
        {/* Investment Type Selection */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-3 sm:p-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-center text-pink-800 tracking-tight mb-3 sm:mb-4">
            {t('create.title')}
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={() => setInvestmentType('diversify')}
              className={`p-2.5 sm:p-3 rounded-lg border-2 transition-all ${investmentType === 'diversify' ? 'border-pink-500 bg-pink-50 shadow-md' : 'border-gray-200 bg-white/80 hover:border-pink-300'}`}>
              <div className="flex flex-col items-center text-center">
                <TrendingUp className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 ${investmentType === 'diversify' ? 'text-pink-600' : 'text-gray-500'}`} />
                <h3 className="text-xs sm:text-sm font-bold mb-1">{t('create.diversifyInvestments')}</h3>
                <p className="text-xs text-gray-600 leading-tight">{t('create.diversifyDescription')}</p>
              </div>
            </button>
            <button
              onClick={() => setInvestmentType('fixed')}
              className={`p-2.5 sm:p-3 rounded-lg border-2 transition-all ${investmentType === 'fixed' ? 'border-pink-500 bg-pink-50 shadow-md' : 'border-gray-200 bg-white/80 hover:border-pink-300'}`}>
              <div className="flex flex-col items-center text-center">
                <Lock className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 ${investmentType === 'fixed' ? 'text-pink-600' : 'text-gray-500'}`} />
                <h3 className="text-xs sm:text-sm font-bold mb-1">{t('create.createFixedTerms')}</h3>
                <p className="text-xs text-gray-600 leading-tight">{t('create.fixedTermsDescription')}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Investment Forms */}
        <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {investmentType === 'diversify' ? (
            // Diversify Investment Form (Unchanged)
            <>
              <div className="space-y-2">
                <label htmlFor="deposit-amount" className="block font-semibold text-gray-700">1. {t('create.depositAmount')}</label>
                <div className="relative">
                    <input id="deposit-amount" type="number" className="w-full border-2 border-gray-200 bg-white/50 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100,000" min="0"/>
                    <span className="absolute right-4 top-2.5 text-gray-500 font-medium">cCOP</span>
                </div>
                {amount && parseFloat(amount) > 0 && (
                  <div className="text-sm text-gray-500">
                    ≈ {formatUSD(convertCOPtoUSD(parseFloat(amount), copUsdRate))}
                  </div>
                )}
                {address && (
                  <div className="text-sm text-gray-600">
                    {isBalanceLoading ? (
                      <span>Loading balance...</span>
                    ) : (
                      <span>
                        Balance: <CCOPWithUSD ccopAmount={formatBalance(ccopBalance as bigint)} />
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="block font-semibold text-gray-700 text-sm sm:text-base">2. {t('create.lockDuration')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map(d => (
                    <Button type="button" key={d} onClick={() => setDuration(d)} variant={duration === d ? 'default' : 'outline'} className={`py-2.5 sm:py-4 text-xs sm:text-sm rounded-lg transition-all ${duration === d ? 'bg-pink-600 text-white shadow-md' : 'bg-white/80 text-gray-700'}`}>
                      {d} {t('create.days')}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-semibold text-gray-700 text-sm sm:text-base">3. {t('create.chooseMode')}</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div onClick={() => setSafeMode(true)} className={`cursor-pointer p-2.5 sm:p-3 border-2 rounded-lg text-center transition-all ${safeMode ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white/80'}`}>
                    <Shield className="mx-auto w-5 h-5 sm:w-6 sm:h-6 text-green-600 mb-1" />
                    <p className="font-semibold text-green-700 text-xs sm:text-sm">{t('create.safeMode')}</p>
                    <p className="text-xs text-gray-500 leading-tight">{t('create.lowerRisk')}</p>
                  </div>
                  <div onClick={() => setSafeMode(false)} className={`cursor-pointer p-2.5 sm:p-3 border-2 rounded-lg text-center transition-all ${!safeMode ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white/80'}`}>
                    <Zap className="mx-auto w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mb-1" />
                    <p className="font-semibold text-purple-700 text-xs sm:text-sm">{t('create.standardMode')}</p>
                    <p className="text-xs text-gray-500 leading-tight">{t('create.higherGrowth')}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Fixed Terms Form (Now fully functional)
            <>
              <div className="space-y-2">
                <label htmlFor="fixed-amount" className="block font-semibold text-gray-700 text-sm sm:text-base">1. {t('create.depositAmount')}</label>
                <div className="relative">
                    <input id="fixed-amount" type="number" className="w-full border-2 border-gray-200 bg-white/50 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} placeholder="100,000" min="0"/>
                    <span className="absolute right-3 sm:right-4 top-2.5 text-gray-700 font-medium text-sm sm:text-base">cCOP</span>
                </div>
                {fixedAmount && parseFloat(fixedAmount) > 0 && (
                  <div className="text-sm text-gray-500">
                    ≈ {formatUSD(convertCOPtoUSD(parseFloat(fixedAmount), copUsdRate))}
                  </div>
                )}
                {address && (
                  <div className="text-xs sm:text-sm text-gray-600">
                    {isBalanceLoading ? (
                      <span>Loading balance...</span>
                    ) : (
                      <span>
                        Balance: <CCOPWithUSD ccopAmount={formatBalance(ccopBalance as bigint)} />
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="block font-semibold text-gray-700 text-sm sm:text-base">2. {t('create.lockDuration')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map(d => (
                    <Button type="button" key={d} onClick={() => setFixedDuration(d)} variant={fixedDuration === d ? 'default' : 'outline'} className={`py-2.5 sm:py-4 text-xs sm:text-sm rounded-lg transition-all ${fixedDuration === d ? 'bg-pink-600 text-white shadow-md' : 'bg-white/80 text-gray-700'}`}>
                      {d} {t('create.days')}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-semibold text-gray-700 text-sm sm:text-base">3. {t('create.monthlyRate')}</label>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2 sm:p-3">
                  <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center">
                    <div>
                      <div className="text-sm sm:text-lg font-bold text-green-700">{fixedTermReturns.rate.toFixed(2)}%</div>
                      <div className="text-xs text-green-600">{t('create.periodReturn')}</div>
                    </div>
                    <div>
                      <div className="text-sm sm:text-lg font-bold text-green-700">{formatNumber(fixedTermReturns.estReturn)}</div>
                      <div className="text-xs text-green-600">{t('create.estReturn')}</div>
                      {!isRateLoading && copUsdRate && fixedTermReturns.estReturn > 0 && (
                        <div className="text-xs text-green-500">{formatUSD(convertCOPtoUSD(fixedTermReturns.estReturn, copUsdRate))}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm sm:text-lg font-bold text-green-700">{formatNumber(fixedTermReturns.total)}</div>
                      <div className="text-xs text-green-600">{t('create.totalAtMaturity')}</div>
                      {!isRateLoading && copUsdRate && fixedTermReturns.total > 0 && (
                        <div className="text-xs text-green-500">{formatUSD(convertCOPtoUSD(fixedTermReturns.total, copUsdRate))}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                <h4 className="font-semibold text-blue-800 text-xs sm:text-sm mb-2">{t('create.fixedTermsFeatures')}:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• {t('create.guaranteedAPY')}</li>
                  <li>• {t('create.interestPaidAtMaturity')}</li>
                  <li>• {t('create.fullyBacked')}</li>
                </ul>
              </div>
            </>
          )}

          {/* Insufficient Balance Warning */}
          {hasInsufficientBalance && address && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 text-sm sm:text-base mb-1">
                    Insufficient cCOP Balance
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-800 mb-2">
                    You need {formatNumber(parseFloat(activeAmount))} cCOP but only have {formatBalance(ccopBalance as bigint)} cCOP in your wallet.
                  </p>
                  <p className="text-xs text-amber-700 font-medium">
                    Get more cCOP using:
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="https://app.uniswap.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all transform hover:scale-[1.02] shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Uniswap
                </a>
                <a
                  href="https://app.squidrouter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all transform hover:scale-[1.02] shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Squid Router
                </a>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 sm:py-4 text-base sm:text-lg font-bold rounded-lg shadow-lg shadow-pink-500/50 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:shadow-none"
            disabled={isProcessing || parsedActiveAmount === 0n || hasInsufficientBalance}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />}
            {buttonText}
          </Button>

          {/* Feedback Messages */}
          {isApprovalInProgress && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <Info className="w-5 h-5"/>
              <div>
                {t('create.approvalSent')}
                <a href={`https://celoscan.io/tx/${approvalTxHash}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline ml-1">{t('create.viewTx')}</a>
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
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                <div className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">⚠️</span>
                    <div className="flex-1" dangerouslySetInnerHTML={{ __html: error.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="font-semibold underline hover:text-red-800 ml-1">' + t('create.errors.checkTransaction') + '</a>') }}>
                    </div>
                </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}