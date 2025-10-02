import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced but reliable market data aggregator
class EnhancedMarketDataAggregator {
  private apis = {
    binance: 'https://api.binance.com/api/v3',
    coinbase: 'https://api.exchange.coinbase.com',
    coingecko: 'https://api.coingecko.com/api/v3',
    feargreed: 'https://api.alternative.me/fng'
  };

  // Fetch with timeout and error handling
  async fetchWithTimeout(url: string, timeout: number = 5000): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TradingBot/1.0)'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      return null;
    }
  }

  // Get comprehensive pricing data
  async getEnhancedPricing(symbol: string = 'BTC') {
    console.log(`📊 Fetching enhanced pricing for ${symbol}...`);
    
    const promises = [
      this.fetchBinanceData(symbol),
      this.fetchCoinbaseData(symbol),
      this.fetchCoingeckoData(symbol)
    ];

    const results = await Promise.allSettled(promises);
    const successfulResults = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => (result as PromiseFulfilledResult<any>).value);

    if (successfulResults.length === 0) {
      throw new Error('Failed to fetch pricing data from any exchange');
    }

    // Calculate average price and spread
    const prices = successfulResults.map(r => r.price).filter(p => p > 0);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const spread = prices.length > 1 ? (Math.max(...prices) - Math.min(...prices)) / avgPrice * 100 : 0;

    return {
      averagePrice: avgPrice,
      exchanges: successfulResults.length,
      spread: spread,
      data: successfulResults,
      timestamp: new Date().toISOString()
    };
  }

  // Binance data
  async fetchBinanceData(symbol: string) {
    try {
      const ticker = await this.fetchWithTimeout(`${this.apis.binance}/ticker/24hr?symbol=${symbol}USDT`);
      if (!ticker) return null;

      return {
        exchange: 'Binance',
        price: parseFloat(ticker.lastPrice),
        volume24h: parseFloat(ticker.volume),
        change24h: parseFloat(ticker.priceChangePercent)
      };
    } catch (error) {
      console.error('Binance error:', error);
      return null;
    }
  }

  // Coinbase data
  async fetchCoinbaseData(symbol: string) {
    try {
      const ticker = await this.fetchWithTimeout(`${this.apis.coinbase}/products/${symbol}-USD/ticker`);
      if (!ticker) return null;

      return {
        exchange: 'Coinbase',
        price: parseFloat(ticker.price),
        volume24h: parseFloat(ticker.volume),
        bid: parseFloat(ticker.bid),
        ask: parseFloat(ticker.ask)
      };
    } catch (error) {
      console.error('Coinbase error:', error);
      return null;
    }
  }

  // CoinGecko data
  async fetchCoingeckoData(symbol: string) {
    try {
      const coinId = symbol === 'BTC' ? 'bitcoin' : 'ethereum';
      const headers: any = {};
      if (process.env.COINGECKO_API_KEY) {
        headers['x-cg-pro-api-key'] = process.env.COINGECKO_API_KEY;
      }

      const data = await this.fetchWithTimeout(
        `${this.apis.coingecko}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
      );
      
      if (!data || !data.market_data) return null;

      return {
        exchange: 'CoinGecko',
        price: data.market_data.current_price.usd,
        volume24h: data.market_data.total_volume.usd,
        change24h: data.market_data.price_change_percentage_24h,
        marketCap: data.market_data.market_cap.usd
      };
    } catch (error) {
      console.error('CoinGecko error:', error);
      return null;
    }
  }

  // Get technical indicators from Binance klines
  async getTechnicalIndicators(symbol: string) {
    console.log(`📈 Calculating technical indicators for ${symbol}...`);
    
    try {
      const klines = await this.fetchWithTimeout(`${this.apis.binance}/klines?symbol=${symbol}USDT&interval=1h&limit=200`);
      if (!klines || !Array.isArray(klines)) {
        throw new Error('Failed to fetch klines data');
      }

      const closes = klines.map((k: any[]) => parseFloat(k[4]));
      const highs = klines.map((k: any[]) => parseFloat(k[2]));
      const lows = klines.map((k: any[]) => parseFloat(k[3]));
      const volumes = klines.map((k: any[]) => parseFloat(k[5]));

      return {
        rsi: this.calculateRSI(closes),
        macd: this.calculateMACD(closes),
        ema20: this.calculateEMA(closes, 20),
        ema50: this.calculateEMA(closes, 50),
        sma20: this.calculateSMA(closes, 20),
        sma50: this.calculateSMA(closes, 50),
        bollinger: this.calculateBollingerBands(closes),
        support: this.findSupport(lows, closes),
        resistance: this.findResistance(highs, closes),
        atr: this.calculateATR(highs, lows, closes),
        currentPrice: closes[closes.length - 1]
      };
    } catch (error) {
      console.error('Technical indicators error:', error);
      return null;
    }
  }

  // Get market sentiment
  async getMarketSentiment() {
    console.log(`📰 Fetching market sentiment...`);
    
    const promises = [
      this.fetchFearGreedIndex(),
      this.fetchBinanceFunding()
    ];

    const results = await Promise.allSettled(promises);
    const sentiment: any = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        if (index === 0) sentiment.fearGreed = result.value;
        if (index === 1) sentiment.funding = result.value;
      }
    });

    return sentiment;
  }

  // Fear & Greed Index
  async fetchFearGreedIndex() {
    try {
      const data = await this.fetchWithTimeout(`${this.apis.feargreed}/?limit=1`);
      if (!data || !data.data || !data.data[0]) return null;

      return {
        value: parseInt(data.data[0].value),
        classification: data.data[0].value_classification
      };
    } catch (error) {
      console.error('Fear & Greed error:', error);
      return null;
    }
  }

  // Binance funding rates
  async fetchBinanceFunding() {
    try {
      const data = await this.fetchWithTimeout(`${this.apis.binance}/premiumIndex?symbol=BTCUSDT`);
      if (!data) return null;

      return {
        fundingRate: parseFloat(data.lastFundingRate),
        markPrice: parseFloat(data.markPrice)
      };
    } catch (error) {
      console.error('Funding rates error:', error);
      return null;
    }
  }

  // Technical indicator calculations
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices: number[]) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    if (!ema12 || !ema26) return { line: 0, signal: 'NEUTRAL' };
    
    const macdLine = ema12 - ema26;
    return {
      line: macdLine,
      signal: macdLine > 0 ? 'BULLISH' : 'BEARISH'
    };
  }

  calculateEMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  calculateSMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const recent = prices.slice(-period);
    return recent.reduce((sum, price) => sum + price, 0) / period;
  }

  calculateBollingerBands(prices: number[], period: number = 20) {
    if (prices.length < period) return null;

    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((sum, price) => sum + price, 0) / period;
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: sma + (stdDev * 2),
      middle: sma,
      lower: sma - (stdDev * 2)
    };
  }

  calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number | null {
    if (closes.length < period + 1) return null;

    const trueRanges = [];
    for (let i = 1; i < closes.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    return trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
  }

  findSupport(lows: number[], closes: number[]): number {
    const currentPrice = closes[closes.length - 1];
    const recentLows = lows.slice(-50);
    const supportLevels = recentLows.filter(low => low < currentPrice).sort((a, b) => b - a);
    return supportLevels[0] || currentPrice * 0.95;
  }

  findResistance(highs: number[], closes: number[]): number {
    const currentPrice = closes[closes.length - 1];
    const recentHighs = highs.slice(-50);
    const resistanceLevels = recentHighs.filter(high => high > currentPrice).sort((a, b) => a - b);
    return resistanceLevels[0] || currentPrice * 1.05;
  }
}

// Enhanced AI trade signal generator
async function generateEnhancedTradeSignal(pricingData: any, technicalData: any, sentimentData: any, symbol: string) {
  try {
    console.log('🤖 Generating enhanced AI trade signal...');
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `You are an expert cryptocurrency trading AI with access to real-time market data from multiple exchanges and advanced technical analysis.

MARKET DATA:
${JSON.stringify(pricingData, null, 2)}

TECHNICAL ANALYSIS:
${JSON.stringify(technicalData, null, 2)}

MARKET SENTIMENT:
${JSON.stringify(sentimentData, null, 2)}

Generate a high-probability trade signal based on this comprehensive analysis. Focus on:
1. Multi-exchange price analysis and arbitrage opportunities
2. Technical indicator confluence and divergence
3. Market sentiment impact on price action
4. Risk management with proper stop-loss placement
5. Realistic profit targets based on volatility

Provide detailed reasoning for your trade recommendation.`
        },
        {
          role: "user",
          content: `Based on the comprehensive market data for ${symbol}, generate an optimal trade signal. Return JSON format:

{
  "id": "enhanced_trade_[timestamp]",
  "symbol": "${symbol}/USD",
  "direction": "LONG" or "SHORT",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "riskRewardRatio": number,
  "confidence": number (75-95),
  "timeframe": "4H",
  "analysis": "comprehensive market analysis",
  "reasoning": "detailed trade logic",
  "technicalIndicators": {
    "rsi": ${technicalData?.rsi || 50},
    "macd": "${technicalData?.macd?.signal || 'NEUTRAL'}",
    "ema20": ${technicalData?.ema20 || pricingData.averagePrice},
    "ema50": ${technicalData?.ema50 || pricingData.averagePrice},
    "support": ${technicalData?.support || pricingData.averagePrice * 0.95},
    "resistance": ${technicalData?.resistance || pricingData.averagePrice * 1.05},
    "atr": ${technicalData?.atr || pricingData.averagePrice * 0.02},
    "bollinger": "${technicalData?.bollinger ? 'CALCULATED' : 'ESTIMATED'}"
  },
  "marketConditions": "current market regime assessment",
  "sentimentAnalysis": "fear/greed and funding rate impact",
  "riskLevel": "LOW/MEDIUM/HIGH",
  "expectedDuration": "4-12 hours",
  "dataQuality": {
    "exchangesCovered": ${pricingData.exchanges},
    "technicalIndicators": ${technicalData ? Object.keys(technicalData).length : 0},
    "sentimentSources": ${sentimentData ? Object.keys(sentimentData).length : 0},
    "priceSpread": ${pricingData.spread?.toFixed(4) || 0},
    "confidence": "HIGH"
  },
  "timestamp": "${new Date().toISOString()}"
}`
        }
      ]
    });

    const tradeSignal = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Validate and enhance
    if (tradeSignal.entryPrice && tradeSignal.stopLoss && tradeSignal.takeProfit) {
      const risk = Math.abs(tradeSignal.entryPrice - tradeSignal.stopLoss);
      const reward = Math.abs(tradeSignal.takeProfit - tradeSignal.entryPrice);
      tradeSignal.riskRewardRatio = parseFloat((reward / risk).toFixed(2));
      tradeSignal.id = `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return tradeSignal;
    }
    
    throw new Error('Invalid trade signal structure');

  } catch (error) {
    console.error('Enhanced trade signal generation error:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const symbol = (req.query.symbol as string) || 'BTC';
    console.log(`🚀 Generating enhanced trade signal for ${symbol}...`);

    // Initialize aggregator
    const aggregator = new EnhancedMarketDataAggregator();

    // Fetch data with timeout protection
    console.log('📊 Fetching enhanced market data...');
    const [pricingData, technicalData, sentimentData] = await Promise.allSettled([
      aggregator.getEnhancedPricing(symbol),
      aggregator.getTechnicalIndicators(symbol),
      aggregator.getMarketSentiment()
    ]);

    // Extract successful results
    const pricing = pricingData.status === 'fulfilled' ? pricingData.value : null;
    const technical = technicalData.status === 'fulfilled' ? technicalData.value : null;
    const sentiment = sentimentData.status === 'fulfilled' ? sentimentData.value : null;

    // Validate minimum data requirements
    if (!pricing || pricing.exchanges < 1) {
      throw new Error('Insufficient pricing data - need at least 1 exchange');
    }

    console.log(`✅ Data collected: ${pricing.exchanges} exchanges, ${technical ? 'technical OK' : 'technical failed'}, ${sentiment ? 'sentiment OK' : 'sentiment failed'}`);

    // Generate enhanced trade signal
    console.log('🤖 Generating AI trade signal...');
    const enhancedTradeSignal = await generateEnhancedTradeSignal(pricing, technical, sentiment, symbol);

    console.log(`✅ Enhanced trade signal generated: ${enhancedTradeSignal.direction} ${symbol} at ${enhancedTradeSignal.entryPrice} (${enhancedTradeSignal.confidence}% confidence)`);

    res.status(200).json(enhancedTradeSignal);

  } catch (error) {
    console.error('Enhanced trade generation error:', error);
    res.status(500).json({
      error: 'Failed to generate enhanced trade signal',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}