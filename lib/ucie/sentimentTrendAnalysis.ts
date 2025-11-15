/**
 * Sentiment Trend Analysis
 * 
 * Provides AI-powered analysis of social sentiment trends
 * Uses GPT-4o-mini for fast, accurate analysis
 */

export interface SentimentTrendInsights {
  trendAnalysis: string;
  momentumIndicator: 'accelerating' | 'stable' | 'decelerating';
  communityHighlights: string[];
  influencerSentiment: string;
  keyNarratives: string[];
  tradingImplications: string;
}

/**
 * Analyze sentiment trends using AI
 * Fast analysis using GPT-4o-mini (~2-3 seconds)
 */
export async function analyzeSentimentTrends(
  sentimentData: any
): Promise<SentimentTrendInsights> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return generateBasicSentimentInsights(sentimentData);
  }

  try {
    const context = buildSentimentContext(sentimentData);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a social sentiment analyst. Analyze cryptocurrency social sentiment and provide actionable insights. Return ONLY valid JSON with this structure:
{
  "trendAnalysis": "2-3 sentence analysis of sentiment trend",
  "momentumIndicator": "accelerating|stable|decelerating",
  "communityHighlights": ["highlight 1", "highlight 2", "highlight 3"],
  "influencerSentiment": "2 sentence summary of influencer sentiment",
  "keyNarratives": ["narrative 1", "narrative 2", "narrative 3"],
  "tradingImplications": "2-3 sentence trading implications"
}`
          },
          {
            role: 'user',
            content: context
          }
        ],
        temperature: 0.3,
        max_tokens: 400
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    return JSON.parse(content);

  } catch (error) {
    console.error('AI sentiment analysis failed:', error);
    return generateBasicSentimentInsights(sentimentData);
  }
}

/**
 * Build context from sentiment data
 */
function buildSentimentContext(sentimentData: any): string {
  const sentiment = sentimentData.sentiment || {};
  const volume = sentimentData.volumeMetrics || {};
  const influencers = sentimentData.influencers || {};

  return `Social Sentiment Analysis:

OVERALL SENTIMENT:
- Score: ${sentiment.overallScore || 0}/100
- Trend: ${sentiment.trend || 'neutral'}
- Distribution: ${sentiment.distribution?.bullish || 0}% bullish, ${sentiment.distribution?.bearish || 0}% bearish, ${sentiment.distribution?.neutral || 0}% neutral

VOLUME METRICS:
- 24h Mentions: ${(volume.total24h || 0).toLocaleString()}
- 24h Change: ${volume.change24h > 0 ? '+' : ''}${(volume.change24h || 0).toFixed(1)}%
- Engagement Rate: ${(volume.engagementRate || 0).toFixed(2)}%

SOURCES:
- LunarCrush: ${sentimentData.sources?.lunarCrush ? 'Active' : 'Inactive'}
- Twitter: ${sentimentData.sources?.twitter ? 'Active' : 'Inactive'}
- Reddit: ${sentimentData.sources?.reddit ? 'Active' : 'Inactive'}

INFLUENCERS:
- Top Influencers: ${influencers.topInfluencers?.length || 0}
- Average Sentiment: ${influencers.averageSentiment || 'N/A'}

Analyze this data and provide insights on:
1. Sentiment trend direction and momentum
2. Community engagement and highlights
3. Influencer sentiment and impact
4. Key narratives driving sentiment
5. Trading implications`;
}

/**
 * Generate basic insights without AI (fallback)
 */
function generateBasicSentimentInsights(sentimentData: any): SentimentTrendInsights {
  const sentiment = sentimentData.sentiment || {};
  const volume = sentimentData.volumeMetrics || {};
  
  const score = sentiment.overallScore || 50;
  const trend = sentiment.trend || 'neutral';
  const change = volume.change24h || 0;
  
  let momentum: 'accelerating' | 'stable' | 'decelerating' = 'stable';
  if (Math.abs(change) > 20) momentum = 'accelerating';
  else if (Math.abs(change) < 5) momentum = 'stable';
  else momentum = 'decelerating';
  
  return {
    trendAnalysis: `Sentiment score at ${score}/100 with ${trend} trend. 24h mention volume ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}%.`,
    momentumIndicator: momentum,
    communityHighlights: [
      `${(volume.total24h || 0).toLocaleString()} mentions in last 24 hours`,
      `Sentiment distribution: ${sentiment.distribution?.bullish || 0}% bullish`,
      `Engagement rate: ${(volume.engagementRate || 0).toFixed(2)}%`
    ],
    influencerSentiment: `Influencer sentiment is ${score > 60 ? 'positive' : score < 40 ? 'negative' : 'neutral'} with ${trend} trend.`,
    keyNarratives: [
      `Overall ${trend} sentiment`,
      `${change > 0 ? 'Increasing' : 'Decreasing'} social activity`,
      `Community engagement ${volume.engagementRate > 5 ? 'strong' : 'moderate'}`
    ],
    tradingImplications: `Social sentiment suggests ${score > 60 ? 'bullish' : score < 40 ? 'bearish' : 'neutral'} bias. ${momentum === 'accelerating' ? 'Momentum is building.' : 'Monitor for trend changes.'}`
  };
}
