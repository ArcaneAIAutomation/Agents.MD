/**
 * LunarCrush Viral Content API
 * GET /api/lunarcrush/viral/[symbol]
 * 
 * Returns viral social media posts (>10M interactions)
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getViralBitcoinContent } from "../../../../lib/lunarcrush/bitcoin";
import type { ViralContent } from "../../../../lib/lunarcrush/types";

// Cache for 5 minutes
const CACHE_TTL = 300000;
const cache = new Map<string, { data: ViralContent; timestamp: number }>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ViralContent | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { symbol, threshold } = req.query;

  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({ error: "Symbol parameter required" });
  }

  // Only support BTC for now
  if (symbol.toUpperCase() !== "BTC") {
    return res.status(400).json({ error: "Only BTC is supported currently" });
  }

  const interactionThreshold = threshold ? parseInt(threshold as string) : 10000000;

  try {
    // Check cache
    const cacheKey = `viral:${symbol.toUpperCase()}:${interactionThreshold}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Cache hit for ${cacheKey}`);
      return res.status(200).json(cached.data);
    }

    // Fetch fresh data
    console.log(`🔄 Fetching viral content for ${symbol}...`);
    const viralPosts = await getViralBitcoinContent(interactionThreshold);

    const viralData: ViralContent = {
      posts: viralPosts,
      threshold: interactionThreshold,
      totalViral: viralPosts.length,
      timestamp: Date.now(),
    };

    // Cache the result
    cache.set(cacheKey, {
      data: viralData,
      timestamp: Date.now(),
    });

    return res.status(200).json(viralData);
  } catch (error) {
    console.error("LunarCrush viral API error:", error);
    
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch viral content",
    });
  }
}
