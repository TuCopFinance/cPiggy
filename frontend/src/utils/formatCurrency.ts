/**
 * Token Display Formatting Utilities
 *
 * IMPORTANT: These functions are for UI DISPLAY ONLY. All calculations MUST use
 * the raw BigInt values or full precision numbers to maintain accuracy.
 *
 * About Tokens:
 * - cCOP, cUSD, cEUR, cGBP are ERC20 tokens, not currencies
 * - They are digital representations of currencies on the blockchain
 * - We query token balances and display them with proper formatting
 * - We use oracles to find USD equivalents for informative display
 *
 * Display Standards (for ALL tokens):
 * - < 1: 4 decimals (e.g., 0,8523)
 * - < 1000: 2 decimals (e.g., 156,75)
 * - >= 1000: 0 decimals (e.g., 45.678)
 * - Uses ISO international format: . (dot) for thousands, , (comma) for decimals
 */

/**
 * Format token amounts for display
 * Applies to all tokens: cCOP, cUSD, cEUR, cGBP
 * @param amount - The token amount (full precision number for calculations)
 * @returns Formatted string for UI display only
 */
export function formatTokenAmount(amount: number): string {
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
 * @deprecated Use formatTokenAmount instead
 * Legacy name for backwards compatibility
 */
export function formatCOP(amount: number): string {
  return formatTokenAmount(amount);
}

/**
 * @deprecated Use formatTokenAmount instead
 * Legacy name for backwards compatibility
 */
export function formatForeignCurrency(amount: number): string {
  return formatTokenAmount(amount);
}

/**
 * Format token amount with symbol
 * @param amount - The token amount (full precision)
 * @param symbol - Token symbol (e.g., 'cCOP', 'cUSD', 'cEUR', 'cGBP')
 * @param showSymbol - Whether to show the symbol (default: true)
 * @returns Formatted string with optional symbol for UI display
 */
export function formatTokenWithSymbol(
  amount: number,
  symbol: string,
  showSymbol: boolean = true
): string {
  const formatted = formatTokenAmount(amount);
  return showSymbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * @deprecated Use formatTokenWithSymbol instead
 */
export function formatCOPWithSymbol(amount: number, showSymbol: boolean = true): string {
  return formatTokenWithSymbol(amount, 'cCOP', showSymbol);
}

/**
 * @deprecated Use formatTokenWithSymbol instead
 */
export function formatForeignCurrencyWithSymbol(
  amount: number,
  symbol: string,
  showSymbol: boolean = true
): string {
  return formatTokenWithSymbol(amount, symbol, showSymbol);
}

/**
 * Convert blockchain BigInt token balance to number for calculations
 *
 * IMPORTANT: Keep full precision for all calculations. Only use formatTokenAmount()
 * when displaying in the UI.
 *
 * WARNING: May lose precision for extremely large numbers (>2^53).
 * For critical blockchain operations, use BigInt arithmetic directly.
 *
 * @param amount - BigInt token balance from blockchain (e.g., from ERC20 balanceOf)
 * @param decimals - Token decimals (default: 18 for most ERC20 tokens including cCOP, cUSD, cEUR, cGBP)
 * @returns Number with full precision for calculations
 *
 * @example
 * // Reading token balance
 * const balance = 1500000000000000000n; // 1.5 tokens with 18 decimals
 * const numericBalance = bigIntToNumber(balance); // 1.5
 *
 * // For display
 * const displayValue = formatTokenAmount(numericBalance); // "1,50"
 */
export function bigIntToNumber(amount: bigint, decimals: number = 18): number {
  return Number(amount) / Math.pow(10, decimals);
}

/**
 * Convert number back to BigInt for blockchain transactions
 *
 * @param amount - Token amount as number (with full precision)
 * @param decimals - Token decimals (default: 18 for ERC20 tokens)
 * @returns BigInt value for blockchain operations
 *
 * @example
 * const userInput = 1.5; // User wants to transfer 1.5 tokens
 * const amountForContract = numberToBigInt(userInput); // 1500000000000000000n
 */
export function numberToBigInt(amount: number, decimals: number = 18): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}
