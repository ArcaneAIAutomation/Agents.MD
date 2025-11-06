/**
 * UCIE Research API - Caesar AI Integration
 * 
 * Uses Caesar AI to analyze cryptocurrency data with rich context
 * Pattern based on working whale-watch/analyze.ts
 * 
 * Endpoint: POST /api/ucie-research
 * Body: { symbol, marketData, newsData, technicalData }
 * 
 * Features:
 * - Caesar AI deep research
 * - Rich context from market data, news, and technical analysis
 * - Structured JSON output
 * - Job-based polling pattern
 */

import type { NextApiRequest, NextApiResponse} from 'next';
import { Caesar } from '../../utils/caesarClient';

interface ResearchRequest {
  symbol: string;
  marketData?: any;
  newsData?: any;
  technicalData?: any;
  userQuery?: string;
}

interface ResearchResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  error?: string;
  timestamp: string;
}

/**
 * Build comprehensive research query for Caesar
 */
function buildResearchQuery(data: ResearchRequest): string {
  const { symbol, marketData, newsData, technicalData, userQuery } = data;

  // Build market context
  let marketContext = '';
  if (marketData) {
    marketContext = `
MARKET DATA (CoinMarketCap + Exchanges):
- Current Price: $${marketData.price?.toLocaleString() || 'N/A'}
- 24h Change: ${marketData.marketData?.change24h?.toFixed(2) || 'N/A'}%
- 7d Change: ${marketData.marketData?.change7d?.toFixed(2) || 'N/A'}%
- 30d Change: ${marketData.marketData?.change30d?.toFixed(2) || 'N/A'}%
- Market Cap: $${(marketData.marketData?.marketCap / 1000000000)?.toFixed(2) || 'N/A'}B
- Market Cap Dominance: ${marketData.marketData?.marketCapDominance?.toFixed(2) || 'N/A'}%
- 24h Volume: $${(marketData.marketData?.volume24h / 1000000)?.toFixed(2) || 'N/A'}M
- Volume Change 24h: ${marketData.marketData?.volumeChange24h?.toFixed(2) || 'N/A'}%
- CMC Rank: #${marketData.marketData?.rank || 'N/A'}
- Circulating Supply: ${marketData.marketData?.circulatingSupply?.toLocaleString() || 'N/A'}
- Max Supply: ${marketData.marketData?.maxSupply?.toLocaleString() || 'Unlimited'}
- Price Spread (Exchanges): ${marketData.priceAggregation?.spread?.toFixed(3) || 'N/A'}%
- Data Confidence: ${marketData.priceAggregation?.confidence || 'N/A'}
`;

    if (marketData.metadata) {
      marketContext += `
PROJECT METADATA:
- Category: ${marketData.metadata.category || 'N/A'}
- Tags: ${marketData.metadata.tags?.join(', ') || 'N/A'}
- Website: ${marketData.metadata.website || 'N/A'}
- Description: ${marketData.metadata.description?.substring(0, 300) || 'N/A'}...
`;
    }
  }

  // Build news context
  let newsContext = '';
  if (newsData && newsData.articles) {
    const recentNews = newsData.articles.slice(0, 5);
    newsContext = `
NEWS SENTIMENT ANALYSIS:
- Overall Sentiment: ${newsData.sentiment?.sentiment || 'N/A'} (Score: ${newsData.sentiment?.score || 'N/A'}/100)
- Sentiment Distribution: ${newsData.sentiment?.distribution?.bullish || 0}% Bullish, ${newsData.sentiment?.distribution?.bearish || 0}% Bearish, ${newsData.sentiment?.distribution?.neutral || 0}% Neutral
- Total Articles Analyzed: ${newsData.articles.length}

RECENT NEWS HEADLINES (Last 24-48 hours):
${recentNews.map((article: any, i: number) => `
${i + 1}. "${article.title}"
   Source: ${article.source}
   Sentiment: ${article.sentiment} (${article.sentimentScore}/100)
   Category: ${article.category}
   Published: ${new Date(article.publishedAt).toLocaleString()}
   URL: ${article.url}
`).join('\n')}
`;
  }

  // Build technical context
  let technicalContext = '';
  if (technicalData) {
    technicalContext = `
TECHNICAL ANALYSIS:
- RSI (14): ${technicalData.rsi?.toFixed(2) || 'N/A'}
- MACD Signal: ${technicalData.macd?.signal || 'N/A'}
- EMA 20: $${technicalData.ema20?.toLocaleString() || 'N/A'}
- EMA 50: $${technicalData.ema50?.toLocaleString() || 'N/A'}
- Support Level: $${technicalData.support?.toLocaleString() || 'N/A'}
- Resistance Level: $${technicalData.resistance?.toLocaleString() || 'N/A'}
- Trend: ${technicalData.trend || 'N/A'}
- Momentum: ${technicalData.momentum || 'N/A'}
`;
  }

  // Build comprehensive query
  const query = `
Conduct comprehensive cryptocurrency market intelligence analysis for ${symbol}.

${marketContext}
${newsContext}
${technicalContext}

RESEARCH OBJECTIVES:
1. **Market Position Analysis**: Evaluate ${symbol}'s current market position, dominance, and competitive landscape
2. **Price Action Analysis**: Analyze recent price movements across multiple timeframes (1h, 24h, 7d, 30d)
3. **News Sentiment Impact**: How is recent news affecting market sentiment and price action?
4. **Technical Outlook**: What do technical indicators suggest about short-term and medium-term price direction?
5. **Volume Analysis**: Is volume supporting current price action? Any unusual volume patterns?
6. **Market Cap Dynamics**: How is market cap changing relative to the broader crypto market?
7. **Supply Dynamics**: Analyze circulating supply vs max supply and inflation rate
8. **Risk Assessment**: Identify key risks and opportunities based on all available data
9. **Trading Recommendation**: Based on comprehensive analysis, what is the optimal trading strategy?
10. **Price Targets**: Provide realistic price targets for 24h, 7d, and 30d timeframes

${userQuery ? `\nUSER SPECIFIC QUESTION:\n${userQuery}\n` : ''}

Focus on actionable intelligence backed by the provided data. Cross-reference news sentiment with price action and technical indicators to identify trading opportunities or risks.
`.trim();

  return query;
}

