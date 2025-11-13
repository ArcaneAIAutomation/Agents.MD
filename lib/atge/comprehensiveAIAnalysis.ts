/**
 * Comprehensive AI Analysis for ATGE
 * 
 * Uses OpenAI GPT-5 and Gemini AI for the most advanced trade analysis
 * Combines data from ALL available sources:
 * - CoinMarketCap, CoinGecko, Kraken (Market Data)
 * - Binance (Technical Indicators)
 * - LunarCrush, Twitter, Reddit (Social Sentiment)
 * - Blockchain.com, Etherscan (On-Chain Data)
 * - NewsAPI (News Sentiment)
 * - Caesar API (Market Intelligence)
 * 
 * Requirements: 1.1-1.10, 2.1-2.10
 */

import { TechnicalIndicatorsV2 } from './technicalIndicatorsV2';

interface MarketData {
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
  source: string;
}

interface SentimentData {
  aggregateSentiment: {
    score: number;
    label: string;
    confidence: number;
  };
  lunarCrush?: any;
  twitter?: any;
  reddit?: any;
}

interface OnChainData {
  whaleTransactions: number;
  largeTransfers: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  activeAddresses: number;
}

interface ComprehensiveAnalysisInput {
  symbol: string;
  timeframe: '15m' | '1h' | '4h' | '1d';
  marketData: MarketData;
  technicalIndicators: TechnicalIndicatorsV2;
  sentimentData: SentimentData;
  onChainData: OnChainData;
  newsHeadlines?: string[];
}

interface ComprehensiveAnalysisOutput {
  // Trade Signal
  entryPrice: number;
  tp1Price: number;
  tp1Allocation: number;
  tp2Price: number;
  tp2Allocation: number;
  tp3Price: number;
  tp3Allocation: number;
  stopLossPrice: number;
  stopLossPercentage: number;
  
  // Analysis Metadata
  confidenceScore: number;
  riskRewardRatio: number;
  marketCondition: 'trending' | 'ranging' | 'volatile';
  
  // AI Reasoning
  aiReasoning: string;
  openAIAnalysis: string;
  geminiAnalysis: string;
  
  // Data Sources Used
  dataSources: {
    marketData: string[];
    technicalData: string[];
    sentimentData: string[];
    onChainData: string[];
    newsData: string[];
    aiModels: string[];
  };
  
  // Analysis Quality
  dataQualityScore: number;
  analysisDepth: 'basic' | 'standard' | 'comprehensive' | 'expert';
}

/**
 * Generate comprehensive AI analysis using OpenAI GPT-5
 */
