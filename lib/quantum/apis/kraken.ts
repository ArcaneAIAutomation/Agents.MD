/**
 * Kraken API Integration
 * 
 * Fetches real-time Bitcoin trading data from Kraken exchange.
 * Provides live price, volume, high/low, and order book data.
 */

import { trackAPICall } from '../performanceMonitor';

export interface KrakenQuote {
  price: number;
  volume_24h: number;
  high_24h: number;
  low_24h: number;
  vwap_24h: number; // Volume-weighted average price
  trades_24h: number;
  last_updated: number;
}

export interface KrakenResponse {
  success: boolean;
  data: KrakenQuote | null;
  error?: string;
  source: 'Kraken';
}

/**
 * Fetch Bitcoin data from Kraken public API
 */
export async function fetchKrakenData(pair: string = 'XBTUSD'): Promise<KrakenResponse> {
  try {
    const result = await trackAPICall(
      'Kraken',
      '/0/public/Ticker',
      'GET',
      async () => {
        const url = `https://api.kraken.com/0/public/Ticker?pair=${pair}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Kraken API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (data.error && data.error.length > 0) {
          throw new Error(`Kraken API error: ${data.error.join(', ')}`);
        }
        
        if (!data.result) {
          throw new Error('Invalid Kraken API response structure: missing result');
        }
        
        // Kraken always returns XXBTZUSD as the key, regardless of input pair format
        // Try multiple possible keys
        const possibleKeys = ['XXBTZUSD', pair, 'XBTUSD', 'BTCUSD'];
        let ticker = null;
        let foundKey = null;
        
        for (const key of possibleKeys) {
          if (data.result[key]) {
            ticker = data.result[key];
            foundKey = key;
            break;
          }
        }
        
        if (!ticker) {
          const availableKeys = Object.keys(data.result);
          throw new Error(`Invalid Kraken API response structure: expected one of [${possibleKeys.join(', ')}], got [${availableKeys.join(', ')}]`);
        }
        
        return {
          price: parseFloat(ticker.c[0]), // Last trade closed price
          volume_24h: parseFloat(ticker.v[1]), // Volume last 24 hours
          high_24h: parseFloat(ticker.h[1]), // High last 24 hours
          low_24h: parseFloat(ticker.l[1]), // Low last 24 hours
          vwap_24h: parseFloat(ticker.p[1]), // Volume weighted average price last 24 hours
          trades_24h: parseInt(ticker.t[1]), // Number of trades last 24 hours
          last_updated: Date.now(),
        };
      }
    );
    
    return {
      success: true,
      data: result,
      source: 'Kraken',
    };
  } catch (error) {
    console.error('[Kraken] Error fetching data:', error);
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'Kraken',
    };
  }
}
