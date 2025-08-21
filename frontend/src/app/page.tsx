// app/page.tsx

"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAppKitAccount } from "@reown/appkit/react";
import { ConnectButton } from "@/components/ConnectButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import cPiggyLogo from "@/pic/cPiggy.png";
import { ArrowRight, PlusCircle, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const { isConnected } = useAppKitAccount();
  const { t, currentLocale, setLocale } = useLanguage();
  
  // --- UPDATED LOGIC ---
  // Default to false. We only set to true if we find it in localStorage.
  const [isSelfVerified, setIsSelfVerified] = useState(false);
  // Start loading until we've checked the connection and verification status.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect now runs only once when the component mounts.
    // We check for the verification status saved in the browser.
    const verified = localStorage.getItem('isSelfVerified') === 'true';
    setIsSelfVerified(verified);
    // After checking, we are no longer loading the verification status.
    setIsLoading(false);
  }, []); // Empty dependency array means this runs once on mount

  const renderContent = () => {
    // Show loading state while checking wallet connection and verification
    if (isLoading) {
      return <p className="text-gray-500">{t('home.initializing')}</p>;
    }

    // If not connected, show the enhanced connect button
    if (!isConnected) {
      return <ConnectButton />;
    }

    // If connected, now we can check the verification status we loaded.
    if (isSelfVerified) {
      // User is connected AND verified
      return (
        <div className="flex flex-col items-center gap-6">
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/create">
              <Button className="group w-full sm:w-auto px-6 py-3 text-base rounded-full shadow-lg bg-pink-600 hover:bg-pink-700 text-white transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 transition-transform group-hover:rotate-90" />
                {t('home.createPiggy')}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="group w-full sm:w-auto px-6 py-3 text-base rounded-full border-2 border-pink-600 text-pink-700 hover:bg-pink-50 hover:text-pink-800 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                {t('home.viewPiggies')}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      );
    } else {
      // User is connected BUT NOT verified
      return (
        <div className="flex flex-col items-center gap-6">
          {/* Verification prompt */}
          <div className="flex flex-col items-center gap-4 w-full">
            <p className="text-gray-700 font-medium text-center">{t('home.verifyIdentity')}</p>
            <Link href="/self">
              <Button className="group w-full sm:w-auto px-8 py-4 text-lg font-semibold rounded-2xl shadow-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center gap-3 border-2 border-white/20 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <ShieldCheck className="w-6 h-6 relative z-10 group-hover:animate-pulse" />
                <span className="relative z-10">{t('home.proceedToVerification')}</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </div>
      );
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-100 p-6">
      {/* Compact Wallet Info - Top Left */}
      {isConnected && (
        <div className="absolute top-4 left-4">
          <ConnectButton compact={true} />
        </div>
      )}
      
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher 
          currentLocale={currentLocale} 
          onLocaleChange={setLocale} 
        />
      </div>
      
      <div className="w-full max-w-xl mx-auto bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-8 sm:p-12 text-center">
        <Image
          src={cPiggyLogo}
          alt="cPiggyFX Logo"
          width={120}
          height={120}
          className="mx-auto mb-4"
        />
        <h1 className="text-5xl font-extrabold text-pink-700 tracking-tight">
          cPiggyFX
        </h1>
        <p className="mt-2 text-lg text-gray-700">
          {t('home.subtitle')}
        </p>
        <p className="mt-4 text-sm text-gray-600 max-w-md mx-auto">
          {t('home.description')}
        </p>

        <div className="mt-10 space-y-4 flex flex-col items-center justify-center">
          {renderContent()}
        </div>

        {/* Demo Link */}
        <div className="mt-8 text-center">
          <Link href="/demo">
            <Button variant="ghost" className="text-sm text-gray-500 hover:text-gray-700">
              🌍 Try Language Demo
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}