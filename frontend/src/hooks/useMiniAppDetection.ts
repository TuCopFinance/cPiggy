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
        // 1. Frame detection (more specific) - enhanced for mobile apps
        const isInFrame = window !== window.top || 
                         window.parent !== window || 
                         window.top !== window.self
        
        // 2. Window context detection (more specific)
        const isInMiniApp = window.top !== window.self && 
                           window.location !== window.parent.location
        
        // 3. User Agent detection (more specific - avoid mobile browser false positives)
        const hasFarcasterUA = navigator.userAgent.includes('Farcaster') || 
                              navigator.userAgent.includes('MiniApp') ||
                              (navigator.userAgent.includes('Warpcast') && isInFrame)
        
        // 4. URL parameter detection (development only)
        const urlParams = new URLSearchParams(window.location.search)
        const hasMiniAppParam = urlParams.get('miniapp') === 'true' ||
                               urlParams.get('miniApp') === 'true' ||
                               urlParams.get('farcaster') === 'true' ||
                               urlParams.get('warpcast') === 'true'
        
        // 5. Farcaster SDK detection (primary method) - enhanced for mobile apps
        let sdkAvailable = false
        try {
          // Check if SDK is actually available and functional
          const context = await sdk.context
          console.log('SDK context result:', context)
          
          // More lenient check for mobile apps - if SDK context is available, trust it
          if (context && typeof context === 'object') {
            sdkAvailable = true
            console.log('SDK detected as available')
          } else {
            sdkAvailable = false
            console.log('SDK context not properly available')
          }
        } catch (error) {
          console.log('Farcaster SDK not available:', error)
          sdkAvailable = false
        }
        
        // 6. Path-based detection (development only)
        const hasMiniAppPath = window.location.pathname.includes('/miniapp') ||
                               window.location.pathname.includes('/mini')
        
        // Determine detection method
        let detectionMethod = 'none'
        if (sdkAvailable) detectionMethod = 'sdk'
        else if (hasFarcasterUA) detectionMethod = 'userAgent'
        else if (hasMiniAppParam) detectionMethod = 'urlParam'
        else if (isInFrame) detectionMethod = 'frame'
        else if (hasMiniAppPath) detectionMethod = 'path'
        
        // More conservative detection - prioritize SDK and specific indicators
        // Only activate for actual Farcaster environments or explicit testing
        const isDevelopment = process.env.NODE_ENV === 'development'
        
        // Only consider it a mini app if we have strong indicators
        // 1. SDK is available (most reliable)
        // 2. OR we're in a frame AND have Farcaster UA (embedded in Farcaster)
        // 3. OR explicit testing parameters
        const isMiniApp = sdkAvailable || (hasFarcasterUA && isInFrame) || hasMiniAppParam || (hasMiniAppPath && isDevelopment)
        
        // Enhanced detection for Farcaster-specific UI
        // Show Farcaster UI if SDK is available (primary) OR we're explicitly testing
        // SDK availability is the most reliable indicator for Farcaster environment
        const isFarcasterMiniApp = sdkAvailable || hasMiniAppParam
        
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
          detectionMethod,
          isDevelopment,
          userAgent: navigator.userAgent,
          isInMiniApp,
          windowComparison: {
            windowTop: window.top,
            windowSelf: window.self,
            windowParent: window.parent,
            isTopEqual: window === window.top,
            isParentEqual: window.parent === window,
            isTopSelfEqual: window.top === window.self
          }
        })
        
        if (isFarcasterMiniApp) {
          console.log('🎉 Farcaster Mini App detected! Using Farcaster-specific features.')
        } else {
          console.log('🌐 Regular web app detected. Using standard web3 features.')
        }
        
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
