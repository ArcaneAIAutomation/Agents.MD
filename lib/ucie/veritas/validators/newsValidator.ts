/**
 * News Correlation Validator for Veritas Protocol
 * 
 * Validates news sentiment against on-chain activity to detect divergences.
 * Uses GPT-4o to classify headlines and compare against whale behavior.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { generateOpenAIAnalysis } from '../../openaiClient';

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

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  url: string;
}

export interface NewsData {
  articles: NewsArticle[];
  summary?: {
    overallSentiment: 'bullish' | 'bearish' | 'neutral';
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
  };
}

export interface OnChainData {
  whaleActivity?: {
    largeTransactions: number;
    totalValue: number;
    exchangeDeposits: number;
    exchangeWithdrawals: number;
    netFlow: number;
  };
  holderDistribution?: {
    accumulation: boolean;
    distribution: boolean;
  };
}

export interface HeadlineSentimentAnalysis {
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -100 to +100
  confidence: number; // 0-100
  headlineAnalysis: Array<{
    headline: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    score: number; // -100 to +100
    reasoning: string;
  }>;
  bullishPercentage: number;
  bearishPercentage: number;
  neutralPercentage: number;
  summary: string;
}

// ============================================================================
// Headline Sentiment Analysis with GPT-4o
// ============================================================================

/**
 * Analyze news headlines using GPT-4o to classify sentiment
 * Classifies each headline as Bullish, Bearish, or Neutral
 */
export async function analyzeHeadlineSentiment(
  symbol: string,
  articles: NewsArticle[]
): Promise<HeadlineSentimentAnalysis> {
  // Take top 20 headlines for analysis
  const headlines = articles
    .slice(0, 20)
    .map((article, index) => `${index + 1}. ${article.title}`)
    .join('\n');

  if (!headlines || headlines.trim().length === 0) {
    return {
      overallSentiment: 'neutral',
      sentimentScore: 0,
      confidence: 0,
      headlineAnalysis: [],
      bullishPercentage: 0,
      bearishPercentage: 0,
      neutralPercentage: 0,
      summary: 'No news headlines available for analysis'
    };
  }

  // Create prompt for GPT-4o sentiment classification
  const systemPrompt = `You are a cryptocurrency news sentiment analyst. Analyze news headlines about ${symbol} and classify each as:

- **Bullish**: Positive news that could drive price up (regulatory approval, adoption, partnerships, positive earnings, upgrades)
- **Bearish**: Negative news that could drive price down (regulatory crackdown, hacks, scams, negative earnings, downgrades)
- **Neutral**: News without clear price impact (general updates, educational content, neutral analysis)

For each headline, provide:
1. Classification (bullish/bearish/neutral)
2. Sentiment score from -100 (extremely bearish) to +100 (extremely bullish)
3. Brief reasoning

Return your analysis as JSON with this exact structure:
{
  "overallSentiment": "<bullish|bearish|neutral>",
  "sentimentScore": <number from -100 to +100>,
  "confidence": <number from 0 to 100>,
  "headlineAnalysis": [
    {
      "headline": "<headline text>",
      "sentiment": "<bullish|bearish|neutral>",
      "score": <number from -100 to +100>,
      "reasoning": "<brief explanation>"
    }
  ],
  "bullishPercentage": <percentage of bullish headlines>,
  "bearishPercentage": <percentage of bearish headlines>,
  "neutralPercentage": <percentage of neutral headlines>,
  "summary": "<overall summary of news sentiment>"
}`;

  const userPrompt = `Analyze the sentiment of these news headlines about ${symbol}:

${headlines}

Provide your analysis as JSON.`;

  try {
    console.log(`🤖 Analyzing news sentiment for ${symbol} with GPT-4o...`);
    
    const response = await generateOpenAIAnalysis(
      systemPrompt,
      userPrompt,
      2500, // 2500 tokens for headline analysis
      0.3   // Lower temperature for consistent classification
    );

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from GPT-4o response');
    }

    const analysis: HeadlineSentimentAnalysis = JSON.parse(jsonMatch[0]);
    
    console.log(`✅ News sentiment analysis complete: ${analysis.overallSentiment} (${analysis.sentimentScore}, confidence: ${analysis.confidence}%)`);
    
    return analysis;
  } catch (error) {
    console.error('❌ Error analyzing news sentiment with GPT-4o:', error);
    
    // Fallback to simple keyword-based analysis
    return fallbackHeadlineSentimentAnalysis(articles);
  }
}

/**
 * Fallback sentiment analysis using keyword matching
 * Used when GPT-4o is unavailable
 */
