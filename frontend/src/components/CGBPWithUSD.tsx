'use client';

import React from 'react';
import { useGBPUSDRate, convertGBPtoUSD, formatUSD } from '@/hooks/useGBPUSDRate';
import { formatTokenAmount } from '@/utils/formatCurrency';

interface CGBPWithUSDProps {
  /** Token balance in cGBP (as a number with full precision for calculations, or string from input) */
  cgbpAmount: number | string;
  /** Optional CSS class for the main container */
  className?: string;
  /** Whether to show loading state while fetching rate */
  showLoading?: boolean;
  /** Format for display: 'inline' or 'block' or 'compact' */
  format?: 'inline' | 'block' | 'compact';
  /** Show cGBP token symbol */
  showLabel?: boolean;
}

/**
 * Component to display cGBP token balance with its USD equivalent
 *
 * About cGBP:
 * - cGBP is an ERC20 token representing British Pounds on the blockchain
 * - This component queries the token balance and formats it for display
 * - Uses Chainlink GBP/USD oracle to calculate USD equivalent for informative display
 *
 * Display Format:
 * - < 1: 4 decimals
 * - < 1000: 2 decimals
 * - >= 1000: 0 decimals
 * - ISO format: . for thousands, , for decimals
 *
 * @example
 * <CGBPWithUSD cgbpAmount={725.80} format="inline" />
 * // Displays: "725,80 cGBP (≈ $925.42)"
 */
export function CGBPWithUSD({
  cgbpAmount,
  className = '',
  showLoading = true,
  format = 'inline',
  showLabel = true
}: CGBPWithUSDProps) {
  const { rate: gbpUsdRate, isLoading: isRateLoading } = useGBPUSDRate();

  // Convert string to number if needed
  // Keep full precision for calculations - formatting is only for display
  const numericAmount = typeof cgbpAmount === 'string'
    ? parseFloat(cgbpAmount.replace(/\./g, '').replace(/,/g, '.'))
    : cgbpAmount;

  // Handle invalid numbers
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    return format === 'block' ? (
      <div className={className}>
        <div className="font-semibold text-gray-800">0 {showLabel && 'cGBP'}</div>
      </div>
    ) : (
      <span className={className}>
        <span className="font-semibold text-gray-800">0 {showLabel && 'cGBP'}</span>
      </span>
    );
  }

  // Calculate USD equivalent using oracle (full precision for calculation)
  const usdValue = convertGBPtoUSD(numericAmount, gbpUsdRate);

  // Format for display only - maintains full precision internally
  const formattedCGBP = formatTokenAmount(numericAmount);

  if (format === 'block') {
    return (
      <div className={className}>
        <div className="font-bold text-gray-800">
          {formattedCGBP} {showLabel && 'cGBP'}
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
          {formattedCGBP} {showLabel && 'cGBP'}
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
        {formattedCGBP} {showLabel && 'cGBP'}
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
