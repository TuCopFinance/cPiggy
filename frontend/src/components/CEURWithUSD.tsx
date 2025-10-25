'use client';

import React from 'react';
import { useEURUSDRate, convertEURtoUSD, formatUSD } from '@/hooks/useEURUSDRate';
import { formatTokenAmount } from '@/utils/formatCurrency';

interface CEURWithUSDProps {
  /** Token balance in cEUR (as a number with full precision for calculations, or string from input) */
  ceurAmount: number | string;
  /** Optional CSS class for the main container */
  className?: string;
  /** Whether to show loading state while fetching rate */
  showLoading?: boolean;
  /** Format for display: 'inline' or 'block' or 'compact' */
  format?: 'inline' | 'block' | 'compact';
  /** Show cEUR token symbol */
  showLabel?: boolean;
}

/**
 * Component to display cEUR token balance with its USD equivalent
 *
 * About cEUR:
 * - cEUR is an ERC20 token representing Euros on the blockchain
 * - This component queries the token balance and formats it for display
 * - Uses Chainlink EUR/USD oracle to calculate USD equivalent for informative display
 *
 * Display Format:
 * - < 1: 4 decimals
 * - < 1000: 2 decimals
 * - >= 1000: 0 decimals
 * - ISO format: . for thousands, , for decimals
 *
 * @example
 * <CEURWithUSD ceurAmount={850.50} format="inline" />
 * // Displays: "850,50 cEUR (≈ $920.14)"
 */
export function CEURWithUSD({
  ceurAmount,
  className = '',
  showLoading = true,
  format = 'inline',
  showLabel = true
}: CEURWithUSDProps) {
  const { rate: eurUsdRate, isLoading: isRateLoading } = useEURUSDRate();

  // Convert string to number if needed
  // Keep full precision for calculations - formatting is only for display
  const numericAmount = typeof ceurAmount === 'string'
    ? parseFloat(ceurAmount.replace(/\./g, '').replace(/,/g, '.'))
    : ceurAmount;

  // Handle invalid numbers
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    return format === 'block' ? (
      <div className={className}>
        <div className="font-semibold text-gray-800">0 {showLabel && 'cEUR'}</div>
      </div>
    ) : (
      <span className={className}>
        <span className="font-semibold text-gray-800">0 {showLabel && 'cEUR'}</span>
      </span>
    );
  }

  // Calculate USD equivalent using oracle (full precision for calculation)
  const usdValue = convertEURtoUSD(numericAmount, eurUsdRate);

  // Format for display only - maintains full precision internally
  const formattedCEUR = formatTokenAmount(numericAmount);

  if (format === 'block') {
    return (
      <div className={className}>
        <div className="font-bold text-gray-800">
          {formattedCEUR} {showLabel && 'cEUR'}
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
          {formattedCEUR} {showLabel && 'cEUR'}
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
        {formattedCEUR} {showLabel && 'cEUR'}
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
