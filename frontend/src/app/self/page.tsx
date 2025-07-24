'use client';

import React, { useState, useEffect } from 'react';
import { getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { ethers } from "ethers";
import { useRouter } from 'next/navigation'; // Import the router

function VerificationPage() {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId] = useState(ethers.ZeroAddress);
  const router = useRouter(); // Initialize the router

   useEffect(() => {
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Self Workshop",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "self-workshop",
        endpoint: `${process.env.NEXT_PUBLIC_SELF_ENDPOINT}`,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "https",
        userIdType: "hex",
        userDefinedData: "Welcome to cPiggy!",
        disclosures: {
          // none here
        }
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
    }
  }, [userId]);

  const handleSuccessfulVerification = () => {
    console.log("Verification successful! Redirecting...");
    
    // 1. Set a flag in localStorage to remember the verification status
    localStorage.setItem('isSelfVerified', 'true');
    
    // 2. Redirect the user back to the main page
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
                console.error("Error: Failed to verify identity", error);
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