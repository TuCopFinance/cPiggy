'use client';

import { useCUSDUSDRate } from '@/hooks/useCUSDUSDRate';
import { useCOPUSDRate } from '@/hooks/useCOPUSDRate';
import { useEURUSDRate } from '@/hooks/useEURUSDRate';
import { useGBPUSDRate } from '@/hooks/useGBPUSDRate';

export function OracleDebug() {
  const cusd = useCUSDUSDRate();
  const cop = useCOPUSDRate();
  const eur = useEURUSDRate();
  const gbp = useGBPUSDRate();

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-red-500 p-4 rounded-lg shadow-lg max-w-md text-xs z-50">
      <h3 className="font-bold text-red-600 mb-2">Oracle Debug Info</h3>

      <div className="space-y-2">
        <div className="border-b pb-1">
          <strong>cUSD/USD (Celo):</strong>
          <div>Rate: {cusd.rate !== null ? cusd.rate : 'NULL'}</div>
          <div>Loading: {cusd.isLoading ? 'YES' : 'NO'}</div>
          <div>Error: {(cusd as any).error ? 'YES' : 'NO'}</div>
        </div>

        <div className="border-b pb-1">
          <strong>COP/USD (Celo):</strong>
          <div>Rate: {cop.rate !== null ? cop.rate : 'NULL'}</div>
          <div>Loading: {cop.isLoading ? 'YES' : 'NO'}</div>
        </div>

        <div className="border-b pb-1">
          <strong>EUR/USD (Base):</strong>
          <div>Rate: {eur.rate !== null ? eur.rate : 'NULL'}</div>
          <div>Loading: {eur.isLoading ? 'YES' : 'NO'}</div>
        </div>

        <div className="border-b pb-1">
          <strong>GBP/USD (Base):</strong>
          <div>Rate: {gbp.rate !== null ? gbp.rate : 'NULL'}</div>
          <div>Loading: {gbp.isLoading ? 'YES' : 'NO'}</div>
        </div>
      </div>
    </div>
  );
}
