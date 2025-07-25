// app/page.tsx

"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAppKitAccount } from "@reown/appkit/react";
import { ConnectButton } from "@/components/ConnectButton";
import cPiggyLogo from "@/pic/cPiggy.png";
import { ArrowRight, PlusCircle, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const { isConnected } = useAppKitAccount();
  
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
      return <p className="text-gray-500">Initializing...</p>;
    }

    // If not connected, always show the connect button first.
    if (!isConnected) {
      return <ConnectButton />;
    }

    // If connected, now we can check the verification status we loaded.
    if (isSelfVerified) {
      // User is connected AND verified
      return (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href="/create">
            <Button className="group w-full sm:w-auto px-6 py-3 text-base rounded-full shadow-lg bg-pink-600 hover:bg-pink-700 text-white transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 transition-transform group-hover:rotate-90" />
              Create a New Piggy
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="group w-full sm:w-auto px-6 py-3 text-base rounded-full border-2 border-pink-600 text-pink-700 hover:bg-pink-50 hover:text-pink-800 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              View My Piggies
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      );
    } else {
      // User is connected BUT NOT verified
      return (
        <div>
          <p className="mb-4 text-gray-700 font-medium">Please verify your identity to continue.</p>
          <Link href="/self">
            <Button className="group w-full sm:w-auto px-6 py-3 text-base rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Proceed to Verification
            </Button>
          </Link>
        </div>
      );
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-100 p-6">
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
          Diversified FX Piggy Bank for Colombians
        </p>
        <p className="mt-4 text-sm text-gray-600 max-w-md mx-auto">
          Save in <span className="font-semibold text-pink-600">cCOP</span>, grow in the world. Your
          funds are automatically diversified into stablecoins like
          <span className="font-semibold text-pink-600"> cUSD</span> to protect your savings.
        </p>

        <div className="mt-10 space-y-4 h-24 flex flex-col items-center justify-center">
          {renderContent()}
        </div>
      </div>
    </main>
  );
}