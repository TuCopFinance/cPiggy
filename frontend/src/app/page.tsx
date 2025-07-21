// app/page.tsx

"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAppKitAccount } from "@reown/appkit/react";
import { ConnectButton } from "@/components/ConnectButton";
import cPiggyLogo from "@/pic/cPiggy.png"; // Assuming the path is src/pic/cPiggy.png
import { ArrowRight, PlusCircle } from "lucide-react";

export default function Home() {
  const { isConnected } = useAppKitAccount();

  return (
    // A more dynamic background gradient
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-100 p-6">
      
      {/* "Glassmorphism" container for a modern feel */}
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

        <div className="mt-10 space-y-4">
          {!isConnected ? (
            <ConnectButton />
          ) : (
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
          )}
        </div>
      </div>
    </main>
  );
}