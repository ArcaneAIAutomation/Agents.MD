/**
 * LunarCrush API Type Definitions
 */

export interface BitcoinOverview {
  price: number;
  volume_24h: number;
  market_cap: number;
  galaxy_score: number;
  alt_rank: number;
  sentiment: number;
  social_dominance: number;
  interactions_24h: number;
  change_24h: number;
  change_7d: number;
  change_30d: number;
  volatility: number;
  market_cap_rank: number;
  timestamp: string;
}

export interface SocialPost {
  id: string;
  post_type: "tweet" | "youtube-video" | "reddit-post" | "tiktok-video" | "news";
  post_title: string;
  post_created: number;
  post_sentiment: number; // 1-5 scale
  post_link: string;
  post_image: string | null;
  interactions_total: number;
  creator_id: string;
  creator_name: string;
  creator_display_name: string;
  creator_followers: string;
  creator_avatar: string;
}

export interface SocialPostsResponse {
  posts: SocialPost[];
  totalPosts: number;
  averageSentiment: number;
  totalInteractions: number;
  postTypeDistribution: Record<string, number>;
  topCreators: Array<{
    name: string;
    displayName: string;
    followers: string;
    posts: number;
    totalInteractions: number;
  }>;
}

export interface TradingSignal {
  type: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  sentiment: number;
  priceChange24h: number;
  galaxyScore: number;
  timestamp: number;
  indicators: {
    sentimentDivergence: boolean;
    galaxyScoreBreakout: boolean;
    socialVolumeSpike: boolean;
  };
}

export interface ViralContent {
  posts: SocialPost[];
  threshold: number;
  totalViral: number;
  timestamp: number;
}

export interface SentimentData {
  galaxyScore: number;
  sentiment: number;
  socialDominance: number;
  altRank: number;
  interactions24h: number;
  timestamp: number;
  label: string;
  color: string;
}
