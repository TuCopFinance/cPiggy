import { http, createConfig } from 'wagmi'
import { celoAlfajores } from "wagmi/chains";
import { injected, metaMask, safe, walletConnect } from 'wagmi/connectors'

const projectId = '<WALLETCONNECT_PROJECT_ID>'

export const config = createConfig({
  chains: [celoAlfajores],
  connectors: [
    injected()
  ],
  transports: {
    [celoAlfajores.id]: http(),
  },
})