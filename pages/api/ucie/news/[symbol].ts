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
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

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
  sources: {
    LunarCrush: { success: boolean; articles: number; error?: string };
    NewsAPI: { success: boolean; articles: number; error?: string };
    CryptoCompare: { success: boolean; articles: number; error?: string };
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

// Cache TTL: 10 minutes (news doesn't change that frequently)
const CACHE_TTL = 10 * 60; // 600 seconds

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<NewsResponse | ErrorResponse>
) {
  // Get user info if authenticated (for database tracking)
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email;
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
    // ✅ CHECK FOR REFRESH PARAMETER: Skip cache for live data
    const forceRefresh = req.query.refresh === 'true';
    
    if (forceRefresh) {
      console.log(`🔄 LIVE DATA MODE: Bypassing cache for ${symbolUpper} news`);
    }

    // Check database cache first (skip if refresh=true)
    if (!forceRefresh) {
      const cachedData = await getCachedAnalysis(symbolUpper, 'news');
      if (cachedData) {
        console.log(`✅ Cache hit for ${symbolUpper} news`);
        return res.status(200).json({
          ...cachedData,
          cached: true
        });
      }
    }

    console.log(`[UCIE News] Fetching news for ${symbolUpper}`);

    // Fetch news from all sources (now returns source status)
    const { articles, sources } = await fetchAllNews(symbolUpper);

    console.log(`[UCIE News] Fetched ${articles.length} articles`);
    console.log(`[UCIE News] LunarCrush: ${sources.LunarCrush.success ? `✅ ${sources.LunarCrush.articles} articles` : `❌ ${sources.LunarCrush.error}`}`);
    console.log(`[UCIE News] NewsAPI: ${sources.NewsAPI.success ? `✅ ${sources.NewsAPI.articles} articles` : `❌ ${sources.NewsAPI.error}`}`);
    console.log(`[UCIE News] CryptoCompare: ${sources.CryptoCompare.success ? `✅ ${sources.CryptoCompare.articles} articles` : `❌ ${sources.CryptoCompare.error}`}`);

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
        sources,
        dataQuality: 0,
        timestamp: new Date().toISOString(),
        cached: false,
        error: 'No news articles found. ' + 
          (sources.LunarCrush.error ? `LunarCrush: ${sources.LunarCrush.error}. ` : '') +
          (sources.NewsAPI.error ? `NewsAPI: ${sources.NewsAPI.error}. ` : '') +
          (sources.CryptoCompare.error ? `CryptoCompare: ${sources.CryptoCompare.error}.` : '')
      };

      return res.status(200).json(response);
    }

    // Assess impact of all articles (with timeout protection)
    console.log(`[UCIE News] Assessing impact for ${articles.length} articles`);
    let assessedArticles: AssessedNewsArticle[];
    
    try {
      // ✅ FIXED: Add 20-second timeout for impact assessment
      // If it times out, use articles without AI assessment
      const assessmentPromise = assessMultipleNews(articles, symbolUpper);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Assessment timeout')), 20000);
      });
      
      assessedArticles = await Promise.race([assessmentPromise, timeoutPromise]);
    } catch (error) {
      console.warn(`[UCIE News] Impact assessment timed out, using articles without AI assessment`);
      // Fallback: Use articles with default assessment
      assessedArticles = articles.map(article => ({
        ...article,
        assessment: {
          articleId: article.id,
          impact: 'neutral' as const,
          impactScore: 50,
          confidence: 50,
          summary: article.description,
          keyPoints: [],
          marketImplications: 'Impact assessment unavailable',
          timeframe: 'short-term' as const
        }
      }));
    }

    // Generate summary
    const summary = generateNewsSummary(assessedArticles);

    // Calculate data quality score
    const dataQuality = calculateDataQuality(assessedArticles);

    const response: NewsResponse = {
      success: true,
      symbol: symbolUpper,
      articles: assessedArticles,
      summary,
      sources,
      dataQuality,
      timestamp: new Date().toISOString(),
      cached: false
    };

    // Cache the response in database (skip if refresh=true for live data)
    if (!forceRefresh) {
      await setCachedAnalysis(symbolUpper, 'news', response, CACHE_TTL, dataQuality, userId, userEmail);
      console.log(`💾 Cached ${symbolUpper} news for ${CACHE_TTL}s`);
    } else {
      console.log(`⚡ LIVE DATA: Not caching ${symbolUpper} news`);
    }

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


// Export with optional authentication middleware (for user tracking)
export default withOptionalAuth(handler);
