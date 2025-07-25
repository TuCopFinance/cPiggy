'use client'

import { useAppKitAccount, useDisconnect } from '@reown/appkit/react'
import { Button } from '@/components/ui/button'
import { LogOut, Wallet, User, Copy, Check, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export const ConnectButton = () => {
  const { isConnected, address, embeddedWalletInfo } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDisconnect = async () => {
    try {
      await disconnect()
      // Clear any local storage data when disconnecting
      localStorage.removeItem('isSelfVerified')
    } catch (error) {
      console.error("Failed to disconnect:", error)
    }
  }

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy address:", error)
      }
    }
  }

  const formatAddress = (addr: string) => {
    if (!addr) return 'Loading...'
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Show loading state until component is mounted
  if (!mounted) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Show connect button when not connected
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4">
        <appkit-button />
        <p className="text-sm text-gray-600">Connect your wallet to get started</p>
      </div>
    )
  }

  // Show wallet info when connected
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      {/* Wallet Info Card */}
      <div className="w-full bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-pink-100 rounded-lg">
            <Wallet className="w-5 h-5 text-pink-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">Connected Wallet</p>
            <p className="text-sm text-gray-600">
              {embeddedWalletInfo?.user?.email || embeddedWalletInfo?.user?.username || 'Wallet'}
            </p>
          </div>
        </div>
        
        {/* Address Display */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-mono text-gray-700">
              {formatAddress(address)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAddress}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            disabled={!address}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-500" />
            )}
          </Button>
        </div>

        {/* Disconnect Button */}
        <Button
          onClick={handleDisconnect}
          variant="outline"
          className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect Wallet
        </Button>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Wallet Connected</span>
      </div>
    </div>
  )
}
