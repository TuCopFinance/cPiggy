'use client';

import React, { useState, useEffect } from 'react';
import { getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { ethers } from "ethers";
import { useRouter } from 'next/navigation';
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ConnectButton } from "@/components/ConnectButton";
import { useAccount } from "wagmi";

function VerificationPage() {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId] = useState(ethers.ZeroAddress);
  const router = useRouter();
  const { t, currentLocale, setLocale } = useLanguage();
  const { address } = useAccount();

   useEffect(() => {
    console.log("🚀 useEffect triggered. Initializing SelfAppBuilder...");
    try {
      // DEBUGGING: Log the userId being used
      console.log("👤 Using userId:", userId);

      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "cPiggyFX",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "cpiggyfx-tests",
        endpoint: process.env.NEXT_PUBLIC_SELF_ENDPOINT || "https://cpiggy-tests.up.railway.app/api/verify",
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "https",
        userIdType: "hex",
        userDefinedData: "Welcome to cPiggy!",
        disclosures: {
          // none here
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

  const handleSuccessfulVerification = () => {
    console.log("✅ Verification successful! Redirecting...");
    localStorage.setItem('isSelfVerified', 'true');
    router.push('/');
  };

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
        
        {selfApp ? (
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

        {universalLink && (
          <a href={universalLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-4 inline-block">
            {t('verification.tryAgain')}
          </a>
        )}
      </div>
    </main>
  );
}

export default VerificationPage;