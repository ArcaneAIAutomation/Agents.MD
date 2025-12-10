/**
 * LunarCrush Sentiment API
 * GET /api/lunarcrush/sentiment/[symbol]
 * 
 * Returns real-time social sentiment data for a cryptocurrency
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getBitcoinOverview } from "../../../../lib/lunarcrush/bitcoin";
import { getSentimentLabel, getSentimentColor } from "../../../../lib/lunarcrush/signals";
import type { SentimentData } from "../../../../lib/lunarcrush/types";

// Cache for 5 minutes
const CACHE_TTL = 300000;
const cache = new Map<string, { data: SentimentData; timestamp: number }>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SentimentData | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({ error: "Symbol parameter required" });
  }

  // Only support BTC for now
  if (symbol.toUpperCase() !== "BTC") {
    return res.status(400).json({ error: "Only BTC is supported currently" });
  }

  try {
    // Check cache
    const cacheKey = `sentiment:${symbol.toUpperCase()}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Cache hit for ${cacheKey}`);
      return res.status(200).json(cached.data);
    }

    // Fetch fresh data
    console.log(`🔄 Fetching fresh sentiment data for ${symbol}...`);
    const overview = await getBitcoinOverview();

    const sentimentData: SentimentData = {
      galaxyScore: overview.galaxy_score,
      sentiment: overview.sentiment,
      socialDominance: overview.social_dominance,
      altRank: overview.alt_rank,
      interactions24h: overview.interactions_24h,
      timestamp: Date.now(),
      label: getSentimentLabel(overview.sentiment),
      color: getSentimentColor(overview.sentiment),
    };

    // Cache the result
    cache.set(cacheKey, {
      data: sentimentData,
      timestamp: Date.now(),
    });

    return res.status(200).json(sentimentData);
  } catch (error) {
    console.error("LunarCrush sentiment API error:", error);
    
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch sentiment data",
    });
  }
}
