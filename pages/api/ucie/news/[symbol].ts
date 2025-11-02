/**
 * UCIE News Aggregation API Endpoint
 * 
 * GET /api/ucie/news/[symbol]
 * 
 * Fetches news from multiple sources, runs AI impact assessment,
 * categorizes and sorts by relevance, and caches results.
 * 
 * Features:
 * - Multi-source news aggregation (NewsAPI, CryptoCompare)
 * - AI-powered impact assessment using GPT-4o
 * - News categorization and deduplication
 * - Breaking news identification
 * - 5-minute caching
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchAllNews } from '../../../../lib/ucie/newsFetching';
import { assessMultipleNews, generateNewsSummary, AssessedNewsArticle } from '../../../../lib/ucie/newsImpactAssessment';

interface NewsResponse {
  success: boolean;
  symbol: string;
  articles: AssessedNewsArticle[];
  summary: {
    overallSentiment: 'bullish' | 'bearish' | 'neutral';
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    averageImpact: number;
    majorNews: AssessedNewsArticle[];
  };
  dataQuality: number;
  timestamp: string;
  cached: boolean;
  error?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  symbol?: string;
}

// In-memory cache
const cache = new Map<string, { data: NewsResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NewsResponse | ErrorResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { symbol } = req.query;

  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid or missing symbol parameter'
    });
  }

  const symbolUpper = symbol.toUpperCase();

  // Validate symbol format (alphanumeric, max 10 chars)
  if (!/^[A-Z0-9]{1,10}$/.test(symbolUpper)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid symbol format',
      symbol: symbolUpper
    });
  }

  try {
    // Check cache first
    const cacheKey = `news-${symbolUpper}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[UCIE News] Cache hit for ${symbolUpper}`);
      return res.status(200).json({
        ...cached.data,
        cached: true
      });
    }

    console.log(`[UCIE News] Fetching news for ${symbolUpper}`);

    // Fetch news from all sources
    const articles = await fetchAllNews(symbolUpper);

    if (articles.length === 0) {
      const response: NewsResponse = {
        success: true,
        symbol: symbolUpper,
        articles: [],
        summary: {
          overallSentiment: 'neutral',
          bullishCount: 0,
          bearishCount: 0,
          neutralCount: 0,
          averageImpact: 50,
          majorNews: []
        },
        dataQuality: 0,
        timestamp: new Date().toISOString(),
        cached: false
      };

      return res.status(200).json(response);
    }

    // Assess impact of all articles
    console.log(`[UCIE News] Assessing impact for ${articles.length} articles`);
    const assessedArticles = await assessMultipleNews(articles, symbolUpper);

    // Generate summary
    const summary = generateNewsSummary(assessedArticles);

    // Calculate data quality score
    const dataQuality = calculateDataQuality(assessedArticles);

    const response: NewsResponse = {
      success: true,
      symbol: symbolUpper,
      articles: assessedArticles,
      summary,
      dataQuality,
      timestamp: new Date().toISOString(),
      cached: false
    };

    // Cache the response
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    cleanupCache();

    console.log(`[UCIE News] Successfully fetched and assessed ${assessedArticles.length} articles for ${symbolUpper}`);

    return res.status(200).json(response);
  } catch (error) {
    console.error('[UCIE News] Error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch news',
      symbol: symbolUpper
    });
  }
}

/**
 * Calculate data quality score based on:
 * - Number of articles
 * - Source diversity
 * - Assessment confidence
 * - Recency
 */
function calculateDataQuality(articles: AssessedNewsArticle[]): number {
  if (articles.length === 0) return 0;

  let score = 0;

  // Article count (max 30 points)
  score += Math.min(articles.length * 1.5, 30);

  // Source diversity (max 20 points)
  const uniqueSources = new Set(articles.map(a => a.source)).size;
  score += Math.min(uniqueSources * 4, 20);

  // Average confidence (max 30 points)
  const avgConfidence = articles.reduce((sum, a) => sum + a.assessment.confidence, 0) / articles.length;
  score += (avgConfidence / 100) * 30;

  // Recency (max 20 points)
  const recentArticles = articles.filter(a => {
    const age = Date.now() - new Date(a.publishedAt).getTime();
    return age < 24 * 60 * 60 * 1000; // Last 24 hours
  }).length;
  score += Math.min((recentArticles / articles.length) * 20, 20);

  return Math.round(Math.min(score, 100));
}

/**
 * Clean up old cache entries
 */
function cleanupCache() {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL * 2) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => cache.delete(key));

  if (keysToDelete.length > 0) {
    console.log(`[UCIE News] Cleaned up ${keysToDelete.length} old cache entries`);
  }
}
