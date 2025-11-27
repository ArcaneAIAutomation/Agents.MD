/**
 * Bitcoin-Only Validator for UCIE
 * 
 * Ensures UCIE only processes Bitcoin (BTC) to avoid wasting API calls
 * on other cryptocurrencies.
 * 
 * ETH and other coins can be added later when needed.
 */

export const ALLOWED_SYMBOLS = ['BTC', 'BITCOIN'];

/**
 * Validate that symbol is Bitcoin only
 */
export function validateBitcoinOnly(symbol: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  if (!symbol || typeof symbol !== 'string') {
    return {
      valid: false,
      error: 'Symbol is required'
    };
  }

  const normalized = symbol.toUpperCase().trim();

  // Check if it's Bitcoin
  if (ALLOWED_SYMBOLS.includes(normalized)) {
    return {
      valid: true,
      normalized: 'BTC' // Always normalize to BTC
    };
  }

  // Reject all other symbols
  return {
    valid: false,
    error: `UCIE currently only supports Bitcoin (BTC). Symbol "${symbol}" is not supported. ETH and other cryptocurrencies will be added in future updates.`
  };
}

/**
 * Check if symbol is Bitcoin
 */
export function isBitcoin(symbol: string): boolean {
  const normalized = symbol.toUpperCase().trim();
  return ALLOWED_SYMBOLS.includes(normalized);
}
