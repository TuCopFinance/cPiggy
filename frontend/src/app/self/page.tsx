'use client';

import React, { useState, useEffect } from 'react';
import { getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { useRouter } from 'next/navigation';
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ConnectButton } from "@/components/ConnectButton";
import { useAccount } from "wagmi";

function VerificationPage() {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const router = useRouter();
  const { t, currentLocale, setLocale } = useLanguage();
  const { address } = useAccount();
  const [isPolling, setIsPolling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isReturningFromSelf, setIsReturningFromSelf] = useState(false);

  // Wait for wallet connection before proceeding
  const userId = address;

  // Check if user is returning from Self app (via URL params)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const isCallback = urlParams.get('callback') === 'true';

    if (isCallback) {
      console.log("🔙 User returned from Self app via callback");
      setIsReturningFromSelf(true);

      // Recover userId from sessionStorage if needed
      const storedUserId = sessionStorage.getItem('self_verification_userId');
      if (storedUserId && !userId) {
        console.log("📦 Recovered userId from sessionStorage:", storedUserId);
      }

      // Start polling immediately
      setIsPolling(true);

      // Clean URL without reloading
      window.history.replaceState({}, '', '/self');
    }
  }, [userId]);

  // Detect if running on mobile device or Farcaster MiniApp
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|iphone|ipad|ipod/i.test(userAgent);

      // Check for Farcaster mobile app or MiniApp context
      const isInFarcaster = /farcaster/i.test(userAgent);

      // Check if running in Farcaster MiniApp iframe
      const isInIframe = window.self !== window.top;

      // Check for Farcaster SDK availability
      const hasFarcasterSDK = typeof window !== 'undefined' &&
        (window as any).fc !== undefined;

      // Check viewport size (MiniApps are typically mobile-sized)
      const isSmallViewport = window.innerWidth <= 768;

      const isFarcasterContext = isInFarcaster || hasFarcasterSDK ||
        (isInIframe && isSmallViewport);

      console.log("📱 Device detection:", {
        isMobileDevice,
        isInFarcaster,
        hasFarcasterSDK,
        isInIframe,
        isSmallViewport,
        isFarcasterContext,
        userAgent
      });

      // Treat Farcaster MiniApp as mobile
      const shouldUseMobileUI = isMobileDevice || isFarcasterContext;
      setIsMobile(shouldUseMobileUI);

      return shouldUseMobileUI;
    };

    checkIfMobile();
  }, []);

   useEffect(() => {
    // Don't initialize until we have a valid wallet address
    if (!userId) {
      console.log("⏳ Waiting for wallet connection...");
      return;
    }

    console.log("🚀 useEffect triggered. Initializing SelfAppBuilder...");
    try {
      // DEBUGGING: Log the userId being used
      console.log("👤 Using userId:", userId);

      // Build callback URL for mobile deep linking
      const callbackUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/self?callback=true`
        : 'https://cpiggy.xyz/self?callback=true';

      console.log("🔗 Callback URL:", callbackUrl);

      // Detect if in Farcaster context for custom message
      const isInFarcaster = typeof window !== 'undefined' && (
        /farcaster/i.test(navigator.userAgent.toLowerCase()) ||
        (window as any).fc !== undefined ||
        window.self !== window.top
      );

      // Customize message based on context
      const verificationMessage = isInFarcaster
        ? "🎭 Verificando tu Identidad en Farcaster MiniApp\n\nVerifying your Identity in Farcaster MiniApp"
        : "Verifica tu Identidad en cPiggy! 🐷";

      console.log("🎭 Context detected:", { isInFarcaster, message: verificationMessage });

      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME,
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "cpiggy-prod",
        endpoint: process.env.NEXT_PUBLIC_SELF_ENDPOINT || "https://cpiggy.xyz/api/verify",
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "https",
        userIdType: "hex",
        userDefinedData: verificationMessage,
        deeplinkCallback: callbackUrl, // Add callback for mobile
        disclosures: {
          excludedCountries: []
        }
      }).build();

      // DEBUGGING: Log the entire generated app object
      console.log("✅ SelfApp object built successfully:", app);

      setSelfApp(app);

      const generatedLink = getUniversalLink(app);
      // DEBUGGING: Log the generated universal link
      console.log("🔗 Generated Universal Link:", generatedLink);
      setUniversalLink(generatedLink);

      // Store userId and context in sessionStorage for recovery after redirect
      sessionStorage.setItem('self_verification_userId', userId);
      sessionStorage.setItem('self_verification_timestamp', Date.now().toString());
      sessionStorage.setItem('self_verification_context', isInFarcaster ? 'farcaster' : 'web');

    } catch (error) {
      console.error("❌ Failed to initialize Self app in useEffect:", error);
    }
  }, [userId]);

  // Poll verification status for mobile apps (when user switches to Self app)
  useEffect(() => {
    if (!userId || !isPolling) return;

    console.log("🔄 Starting verification polling for userId:", userId);

    const checkVerificationStatus = async () => {
      try {
        // Normalize userId to lowercase to match backend storage
        const normalizedUserId = userId.toLowerCase();

        const response = await fetch('/api/verify/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: normalizedUserId }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("📊 Polling response:", data);
          if (data.verified) {
            console.log("✅ Verification detected via polling!");
            handleSuccessfulVerification();
          }
        }
      } catch (error) {
        console.error("❌ Error checking verification status:", error);
      }
    };

    // Check immediately
    checkVerificationStatus();

    // Poll every 3 seconds
    const interval = setInterval(checkVerificationStatus, 3000);

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      console.log("⏱️ Polling timeout reached");
      setIsPolling(false);
      clearInterval(interval);
    }, 300000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [userId, isPolling]);

  const handleSuccessfulVerification = () => {
    const context = sessionStorage.getItem('self_verification_context') || 'unknown';
    console.log("✅ Verification successful! Context:", context);
    console.log("🔄 Redirecting to home...");

    localStorage.setItem('isSelfVerified', 'true');
    localStorage.setItem('self_verification_context', context);
    setIsPolling(false);

    // Clear session storage
    sessionStorage.removeItem('self_verification_userId');
    sessionStorage.removeItem('self_verification_timestamp');
    sessionStorage.removeItem('self_verification_initiated');
    sessionStorage.removeItem('self_verification_context');

    router.push('/');
  };

  // Auto-open Self app on mobile devices (disabled for Farcaster webview compatibility)
  // Farcaster blocks automatic redirects, so we rely on manual button click
  useEffect(() => {
    if (universalLink && isMobile && userId) {
      console.log("📱 Mobile detected - Link ready:", universalLink);
      console.log("🔍 User must manually click button to open Self app (Farcaster security)");
    }
  }, [universalLink, isMobile, userId]);

  // Start polling when QR is shown (especially important for mobile)
  useEffect(() => {
    if (selfApp && userId) {
      console.log("🔄 Starting verification polling for userId:", userId);
      setIsPolling(true);
    }
  }, [selfApp, userId]);

  // Detect when user returns to the page (mobile app switching)
  useEffect(() => {
    if (!isMobile || !userId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const initiatedTimestamp = sessionStorage.getItem('self_verification_initiated');

        if (initiatedTimestamp) {
          const timeSinceInitiation = Date.now() - parseInt(initiatedTimestamp);

          // If more than 5 seconds passed, user likely went to Self app
          if (timeSinceInitiation > 5000) {
            console.log("👁️ Page became visible after Self app switch - checking verification");
            setIsPolling(true);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMobile, userId]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-cyan-100 p-3 sm:p-6">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
        <LanguageSwitcher 
          currentLocale={currentLocale} 
          onLocaleChange={setLocale} 
        />
      </div>
      
      {/* Compact Wallet Info - Top Left */}
      {address && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
          <ConnectButton compact={true} />
        </div>
      )}
      
      <div className="w-full max-w-xl mx-auto bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-4 sm:p-8 md:p-12 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('verification.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{t('verification.description')}</p>

        {!userId ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4">
            <p className="text-gray-600 text-lg">{t('verification.connectWallet') || 'Please connect your wallet to continue'}</p>
            <ConnectButton />
          </div>
        ) : isMobile && universalLink ? (
          <div className="h-64 flex flex-col items-center justify-center gap-6">
            {isReturningFromSelf ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="text-gray-700 text-xl font-semibold">{t('verification.checkingStatus') || 'Checking verification status...'}</p>
                <p className="text-gray-500 text-sm">{t('verification.pleaseWait') || 'Please wait while we verify your identity'}</p>
              </>
            ) : (
              <>
                <p className="text-gray-700 text-xl font-semibold">{t('verification.readyToVerify') || 'Ready to Verify'}</p>
                <p className="text-gray-600 text-base px-4">{t('verification.tapToOpen') || 'Tap the button below to open Self app and complete verification'}</p>
                <a
                  href={universalLink}
                  onClick={() => {
                    console.log("🚀 User clicked to open Self app");
                    setIsPolling(true);
                    sessionStorage.setItem('self_verification_initiated', Date.now().toString());
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {t('verification.openSelfApp') || 'Open Self App to Verify'}
                </a>
                <p className="text-gray-500 text-xs">{t('verification.returnAfter') || 'Return here after verification completes'}</p>
              </>
            )}
          </div>
        ) : selfApp ? (
          <div className="flex justify-center">
            <SelfQRcodeWrapper
              selfApp={selfApp}
              onSuccess={handleSuccessfulVerification}
              onError={(error) => {
                console.error("❌ QR Code Error: Failed to verify identity", error);
              }}
            />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">{t('verification.verifying')}</p>
          </div>
        )}

        {universalLink && userId && !isMobile && (
          <a href={universalLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-4 inline-block">
            {t('verification.tryAgain')}
          </a>
        )}
      </div>
    </main>
  );
}

export default VerificationPage;