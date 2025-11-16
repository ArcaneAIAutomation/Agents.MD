/**
 * Social Sentiment Validator for Veritas Protocol
 * 
 * Validates social sentiment for logical consistency and cross-validates
 * LunarCrush sentiment against Reddit sentiment using GPT-4o analysis.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 11.1, 12.2
 */

import { generateOpenAIAnalysis } from '../../openaiClient';
import { fetchRedditMetrics, type RedditMetrics, type LunarCrushData } from '../../socialSentimentClients';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ValidationAlert {
  severity: 'info' | 'warning' | 'error' | 'fatal';
  type: 'market' | 'social' | 'onchain' | 'news';
  message: string;
  affectedSources: string[];
  recommendation: string;
}

export interface Discrepancy {
  metric: string;
  sources: { name: string; value: any }[];
  variance: number;
  threshold: number;
  exceeded: boolean;
}

export interface DataQualitySummary {
  overallScore: number; // 0-100
  marketDataQuality: number;
  socialDataQuality: number;
  onChainDataQuality: number;
  newsDataQuality: number;
  passedChecks: string[];
  failedChecks: string[];
}

export interface VeritasValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  alerts: ValidationAlert[];
  discrepancies: Discrepancy[];
  dataQualitySummary: DataQualitySummary;
}

export interface RedditSentimentAnalysis {
  overallSentiment: number; // -100 to +100
  confidence: number; // 0-100
  postAnalysis: Array<{
    title: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    score: number; // -100 to +100
    reasoning: string;
  }>;
  summary: string;
}

// ============================================================================
// Reddit Sentiment Analysis with GPT-4o
// ============================================================================

/**
 * Analyze Reddit post sentiment using GPT-4o
 * Extracts post titles and uses AI to determine sentiment
 */
export async function analyzeRedditSentiment(
  symbol: string,
  redditMetrics: RedditMetrics
): Promise<RedditSentimentAnalysis> {
  // Extract top 10 post titles for analysis
  const postTitles = redditMetrics.topPosts
    .slice(0, 10)
    .map((post, index) => `${index + 1}. ${post.content.substring(0, 200)}`)
    .join('\n');

  if (!postTitles || postTitles.trim().length === 0) {
    return {
      overallSentiment: 0,
      confidence: 0,
      postAnalysis: [],
      summary: 'No Reddit posts available for analysis'
    };
  }

  // Create prompt for GPT-4o sentiment analysis
  const systemPrompt = `You are a cryptocurrency sentiment analyst. Analyze Reddit posts about ${symbol} and determine the overall sentiment.

For each post, classify it as:
- bullish (positive sentiment, optimistic about price)
- bearish (negative sentiment, pessimistic about price)
- neutral (no clear sentiment)

Provide a sentiment score from -100 (extremely bearish) to +100 (extremely bullish) for each post.

Return your analysis as JSON with this exact structure:
{
  "overallSentiment": <number from -100 to +100>,
  "confidence": <number from 0 to 100>,
  "postAnalysis": [
    {
      "title": "<post title>",
      "sentiment": "<bullish|bearish|neutral>",
      "score": <number from -100 to +100>,
      "reasoning": "<brief explanation>"
    }
  ],
  "summary": "<brief overall summary>"
}`;

  const userPrompt = `Analyze the sentiment of these Reddit posts about ${symbol}:

${postTitles}

Provide your analysis as JSON.`;

  try {
    console.log(`🤖 Analyzing Reddit sentiment for ${symbol} with GPT-4o...`);
    
    const response = await generateOpenAIAnalysis(
      systemPrompt,
      userPrompt,
      2000, // 2000 tokens should be enough for sentiment analysis
      0.3   // Lower temperature for more consistent analysis
    );

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from GPT-4o response');
    }

    const analysis: RedditSentimentAnalysis = JSON.parse(jsonMatch[0]);
    
    console.log(`✅ Reddit sentiment analysis complete: ${analysis.overallSentiment} (confidence: ${analysis.confidence}%)`);
    
    return analysis;
  } catch (error) {
    console.error('❌ Error analyzing Reddit sentiment with GPT-4o:', error);
    
    // Fallback to simple keyword-based analysis
    return fallbackRedditSentimentAnalysis(redditMetrics);
  }
}

/**
 * Fallback sentiment analysis using keyword matching
 * Used when GPT-4o is unavailable
 */
