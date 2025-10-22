'use client';

import React from 'react';
import { useCOPUSDRate, convertCOPtoUSD, formatUSD } from '@/hooks/useCOPUSDRate';

interface CCOPWithUSDProps {
  /** Amount in cCOP (as a number or string) */
  ccopAmount: number | string;
  /** Optional CSS class for the main container */
  className?: string;
  /** Whether to show loading state while fetching rate */
  showLoading?: boolean;
  /** Format for display: 'inline' or 'block' or 'compact' */
  format?: 'inline' | 'block' | 'compact';
  /** Show cCOP label */
  showLabel?: boolean;
}

/**
 * Component to display cCOP amount with its USD equivalent
 * Uses Chainlink COP/USD price feed on Polygon
 */
export function CCOPWithUSD({
  ccopAmount,
  className = '',
  showLoading = true,
  format = 'inline',
  showLabel = true
}: CCOPWithUSDProps) {
  const { rate: copUsdRate, isLoading: isRateLoading } = useCOPUSDRate();

  // Convert string amount to number, handling commas
  const numericAmount = typeof ccopAmount === 'string'
    ? parseFloat(ccopAmount.replace(/,/g, ''))
    : ccopAmount;

  // Handle invalid numbers
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    return format === 'block' ? (
      <div className={className}>
        <div className="font-semibold text-gray-800">0 {showLabel && 'cCOP'}</div>
      </div>
    ) : (
      <span className={className}>
        <span className="font-semibold text-gray-800">0 {showLabel && 'cCOP'}</span>
      </span>
    );
  }

  const usdValue = convertCOPtoUSD(numericAmount, copUsdRate);

  // Format the cCOP amount (European format: . for thousands, , for decimals)
  const formattedCCOP = Math.floor(numericAmount).toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  if (format === 'block') {
    return (
      <div className={className}>
        <div className="font-bold text-gray-800">
          {formattedCCOP} {showLabel && 'cCOP'}
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
        <div className="font-semibold text-gray-800 leading-tight">
          {formattedCCOP} {showLabel && 'cCOP'}
        </div>
        {showLoading && isRateLoading ? (
          <div className="text-gray-400 text-xs">(...)</div>
        ) : usdValue !== null ? (
          <div className="text-gray-500 text-xs">
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
        {formattedCCOP} {showLabel && 'cCOP'}
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
