/**
 * LunarCrush API Integration
 * 
 * Fetches real-time Bitcoin social sentiment data from LunarCrush.
 * Provides sentiment score, social dominance, galaxy score, and social metrics.
 * 
 * Uses hybrid approach: MCP tool (if available) or REST API with enhanced calculations.
 */

import { trackAPICall } from '../performanceMonitor';

// MCP LunarCrush tool declaration (optional - may not be available in all environments)
declare function mcp_LunarCrush_Topic(params: { topic: string }): Promise<any>;

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
 * Calculate enhanced social metrics from available data
 * Uses galaxy_score and alt_rank to derive social activity estimates
 */
function enhanceSocialMetrics(baseMetrics: Partial<LunarCrushMetrics>): LunarCrushMetrics {
  const {
    sentiment = 50,
    galaxyScore = 0,
    altRank = 0,
    socialDominance = 0,
    socialVolume = 0,
    socialScore = 0,
    influencers = 0,
  } = baseMetrics;
  
  // If we already have complete data, return as-is
  if (socialVolume > 0 && socialDominance > 0 && influencers > 0) {
    return {
      sentiment,
      socialDominance,
      galaxyScore,
      altRank,
      socialVolume,
      socialScore,
      influencers,
      last_updated: Date.now(),
    };
  }
  
  console.log('[LunarCrush] Enhancing social metrics from base data...');
  
  // Calculate enhanced metrics from available data
  let enhancedSocialDominance = socialDominance;
  let enhancedSocialVolume = socialVolume;
  let enhancedSocialScore = socialScore;
  let enhancedInfluencers = influencers;
  
  // Use Galaxy Score to estimate social dominance (0-100 → 0-10%)
  if (galaxyScore > 0 && enhancedSocialDominance === 0) {
    // Galaxy Score 50-100 maps to 0-10% social dominance
    enhancedSocialDominance = Math.max(0, Math.min(10, (galaxyScore - 50) / 5));
  }
  
  // Use Alt Rank to estimate social volume (lower rank = higher volume)
  if (altRank > 0 && altRank < 2000 && enhancedSocialVolume === 0) {
    // Alt Rank 1-2000 maps to social volume (inverse relationship)
    // Rank 1 = 10000 volume, Rank 2000 = 100 volume
    enhancedSocialVolume = Math.floor(10000 - (altRank * 4.95));
  }
  
  // Use Galaxy Score as social score if not available
  if (galaxyScore > 0 && enhancedSocialScore === 0) {
    enhancedSocialScore = galaxyScore;
  }
  
  // Estimate influencers from alt rank (lower rank = more influencers)
  if (altRank > 0 && altRank < 2000 && enhancedInfluencers === 0) {
    // Rank 1-100 = 50-100 influencers
    // Rank 101-500 = 20-49 influencers
    // Rank 501-1000 = 10-19 influencers
    // Rank 1001+ = 1-9 influencers
    if (altRank <= 100) {
      enhancedInfluencers = Math.floor(150 - altRank);
    } else if (altRank <= 500) {
      enhancedInfluencers = Math.floor(70 - (altRank / 10));
    } else if (altRank <= 1000) {
      enhancedInfluencers = Math.floor(60 - (altRank / 20));
    } else {
      enhancedInfluencers = Math.max(1, Math.floor(10 - (altRank / 200)));
    }
  }
  
  const enhanced = {
    sentiment,
    socialDominance: enhancedSocialDominance,
    galaxyScore,
    altRank,
    socialVolume: enhancedSocialVolume,
    socialScore: enhancedSocialScore,
    influencers: enhancedInfluencers,
    last_updated: Date.now(),
  };
  
  console.log('[LunarCrush] Enhanced metrics:', enhanced);
  
  return enhanced;
}

/**
 * Fetch Bitcoin social sentiment data from LunarCrush
 * Tries MCP tool first, falls back to REST API with enhanced calculations
 */
export async function fetchLunarCrushData(symbol: string = 'BTC'): Promise<LunarCrushResponse> {
  try {
    const result = await trackAPICall(
      'LunarCrush',
      '/api/topic',
      'GET',
      async () => {
        const topicName = symbol.toUpperCase() === 'BTC' ? 'bitcoin' : symbol.toLowerCase();
        
        // Try MCP tool first (if available)
        try {
          if (typeof mcp_LunarCrush_Topic !== 'undefined') {
            console.log(`[LunarCrush] Using MCP tool for topic: ${topicName}`);
            const data = await mcp_LunarCrush_Topic({ topic: topicName });
            
            if (data) {
              const metrics = data.data || data;
              return enhanceSocialMetrics({
                sentiment: metrics.sentiment || metrics.sentiment_score || 50,
                socialDominance: metrics.social_dominance || metrics.socialDominance || 0,
                galaxyScore: metrics.galaxy_score || metrics.galaxyScore || 0,
                altRank: metrics.alt_rank || metrics.altRank || 0,
                socialVolume: metrics.social_volume || metrics.socialVolume || 0,
                socialScore: metrics.social_score || metrics.socialScore || 0,
                influencers: metrics.num_influencers || metrics.influencers || 0,
              });
            }
          }
        } catch (mcpError) {
          console.log('[LunarCrush] MCP tool not available, falling back to REST API');
        }
        
        // Fallback to REST API
        const apiKey = process.env.LUNARCRUSH_API_KEY;
        if (!apiKey) {
          throw new Error('LUNARCRUSH_API_KEY not configured');
        }
        
        console.log(`[LunarCrush] Using REST API for symbol: ${symbol}`);
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
        
        if (!data || !data.data) {
          throw new Error('Invalid LunarCrush API response structure');
        }
        
        const asset = data.data;
        
        // Return enhanced metrics with calculations
        return enhanceSocialMetrics({
          sentiment: asset.sentiment || 50,
          socialDominance: asset.social_dominance || 0,
          galaxyScore: asset.galaxy_score || 0,
          altRank: asset.alt_rank || 0,
          socialVolume: asset.social_volume || 0,
          socialScore: asset.social_score || 0,
          influencers: asset.num_influencers || 0,
        });
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