function fallbackHeadlineSentimentAnalysis(articles: NewsArticle[]): HeadlineSentimentAnalysis {
  const headlineAnalysis = articles.slice(0, 20).map(article => {
    const headline = article.title.toLowerCase();
    
    // Keyword-based sentiment classification
    const bullishKeywords = [
      'surge', 'rally', 'bullish', 'gains', 'soars', 'breakout', 'adoption',
      'partnership', 'approval', 'upgrade', 'positive', 'growth', 'record',
      'milestone', 'success', 'innovation', 'breakthrough'
    ];
    
    const bearishKeywords = [
      'crash', 'plunge', 'bearish', 'losses', 'falls', 'drops', 'decline',
      'crackdown', 'ban', 'hack', 'scam', 'fraud', 'lawsuit', 'investigation',
      'warning', 'risk', 'concern', 'threat', 'collapse'
    ];
    
    let bullishCount = 0;
    let bearishCount = 0;
    
    bullishKeywords.forEach(keyword => {
      if (headline.includes(keyword)) bullishCount++;
    });
    
    bearishKeywords.forEach(keyword => {
      if (headline.includes(keyword)) bearishCount++;
    });
    
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0;
    
    if (bullishCount > bearishCount) {
      sentiment = 'bullish';
      score = Math.min(80, 40 + bullishCount * 15);
    } else if (bearishCount > bullishCount) {
      sentiment = 'bearish';
      score = Math.max(-80, -40 - bearishCount * 15);
    }
    
    return {
      headline: article.title,
      sentiment,
      score,
      reasoning: `Keyword analysis: ${bullishCount} bullish, ${bearishCount} bearish keywords`
    };
  });

  const bullishCount = headlineAnalysis.filter(h => h.sentiment === 'bullish').length;
  const bearishCount = headlineAnalysis.filter(h => h.sentiment === 'bearish').length;
  const neutralCount = headlineAnalysis.filter(h => h.sentiment === 'neutral').length;
  const total = headlineAnalysis.length;

  const bullishPercentage = (bullishCount / total) * 100;
  const bearishPercentage = (bearishCount / total) * 100;
  const neutralPercentage = (neutralCount / total) * 100;

  const avgScore = headlineAnalysis.reduce((sum, h) => sum + h.score, 0) / total;
  
  let overallSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (bullishPercentage > 50) overallSentiment = 'bullish';
  else if (bearishPercentage > 50) overallSentiment = 'bearish';

  return {
    overallSentiment,
    sentimentScore: Math.round(avgScore),
    confidence: 50, // Lower confidence for fallback
    headlineAnalysis,
    bullishPercentage: Math.round(bullishPercentage),
    bearishPercentage: Math.round(bearishPercentage),
    neutralPercentage: Math.round(neutralPercentage),
    summary: `Fallback keyword-based analysis: ${bullishCount} bullish, ${bearishCount} bearish, ${neutralCount} neutral headlines`
  };
}

// ============================================================================
// News-OnChain Divergence Detection
// ============================================================================

/**
 * Detect divergences between news sentiment and on-chain activity
 * 
 * Divergences:
 * 1. Bearish news (>70% bearish) + Accumulation (positive net flow) = Potential buying opportunity
 * 2. Bullish news (>70% bullish) + Distribution (negative net flow) = Potential selling opportunity
 */
function detectNewsOnChainDivergence(
  newsSentiment: HeadlineSentimentAnalysis,
  onChainData: OnChainData
): {
  divergenceDetected: boolean;
  divergenceType: 'bearish_news_accumulation' | 'bullish_news_distribution' | null;
  severity: 'info' | 'warning' | 'error';
  message: string;
  recommendation: string;
} {
  // Determine on-chain sentiment from net flow
  const netFlow = onChainData.whaleActivity?.netFlow || 0;
  const isAccumulation = netFlow > 0; // Positive net flow = withdrawals > deposits = accumulation
  const isDistribution = netFlow < 0; // Negative net flow = deposits > withdrawals = distribution

  // Check for divergences
  
  // Divergence 1: Bearish news + Accumulation
  if (newsSentiment.bearishPercentage > 70 && isAccumulation) {
    return {
      divergenceDetected: true,
      divergenceType: 'bearish_news_accumulation',
      severity: 'warning',
      message: `News-OnChain Divergence: ${newsSentiment.bearishPercentage.toFixed(0)}% bearish news but whales are accumulating (net flow: ${netFlow > 0 ? '+' : ''}${netFlow.toFixed(2)} BTC)`,
      recommendation: 'Whales may be buying the dip despite negative news. Consider this a potential buying opportunity, but verify with additional analysis.'
    };
  }
  
  // Divergence 2: Bullish news + Distribution
  if (newsSentiment.bullishPercentage > 70 && isDistribution) {
    return {
      divergenceDetected: true,
      divergenceType: 'bullish_news_distribution',
      severity: 'warning',
      message: `News-OnChain Divergence: ${newsSentiment.bullishPercentage.toFixed(0)}% bullish news but whales are distributing (net flow: ${netFlow > 0 ? '+' : ''}${netFlow.toFixed(2)} BTC)`,
      recommendation: 'Whales may be selling into positive news. Exercise caution and consider taking profits.'
    };
  }

  // No divergence detected
  return {
    divergenceDetected: false,
    divergenceType: null,
    severity: 'info',
    message: 'News sentiment aligns with on-chain activity',
    recommendation: 'News and on-chain data are consistent'
  };
}