function fallbackRedditSentimentAnalysis(redditMetrics: RedditMetrics): RedditSentimentAnalysis {
  const postAnalysis = redditMetrics.topPosts.slice(0, 10).map(post => {
    const content = post.content.toLowerCase();
    
    // Simple keyword-based sentiment
    const bullishKeywords = ['bullish', 'moon', 'pump', 'buy', 'long', 'hodl', 'gem', 'rocket', 'breakout', 'rally'];
    const bearishKeywords = ['bearish', 'dump', 'sell', 'short', 'crash', 'scam', 'rug', 'loss', 'down', 'fall'];
    
    let bullishCount = 0;
    let bearishCount = 0;
    
    bullishKeywords.forEach(keyword => {
      if (content.includes(keyword)) bullishCount++;
    });
    
    bearishKeywords.forEach(keyword => {
      if (content.includes(keyword)) bearishCount++;
    });
    
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0;
    
    if (bullishCount > bearishCount) {
      sentiment = 'bullish';
      score = Math.min(80, 40 + bullishCount * 10);
    } else if (bearishCount > bullishCount) {
      sentiment = 'bearish';
      score = Math.max(-80, -40 - bearishCount * 10);
    }
    
    return {
      title: post.content.substring(0, 100),
      sentiment,
      score,
      reasoning: `Keyword analysis: ${bullishCount} bullish, ${bearishCount} bearish keywords`
    };
  });

  const overallSentiment = postAnalysis.reduce((sum, p) => sum + p.score, 0) / postAnalysis.length;

  return {
    overallSentiment: Math.round(overallSentiment),
    confidence: 50, // Lower confidence for fallback analysis
    postAnalysis,
    summary: 'Fallback keyword-based analysis (GPT-4o unavailable)'
  };
}

// ============================================================================
// Social Sentiment Validation
// ============================================================================

/**
 * Validate social sentiment for logical consistency and cross-validate sources
 * 
 * Checks:
 * 1. Impossibility detection: mention_count = 0 but sentiment_distribution has values
 * 2. Cross-validation: LunarCrush sentiment vs Reddit sentiment (GPT-4o analyzed)
 * 3. Sentiment mismatch detection: >30 point difference triggers alert
 */
