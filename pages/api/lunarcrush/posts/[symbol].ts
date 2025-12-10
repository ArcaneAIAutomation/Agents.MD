/**
 * LunarCrush Social Posts API
 * GET /api/lunarcrush/posts/[symbol]
 * 
 * Returns social media posts for a cryptocurrency
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getBitcoinPosts } from "../../../../lib/lunarcrush/bitcoin";
import type { SocialPostsResponse } from "../../../../lib/lunarcrush/types";

// Cache for 5 minutes
const CACHE_TTL = 300000;
const cache = new Map<string, { data: SocialPostsResponse; timestamp: number }>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SocialPostsResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { symbol, limit, filter } = req.query;

  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({ error: "Symbol parameter required" });
  }

  // Only support BTC for now
  if (symbol.toUpperCase() !== "BTC") {
    return res.status(400).json({ error: "Only BTC is supported currently" });
  }

  const postLimit = limit ? parseInt(limit as string) : 50;
  const postFilter = filter as string | undefined;

  try {
    // Check cache
    const cacheKey = `posts:${symbol.toUpperCase()}:${postLimit}:${postFilter || "all"}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Cache hit for ${cacheKey}`);
      return res.status(200).json(cached.data);
    }

    // Fetch fresh data
    console.log(`🔄 Fetching fresh posts for ${symbol}...`);
    const postsData = await getBitcoinPosts(postLimit);

    // Apply filter if specified
    if (postFilter && postFilter !== "all") {
      postsData.posts = postsData.posts.filter(
        post => post.post_type === postFilter
      );
      postsData.totalPosts = postsData.posts.length;
    }

    // Cache the result
    cache.set(cacheKey, {
      data: postsData,
      timestamp: Date.now(),
    });

    return res.status(200).json(postsData);
  } catch (error) {
    console.error("LunarCrush posts API error:", error);
    
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch posts",
    });
  }
}
