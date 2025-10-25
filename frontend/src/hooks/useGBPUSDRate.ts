import { useReadContract } from 'wagmi';
import { base } from 'viem/chains';

// Chainlink GBP/USD Price Feed on Base Mainnet
// https://data.chain.link/feeds/base/mainnet/gbp-usd
// Used as reference price for cGBP/USD conversion
const GBP_USD_FEED_ADDRESS = '0x91FAB41F5f3bE955963a986366edAcff1aaeaa83' as const;

// Chainlink Aggregator ABI (minimal for reading price)
const AGGREGATOR_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { name: 'roundId', type: 'uint80' },
      { name: 'answer', type: 'int256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'answeredInRound', type: 'uint80' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

/**
 * Hook to fetch the current GBP/USD exchange rate from Chainlink on Base
 * Used as reference price for displaying cGBP token amounts in USD
 * Returns the rate as a number (e.g., 1.25 means 1 GBP = 1.25 USD)
 */
export function useGBPUSDRate() {
  // Fetch the latest price data
  const { data: priceData, isLoading: isPriceLoading } = useReadContract({
    address: GBP_USD_FEED_ADDRESS,
    abi: AGGREGATOR_ABI,
    functionName: 'latestRoundData',
    chainId: base.id,
    query: {
      refetchInterval: 60000, // Refresh every minute
      staleTime: 30000, // Consider data stale after 30 seconds
    },
  });

  // Fetch decimals
  const { data: decimals, isLoading: isDecimalsLoading } = useReadContract({
    address: GBP_USD_FEED_ADDRESS,
    abi: AGGREGATOR_ABI,
    functionName: 'decimals',
    chainId: base.id,
    query: {
      staleTime: Infinity, // Decimals never change
    },
  });

  const isLoading = isPriceLoading || isDecimalsLoading;

  // Calculate the rate
  const rate = priceData && decimals
    ? Number(priceData[1]) / Math.pow(10, Number(decimals))
    : null;

  return {
    rate,
    isLoading,
    rawData: priceData,
  };
}

/**
 * Convert GBP amount to USD
 * @param gbpAmount Amount in GBP
 * @param rate GBP/USD exchange rate
 * @returns USD amount
 */
export function convertGBPtoUSD(gbpAmount: number, rate: number | null): number | null {
  if (rate === null) return null;
  if (gbpAmount === 0) return 0;
  return gbpAmount * rate;
}

/**
 * Format USD amount with ISO international notation (. for thousands, , for decimals)
 * @param usdAmount Amount in USD
 * @returns Formatted string (e.g., "$1.234,56")
 */
export function formatUSD(usdAmount: number | null): string {
  if (usdAmount === null) return '...';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usdAmount);
}
