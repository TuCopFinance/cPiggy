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

function VerificationPage() {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId] = useState(ethers.ZeroAddress);
  const router = useRouter();

  // DEBUGGING: Log environment variables to ensure they are loaded
  console.log("--- ENV VARS ---");
  console.log("NEXT_PUBLIC_SELF_APP_NAME:", process.env.NEXT_PUBLIC_SELF_APP_NAME);
  console.log("NEXT_PUBLIC_SELF_SCOPE:", process.env.NEXT_PUBLIC_SELF_SCOPE);
  console.log("NEXT_PUBLIC_SELF_ENDPOINT:", process.env.NEXT_PUBLIC_SELF_ENDPOINT);
  console.log("------------------");

   useEffect(() => {
    console.log("🚀 useEffect triggered. Initializing SelfAppBuilder...");
    try {
      // DEBUGGING: Log the userId being used
      console.log("👤 Using userId:", userId);

      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "cPiggyFX",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "cpiggyfx-production",
        endpoint: process.env.NEXT_PUBLIC_SELF_ENDPOINT || "https://cpiggy-production.up.railway.app/api/verify",
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-cyan-100 p-6">
      <div className="w-full max-w-xl mx-auto bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-8 sm:p-12 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Verify Your Identity</h1>
        <p className="text-gray-600 mb-6">Scan this QR code with the Self app to continue.</p>
        
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
            <p className="text-gray-500">Loading QR Code...</p>
          </div>
        )}

        {universalLink && (
          <a href={universalLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-4 inline-block">
            Having trouble? Open in Self app directly.
          </a>
        )}
      </div>
    </main>
  );
}

export default VerificationPage;