// ============================================================================
// News Sentiment Consistency Score
// ============================================================================

/**
 * Calculate news sentiment consistency score (0-100)
 * 
 * Factors:
 * - Sentiment clarity (how decisive the sentiment is)
 * - Source diversity (number of unique sources)
 * - Recency (how recent the news is)
 * - Confidence (GPT-4o confidence in classification)
 * - On-chain alignment (whether news aligns with on-chain activity)
 */
function calculateNewsSentimentConsistency(
  newsSentiment: HeadlineSentimentAnalysis,
  onChainData: OnChainData,
  articles: NewsArticle[]
): number {
  let score = 0;

  // 1. Sentiment clarity (30 points)
  // Higher score if sentiment is decisive (>70% in one direction)
  const maxPercentage = Math.max(
    newsSentiment.bullishPercentage,
    newsSentiment.bearishPercentage,
    newsSentiment.neutralPercentage
  );
  score += (maxPercentage / 100) * 30;

  // 2. Source diversity (20 points)
  const uniqueSources = new Set(articles.map(a => a.source)).size;
  score += Math.min((uniqueSources / 5) * 20, 20); // Max 20 points for 5+ sources

  // 3. Recency (20 points)
  const recentArticles = articles.filter(a => {
    const age = Date.now() - new Date(a.publishedAt).getTime();
    return age < 24 * 60 * 60 * 1000; // Last 24 hours
  }).length;
  score += Math.min((recentArticles / articles.length) * 20, 20);

  // 4. GPT-4o confidence (20 points)
  score += (newsSentiment.confidence / 100) * 20;

  // 5. On-chain alignment (10 points)
  const netFlow = onChainData.whaleActivity?.netFlow || 0;
  const isAccumulation = netFlow > 0;
  const isDistribution = netFlow < 0;
  
  // Aligned: bullish news + accumulation OR bearish news + distribution
  const aligned = 
    (newsSentiment.overallSentiment === 'bullish' && isAccumulation) ||
    (newsSentiment.overallSentiment === 'bearish' && isDistribution) ||
    (newsSentiment.overallSentiment === 'neutral');
  
  if (aligned) {
    score += 10;
  }

  return Math.round(Math.min(score, 100));
}

// ============================================================================
// Main News Correlation Validator
// ============================================================================

/**
 * Validate news correlation with on-chain activity
 * 
 * Steps:
 * 1. Fetch news from existing endpoint
 * 2. Use GPT-4o to classify headlines as Bullish, Bearish, or Neutral
 * 3. Compare news sentiment to on-chain activity (accumulation vs distribution)
 * 4. Detect divergences (bearish news + accumulation, bullish news + distribution)
 * 5. Generate alerts and calculate consistency score
 */
