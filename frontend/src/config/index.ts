import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo, base } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { defineChain } from 'viem'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string

if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not defined. Please set it in your environment variables.')
}

// Define Celo Sepolia testnet (new testnet replacing Alfajores)
// https://docs.celo.org/network/celo-sepolia
export const celoSepolia = defineChain({
  id: 11142220,
  name: 'Celo Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Sepolia Explorer',
      url: 'https://celo-sepolia.blockscout.com',
    },
  },
  testnet: true,
})

// Detect if running in Farcaster Mini App (server-safe check)
const isFarcasterMiniApp = typeof window !== 'undefined' && (
  window.location.hostname.includes('warpcast.com') ||
  window.location.hostname.includes('farcaster') ||
  navigator.userAgent.includes('Warpcast')
);

// Farcaster wallet doesn't support testnets - only include mainnet for Farcaster
// Otherwise include both mainnet and Celo Sepolia testnet
// Note: Base is included for reading Chainlink EUR/USD and GBP/USD price feeds (read-only, not for transactions)
export const networks = isFarcasterMiniApp
  ? [celo, base] as [AppKitNetwork, ...AppKitNetwork[]]
  : [celo, celoSepolia as AppKitNetwork, base] as [AppKitNetwork, ...AppKitNetwork[]]

//Set up the Wagmi Adapter (Config)
// WagmiAdapter automatically includes injected() and walletConnect() connectors
// We only need to add custom connectors like Farcaster miniapp
export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks,
  connectors: [
    miniAppConnector() // Farcaster Mini App connector
  ]
})

export const config = wagmiAdapter.wagmiConfig