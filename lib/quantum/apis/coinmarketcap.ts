/**
 * CoinMarketCap API Integration
 * 
 * Fetches real-time Bitcoin market data from CoinMarketCap Pro API.
 * Includes price, volume, market cap, and percentage changes.
 */

import { trackAPICall } from '../performanceMonitor';

export interface CMCQuote {
  price: number;
  volume_24h: number;
  volume_change_24h: number;
  market_cap: number;
  market_cap_dominance: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  percent_change_30d: number;
  last_updated: string;
}

export interface CMCResponse {
  success: boolean;
  data: CMCQuote | null;
  error?: string;
  source: 'CoinMarketCap';
}

/**
 * Fetch Bitcoin data from CoinMarketCap Pro API
 */
export async function fetchCMCData(symbol: string = 'BTC'): Promise<CMCResponse> {
  try {
    const result = await trackAPICall(
      'CoinMarketCap',
      '/v1/cryptocurrency/quotes/latest',
      'GET',
      async () => {
        const apiKey = process.env.COINMARKETCAP_API_KEY;
        
        if (!apiKey) {
          throw new Error('COINMARKETCAP_API_KEY not configured');
        }
        
        const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=USD`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-CMC_PRO_API_KEY': apiKey,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`CMC API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!data.data || !data.data[symbol]) {
          throw new Error('Invalid CMC API response structure');
        }
        
        const quote = data.data[symbol].quote.USD;
        
        return {
          price: quote.price,
          volume_24h: quote.volume_24h,
          volume_change_24h: quote.volume_change_24h,
          market_cap: quote.market_cap,
          market_cap_dominance: quote.market_cap_dominance,
          percent_change_1h: quote.percent_change_1h,
          percent_change_24h: quote.percent_change_24h,
          percent_change_7d: quote.percent_change_7d,
          percent_change_30d: quote.percent_change_30d,
          last_updated: quote.last_updated,
        };
      }
    );
    
    return {
      success: true,
      data: result,
      source: 'CoinMarketCap',
    };
  } catch (error) {
    console.error('[CMC] Error fetching data:', error);
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'CoinMarketCap',
    };
  }
}
