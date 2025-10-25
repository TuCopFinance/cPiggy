'use client';

import React from 'react';
import { useCUSDUSDRate, convertCUSDtoUSD, formatUSD } from '@/hooks/useCUSDUSDRate';
import { formatTokenAmount } from '@/utils/formatCurrency';

interface CUSDWithUSDProps {
  /** Token balance in cUSD (as a number with full precision for calculations, or string from input) */
  cusdAmount: number | string;
  /** Optional CSS class for the main container */
  className?: string;
  /** Whether to show loading state while fetching rate */
  showLoading?: boolean;
  /** Format for display: 'inline' or 'block' or 'compact' */
  format?: 'inline' | 'block' | 'compact';
  /** Show cUSD token symbol */
  showLabel?: boolean;
}

/**
 * Component to display cUSD token balance with its USD equivalent
 *
 * About cUSD:
 * - cUSD is an ERC20 token representing US Dollars on the Celo blockchain
 * - This component queries the token balance and formats it for display
 * - Uses Chainlink cUSD/USD oracle on Celo for accurate USD conversion
 * - Note: cUSD is designed to maintain 1:1 parity with USD, but may have slight variations
 *
 * Display Format:
 * - < 1: 4 decimals
 * - < 1000: 2 decimals
 * - >= 1000: 0 decimals
 * - ISO format: . for thousands, , for decimals
 *
 * @example
 * <CUSDWithUSD cusdAmount={100.50} format="inline" />
 * // Displays: "100,50 cUSD (≈ $100.48)"
 */
export function CUSDWithUSD({
  cusdAmount,
  className = '',
  showLoading = true,
  format = 'inline',
  showLabel = true
}: CUSDWithUSDProps) {
  const { rate: cusdUsdRate, isLoading: isRateLoading, error } = useCUSDUSDRate();

  // Log errors for debugging
  if (error && typeof window !== 'undefined') {
    console.error('cUSD Oracle Error:', error);
  }

  // Convert string to number if needed
  // Keep full precision for calculations - formatting is only for display
  const numericAmount = typeof cusdAmount === 'string'
    ? parseFloat(cusdAmount.replace(/\./g, '').replace(/,/g, '.'))
    : cusdAmount;

  // Handle invalid numbers
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    return format === 'block' ? (
      <div className={className}>
        <div className="font-semibold text-gray-800">0 {showLabel && 'cUSD'}</div>
      </div>
    ) : (
      <span className={className}>
        <span className="font-semibold text-gray-800">0 {showLabel && 'cUSD'}</span>
      </span>
    );
  }

  // Calculate USD equivalent using oracle (full precision for calculation)
  const usdValue = convertCUSDtoUSD(numericAmount, cusdUsdRate);

  // Format for display only - maintains full precision internally
  const formattedCUSD = formatTokenAmount(numericAmount);

  if (format === 'block') {
    return (
      <div className={className}>
        <div className="font-bold text-gray-800">
          {formattedCUSD} {showLabel && 'cUSD'}
        </div>
        {showLoading && isRateLoading ? (
          <div className="text-sm text-gray-400">Loading rate...</div>
        ) : usdValue !== null ? (
          <div className="text-sm text-gray-500">≈ {formatUSD(usdValue)}</div>
        ) : null}
      </div>
    );
  }

  if (format === 'compact') {
    return (
      <div className={className}>
        <div className="font-semibold text-gray-800 leading-none whitespace-nowrap">
          {formattedCUSD} {showLabel && 'cUSD'}
        </div>
        {showLoading && isRateLoading ? (
          <div className="text-gray-400 leading-none mt-0.5">(...)</div>
        ) : usdValue !== null ? (
          <div className="text-gray-500 leading-none mt-0.5 whitespace-nowrap">
            ≈ {formatUSD(usdValue)}
          </div>
        ) : null}
      </div>
    );
  }

  // inline format (default)
  return (
    <span className={className}>
      <span className="font-semibold text-gray-800">
        {formattedCUSD} {showLabel && 'cUSD'}
      </span>
      {showLoading && isRateLoading ? (
        <span className="text-gray-400 ml-1 text-sm">(...)</span>
      ) : usdValue !== null ? (
        <span className="text-gray-500 ml-1 text-sm">
          (≈ {formatUSD(usdValue)})
        </span>
      ) : null}
    </span>
  );
}
