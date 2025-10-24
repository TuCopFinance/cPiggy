/**
 * Currency Formatting Utilities
 *
 * Standards:
 * - COP: <1 = 4 decimals, <1000 = 2 decimals, >=1000 = 0 decimals
 * - Foreign currencies (USD, EUR, GBP): <1 = 4 decimals, >=1 = 2 decimals
 * - Uses ISO international format: . for thousands, , for decimals
 */

/**
 * Format COP amounts based on value
 * @param amount - The amount in COP
 * @returns Formatted string
 */
export function formatCOP(amount: number): string {
  if (amount < 1) {
    return amount.toLocaleString('de-DE', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    });
  }
  if (amount < 1000) {
    return amount.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  return amount.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Format foreign currency amounts (USD, EUR, GBP)
 * <1 = 4 decimals, >=1 = 2 decimals
 * @param amount - The amount in foreign currency
 * @returns Formatted string
 */
export function formatForeignCurrency(amount: number): string {
  if (amount < 1) {
    return amount.toLocaleString('de-DE', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    });
  }
  return amount.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format COP with currency symbol
 * @param amount - The amount in COP
 * @param showSymbol - Whether to show the cCOP symbol (default: true)
 * @returns Formatted string with optional symbol
 */
export function formatCOPWithSymbol(amount: number, showSymbol: boolean = true): string {
  const formatted = formatCOP(amount);
  return showSymbol ? `${formatted} cCOP` : formatted;
}

/**
 * Format foreign currency with symbol
 * @param amount - The amount
 * @param symbol - Currency symbol (e.g., 'cUSD', 'cEUR', 'cGBP')
 * @param showSymbol - Whether to show the symbol (default: true)
 * @returns Formatted string with optional symbol
 */
export function formatForeignCurrencyWithSymbol(
  amount: number,
  symbol: string,
  showSymbol: boolean = true
): string {
  const formatted = formatForeignCurrency(amount);
  return showSymbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Convert bigint to number for formatting
 * @param amount - BigInt amount (typically from blockchain)
 * @param decimals - Number of decimals (default: 18 for most ERC20 tokens)
 * @returns Number value
 */
export function bigIntToNumber(amount: bigint, decimals: number = 18): number {
  return Number(amount) / Math.pow(10, decimals);
}
