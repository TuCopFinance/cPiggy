'use client'

import { wagmiAdapter, projectId, networks } from '../config/index'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { LanguageProvider } from './LanguageContext'
import { FarcasterProvider } from './FarcasterContext'

// Set up queryClient
const queryClient = new QueryClient()

// Set up metadata
const metadata = {
  name: 'cPiggyFX',
  description: 'Diversified FX Piggy Bank on Celo',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://cpiggy-tests.up.railway.app',
  icons: ['https://cpiggy-tests.up.railway.app/icon.png']
}

// Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  themeMode: 'light',
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  }
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <FarcasterProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </FarcasterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider
