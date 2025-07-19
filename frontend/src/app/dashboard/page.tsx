// app/dashboard/page.tsx

"use client";

import { useState } from "react";

export default function DashboardPage() {
  // Mocked Piggy state (replace with actual contract data later)
  const [piggy, setPiggy] = useState({
    name: "Travel Fund Piggy",
    deposit: 100,
    duration: 60,
    daysRemaining: 22,
    safeMode: true,
    allocation: {
      cUSD: 50,
      cREAL: 50,
    },
    fxBonusEstimate: 4.5, // %
    matured: false,
  });

  return (
    <main className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <h1 className="text-3xl font-bold text-pink-700">My Piggy</h1>

      <div className="bg-white shadow rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">{piggy.name}</h2>

        <p><strong>Deposit:</strong> {piggy.deposit} cCOP</p>
        <p><strong>Lock Duration:</strong> {piggy.duration} days</p>
        <p><strong>Time Left:</strong> {piggy.daysRemaining} days</p>
        <p><strong>Safe Mode:</strong> {piggy.safeMode ? "On (reduced FX exposure)" : "Off"}</p>

        <div>
          <h3 className="font-medium mt-4">FX Allocation</h3>
          <ul className="list-disc ml-6">
            <li>cUSD: {piggy.allocation.cUSD}%</li>
            <li>cREAL: {piggy.allocation.cREAL}%</li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium mt-4">📈 Estimated FX Bonus</h3>
          <p className="text-green-600 font-semibold">{piggy.fxBonusEstimate}%</p>
        </div>

        <div className="pt-4">
          {piggy.matured ? (
            <button className="bg-pink-700 text-white px-4 py-2 rounded hover:bg-pink-800 transition">
              Claim Now
            </button>
          ) : (
            <button
              className="bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed"
              disabled
            >
              Not Ready to Claim
            </button>
          )}
        </div>
      </div>

      {/* Visual Piggy Placeholder */}
      <div className="text-center pt-6">
        <div className="w-32 h-32 bg-pink-200 rounded-full mx-auto shadow-inner">
          🐷
        </div>
        <p className="pt-2 text-gray-500">Your piggy is growing!</p>
      </div>
    </main>
  );
}
