/**
 * LunarCrush Bitcoin-specific functions
 */

import { lcGet, rateLimiter } from "./client";
import type { BitcoinOverview, SocialPost, SocialPostsResponse } from "./types";

/**
 * Get Bitcoin market + social overview
 */
export async function getBitcoinOverview(): Promise<BitcoinOverview> {
  await rateLimiter.checkLimit();

  const response = await lcGet<any>("/api4/public/coins/list/v1", {
    symbol: "BTC",
    limit: 1,
  });

  const coin = Array.isArray(response.data) ? response.data[0] : response.data;

  if (!coin) {
    throw new Error("No Bitcoin data returned from LunarCrush");
  }

  return {
    price: coin.price || 0,
    volume_24h: coin.volume_24h || 0,
    market_cap: coin.market_cap || 0,
    galaxy_score: coin.galaxy_score || 0,
    alt_rank: coin.alt_rank || 0,
    sentiment: coin.sentiment || 0,
    social_dominance: coin.social_dominance || 0,
    interactions_24h: coin.interactions_24h || 0,
    change_24h: coin.percent_change_24h || 0,
    change_7d: coin.percent_change_7d || 0,
    change_30d: coin.percent_change_30d || 0,
    volatility: coin.volatility || 0,
    market_cap_rank: coin.market_cap_rank || 1,
    timestamp: coin.time || new Date().toISOString(),
  };
}

/**
 * Get Bitcoin social media posts
 */
export async function getBitcoinPosts(
  limit: number = 50,
  start?: number,
  end?: number
): Promise<SocialPostsResponse> {
  await rateLimiter.checkLimit();

  const params: Record<string, any> = {};
  if (start) params.start = start;
  if (end) params.end = end;
  if (limit) params.limit = limit;

  const response = await lcGet<any>("/api4/public/topic/bitcoin/posts/v1", params);

  const posts: SocialPost[] = (response.data || []).map((post: any) => ({
    id: post.id,
    post_type: post.post_type,
    post_title: post.post_title,
    post_created: post.post_created,
    post_sentiment: post.post_sentiment,
    post_link: post.post_link,
    post_image: post.post_image,
    interactions_total: post.interactions_total,
    creator_id: post.creator_id,
    creator_name: post.creator_name,
    creator_display_name: post.creator_display_name,
    creator_followers: post.creator_followers,
    creator_avatar: post.creator_avatar,
  }));

  // Calculate statistics
  const totalInteractions = posts.reduce((sum, p) => sum + p.interactions_total, 0);
  const averageSentiment = posts.length > 0
    ? posts.reduce((sum, p) => sum + p.post_sentiment, 0) / posts.length
    : 0;

  // Post type distribution
  const postTypeDistribution: Record<string, number> = {};
  posts.forEach(post => {
    postTypeDistribution[post.post_type] = (postTypeDistribution[post.post_type] || 0) + 1;
  });

  // Top creators
  const creatorMap = new Map<string, {
    name: string;
    displayName: string;
    followers: string;
    posts: number;
    totalInteractions: number;
  }>();

  posts.forEach(post => {
    const existing = creatorMap.get(post.creator_id);
    if (existing) {
      existing.posts++;
      existing.totalInteractions += post.interactions_total;
    } else {
      creatorMap.set(post.creator_id, {
        name: post.creator_name,
        displayName: post.creator_display_name,
        followers: post.creator_followers,
        posts: 1,
        totalInteractions: post.interactions_total,
      });
    }
  });

  const topCreators = Array.from(creatorMap.values())
    .sort((a, b) => b.totalInteractions - a.totalInteractions)
    .slice(0, 5);

  return {
    posts,
    totalPosts: posts.length,
    averageSentiment,
    totalInteractions,
    postTypeDistribution,
    topCreators,
  };
}

/**
 * Get viral Bitcoin content (posts with >threshold interactions)
 */
export async function getViralBitcoinContent(
  threshold: number = 10000000
): Promise<SocialPost[]> {
  const { posts } = await getBitcoinPosts(100);
  
  return posts
    .filter(post => post.interactions_total >= threshold)
    .sort((a, b) => b.interactions_total - a.interactions_total)
    .slice(0, 10);
}

/**
 * Get Bitcoin detailed metrics
 */
export async function getBitcoinDetails(): Promise<any> {
  await rateLimiter.checkLimit();

  const response = await lcGet<any>("/api4/public/coins/BTC/v1");
  
  return response.data || response;
}
