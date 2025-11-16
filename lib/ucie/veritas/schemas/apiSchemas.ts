import { z } from 'zod';

/**
 * Zod Validation Schemas for External APIs
 * 
 * This module provides runtime validation for all external API responses
 * used in the UCIE Veritas Protocol. Each schema ensures data integrity
 * and type safety before processing API responses.
 */

// ============================================================================
// CoinGecko API Response Schema
// ============================================================================

export const CoinGeckoMarketDataSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  market_data: z.object({
    current_price: z.object({
      usd: z.number().positive()
    }),
    market_cap: z.object({
      usd: z.number().positive()
    }),
    total_volume: z.object({
      usd: z.number().positive()
    }),
    price_change_percentage_24h: z.number(),
    circulating_supply: z.number().positive().optional(),
    total_supply: z.number().positive().optional()
  }),
  last_updated: z.string()
});

export type CoinGeckoMarketData = z.infer<typeof CoinGeckoMarketDataSchema>;

// ============================================================================
// CoinMarketCap API Response Schema
// ============================================================================

export const CoinMarketCapQuoteSchema = z.object({
  data: z.record(z.object({
    id: z.number(),
    symbol: z.string(),
    quote: z.object({
      USD: z.object({
        price: z.number().positive(),
        volume_24h: z.number().positive(),
        market_cap: z.number().positive(),
        percent_change_24h: z.number(),
        last_updated: z.string()
      })
    })
  }))
});

export type CoinMarketCapQuote = z.infer<typeof CoinMarketCapQuoteSchema>;

// ============================================================================
// Kraken API Response Schema
// ============================================================================

export const KrakenTickerSchema = z.object({
  result: z.record(z.object({
    c: z.tuple([z.string(), z.string()]), // [price, lot volume]
    v: z.tuple([z.string(), z.string()]), // [volume today, volume 24h]
    p: z.tuple([z.string(), z.string()]), // [vwap today, vwap 24h]
    t: z.tuple([z.number(), z.number()]), // [trades today, trades 24h]
    l: z.tuple([z.string(), z.string()]), // [low today, low 24h]
    h: z.tuple([z.string(), z.string()]), // [high today, high 24h]
    o: z.string() // opening price
  }))
});

export type KrakenTicker = z.infer<typeof KrakenTickerSchema>;

// ============================================================================
// LunarCrush API Response Schema
// ============================================================================

export const LunarCrushSentimentSchema = z.object({
  data: z.object({
    id: z.number(),
    symbol: z.string(),
    name: z.string(),
    galaxy_score: z.number().min(0).max(100),
    alt_rank: z.number().positive(),
    sentiment: z.number().min(-100).max(100),
    social_volume: z.number().nonnegative(),
    social_volume_24h_change: z.number(),
    sentiment_absolute: z.number().nonnegative(),
    sentiment_relative: z.number().min(-100).max(100),
    interactions_24h: z.number().nonnegative(),
    social_contributors: z.number().nonnegative(),
    social_dominance: z.number().min(0).max(100),
    market_cap: z.number().positive().optional(),
    volume_24h: z.number().positive().optional()
  })
});

export type LunarCrushSentiment = z.infer<typeof LunarCrushSentimentSchema>;

// ============================================================================
// Blockchain.com API Response Schema
// ============================================================================

export const BlockchainInfoSchema = z.object({
  hash_rate: z.number().positive(),
  difficulty: z.number().positive(),
  mempool_size: z.number().nonnegative(),
  n_tx: z.number().nonnegative(),
  market_price_usd: z.number().positive(),
  estimated_transaction_volume_usd: z.number().positive(),
  blocks_size: z.number().positive(),
  miners_revenue_usd: z.number().positive(),
  timestamp: z.number()
});

export type BlockchainInfo = z.infer<typeof BlockchainInfoSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates an API response against a Zod schema
 * 
 * @param schema - The Zod schema to validate against
 * @param data - The raw API response data
 * @param sourceName - Name of the API source (for error messages)
 * @returns Validation result with typed data or error message
 */
export function validateApiResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  sourceName: string
): { success: boolean; data?: T; error?: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => {
        const path = e.path.join('.');
        return `${path}: ${e.message}`;
      }).join(', ');
      
      return {
        success: false,
        error: `${sourceName} API response validation failed: ${errorMessages}`
      };
    }
    return {
      success: false,
      error: `${sourceName} API response validation failed: Unknown error`
    };
  }
}

/**
 * Fetches data from an API and validates the response
 * 
 * This wrapper function combines API fetching with Zod validation,
 * ensuring that all API responses are type-safe and validated before use.
 * 
 * @param fetcher - Async function that fetches the raw API data
 * @param schema - Zod schema to validate the response
 * @param sourceName - Name of the API source (for error messages)
 * @returns Validation result with typed data or error message
 * 
 * @example
 * ```typescript
 * const result = await fetchWithValidation(
 *   () => fetch('https://api.coingecko.com/...').then(r => r.json()),
 *   CoinGeckoMarketDataSchema,
 *   'CoinGecko'
 * );
 * 
 * if (result.success) {
 *   console.log('Price:', result.data.current_price);
 * } else {
 *   console.error('Validation error:', result.error);
 * }
 * ```
 */
export async function fetchWithValidation<T>(
  fetcher: () => Promise<unknown>,
  schema: z.ZodSchema<T>,
  sourceName: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const rawData = await fetcher();
    return validateApiResponse(schema, rawData, sourceName);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `${sourceName} API fetch failed: ${errorMessage}`
    };
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
