import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo, celoAlfajores } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string || '5aa426208ed21c5b9a93b4a0eec73d97' // this is a public projectId only to use on localhost

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [celo, celoAlfajores] as [AppKitNetwork, ...AppKitNetwork[]]

//Set up the Wagmi Adapter (Config) with Farcaster Mini App connector
export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks,
  connectors: [
    miniAppConnector() // Farcaster Mini App connector
  ]
})

export const config = wagmiAdapter.wagmiConfig