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

  // Wait for wallet connection before proceeding
  const userId = address;

  // Detect if running on mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /android|iphone|ipad|ipod/i.test(userAgent);

      // Additional check for Farcaster mobile app
      const isInFarcaster = /farcaster/i.test(userAgent);

      console.log("📱 Device detection:", { isMobileDevice, isInFarcaster, userAgent });
      setIsMobile(isMobileDevice || isInFarcaster);

      return isMobileDevice || isInFarcaster;
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

      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME,
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "cpiggy-prod",
        endpoint: process.env.NEXT_PUBLIC_SELF_ENDPOINT || "https://cpiggy.xyz/api/verify",
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "https",
        userIdType: "hex",
        userDefinedData: "Welcome to cPiggy!",
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

    } catch (error) {
      console.error("❌ Failed to initialize Self app in useEffect:", error);
    }
  }, [userId]);

  // Poll verification status for mobile apps (when user switches to Self app)
  useEffect(() => {
    if (!userId || !isPolling) return;

    const checkVerificationStatus = async () => {
      try {
        const response = await fetch('/api/verify/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.verified) {
            console.log("✅ Verification detected via polling!");
            handleSuccessfulVerification();
          }
        }
      } catch (error) {
        console.error("❌ Error checking verification status:", error);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(checkVerificationStatus, 3000);

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      setIsPolling(false);
      clearInterval(interval);
    }, 300000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [userId, isPolling]);

  const handleSuccessfulVerification = () => {
    console.log("✅ Verification successful! Redirecting...");
    localStorage.setItem('isSelfVerified', 'true');
    setIsPolling(false);
    router.push('/');
  };

  // Auto-open Self app on mobile devices
  useEffect(() => {
    if (universalLink && isMobile && userId) {
      console.log("📱 Mobile detected - Auto-opening Self app with link:", universalLink);

      // Small delay to ensure page has loaded
      const timer = setTimeout(() => {
        window.location.href = universalLink;
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [universalLink, isMobile, userId]);

  // Start polling when QR is shown (especially important for mobile)
  useEffect(() => {
    if (selfApp && userId) {
      console.log("🔄 Starting verification polling for userId:", userId);
      setIsPolling(true);
    }
  }, [selfApp, userId]);

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
          <div className="h-64 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 text-lg">{t('verification.openingApp') || 'Opening Self app...'}</p>
            <p className="text-gray-500 text-sm">{t('verification.ifNotOpened') || "If the app doesn't open automatically:"}</p>
            <a
              href={universalLink}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t('verification.openManually') || 'Open Self App'}
            </a>
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