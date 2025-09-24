'use client'

import { useState, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export interface MiniAppDetectionResult {
  isMiniApp: boolean
  isFarcasterMiniApp: boolean
  isInFrame: boolean
  hasFarcasterUA: boolean
  hasMiniAppParam: boolean
  sdkAvailable: boolean
  detectionMethod: string
}

export const useMiniAppDetection = (): MiniAppDetectionResult => {
  const [detection, setDetection] = useState<MiniAppDetectionResult>({
    isMiniApp: false,
    isFarcasterMiniApp: false,
    isInFrame: false,
    hasFarcasterUA: false,
    hasMiniAppParam: false,
    sdkAvailable: false,
    detectionMethod: 'none'
  })

  useEffect(() => {
    const detectMiniApp = async () => {
      try {
        // 1. Frame detection
        const isInFrame = window !== window.top
        
        // 2. Window context detection
        const isInMiniApp = window.top !== window.self && 
                           window.location !== window.parent.location
        
        // 3. User Agent detection
        const hasFarcasterUA = navigator.userAgent.includes('Farcaster') || 
                              navigator.userAgent.includes('MiniApp') ||
                              navigator.userAgent.includes('Warpcast')
        
        // 4. URL parameter detection
        const urlParams = new URLSearchParams(window.location.search)
        const hasMiniAppParam = urlParams.get('miniapp') === 'true' ||
                               urlParams.get('miniApp') === 'true' ||
                               urlParams.get('farcaster') === 'true' ||
                               urlParams.get('warpcast') === 'true'
        
        // 5. Farcaster SDK detection
        let sdkAvailable = false
        try {
          await sdk.context
          sdkAvailable = true
        } catch (error) {
          console.log('Farcaster SDK not available:', error)
        }
        
        // 6. Path-based detection (for development)
        const hasMiniAppPath = window.location.pathname.includes('/miniapp') ||
                               window.location.pathname.includes('/mini')
        
        // Determine detection method
        let detectionMethod = 'none'
        if (sdkAvailable) detectionMethod = 'sdk'
        else if (hasFarcasterUA) detectionMethod = 'userAgent'
        else if (hasMiniAppParam) detectionMethod = 'urlParam'
        else if (isInFrame) detectionMethod = 'frame'
        else if (hasMiniAppPath) detectionMethod = 'path'
        
        // Determine if it's a Mini App
        const isMiniApp = isInFrame || isInMiniApp || hasFarcasterUA || hasMiniAppParam || sdkAvailable || hasMiniAppPath
        const isFarcasterMiniApp = isMiniApp && (sdkAvailable || hasFarcasterUA || hasMiniAppParam)
        
        setDetection({
          isMiniApp,
          isFarcasterMiniApp,
          isInFrame,
          hasFarcasterUA,
          hasMiniAppParam,
          sdkAvailable,
          detectionMethod
        })
        
        console.log('Mini App Detection Result:', {
          isMiniApp,
          isFarcasterMiniApp,
          isInFrame,
          hasFarcasterUA,
          hasMiniAppParam,
          sdkAvailable,
          hasMiniAppPath,
          detectionMethod
        })
        
      } catch (error) {
        console.error('Mini App detection failed:', error)
        setDetection({
          isMiniApp: false,
          isFarcasterMiniApp: false,
          isInFrame: false,
          hasFarcasterUA: false,
          hasMiniAppParam: false,
          sdkAvailable: false,
          detectionMethod: 'error'
        })
      }
    }
    
    detectMiniApp()
  }, [])
  
  return detection
}

// Utility function to check if running in development mode
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1'
}

// Utility function to get Mini App URL for testing
export const getMiniAppUrl = (baseUrl: string): string => {
  const url = new URL(baseUrl)
  url.searchParams.set('miniapp', 'true')
  return url.toString()
}
