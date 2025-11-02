/**
 * AI-Powered News Impact Assessment for UCIE
 * 
 * Uses GPT-4o to analyze news articles and generate:
 * - Impact scores (Bullish/Bearish/Neutral)
 * - Confidence scores
 * - Market implication summaries
 * - Breaking news identification
 */

import { NewsArticle } from './newsFetching';

export interface NewsImpactAssessment {
  articleId: string;
  impact: 'bullish' | 'bearish' | 'neutral';
  impactScore: number; // 0-100
  confidence: number; // 0-100
  summary: string;
  keyPoints: string[];
  marketImplications: string;
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
}

export interface AssessedNewsArticle extends NewsArticle {
  assessment: NewsImpactAssessment;
}

/**
 * Assess impact of a single news article using GPT-4o
 */
export async function assessNewsImpact(
  article: NewsArticle,
  symbol: string
): Promise<NewsImpactAssessment> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Return default assessment if no API key
    return getDefaultAssessment(article);
  }
  
  try {
    const prompt = buildAssessmentPrompt(article, symbol);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency market analyst specializing in news impact assessment. Analyze news articles and provide structured JSON responses with impact analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    return {
      articleId: article.id,
      impact: parsed.impact || 'neutral',
      impactScore: parsed.impactScore || 50,
      confidence: parsed.confidence || 50,
      summary: parsed.summary || article.description,
      keyPoints: parsed.keyPoints || [],
      marketImplications: parsed.marketImplications || '',
      timeframe: parsed.timeframe || 'short-term'
    };
  } catch (error) {
    console.error('News impact assessment error:', error);
    return getDefaultAssessment(article);
  }
}

/**
 * Assess impact of multiple news articles in batch
 */
