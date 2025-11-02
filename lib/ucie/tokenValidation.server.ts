/**
 * Server-Side Token Validation Utilities
 * These functions can ONLY be used in API routes or server-side code
 * DO NOT import this file in client-side code
 */

import { query } from '../db';

interface TokenInfo {
  id: string;
  symbol: string;
  name: string;
  exists: boolean;
  exchanges?: string[];
  marketCapRank?: number;
  currentPrice?: number;
}

/**
 * Check if token exists in database (primary method)
 * SERVER-SIDE ONLY - Must be called from API routes
 */
export async function checkTokenInDatabase(symbol: string): Promise<TokenInfo | null> {
  try {
    const result = await query(
      `SELECT 
        coingecko_id as id,
        symbol,
        name,
        market_cap_rank,
        current_price_usd
      FROM ucie_tokens 
      WHERE UPPER(symbol) = UPPER($1) 
        AND is_active = TRUE
      LIMIT 1`,
      [symbol]
    );

    if (result.rows.length > 0) {
      const token = result.rows[0];
      return {
        id: token.id,
        symbol: token.symbol.toUpperCase(),
        name: token.name,
        exists: true,
        marketCapRank: token.market_cap_rank,
        currentPrice: token.current_price_usd ? parseFloat(token.current_price_usd) : undefined
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking token in database:', error);
    return null;
  }
}

/**
 * Get similar token suggestions from database
 * SERVER-SIDE ONLY - Must be called from API routes
 */
export async function getSimilarTokensFromDatabase(symbol: string): Promise<string[]> {
  try {
    const result = await query(
      `SELECT symbol 
      FROM ucie_tokens 
      WHERE UPPER(symbol) LIKE UPPER($1) 
        OR UPPER(name) LIKE UPPER($2)
        AND is_active = TRUE
      ORDER BY market_cap_rank ASC NULLS LAST
      LIMIT 5`,
      [`%${symbol}%`, `%${symbol}%`]
    );

    return result.rows.map(row => row.symbol.toUpperCase());
  } catch (error) {
    console.error('Error getting similar tokens from database:', error);
    return [];
  }
}
