'use client';

import React from 'react';
import { useGBPUSDRate, convertGBPtoUSD, formatUSD } from '@/hooks/useGBPUSDRate';
import { formatForeignCurrency } from '@/utils/formatCurrency';

interface CGBPWithUSDProps {
  /** Amount in cGBP (as a number or string) */
  cgbpAmount: number | string;
  /** Optional CSS class for the main container */
  className?: string;
  /** Whether to show loading state while fetching rate */
  showLoading?: boolean;
  /** Format for display: 'inline' or 'block' or 'compact' */
  format?: 'inline' | 'block' | 'compact';
  /** Show cGBP label */
  showLabel?: boolean;
}

/**
 * Component to display cGBP amount with its USD equivalent
 * Uses Chainlink GBP/USD price feed on Ethereum
 */
export function CGBPWithUSD({
  cgbpAmount,
  className = '',
  showLoading = true,
  format = 'inline',
  showLabel = true
}: CGBPWithUSDProps) {
  const { rate: gbpUsdRate, isLoading: isRateLoading } = useGBPUSDRate();

  // Convert string amount to number, handling both commas and dots as thousand separators
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

  const usdValue = convertGBPtoUSD(numericAmount, gbpUsdRate);

  // Format the cGBP amount using formatForeignCurrency for proper decimal handling
  const formattedCGBP = formatForeignCurrency(numericAmount);

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
