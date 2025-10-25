import { useReadContract } from 'wagmi';
import { celo } from 'viem/chains';

// Chainlink cUSD/USD Price Feed on Celo Mainnet
// https://data.chain.link/feeds/celo/mainnet/cusd-usd
// Used for displaying cUSD token amounts in USD
const CUSD_USD_FEED_ADDRESS = '0x022F9dCC73C5Fb43F2b4eF2EF9ad3eDD1D853946' as const;

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
 * Hook to fetch the current cUSD/USD exchange rate from Chainlink on Celo
 * Used for displaying cUSD token amounts in USD
 * Returns the rate as a number (e.g., 0.998 means 1 cUSD ≈ 0.998 USD)
 * Note: cUSD is designed to maintain 1:1 parity with USD, but may have slight variations
 */
export function useCUSDUSDRate() {
  // Fetch the latest price data
  const { data: priceData, isLoading: isPriceLoading } = useReadContract({
    address: CUSD_USD_FEED_ADDRESS,
    abi: AGGREGATOR_ABI,
    functionName: 'latestRoundData',
    chainId: celo.id,
    query: {
      refetchInterval: 60000, // Refresh every minute
      staleTime: 30000, // Consider data stale after 30 seconds
    },
  });

  // Fetch decimals
  const { data: decimals, isLoading: isDecimalsLoading } = useReadContract({
    address: CUSD_USD_FEED_ADDRESS,
    abi: AGGREGATOR_ABI,
    functionName: 'decimals',
    chainId: celo.id,
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
 * Convert cUSD amount to USD
 * @param cusdAmount Amount in cUSD token
 * @param rate cUSD/USD exchange rate from oracle
 * @returns USD amount
 */
export function convertCUSDtoUSD(cusdAmount: number, rate: number | null): number | null {
  if (rate === null || cusdAmount === 0) return null;
  return cusdAmount * rate;
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
