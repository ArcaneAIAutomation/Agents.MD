/**
 * LunarCrush Trading Signals API
 * GET /api/lunarcrush/signals/[symbol]
 * 
 * Returns sentiment-based trading signals
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getBitcoinOverview } from "../../../../lib/lunarcrush/bitcoin";
import { generateTradingSignal, getSentimentLabel, getSentimentColor } from "../../../../lib/lunarcrush/signals";
import type { TradingSignal, SentimentData } from "../../../../lib/lunarcrush/types";

// Cache for 5 minutes
const CACHE_TTL = 300000;
const cache = new Map<string, { data: TradingSignal; timestamp: number }>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TradingSignal | { error: string }>
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
    const cacheKey = `signals:${symbol.toUpperCase()}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Cache hit for ${cacheKey}`);
      return res.status(200).json(cached.data);
    }

    // Fetch fresh data
    console.log(`🔄 Generating trading signal for ${symbol}...`);
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

    const signal = generateTradingSignal(sentimentData, overview.change_24h);

    // Cache the result
    cache.set(cacheKey, {
      data: signal,
      timestamp: Date.now(),
    });

    return res.status(200).json(signal);
  } catch (error) {
    console.error("LunarCrush signals API error:", error);
    
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate trading signal",
    });
  }
}
