import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
}

interface UpdateResponse {
  success: boolean;
  updated: number;
  failed: number;
  timestamp: string;
  message?: string;
}

/**
 * Fetch tokens from CoinGecko
 */
async function fetchTokensFromCoinGecko(limit: number = 250): Promise<CoinGeckoToken[]> {
  const apiKey = process.env.COINGECKO_API_KEY;
  const baseUrl = 'https://api.coingecko.com/api/v3';
  
  const perPage = Math.min(limit, 250);
  
  const url = apiKey
    ? `${baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false&x_cg_pro_api_key=${apiKey}`
    : `${baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Update tokens in database
 */
async function updateTokens(tokens: CoinGeckoToken[]): Promise<{ updated: number; failed: number }> {
  let updated = 0;
  let failed = 0;

  for (const token of tokens) {
    try {
      await query(`
        INSERT INTO ucie_tokens (
          coingecko_id,
          symbol,
          name,
          market_cap_rank,
          image_url,
          current_price_usd,
          market_cap_usd,
          total_volume_usd,
          price_change_24h,
          is_active,
          last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (coingecko_id) 
        DO UPDATE SET
          symbol = EXCLUDED.symbol,
          name = EXCLUDED.name,
          market_cap_rank = EXCLUDED.market_cap_rank,
          image_url = EXCLUDED.image_url,
          current_price_usd = EXCLUDED.current_price_usd,
          market_cap_usd = EXCLUDED.market_cap_usd,
          total_volume_usd = EXCLUDED.total_volume_usd,
          price_change_24h = EXCLUDED.price_change_24h,
          last_updated = NOW()
      `, [
        token.id,
        token.symbol.toUpperCase(),
        token.name,
        token.market_cap_rank,
        token.image,
        token.current_price,
        token.market_cap,
        token.total_volume,
        token.price_change_percentage_24h,
        true
      ]);

      updated++;
    } catch (error) {
      console.error(`Failed to update ${token.symbol}:`, error);
      failed++;
    }
  }

  return { updated, failed };
}

/**
 * Cron job handler for updating token list
 * 
 * This endpoint should be called daily by Vercel Cron or similar service.
 * 
 * Security: Requires CRON_SECRET header to prevent unauthorized access
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      updated: 0,
      failed: 0,
      timestamp: new Date().toISOString(),
      message: 'Method not allowed'
    });
  }

  // Verify cron secret
  const cronSecret = req.headers['authorization'];
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized token update attempt');
    return res.status(401).json({
      success: false,
      updated: 0,
      failed: 0,
      timestamp: new Date().toISOString(),
      message: 'Unauthorized'
    });
  }

  try {
    console.log('Starting token update cron job...');

    // Fetch latest tokens from CoinGecko
    const tokens = await fetchTokensFromCoinGecko(250);
    console.log(`Fetched ${tokens.length} tokens from CoinGecko`);

    // Update database
    const { updated, failed } = await updateTokens(tokens);
    console.log(`Updated ${updated} tokens, ${failed} failed`);

    return res.status(200).json({
      success: true,
      updated,
      failed,
      timestamp: new Date().toISOString(),
      message: `Successfully updated ${updated} tokens`
    });

  } catch (error) {
    console.error('Token update cron job failed:', error);
    
    return res.status(500).json({
      success: false,
      updated: 0,
      failed: 0,
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
