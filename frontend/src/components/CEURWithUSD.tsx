'use client';

import React from 'react';
import { useEURUSDRate, convertEURtoUSD, formatUSD } from '@/hooks/useEURUSDRate';
import { formatForeignCurrency } from '@/utils/formatCurrency';

interface CEURWithUSDProps {
  /** Amount in cEUR (as a number or string) */
  ceurAmount: number | string;
  /** Optional CSS class for the main container */
  className?: string;
  /** Whether to show loading state while fetching rate */
  showLoading?: boolean;
  /** Format for display: 'inline' or 'block' or 'compact' */
  format?: 'inline' | 'block' | 'compact';
  /** Show cEUR label */
  showLabel?: boolean;
}

/**
 * Component to display cEUR amount with its USD equivalent
 * Uses Chainlink EUR/USD price feed on Ethereum
 */
export function CEURWithUSD({
  ceurAmount,
  className = '',
  showLoading = true,
  format = 'inline',
  showLabel = true
}: CEURWithUSDProps) {
  const { rate: eurUsdRate, isLoading: isRateLoading } = useEURUSDRate();

  // Convert string amount to number, handling both commas and dots as thousand separators
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

  const usdValue = convertEURtoUSD(numericAmount, eurUsdRate);

  // Format the cEUR amount using formatForeignCurrency for proper decimal handling
  const formattedCEUR = formatForeignCurrency(numericAmount);

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