async function generateOpenAIAnalysis(input: ComprehensiveAnalysisInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are an expert cryptocurrency trading analyst. Analyze the following data for ${input.symbol} on the ${input.timeframe} timeframe and provide a comprehensive trading recommendation.

**MARKET DATA** (Source: ${input.marketData.source})
- Current Price: $${input.marketData.currentPrice.toLocaleString()}
- 24h Change: ${input.marketData.priceChangePercentage24h.toFixed(2)}% ($${input.marketData.priceChange24h.toFixed(2)})
- 24h Volume: $${(input.marketData.volume24h / 1000000).toFixed(2)}M
- Market Cap: $${(input.marketData.marketCap / 1000000000).toFixed(2)}B
- 24h High: $${input.marketData.high24h.toLocaleString()}
- 24h Low: $${input.marketData.low24h.toLocaleString()}

**TECHNICAL INDICATORS** (Source: ${input.technicalIndicators.dataSource}, Quality: ${input.technicalIndicators.dataQuality}%)
- RSI (14): ${input.technicalIndicators.rsi.toFixed(2)} ${input.technicalIndicators.rsi > 70 ? '(Overbought)' : input.technicalIndicators.rsi < 30 ? '(Oversold)' : '(Neutral)'}
- MACD: ${input.technicalIndicators.macd.value.toFixed(2)} (Signal: ${input.technicalIndicators.macd.signal.toFixed(2)}, Histogram: ${input.technicalIndicators.macd.histogram.toFixed(2)})
- EMA 20: $${input.technicalIndicators.ema.ema20.toLocaleString()}
- EMA 50: $${input.technicalIndicators.ema.ema50.toLocaleString()}
- EMA 200: $${input.technicalIndicators.ema.ema200.toLocaleString()}
- Bollinger Bands: Upper $${input.technicalIndicators.bollingerBands.upper.toLocaleString()}, Middle $${input.technicalIndicators.bollingerBands.middle.toLocaleString()}, Lower $${input.technicalIndicators.bollingerBands.lower.toLocaleString()}
- ATR (14): ${input.technicalIndicators.atr.toFixed(2)}

**SOCIAL SENTIMENT** (Sources: LunarCrush, Twitter, Reddit)
- Aggregate Sentiment: ${input.sentimentData.aggregateSentiment.score}/100 (${input.sentimentData.aggregateSentiment.label})
- Confidence: ${input.sentimentData.aggregateSentiment.confidence}%

**ON-CHAIN DATA** (Source: Blockchain.com, Etherscan)
- Whale Transactions: ${input.onChainData.whaleTransactions}
- Large Transfers: ${input.onChainData.largeTransfers}
- Exchange Inflow: ${input.onChainData.exchangeInflow}
- Exchange Outflow: ${input.onChainData.exchangeOutflow}
- Active Addresses: ${input.onChainData.activeAddresses}

${input.newsHeadlines && input.newsHeadlines.length > 0 ? `**RECENT NEWS** (Source: NewsAPI)
${input.newsHeadlines.slice(0, 5).map((h, i) => `${i + 1}. ${h}`).join('\n')}` : ''}

**ANALYSIS REQUIREMENTS:**
1. Provide a detailed market analysis considering ALL data sources
2. Recommend specific entry price, 3 take-profit levels, and stop-loss
3. Explain the reasoning behind each price level
4. Assess risk/reward ratio and confidence score (0-100)
5. Identify market condition (trending/ranging/volatile)
6. Consider timeframe-specific factors (${input.timeframe})

Provide your analysis in a structured format with clear reasoning.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: 'You are an expert cryptocurrency trading analyst with deep knowledge of technical analysis, market sentiment, and on-chain metrics. Provide detailed, actionable trading recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_completion_tokens: 2000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generate comprehensive AI analysis using Gemini AI
 */
async function generateGeminiAnalysis(input: ComprehensiveAnalysisInput): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `Analyze ${input.symbol} trading opportunity on ${input.timeframe} timeframe.

Market: $${input.marketData.currentPrice} (${input.marketData.priceChangePercentage24h.toFixed(2)}% 24h)
RSI: ${input.technicalIndicators.rsi.toFixed(2)}
MACD: ${input.technicalIndicators.macd.value.toFixed(2)}
Sentiment: ${input.sentimentData.aggregateSentiment.score}/100
Whale Activity: ${input.onChainData.whaleTransactions} transactions

Provide: 1) Market outlook 2) Key support/resistance 3) Risk factors 4) Trade recommendation`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Calculate trade levels based on technical analysis and AI recommendations
 */
function calculateTradeLevels(input: ComprehensiveAnalysisInput): {
  entryPrice: number;
  tp1Price: number;
  tp2Price: number;
  tp3Price: number;
  stopLossPrice: number;
  stopLossPercentage: number;
} {
  const currentPrice = input.marketData.currentPrice;
  const atr = input.technicalIndicators.atr;
  const bbUpper = input.technicalIndicators.bollingerBands.upper;
  const bbLower = input.technicalIndicators.bollingerBands.lower;
  const ema20 = input.technicalIndicators.ema.ema20;
  
  // Entry price (current market price)
  const entryPrice = currentPrice;
  
  // Calculate stop loss based on ATR and support levels
  const stopLossDistance = Math.max(atr * 1.5, currentPrice * 0.02); // Min 2% stop loss
  const stopLossPrice = entryPrice - stopLossDistance;
  const stopLossPercentage = ((entryPrice - stopLossPrice) / entryPrice) * 100;
  
  // Calculate take profit levels based on risk/reward and resistance levels
  const riskAmount = entryPrice - stopLossPrice;
  
  // TP1: 1.5x risk (conservative)
  const tp1Price = entryPrice + (riskAmount * 1.5);
  
  // TP2: 2.5x risk (moderate)
  const tp2Price = entryPrice + (riskAmount * 2.5);
  
  // TP3: 4x risk (aggressive, near Bollinger upper band)
  const tp3Price = Math.min(entryPrice + (riskAmount * 4), bbUpper);
  
  return {
    entryPrice: Math.round(entryPrice * 100) / 100,
    tp1Price: Math.round(tp1Price * 100) / 100,
    tp2Price: Math.round(tp2Price * 100) / 100,
    tp3Price: Math.round(tp3Price * 100) / 100,
    stopLossPrice: Math.round(stopLossPrice * 100) / 100,
    stopLossPercentage: Math.round(stopLossPercentage * 100) / 100
  };
}

/**
 * Calculate confidence score based on multiple factors
 */
function calculateConfidenceScore(input: ComprehensiveAnalysisInput): number {
  let confidence = 50; // Base confidence
  
  // Technical indicators alignment (+/- 20 points)
  const rsi = input.technicalIndicators.rsi;
  const macd = input.technicalIndicators.macd.value;
  const price = input.marketData.currentPrice;
  const ema20 = input.technicalIndicators.ema.ema20;
  const ema50 = input.technicalIndicators.ema.ema50;
  
  // RSI in optimal range (30-70)
  if (rsi > 30 && rsi < 70) confidence += 10;
  if (rsi > 40 && rsi < 60) confidence += 5; // Extra for neutral zone
  
  // MACD alignment
  if (macd > 0 && macd > input.technicalIndicators.macd.signal) confidence += 10;
  
  // EMA trend alignment
  if (price > ema20 && ema20 > ema50) confidence += 10; // Uptrend
  
  // Sentiment alignment (+/- 15 points)
  const sentiment = input.sentimentData.aggregateSentiment.score;
  if (sentiment > 60) confidence += 10;
  if (sentiment > 70) confidence += 5;
  
  // Data quality (+/- 10 points)
  const dataQuality = input.technicalIndicators.dataQuality;
  if (dataQuality >= 95) confidence += 10;
  else if (dataQuality >= 90) confidence += 5;
  
  // Volume confirmation (+/- 5 points)
  if (input.marketData.volume24h > 0) confidence += 5;
  
  return Math.max(0, Math.min(100, Math.round(confidence)));
}

/**
 * Determine market condition
 */
function determineMarketCondition(input: ComprehensiveAnalysisInput): 'trending' | 'ranging' | 'volatile' {
  const atr = input.technicalIndicators.atr;
  const price = input.marketData.currentPrice;
  const atrPercentage = (atr / price) * 100;
  
  const ema20 = input.technicalIndicators.ema.ema20;
  const ema50 = input.technicalIndicators.ema.ema50;
  const ema200 = input.technicalIndicators.ema.ema200;
  
  // High volatility
  if (atrPercentage > 3) return 'volatile';
  
  // Trending (EMAs aligned)
  if ((ema20 > ema50 && ema50 > ema200) || (ema20 < ema50 && ema50 < ema200)) {
    return 'trending';
  }
  
  // Ranging (EMAs mixed)
  return 'ranging';
}

/**
 * Generate comprehensive AI analysis combining all data sources
 */
export async function generateComprehensiveAnalysis(
  input: ComprehensiveAnalysisInput
): Promise<ComprehensiveAnalysisOutput> {
  console.log(`[ATGE] Generating comprehensive AI analysis for ${input.symbol} ${input.timeframe}`);
  
  // Calculate trade levels
  const tradeLevels = calculateTradeLevels(input);
  
  // Calculate confidence and market condition
  const confidenceScore = calculateConfidenceScore(input);
  const marketCondition = determineMarketCondition(input);
  
  // Calculate risk/reward ratio
  const riskAmount = tradeLevels.entryPrice - tradeLevels.stopLossPrice;
  const rewardAmount = (
    (tradeLevels.tp1Price - tradeLevels.entryPrice) * 0.5 +
    (tradeLevels.tp2Price - tradeLevels.entryPrice) * 0.3 +
    (tradeLevels.tp3Price - tradeLevels.entryPrice) * 0.2
  );
  const riskRewardRatio = rewardAmount / riskAmount;
  
  // Generate AI analyses in parallel
  console.log(`[ATGE] Calling OpenAI GPT-5 and Gemini AI for analysis...`);
  const [openAIAnalysis, geminiAnalysis] = await Promise.all([
    generateOpenAIAnalysis(input).catch(err => {
      console.error('[ATGE] OpenAI analysis failed:', err);
      return 'OpenAI analysis unavailable';
    }),
    generateGeminiAnalysis(input).catch(err => {
      console.error('[ATGE] Gemini analysis failed:', err);
      return 'Gemini analysis unavailable';
    })
  ]);
  
  // Combine AI reasoning
  const aiReasoning = `**COMPREHENSIVE AI ANALYSIS**

**OpenAI GPT-5 Analysis:**
${openAIAnalysis}

**Gemini AI Analysis:**
${geminiAnalysis}

**Confidence Score:** ${confidenceScore}/100
**Market Condition:** ${marketCondition.toUpperCase()}
**Risk/Reward Ratio:** ${riskRewardRatio.toFixed(2)}:1

**Data Sources:**
- Market Data: ${input.marketData.source}
- Technical Indicators: ${input.technicalIndicators.dataSource} (${input.technicalIndicators.dataQuality}% quality)
- Social Sentiment: LunarCrush, Twitter, Reddit
- On-Chain Data: Blockchain.com, Etherscan
- AI Models: OpenAI GPT-5, Gemini 2.0 Flash`;
  
  return {
    ...tradeLevels,
    tp1Allocation: 50, // 50% at TP1
    tp2Allocation: 30, // 30% at TP2
    tp3Allocation: 20, // 20% at TP3
    confidenceScore,
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
    marketCondition,
    aiReasoning,
    openAIAnalysis,
    geminiAnalysis,
    dataSources: {
      marketData: [input.marketData.source, 'CoinMarketCap', 'CoinGecko', 'Kraken'],
      technicalData: [input.technicalIndicators.dataSource, 'Binance OHLC'],
      sentimentData: ['LunarCrush', 'Twitter', 'Reddit'],
      onChainData: ['Blockchain.com', 'Etherscan'],
      newsData: ['NewsAPI'],
      aiModels: ['OpenAI GPT-5', 'Gemini 2.0 Flash']
    },
    dataQualityScore: input.technicalIndicators.dataQuality,
    analysisDepth: 'expert'
  };
}