export async function validateSocialSentiment(
  symbol: string,
  lunarCrushData: LunarCrushData | null,
  redditMetrics: RedditMetrics | null
): Promise<VeritasValidationResult> {
  const alerts: ValidationAlert[] = [];
  const discrepancies: Discrepancy[] = [];
  const passedChecks: string[] = [];
  const failedChecks: string[] = [];

  // ============================================================================
  // Check 1: Impossibility Detection
  // ============================================================================
  
  if (lunarCrushData) {
    // Check for logical impossibility: zero mentions but non-zero sentiment
    if (lunarCrushData.mentions === 0 && lunarCrushData.sentimentScore !== 0) {
      alerts.push({
        severity: 'fatal',
        type: 'social',
        message: 'Fatal Social Data Error: Zero mentions but non-zero sentiment detected',
        affectedSources: ['LunarCrush'],
        recommendation: 'Discarding social data - cannot have sentiment without mentions'
      });
      
      failedChecks.push('social_impossibility_check');
      
      return {
        isValid: false,
        confidence: 0,
        alerts,
        discrepancies: [],
        dataQualitySummary: {
          overallScore: 0,
          marketDataQuality: 0,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: [],
          failedChecks
        }
      };
    }
    
    passedChecks.push('social_impossibility_check');
  }

  // ============================================================================
  // Check 2: Reddit Sentiment Cross-Validation with GPT-4o
  // ============================================================================
  
  if (lunarCrushData && redditMetrics && redditMetrics.topPosts.length > 0) {
    try {
      console.log(`🔍 Cross-validating LunarCrush sentiment with Reddit (GPT-4o)...`);
      
      // Analyze Reddit sentiment using GPT-4o
      const redditAnalysis = await analyzeRedditSentiment(symbol, redditMetrics);
      
      // Compare LunarCrush sentiment vs Reddit sentiment
      const lunarCrushSentiment = lunarCrushData.sentimentScore;
      const redditSentiment = redditAnalysis.overallSentiment;
      const sentimentDifference = Math.abs(lunarCrushSentiment - redditSentiment);
      
      console.log(`📊 Sentiment comparison: LunarCrush=${lunarCrushSentiment}, Reddit=${redditSentiment}, Difference=${sentimentDifference}`);
      
      // Check if mismatch exceeds 30 point threshold
      if (sentimentDifference > 30) {
        alerts.push({
          severity: 'warning',
          type: 'social',
          message: `Social Sentiment Mismatch: LunarCrush (${lunarCrushSentiment.toFixed(0)}) vs Reddit (${redditSentiment.toFixed(0)})`,
          affectedSources: ['LunarCrush', 'Reddit'],
          recommendation: 'Review both sources - significant divergence detected. Reddit analysis: ' + redditAnalysis.summary
        });
        
        discrepancies.push({
          metric: 'sentiment_score',
          sources: [
            { name: 'LunarCrush', value: lunarCrushSentiment },
            { name: 'Reddit (GPT-4o)', value: redditSentiment }
          ],
          variance: sentimentDifference,
          threshold: 30,
          exceeded: true
        });
        
        failedChecks.push('sentiment_consistency');
      } else {
        passedChecks.push('sentiment_consistency');
        
        // Add info alert for successful cross-validation
        alerts.push({
          severity: 'info',
          type: 'social',
          message: `Sentiment sources agree: LunarCrush (${lunarCrushSentiment.toFixed(0)}) and Reddit (${redditSentiment.toFixed(0)}) within acceptable range`,
          affectedSources: ['LunarCrush', 'Reddit'],
          recommendation: 'Sentiment data validated successfully'
        });
      }
    } catch (error) {
      console.error('❌ Error during Reddit sentiment cross-validation:', error);
      
      alerts.push({
        severity: 'warning',
        type: 'social',
        message: 'Reddit sentiment cross-validation failed',
        affectedSources: ['Reddit'],
        recommendation: 'Using LunarCrush sentiment only - Reddit validation unavailable'
      });
      
      failedChecks.push('sentiment_cross_validation');
    }
  } else if (!redditMetrics || redditMetrics.topPosts.length === 0) {
    alerts.push({
      severity: 'info',
      type: 'social',
      message: 'Reddit data unavailable for cross-validation',
      affectedSources: ['Reddit'],
      recommendation: 'Using LunarCrush sentiment only'
    });
    
    passedChecks.push('sentiment_single_source');
  }

  // ============================================================================
  // Calculate Data Quality Score
  // ============================================================================
  
  const totalChecks = passedChecks.length + failedChecks.length;
  const passRate = totalChecks > 0 ? (passedChecks.length / totalChecks) * 100 : 0;
  
  // Reduce score for each alert
  const alertPenalty = alerts.filter(a => a.severity === 'warning' || a.severity === 'error').length * 15;
  const fatalPenalty = alerts.filter(a => a.severity === 'fatal').length * 100;
  
  const socialDataQuality = Math.max(0, passRate - alertPenalty - fatalPenalty);
  
  const dataQuality: DataQualitySummary = {
    overallScore: Math.round(socialDataQuality),
    marketDataQuality: 0,
    socialDataQuality: Math.round(socialDataQuality),
    onChainDataQuality: 0,
    newsDataQuality: 0,
    passedChecks,
    failedChecks
  };

  return {
    isValid: alerts.filter(a => a.severity === 'fatal').length === 0,
    confidence: Math.round(socialDataQuality),
    alerts,
    discrepancies,
    dataQualitySummary: dataQuality
  };
}

// ============================================================================
// Fetch Reddit Posts for Validation
// ============================================================================

/**
 * Fetch top Reddit posts from r/Bitcoin and r/CryptoCurrency
 * Returns top 10 posts for sentiment analysis
 */
export async function fetchRedditPostsForValidation(symbol: string): Promise<RedditMetrics | null> {
  try {
    console.log(`📱 Fetching Reddit posts for ${symbol} validation...`);
    
    // Use existing Reddit API client
    const redditMetrics = await fetchRedditMetrics(symbol);
    
    if (!redditMetrics || redditMetrics.topPosts.length === 0) {
      console.warn(`⚠️ No Reddit posts found for ${symbol}`);
      return null;
    }
    
    console.log(`✅ Fetched ${redditMetrics.topPosts.length} Reddit posts for validation`);
    
    return redditMetrics;
  } catch (error) {
    console.error('❌ Error fetching Reddit posts for validation:', error);
    return null;
  }
}
