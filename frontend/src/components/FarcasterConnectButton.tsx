'use client'

import { useConnect, useAccount, useSwitchChain } from 'wagmi'
import { celo } from 'viem/chains'
import { Button } from '@/components/ui/button'
import { Wallet, Loader2, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useFarcaster } from '@/context/FarcasterContext'

export const FarcasterConnectButton = () => {
  const { connect, connectors, isPending } = useConnect()
  const { isConnected, address, chainId } = useAccount()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const { isFarcasterMiniApp, isFarcasterWalletConnected } = useFarcaster()
  const [mounted, setMounted] = useState(false)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-switch to Celo chain when connected
  useEffect(() => {
    if (isConnected && chainId !== celo.id) {
      switchChain({ chainId: celo.id })
    }
  }, [isConnected, chainId, switchChain])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </div>
    )
  }

  // Find Farcaster connector
  const farcasterConnector = connectors.find(
    connector => connector.id === 'miniApp'
  )

  if (!farcasterConnector) {
    return (
      <div className="text-red-500 text-sm">
        Farcaster connector not available
      </div>
    )
  }

  // Show connected state
  if (isConnected && isFarcasterWalletConnected) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-green-800">
            Farcaster Wallet Connected
          </span>
          <span className="text-xs text-green-600">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
          </span>
        </div>
      </div>
    )
  }

  // Show connect button
  return (
    <Button
      onClick={() => connect({ connector: farcasterConnector })}
      disabled={isPending || isSwitchingChain}
      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
    >
      {isPending || isSwitchingChain ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>
            {isSwitchingChain ? 'Switching to Celo...' : 'Connecting...'}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          <span>Connect Farcaster Wallet</span>
        </div>
      )}
    </Button>
  )
}

// Hook for checking if we should show Farcaster-specific UI
export const useFarcasterWallet = () => {
  const { isFarcasterMiniApp, isFarcasterWalletConnected } = useFarcaster()
  const { isConnected, chainId } = useAccount()
  
  return {
    isFarcasterMiniApp,
    isFarcasterWalletConnected: isFarcasterMiniApp && isConnected,
    isOnCorrectChain: chainId === celo.id,
    shouldShowFarcasterUI: isFarcasterMiniApp
  }
}