export async function validateNewsCorrelation(
  symbol: string,
  newsData: NewsData | null,
  onChainData: OnChainData | null
): Promise<VeritasValidationResult> {
  const alerts: ValidationAlert[] = [];
  const discrepancies: Discrepancy[] = [];
  const passedChecks: string[] = [];
  const failedChecks: string[] = [];

  // ============================================================================
  // Check 1: Data Availability
  // ============================================================================
  
  if (!newsData || !newsData.articles || newsData.articles.length === 0) {
    alerts.push({
      severity: 'warning',
      type: 'news',
      message: 'No news data available for validation',
      affectedSources: ['NewsAPI', 'CryptoCompare'],
      recommendation: 'News correlation validation skipped - no news articles found'
    });
    
    return {
      isValid: true,
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
        failedChecks: ['news_data_availability']
      }
    };
  }

  if (!onChainData || !onChainData.whaleActivity) {
    alerts.push({
      severity: 'warning',
      type: 'news',
      message: 'No on-chain data available for correlation',
      affectedSources: ['Blockchain.com', 'Etherscan'],
      recommendation: 'News sentiment analyzed but cannot correlate with on-chain activity'
    });
    
    failedChecks.push('onchain_data_availability');
  }

  // ============================================================================
  // Check 2: Headline Sentiment Analysis with GPT-4o
  // ============================================================================
  
  let newsSentiment: HeadlineSentimentAnalysis;
  
  try {
    console.log(`🔍 Analyzing news sentiment for ${symbol} with GPT-4o...`);
    
    newsSentiment = await analyzeHeadlineSentiment(symbol, newsData.articles);
    
    passedChecks.push('news_sentiment_analysis');
    
    // Add info alert with sentiment breakdown
    alerts.push({
      severity: 'info',
      type: 'news',
      message: `News sentiment: ${newsSentiment.overallSentiment} (${newsSentiment.bullishPercentage.toFixed(0)}% bullish, ${newsSentiment.bearishPercentage.toFixed(0)}% bearish, ${newsSentiment.neutralPercentage.toFixed(0)}% neutral)`,
      affectedSources: ['NewsAPI', 'CryptoCompare', 'GPT-4o'],
      recommendation: newsSentiment.summary
    });
  } catch (error) {
    console.error('❌ Error analyzing news sentiment:', error);
    
    alerts.push({
      severity: 'error',
      type: 'news',
      message: 'News sentiment analysis failed',
      affectedSources: ['GPT-4o'],
      recommendation: 'Using fallback keyword-based analysis'
    });
    
    failedChecks.push('news_sentiment_analysis');
    
    // Use fallback analysis
    newsSentiment = fallbackHeadlineSentimentAnalysis(newsData.articles);
  }

  // ============================================================================
  // Check 3: News-OnChain Divergence Detection
  // ============================================================================
  
  if (onChainData && onChainData.whaleActivity) {
    const divergence = detectNewsOnChainDivergence(newsSentiment, onChainData);
    
    if (divergence.divergenceDetected) {
      alerts.push({
        severity: divergence.severity,
        type: 'news',
        message: divergence.message,
        affectedSources: ['News', 'On-Chain'],
        recommendation: divergence.recommendation
      });
      
      discrepancies.push({
        metric: 'news_onchain_correlation',
        sources: [
          { name: 'News Sentiment', value: newsSentiment.overallSentiment },
          { name: 'On-Chain Activity', value: onChainData.whaleActivity.netFlow > 0 ? 'accumulation' : 'distribution' }
        ],
        variance: Math.abs(newsSentiment.sentimentScore - (onChainData.whaleActivity.netFlow * 10)),
        threshold: 70,
        exceeded: true
      });
      
      failedChecks.push('news_onchain_alignment');
    } else {
      passedChecks.push('news_onchain_alignment');
      
      alerts.push({
        severity: 'info',
        type: 'news',
        message: divergence.message,
        affectedSources: ['News', 'On-Chain'],
        recommendation: divergence.recommendation
      });
    }
  }

  // ============================================================================
  // Check 4: Calculate News Sentiment Consistency Score
  // ============================================================================
  
  const consistencyScore = calculateNewsSentimentConsistency(
    newsSentiment,
    onChainData || {},
    newsData.articles
  );
  
  console.log(`📊 News sentiment consistency score: ${consistencyScore}/100`);

  // ============================================================================
  // Calculate Data Quality Score
  // ============================================================================
  
  const totalChecks = passedChecks.length + failedChecks.length;
  const passRate = totalChecks > 0 ? (passedChecks.length / totalChecks) * 100 : 0;
  
  // Reduce score for each alert
  const alertPenalty = alerts.filter(a => a.severity === 'warning' || a.severity === 'error').length * 10;
  
  const newsDataQuality = Math.max(0, Math.min(consistencyScore, passRate) - alertPenalty);
  
  const dataQuality: DataQualitySummary = {
    overallScore: Math.round(newsDataQuality),
    marketDataQuality: 0,
    socialDataQuality: 0,
    onChainDataQuality: 0,
    newsDataQuality: Math.round(newsDataQuality),
    passedChecks,
    failedChecks
  };

  return {
    isValid: alerts.filter(a => a.severity === 'fatal').length === 0,
    confidence: Math.round(newsDataQuality),
    alerts,
    discrepancies,
    dataQualitySummary: dataQuality
  };
}

// ============================================================================
// Fetch News Data for Validation
// ============================================================================

/**
 * Fetch news data from existing UCIE news endpoint
 * Returns news articles for validation
 */
export async function fetchNewsDataForValidation(symbol: string): Promise<NewsData | null> {
  try {
    console.log(`📰 Fetching news data for ${symbol} validation...`);
    
    // Fetch from existing news endpoint
    const response = await fetch(`/api/ucie/news/${symbol}`);
    
    if (!response.ok) {
      console.warn(`⚠️ News endpoint returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.articles || data.articles.length === 0) {
      console.warn(`⚠️ No news articles found for ${symbol}`);
      return null;
    }
    
    console.log(`✅ Fetched ${data.articles.length} news articles for validation`);
    
    return {
      articles: data.articles,
      summary: data.summary
    };
  } catch (error) {
    console.error('❌ Error fetching news data for validation:', error);
    return null;
  }
}
