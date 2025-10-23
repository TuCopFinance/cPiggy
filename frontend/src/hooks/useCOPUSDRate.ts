import { useReadContract } from 'wagmi';
import { polygon } from 'viem/chains';

// Chainlink COP/USD Price Feed on Polygon Mainnet
const COP_USD_FEED_ADDRESS = '0xfAA9147190c2C2cc5B8387B4f49016bDB3380572' as const;

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
 * Hook to fetch the current COP/USD exchange rate from Chainlink on Polygon
 * Returns the rate as a number (e.g., 0.00025 means 1 COP = 0.00025 USD)
 */
export function useCOPUSDRate() {
  // Fetch the latest price data
  const { data: priceData, isLoading: isPriceLoading } = useReadContract({
    address: COP_USD_FEED_ADDRESS,
    abi: AGGREGATOR_ABI,
    functionName: 'latestRoundData',
    chainId: polygon.id,
    query: {
      refetchInterval: 60000, // Refresh every minute
      staleTime: 30000, // Consider data stale after 30 seconds
    },
  });

  // Fetch decimals
  const { data: decimals, isLoading: isDecimalsLoading } = useReadContract({
    address: COP_USD_FEED_ADDRESS,
    abi: AGGREGATOR_ABI,
    functionName: 'decimals',
    chainId: polygon.id,
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
 * Convert COP amount to USD
 * @param copAmount Amount in COP
 * @param rate COP/USD exchange rate
 * @returns USD amount
 */
export function convertCOPtoUSD(copAmount: number, rate: number | null): number | null {
  if (rate === null || copAmount === 0) return null;
  return copAmount * rate;
}

/**
 * Format USD amount with ISO international notation (. for thousands, , for decimals)
 * @param usdAmount Amount in USD
 * @returns Formatted string (e.g., "$1.234,56")
 */
export function formatUSD(usdAmount: number | null): string {
  if (usdAmount === null) return '...';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usdAmount);
}
