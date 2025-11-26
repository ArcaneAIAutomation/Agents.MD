/**
 * LunarCrush API Integration
 * 
 * Fetches real-time Bitcoin social sentiment data from LunarCrush.
 * Provides sentiment score, social dominance, galaxy score, and social metrics.
 */

import { trackAPICall } from '../performanceMonitor';

export interface LunarCrushMetrics {
  sentiment: number; // Sentiment score (0-100)
  socialDominance: number; // Social dominance percentage
  galaxyScore: number; // Galaxy score (0-100)
  altRank: number; // AltRank position
  socialVolume: number; // Total social mentions
  socialScore: number; // Social score (0-100)
  influencers: number; // Number of influencers mentioning
  last_updated: number;
}

export interface LunarCrushResponse {
  success: boolean;
  data: LunarCrushMetrics | null;
  error?: string;
  source: 'LunarCrush';
}

/**
 * Fetch Bitcoin social sentiment data from LunarCrush API
 */
export async function fetchLunarCrushData(symbol: string = 'BTC'): Promise<LunarCrushResponse> {
  try {
    const result = await trackAPICall(
      'LunarCrush',
      '/v2/assets',
      'GET',
      async () => {
        const apiKey = process.env.LUNARCRUSH_API_KEY;
        
        if (!apiKey) {
          throw new Error('LUNARCRUSH_API_KEY not configured');
        }
        
        // Use LunarCrush v4 API endpoint (correct endpoint)
        const url = `https://lunarcrush.com/api4/public/coins/${symbol}/v1`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`LunarCrush API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate response structure (v4 API format)
        if (!data || !data.data) {
          throw new Error('Invalid LunarCrush API response structure');
        }
        
        const asset = data.data;
        
        return {
          sentiment: asset.sentiment || 50,
          socialDominance: asset.social_dominance || 0,
          galaxyScore: asset.galaxy_score || 0,
          altRank: asset.alt_rank || 0,
          socialVolume: asset.social_volume || 0,
          socialScore: asset.social_score || 0,
          influencers: asset.num_influencers || 0,
          last_updated: Date.now(),
        };
      }
    );
    
    return {
      success: true,
      data: result,
      source: 'LunarCrush',
    };
  } catch (error) {
    console.error('[LunarCrush] Error fetching data:', error);
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'LunarCrush',
    };
  }
}
