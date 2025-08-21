'use client'

import { useAppKitAccount, useDisconnect, useAppKit } from '@reown/appkit/react'
import { Button } from '@/components/ui/button'
import { LogOut, Wallet, User, Copy, Check, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export const ConnectButton = ({ compact = false }: { compact?: boolean }) => {
  const { isConnected, address, embeddedWalletInfo } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { t } = useLanguage()

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

  const formatAddress = (addr: string | undefined): string => {
    if (!addr) return t('common.loading')
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Show loading state until component is mounted
  if (!mounted) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  // Show connect button when not connected
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Button 
          onClick={() => open()}
          className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {t('home.connectWallet')}
        </Button>
        <p className="text-sm text-gray-600">{t('home.connectWalletMessage')}</p>
      </div>
    )
  }

  // Show wallet info when connected
  if (compact) {
    // Mini version for top corner
    return (
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-lg p-2 border border-gray-200/50 shadow-sm">
        <div className="p-1 bg-pink-100 rounded-md">
          <Wallet className="w-3 h-3 text-pink-600" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-gray-800 truncate">
            {embeddedWalletInfo?.user?.email || embeddedWalletInfo?.user?.username || formatAddress(address)}
          </span>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-600">Connected</span>
          </div>
        </div>
        <Button
          onClick={handleDisconnect}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-red-100 rounded-md flex-shrink-0"
        >
          <LogOut className="w-3 h-3 text-red-600" />
        </Button>
      </div>
    )
  }

  // Full version for main content
  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-sm">
      {/* Ultra Compact Wallet Info Card */}
      <div className="w-full bg-white/90 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 shadow-lg">
        {/* Compact Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg">
              <Wallet className="w-4 h-4 text-pink-600" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-gray-800">
                {embeddedWalletInfo?.user?.email || embeddedWalletInfo?.user?.username || t('wallet.wallet')}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>{t('wallet.walletConnected')}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Compact Address Row */}
        <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <User className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span className="text-xs font-mono text-gray-700 truncate">
              {formatAddress(address)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAddress}
            className="h-7 w-7 p-0 hover:bg-gray-200/80 rounded-md flex-shrink-0 transition-colors"
            disabled={!address}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-gray-500" />
            )}
          </Button>
        </div>

        {/* Compact Action Buttons Row */}
        <div className="flex gap-2">
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            {t('wallet.disconnectWallet')}
          </Button>
        </div>
      </div>
    </div>
  )
}
