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

// Set up metadata - dynamically match current environment (dev, staging, or production)
const getAppUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // Server-side: use environment variable or default
  return process.env.NEXT_PUBLIC_APP_URL || 'https://cpiggy.xyz'
}

const metadata = {
  name: 'cPiggyFX',
  description: 'Diversified FX Piggy Bank on Celo',
  url: getAppUrl(),
  icons: [`${getAppUrl()}/icon.png`]
}

// Create the modal with all advanced features (singleton to prevent double initialization)
let modalInstance: ReturnType<typeof createAppKit> | null = null

if (!modalInstance) {
  modalInstance = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks,
    metadata,
    themeMode: 'light',
    // Features are controlled remotely via Reown dashboard at dashboard.reown.com
    // Current enabled features: email, socials, onramp, swaps, activity, event tracking
    themeVariables: {
      '--w3m-accent': '#000000',
    }
  })
}

export const modal = modalInstance

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
