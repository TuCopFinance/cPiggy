// app/page.tsx

"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAppKitAccount } from "@reown/appkit/react";
import { ConnectButton } from "@/components/ConnectButton";

export default function Home() {
  const { address, isConnected, caipAddress, status, embeddedWalletInfo } =
  useAppKitAccount();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-slate-100 p-6">
      <div className="text-center space-y-6 max-w-xl">
        <Image
          src="/piggy-icon.svg"
          alt="cPiggyFX Logo"
          width={100}
          height={100}
          className="mx-auto"
        />
        <h1 className="text-5xl font-extrabold text-pink-700 tracking-tight">
          cPiggyFX
        </h1>
        <p className="text-lg text-gray-700">
          Diversified FX Piggy Bank for Colombians
        </p>
        <p className="text-sm text-gray-500">
          Save in <span className="font-semibold">cCOP</span>, grow in the world. Your
          funds are automatically diversified into stablecoins like
          <span className="font-semibold"> cUSD</span> and
          <span className="font-semibold"> cREAL</span>, then returned to you with
          potential FX gains.
        </p>

        <div className="pt-4">
          <ConnectButton />
        </div>

        {isConnected && (
          <div className="flex justify-center gap-4 mt-6">
            <Link href="/create">
              <Button className="px-6 py-2 text-base rounded-full shadow-md bg-pink-600 hover:bg-pink-700 text-white">
                Create Piggy
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="px-6 py-2 text-base rounded-full border-pink-600 text-pink-700 hover:bg-pink-50"
              >
                View My Piggy
              </Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