/**
 * Build system prompt for structured output
 */
function buildSystemPrompt(): string {
  return `You are a professional cryptocurrency market analyst with expertise in technical analysis, fundamental analysis, and market sentiment.

Analyze the provided comprehensive market data, news sentiment, and technical indicators to generate actionable trading intelligence.

Return ONLY valid JSON (no markdown, no code blocks, no explanatory text - just raw JSON):
{
  "market_position": {
    "rank": "number",
    "dominance": "percentage",
    "competitive_analysis": "string"
  },
  "price_analysis": {
    "current_trend": "bullish|bearish|neutral",
    "trend_strength": "strong|moderate|weak",
    "key_levels": {
      "support": "number",
      "resistance": "number"
    },
    "price_action_summary": "string"
  },
  "news_sentiment_impact": {
    "overall_sentiment": "bullish|bearish|neutral",
    "sentiment_score": "number (0-100)",
    "key_narratives": ["string"],
    "sentiment_price_correlation": "string"
  },
  "technical_outlook": {
    "short_term": "bullish|bearish|neutral",
    "medium_term": "bullish|bearish|neutral",
    "key_indicators": {
      "rsi_signal": "string",
      "macd_signal": "string",
      "ema_signal": "string"
    },
    "technical_summary": "string"
  },
  "volume_analysis": {
    "volume_trend": "increasing|decreasing|stable",
    "volume_price_correlation": "string",
    "unusual_patterns": "string"
  },
  "risk_assessment": {
    "risk_level": "low|medium|high",
    "key_risks": ["string"],
    "key_opportunities": ["string"]
  },
  "trading_recommendation": {
    "action": "buy|sell|hold",
    "confidence": "number (0-100)",
    "reasoning": "string",
    "entry_strategy": "string",
    "exit_strategy": "string"
  },
  "price_targets": {
    "24h": {
      "target": "number",
      "confidence": "number (0-100)"
    },
    "7d": {
      "target": "number",
      "confidence": "number (0-100)"
    },
    "30d": {
      "target": "number",
      "confidence": "number (0-100)"
    }
  },
  "executive_summary": "string (2-3 sentences)",
  "data_quality": {
    "market_data": "excellent|good|fair|poor",
    "news_data": "excellent|good|fair|poor",
    "technical_data": "excellent|good|fair|poor",
    "overall_confidence": "number (0-100)"
  }
}

Be specific, cite data points, and provide actionable intelligence.`.trim();
}

/**
 * Main API handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResearchResponse | any>
) {
  // Handle GET requests for polling results
  if (req.method === 'GET') {
    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: jobId',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      console.log(`🔍 Polling Caesar job: ${jobId}`);
      
      // Get job status and results from Caesar
      const job = await Caesar.getResearch(jobId);
      
      console.log(`📊 Job status: ${job.status}`);

      // If job is completed, parse the transformed_content (JSON)
      if (job.status === 'completed' && job.transformed_content) {
        try {
          const analysis = JSON.parse(job.transformed_content);
          
          return res.status(200).json({
            success: true,
            status: job.status,
            analysis, // Structured JSON from Caesar
            sources: job.results, // Citation sources
            rawContent: job.content, // Raw text synthesis
            timestamp: new Date().toISOString(),
          });
        } catch (parseError) {
          console.error('❌ Failed to parse Caesar response as JSON:', parseError);
          
          // Fallback: return raw content if JSON parsing fails
          return res.status(200).json({
            success: true,
            status: job.status,
            analysis: null,
            rawContent: job.content,
            sources: job.results,
            error: 'Failed to parse structured analysis, returning raw content',
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Job still processing or failed
      return res.status(200).json({
        success: true,
        status: job.status,
        analysis: null,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('❌ Failed to poll Caesar job:', error);
      
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get research results',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Handle POST requests for creating new research jobs
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const researchData: ResearchRequest = req.body;

    // Validate required data
    if (!researchData.symbol) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: symbol',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🤖 Starting Caesar research for ${researchData.symbol}...`);

    // Build comprehensive research query
    const query = buildResearchQuery(researchData);
    const systemPrompt = buildSystemPrompt();

    console.log(`📤 Sending request to Caesar API...`);
    console.log(`Query length: ${query.length} chars`);
    console.log(`System prompt length: ${systemPrompt.length} chars`);

    // Create Caesar research job (2 CU for balanced speed/depth)
    const job = await Caesar.createResearch({
      query,
      compute_units: 2,
      system_prompt: systemPrompt,
    });

    console.log(`✅ Caesar job created successfully`);
    console.log(`Job ID: ${job.id}`);
    console.log(`Initial status: ${job.status}`);

    // Return job ID immediately for polling
    return res.status(200).json({
      success: true,
      jobId: job.id,
      status: job.status,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ UCIE Research API Error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start research',
      timestamp: new Date().toISOString(),
    });
  }
}
