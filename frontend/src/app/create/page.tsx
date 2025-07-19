// app/create/page.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CreatePiggy() {
  const [amount, setAmount] = useState(0);
  const [duration, setDuration] = useState(30);
  const [safeMode, setSafeMode] = useState(true);

  const handleSubmit = () => {
    console.log("Depositing:", { amount, duration, safeMode });
    // TODO: Connect to smart contract interaction
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center text-pink-700">
          Create Your Piggy
        </h1>

        <div className="space-y-2">
          <label className="block font-medium text-gray-700">Deposit Amount (in cCOP)</label>
          <input
            type="number"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <label className="block font-medium text-gray-700">Lock Duration (days)</label>
          <select
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={safeMode}
            onChange={(e) => setSafeMode(e.target.checked)}
            className="accent-pink-600"
          />
          <label className="text-gray-700 text-sm">
            Enable Safe Mode (lower FX exposure)
          </label>
        </div>

        <Button
          className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 text-lg"
          onClick={handleSubmit}
        >
          Start Saving
        </Button>
      </div>
    </div>
  );
}
