import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { injected, walletConnect } from 'wagmi/connectors'
import { defineChain } from 'viem'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string || '5aa426208ed21c5b9a93b4a0eec73d97' // this is a public projectId only to use on localhost

if (!projectId) {
  throw new Error('Project ID is not defined')
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
export const networks = isFarcasterMiniApp
  ? [celo] as [AppKitNetwork, ...AppKitNetwork[]]
  : [celo, celoSepolia as AppKitNetwork] as [AppKitNetwork, ...AppKitNetwork[]]

//Set up the Wagmi Adapter (Config) with both Farcaster and standard connectors
export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks,
  connectors: [
    injected(), // MetaMask and other browser wallets
    walletConnect({
      projectId,
      metadata: {
        name: 'cPiggyFX',
        description: 'Diversified FX Piggy Bank on Celo',
        url: 'https://cpiggy.xyz',
        icons: ['https://cpiggy.xyz/icon.png']
      }
    }), // WalletConnect protocol
    miniAppConnector() // Farcaster Mini App connector
  ]
})

export const config = wagmiAdapter.wagmiConfig