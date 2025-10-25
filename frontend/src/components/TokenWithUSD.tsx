'use client';

import React from 'react';
import { formatTokenAmount } from '@/utils/formatCurrency';
import { formatUSD } from '@/hooks/useCOPUSDRate';

interface TokenWithUSDProps {
  /** Amount in token (as a number) */
  amount: number;
  /** Token symbol (e.g., 'cUSD', 'cEUR', 'cGBP') */
  symbol: string;
  /** USD equivalent value (for cUSD use 1:1, for others use oracle rates) */
  usdValue?: number | null;
  /** Optional CSS class for the main container */
  className?: string;
  /** Format for display: 'inline' or 'block' */
  format?: 'inline' | 'block';
}

/**
 * Component to display token amount with its USD equivalent
 * - cUSD: 1:1 with USD
 * - cEUR, cGBP: Use oracle rates when available
 */
export function TokenWithUSD({
  amount,
  symbol,
  usdValue,
  className = '',
  format = 'inline'
}: TokenWithUSDProps) {
  // Handle invalid numbers
  if (isNaN(amount) || !isFinite(amount)) {
    return format === 'block' ? (
      <div className={className}>
        <div className="font-semibold text-gray-800">0 {symbol}</div>
      </div>
    ) : (
      <span className={className}>
        <span className="font-semibold text-gray-800">0 {symbol}</span>
      </span>
    );
  }

  // Format the token amount
  // <1 = 4 decimals, <1000 = 2 decimals, >=1000 = 0 decimals
  const formattedAmount = formatTokenAmount(amount);

  // Calculate USD value if not provided
  // For cUSD, assume 1:1 with USD
  const displayUsdValue = usdValue !== undefined && usdValue !== null
    ? usdValue
    : (symbol === 'cUSD' ? amount : null);

  if (format === 'block') {
    return (
      <div className={className}>
        <div className="font-semibold text-gray-800">
          {formattedAmount} {symbol}
        </div>
        {displayUsdValue !== null && (
          <div className="text-xs text-gray-500">≈ {formatUSD(displayUsdValue)}</div>
        )}
      </div>
    );
  }

  // inline format (default)
  return (
    <span className={className}>
      <span className="font-semibold text-gray-800">
        {formattedAmount} {symbol}
      </span>
      {displayUsdValue !== null && (
        <span className="text-gray-500 ml-1 text-xs">
          (≈ {formatUSD(displayUsdValue)})
        </span>
      )}
    </span>
  );
}
