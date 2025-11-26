/**
 * CoinGecko API Integration
 * 
 * Fetches real-time Bitcoin market data from CoinGecko API.
 * Provides price, market cap, volume, and 24h changes.
 */

import { trackAPICall } from '../performanceMonitor';

export interface CoinGeckoQuote {
  price: number;
  market_cap: number;
  volume_24h: number;
  percent_change_24h: number;
  last_updated: number;
}

export interface CoinGeckoResponse {
  success: boolean;
  data: CoinGeckoQuote | null;
  error?: string;
  source: 'CoinGecko';
}

/**
 * Fetch Bitcoin data from CoinGecko API
 */
export async function fetchCoinGeckoData(coinId: string = 'bitcoin'): Promise<CoinGeckoResponse> {
  try {
    const result = await trackAPICall(
      'CoinGecko',
      '/api/v3/simple/price',
      'GET',
      async () => {
        const apiKey = process.env.COINGECKO_API_KEY;
        
        // CoinGecko API key is optional (free tier works without it)
        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };
        
        if (apiKey) {
          headers['x-cg-demo-api-key'] = apiKey;
        }
        
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });
        
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!data[coinId]) {
          throw new Error('Invalid CoinGecko API response structure');
        }
        
        const coinData = data[coinId];
        
        return {
          price: coinData.usd,
          market_cap: coinData.usd_market_cap,
          volume_24h: coinData.usd_24h_vol,
          percent_change_24h: coinData.usd_24h_change,
          last_updated: coinData.last_updated_at,
        };
      }
    );
    
    return {
      success: true,
      data: result,
      source: 'CoinGecko',
    };
  } catch (error) {
    console.error('[CoinGecko] Error fetching data:', error);
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'CoinGecko',
    };
  }
}