export async function assessMultipleNews(
  articles: NewsArticle[],
  symbol: string
): Promise<AssessedNewsArticle[]> {
  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;
  const results: AssessedNewsArticle[] = [];
  
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    
    const assessments = await Promise.all(
      batch.map(article => assessNewsImpact(article, symbol))
    );
    
    const assessedBatch = batch.map((article, index) => ({
      ...article,
      assessment: assessments[index]
    }));
    
    results.push(...assessedBatch);
    
    // Small delay between batches
    if (i + batchSize < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Build assessment prompt for GPT-4o
 */
function buildAssessmentPrompt(article: NewsArticle, symbol: string): string {
  return `Analyze this cryptocurrency news article for ${symbol} and provide a structured impact assessment.

Article Title: ${article.title}
Description: ${article.description}
Source: ${article.source}
Published: ${article.publishedAt}
Category: ${article.category}

Provide your analysis in the following JSON format:
{
  "impact": "bullish" | "bearish" | "neutral",
  "impactScore": <number 0-100, where 0 is extremely bearish, 50 is neutral, 100 is extremely bullish>,
  "confidence": <number 0-100, your confidence in this assessment>,
  "summary": "<one sentence summary of the news>",
  "keyPoints": ["<key point 1>", "<key point 2>", "<key point 3>"],
  "marketImplications": "<2-3 sentences explaining potential market impact>",
  "timeframe": "immediate" | "short-term" | "medium-term" | "long-term"
}

Consider:
- Partnerships and integrations are typically bullish
- Regulatory actions can be bearish or bullish depending on context
- Technology upgrades are usually bullish
- Security breaches or hacks are bearish
- Adoption news is bullish
- Exchange delistings are bearish
- Major institutional involvement is bullish

Be objective and base your assessment on the actual content, not speculation.`;
}

/**
 * Get default assessment when AI is unavailable
 */
function getDefaultAssessment(article: NewsArticle): NewsImpactAssessment {
  // Rule-based assessment as fallback
  const impact = determineImpactFromCategory(article.category, article.title, article.description);
  const impactScore = calculateDefaultImpactScore(impact, article.title, article.description);
  
  return {
    articleId: article.id,
    impact,
    impactScore,
    confidence: 60, // Lower confidence for rule-based
    summary: article.description.substring(0, 150) + '...',
    keyPoints: extractKeyPoints(article.title, article.description),
    marketImplications: generateDefaultImplications(impact, article.category),
    timeframe: article.isBreaking ? 'immediate' : 'short-term'
  };
}

/**
 * Determine impact from category and keywords
 */
function determineImpactFromCategory(
  category: NewsArticle['category'],
  title: string,
  description: string
): 'bullish' | 'bearish' | 'neutral' {
  const text = (title + ' ' + description).toLowerCase();
  
  // Bearish keywords
  if (text.match(/hack|breach|scam|fraud|lawsuit|ban|crash|plunge|collapse|fail/)) {
    return 'bearish';
  }
  
  // Bullish keywords
  if (text.match(/partner|launch|adopt|integrate|surge|rally|breakthrough|approve|invest/)) {
    return 'bullish';
  }
  
  // Category-based defaults
  if (category === 'partnerships' || category === 'technology') {
    return 'bullish';
  }
  
  if (category === 'regulatory') {
    // Regulatory can go either way
    if (text.match(/approve|license|legal clarity/)) return 'bullish';
    if (text.match(/ban|restrict|lawsuit|fine/)) return 'bearish';
  }
  
  return 'neutral';
}

/**
 * Calculate default impact score
 */
function calculateDefaultImpactScore(
  impact: 'bullish' | 'bearish' | 'neutral',
  title: string,
  description: string
): number {
  const text = (title + ' ' + description).toLowerCase();
  
  let baseScore = 50;
  
  if (impact === 'bullish') {
    baseScore = 65;
    // Strong bullish keywords
    if (text.match(/major|huge|massive|breakthrough|revolutionary/)) baseScore += 15;
    if (text.match(/partnership|integrate|adopt/)) baseScore += 10;
  } else if (impact === 'bearish') {
    baseScore = 35;
    // Strong bearish keywords
    if (text.match(/major|huge|massive|critical|severe/)) baseScore -= 15;
    if (text.match(/hack|breach|lawsuit|ban/)) baseScore -= 10;
  }
  
  return Math.max(0, Math.min(100, baseScore));
}

/**
 * Extract key points from text
 */
function extractKeyPoints(title: string, description: string): string[] {
  const points: string[] = [];
  
  // Add title as first point
  points.push(title);
  
  // Extract sentences from description
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Add up to 2 more sentences
  points.push(...sentences.slice(0, 2).map(s => s.trim()));
  
  return points.slice(0, 3);
}

/**
 * Generate default market implications
 */
function generateDefaultImplications(
  impact: 'bullish' | 'bearish' | 'neutral',
  category: NewsArticle['category']
): string {
  const implications: Record<string, Record<string, string>> = {
    bullish: {
      partnerships: 'This partnership could increase adoption and utility, potentially driving demand.',
      technology: 'Technology improvements may enhance network capabilities and attract more users.',
      regulatory: 'Positive regulatory developments could reduce uncertainty and attract institutional investment.',
      market: 'Positive market sentiment may lead to increased buying pressure.',
      community: 'Strong community engagement often correlates with long-term project success.'
    },
    bearish: {
      partnerships: 'Partnership concerns may indicate strategic challenges or reduced confidence.',
      technology: 'Technical issues could impact user confidence and network reliability.',
      regulatory: 'Regulatory challenges may limit market access and institutional participation.',
      market: 'Negative market sentiment could trigger selling pressure and price decline.',
      community: 'Community concerns may reflect underlying project issues.'
    },
    neutral: {
      partnerships: 'This development may have limited immediate market impact.',
      technology: 'The technology update appears to be routine maintenance.',
      regulatory: 'Regulatory developments require further monitoring for market impact.',
      market: 'Market reaction is likely to be muted without additional catalysts.',
      community: 'Community activity remains stable with no significant changes.'
    }
  };
  
  return implications[impact][category] || 'Market impact requires further analysis.';
}

/**
 * Identify major breaking news (impact score > 80)
 */
export function identifyMajorNews(assessedArticles: AssessedNewsArticle[]): AssessedNewsArticle[] {
  return assessedArticles.filter(article => 
    article.assessment.impactScore > 80 || article.assessment.impactScore < 20
  );
}

/**
 * Generate aggregate news summary
 */
export function generateNewsSummary(assessedArticles: AssessedNewsArticle[]): {
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  averageImpact: number;
  majorNews: AssessedNewsArticle[];
} {
  const bullishCount = assessedArticles.filter(a => a.assessment.impact === 'bullish').length;
  const bearishCount = assessedArticles.filter(a => a.assessment.impact === 'bearish').length;
  const neutralCount = assessedArticles.filter(a => a.assessment.impact === 'neutral').length;
  
  const averageImpact = assessedArticles.reduce((sum, a) => sum + a.assessment.impactScore, 0) / assessedArticles.length;
  
  let overallSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (averageImpact > 55) overallSentiment = 'bullish';
  if (averageImpact < 45) overallSentiment = 'bearish';
  
  const majorNews = identifyMajorNews(assessedArticles);
  
  return {
    overallSentiment,
    bullishCount,
    bearishCount,
    neutralCount,
    averageImpact,
    majorNews
  };
}
