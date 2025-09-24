"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useConnect, useAccount, useSwitchChain } from 'wagmi';
import { celo } from 'viem/chains';
import { useMiniAppDetection } from '@/hooks/useMiniAppDetection';

interface FarcasterContextType {
  isLoaded: boolean;
  isFarcasterMiniApp: boolean;
  context: unknown;
  user: unknown;
  signIn: () => Promise<void>;
  shareToFeed: (text: string, embeds?: string[]) => Promise<void>;
  openUrl: (url: string) => Promise<void>;
  markReady: () => Promise<void>;
  connectFarcasterWallet: () => Promise<void>;
  isFarcasterWalletConnected: boolean;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [context, setContext] = useState<unknown>(null);
  const [user, setUser] = useState<unknown>(null);
  
  const { connect, connectors } = useConnect();
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  
  // Use the improved Mini App detection
  const { isFarcasterMiniApp, isMiniApp, sdkAvailable, detectionMethod } = useMiniAppDetection();

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        console.log('Farcaster Mini App Detection:', {
          isFarcasterMiniApp,
          isMiniApp,
          sdkAvailable,
          detectionMethod
        });
        
        if (isFarcasterMiniApp) {
          // Get context from Farcaster if SDK is available
          if (sdkAvailable) {
            try {
              const contextData = await sdk.context;
              setContext(contextData);
              
              if ((contextData as any)?.user) {
                setUser((contextData as any).user);
              }
            } catch (error) {
              console.error('Failed to get Farcaster context:', error);
            }
          }
          
          // Auto-connect Farcaster wallet if in MiniApp and not connected
          if (!isConnected) {
            const farcasterConnector = connectors.find(
              connector => connector.id === 'miniApp'
            );
            if (farcasterConnector) {
              try {
                connect({ connector: farcasterConnector });
              } catch (error) {
                console.error('Auto-connect failed:', error);
              }
            }
          }
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        setIsLoaded(true);
      }
    };

    initializeFarcaster();
  }, [isFarcasterMiniApp, sdkAvailable, connect, connectors, isConnected, detectionMethod]);

  const signIn = async () => {
    if (!isFarcasterMiniApp) return;
    
    try {
      // For now, just use context user if available
      if ((context as any)?.user) {
        setUser((context as any).user);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const shareToFeed = async (text: string, embeds?: string[]) => {
    if (!isFarcasterMiniApp) return;
    
    try {
      // For now, just log the share attempt
      console.log('Share to feed:', { text, embeds });
    } catch (error) {
      console.error('Share to feed failed:', error);
    }
  };

  const openUrl = async (url: string) => {
    if (!isFarcasterMiniApp) {
      window.open(url, '_blank');
      return;
    }
    
    try {
      await sdk.actions.openUrl(url);
    } catch (error) {
      console.error('Open URL failed:', error);
      window.open(url, '_blank');
    }
  };

  const markReady = async () => {
    if (isFarcasterMiniApp) {
      try {
        await sdk.actions.ready();
      } catch (error) {
        console.error('Failed to mark app as ready:', error);
      }
    }
  };

  const connectFarcasterWallet = async () => {
    if (!isFarcasterMiniApp) return;
    
    const farcasterConnector = connectors.find(
      connector => connector.id === 'miniApp'
    );
    
    if (farcasterConnector) {
      try {
        await connect({ connector: farcasterConnector });
        
        // Switch to Celo chain if connected to wrong chain
        if (isConnected && chainId !== celo.id) {
          try {
            await switchChain({ chainId: celo.id });
          } catch (error) {
            console.error('Failed to switch to Celo chain:', error);
          }
        }
      } catch (error) {
        console.error('Failed to connect Farcaster wallet:', error);
      }
    }
  };

  const value: FarcasterContextType = {
    isLoaded,
    isFarcasterMiniApp,
    context,
    user,
    signIn,
    shareToFeed,
    openUrl,
    markReady,
    connectFarcasterWallet,
    isFarcasterWalletConnected: isFarcasterMiniApp && isConnected,
  };

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error('useFarcaster must be used within a FarcasterProvider');
  }
  return context;
}