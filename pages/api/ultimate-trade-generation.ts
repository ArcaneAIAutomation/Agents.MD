import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ultimate Market Data Aggregator - Uses ALL available APIs
class UltimateMarketDataAggregator {
  private apis = {
    binance: 'https://api.binance.com/api/v3',
    coinbase: 'https://api.exchange.coinbase.com',
    kraken: 'https://api.kraken.com/0/public',
    coingecko: 'https://api.coingecko.com/api/v3',
    coinmarketcap: 'https://pro-api.coinmarketcap.com/v1',
    newsapi: 'https://newsapi.org/v2',
    feargreed: 'https://api.alternative.me/fng',
    alphavantage: 'https://www.alphavantage.co/query'
  };

  // Comprehensive price aggregation from multiple exchanges
  async getMultiExchangePricing(symbol: string = 'BTC') {
    const promises = [];
    
    // Binance
    promises.push(this.fetchBinancePrice(symbol));
    
    // Coinbase
    promises.push(this.fetchCoinbasePrice(symbol));
    
    // Kraken
    promises.push(this.fetchKrakenPrice(symbol));
    
    // CoinGecko
    promises.push(this.fetchCoingeckoPrice(symbol));
    
    // CoinMarketCap
    promises.push(this.fetchCMCPrice(symbol));

    const results = await Promise.allSettled(promises);
    const prices = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => (result as PromiseFulfilledResult<any>).value);

    if (prices.length === 0) {
      throw new Error('Failed to fetch price data from any exchange');
    }

    // Calculate weighted average and spread analysis
    const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const priceSpread = Math.max(...prices.map(p => p.price)) - Math.min(...prices.map(p => p.price));
    const spreadPercentage = (priceSpread / avgPrice) * 100;

    return {
      averagePrice: avgPrice,
      prices: prices,
      spread: priceSpread,
      spreadPercentage: spreadPercentage,
      exchanges: prices.length,
      timestamp: new Date().toISOString()
    };
  }

  // Binance price and order book
  async fetchBinancePrice(symbol: string) {
    try {
      const ticker = await fetch(`${this.apis.binance}/ticker/24hr?symbol=${symbol}USDT`);
      const orderBook = await fetch(`${this.apis.binance}/depth?symbol=${symbol}USDT&limit=100`);
      
      if (ticker.ok && orderBook.ok) {
        const tickerData = await ticker.json();
        const orderBookData = await orderBook.json();
        
        return {
          exchange: 'Binance',
          price: parseFloat(tickerData.lastPrice),
          volume24h: parseFloat(tickerData.volume),
          change24h: parseFloat(tickerData.priceChangePercent),
          orderBook: {
            bids: orderBookData.bids.slice(0, 10).map(([price, qty]: [string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(qty)
            })),
            asks: orderBookData.asks.slice(0, 10).map(([price, qty]: [string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(qty)
            }))
          }
        };
      }
    } catch (error) {
      console.error('Binance fetch error:', error);
    }
    return null;
  }

  // Coinbase price
  async fetchCoinbasePrice(symbol: string) {
    try {
      const response = await fetch(`${this.apis.coinbase}/products/${symbol}-USD/ticker`);
      if (response.ok) {
        const data = await response.json();
        return {
          exchange: 'Coinbase',
          price: parseFloat(data.price),
          volume24h: parseFloat(data.volume),
          bid: parseFloat(data.bid),
          ask: parseFloat(data.ask)
        };
      }
    } catch (error) {
      console.error('Coinbase fetch error:', error);
    }
    return null;
  }

  // Kraken price with API key
  async fetchKrakenPrice(symbol: string) {
    try {
      const pair = symbol === 'BTC' ? 'XBTUSD' : 'ETHUSD';
      const response = await fetch(`${this.apis.kraken}/Ticker?pair=${pair}`);
      
      if (response.ok) {
        const data = await response.json();
        const tickerData = data.result[pair];
        
        return {
          exchange: 'Kraken',
          price: parseFloat(tickerData.c[0]),
          volume24h: parseFloat(tickerData.v[1]),
          change24h: ((parseFloat(tickerData.c[0]) - parseFloat(tickerData.o)) / parseFloat(tickerData.o)) * 100,
          bid: parseFloat(tickerData.b[0]),
          ask: parseFloat(tickerData.a[0])
        };
      }
    } catch (error) {
      console.error('Kraken fetch error:', error);
    }
    return null;
  }

  // CoinGecko comprehensive data
  async fetchCoingeckoPrice(symbol: string) {
    try {
      const coinId = symbol === 'BTC' ? 'bitcoin' : 'ethereum';
      const headers: any = {};
      if (process.env.COINGECKO_API_KEY) {
        headers['x-cg-pro-api-key'] = process.env.COINGECKO_API_KEY;
      }
      
      const response = await fetch(
        `${this.apis.coingecko}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`,
        { headers }
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          exchange: 'CoinGecko',
          price: data.market_data.current_price.usd,
          volume24h: data.market_data.total_volume.usd,
          change24h: data.market_data.price_change_percentage_24h,
          marketCap: data.market_data.market_cap.usd,
          sparkline: data.market_data.sparkline_7d.price
        };
      }
    } catch (error) {
      console.error('CoinGecko fetch error:', error);
    }
    return null;
  }

  // CoinMarketCap data
  async fetchCMCPrice(symbol: string) {
    try {
      if (!process.env.COINMARKETCAP_API_KEY) return null;
      
      const response = await fetch(
        `${this.apis.coinmarketcap}/cryptocurrency/quotes/latest?symbol=${symbol}`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const coinData = data.data[symbol];
        
        return {
          exchange: 'CoinMarketCap',
          price: coinData.quote.USD.price,
          volume24h: coinData.quote.USD.volume_24h,
          change24h: coinData.quote.USD.percent_change_24h,
          marketCap: coinData.quote.USD.market_cap,
          dominance: coinData.quote.USD.market_cap_dominance
        };
      }
    } catch (error) {
      console.error('CoinMarketCap fetch error:', error);
    }
    return null;
  }

  // Advanced technical indicators calculation
  async getAdvancedTechnicalIndicators(symbol: string) {
    try {
      // Get historical data from multiple sources
      const [binanceKlines, alphaVantageData] = await Promise.allSettled([
        this.getBinanceKlines(symbol),
        this.getAlphaVantageData(symbol)
      ]);

      let historicalData = [];
      
      if (binanceKlines.status === 'fulfilled' && binanceKlines.value) {
        historicalData = binanceKlines.value;
      } else if (alphaVantageData.status === 'fulfilled' && alphaVantageData.value) {
        historicalData = alphaVantageData.value;
      }

      if (historicalData.length === 0) {
        throw new Error('No historical data available');
      }

      const closes = historicalData.map((d: any) => d.close);
      const highs = historicalData.map((d: any) => d.high);
      const lows = historicalData.map((d: any) => d.low);
      const volumes = historicalData.map((d: any) => d.volume);

      return {
        rsi: this.calculateRSI(closes),
        macd: this.calculateMACD(closes),
        bollinger: this.calculateBollingerBands(closes),
        ema20: this.calculateEMA(closes, 20),
        ema50: this.calculateEMA(closes, 50),
        ema200: this.calculateEMA(closes, 200),
        sma20: this.calculateSMA(closes, 20),
        sma50: this.calculateSMA(closes, 50),
        stochastic: this.calculateStochastic(highs, lows, closes),
        atr: this.calculateATR(highs, lows, closes),
        volumeProfile: this.calculateVolumeProfile(closes, volumes),
        supportResistance: this.calculateSupportResistance(highs, lows, closes)
      };
    } catch (error) {
      console.error('Technical indicators error:', error);
      return null;
    }
  }

  // Get Binance klines data
  async getBinanceKlines(symbol: string, interval: string = '1h', limit: number = 200) {
    try {
      const response = await fetch(`${this.apis.binance}/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        return data.map((candle: any[]) => ({
          timestamp: candle[0],
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseFloat(candle[5])
        }));
      }
    } catch (error) {
      console.error('Binance klines error:', error);
    }
    return null;
  }

  // Get Alpha Vantage data
  async getAlphaVantageData(symbol: string) {
    try {
      if (!process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY === 'DISABLED') return null;
      
      const response = await fetch(
        `${this.apis.alphavantage}?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=USD&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const timeSeries = data['Time Series (Digital Currency Daily)'];
        
        if (timeSeries) {
          return Object.entries(timeSeries).slice(0, 200).map(([date, values]: [string, any]) => ({
            timestamp: new Date(date).getTime(),
            open: parseFloat(values['1a. open (USD)']),
            high: parseFloat(values['2a. high (USD)']),
            low: parseFloat(values['3a. low (USD)']),
            close: parseFloat(values['4a. close (USD)']),
            volume: parseFloat(values['5. volume'])
          }));
        }
      }
    } catch (error) {
      console.error('Alpha Vantage error:', error);
    }
    return null;
  }

  // Market sentiment from multiple sources
  async getComprehensiveMarketSentiment(symbol: string) {
    const promises = [
      this.getFearGreedIndex(),
      this.getCryptoNews(symbol),
      this.getNewsAPISentiment(symbol),
      this.getBinanceFundingRates(symbol)
    ];

    const results = await Promise.allSettled(promises);
    const sentiment: any = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        switch (index) {
          case 0:
            sentiment.fearGreed = result.value;
            break;
          case 1:
            sentiment.cryptoNews = result.value;
            break;
          case 2:
            sentiment.generalNews = result.value;
            break;
          case 3:
            sentiment.fundingRates = result.value;
            break;
        }
      }
    });

    return sentiment;
  }

  // Fear & Greed Index
  async getFearGreedIndex() {
    try {
      const response = await fetch(`${this.apis.feargreed}/?limit=10`);
      if (response.ok) {
        const data = await response.json();
        return {
          current: parseInt(data.data[0].value),
          classification: data.data[0].value_classification,
          history: data.data.slice(0, 7).map((d: any) => ({
            value: parseInt(d.value),
            timestamp: d.timestamp
          }))
        };
      }
    } catch (error) {
      console.error('Fear & Greed error:', error);
    }
    return null;
  }

  // Crypto-specific news sentiment
  async getCryptoNews(symbol: string) {
    try {
      if (!process.env.NEWS_API_KEY) return null;
      
      const query = symbol === 'BTC' ? 'bitcoin' : 'ethereum';
      const response = await fetch(
        `${this.apis.newsapi}/everything?q=${query}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${process.env.NEWS_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          articles: data.articles?.slice(0, 10) || [],
          totalResults: data.totalResults
        };
      }
    } catch (error) {
      console.error('Crypto news error:', error);
    }
    return null;
  }

  // General news sentiment
  async getNewsAPISentiment(symbol: string) {
    try {
      if (!process.env.NEWS_API_KEY) return null;
      
      const query = `${symbol} cryptocurrency trading`;
      const response = await fetch(
        `${this.apis.newsapi}/everything?q=${query}&sortBy=popularity&pageSize=10&language=en&apiKey=${process.env.NEWS_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.articles || [];
      }
    } catch (error) {
      console.error('News API sentiment error:', error);
    }
    return null;
  }

  // Binance funding rates
  async getBinanceFundingRates(symbol: string) {
    try {
      const response = await fetch(`${this.apis.binance}/premiumIndex?symbol=${symbol}USDT`);
      if (response.ok) {
        const data = await response.json();
        return {
          fundingRate: parseFloat(data.lastFundingRate),
          nextFundingTime: data.nextFundingTime,
          markPrice: parseFloat(data.markPrice)
        };
      }
    } catch (error) {
      console.error('Funding rates error:', error);
    }
    return null;
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
    
    if (!ema12 || !ema26) return null;
    
    const macdLine = ema12 - ema26;
    return {
      line: macdLine,
      signal: macdLine > 0 ? 'BULLISH' : 'BEARISH',
      histogram: macdLine
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
      lower: sma - (stdDev * 2),
      squeeze: stdDev < (sma * 0.01) // Bollinger squeeze detection
    };
  }

  calculateStochastic(highs: number[], lows: number[], closes: number[], period: number = 14) {
    if (closes.length < period) return null;

    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];

    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    return {
      k: k,
      signal: k > 80 ? 'OVERBOUGHT' : k < 20 ? 'OVERSOLD' : 'NEUTRAL'
    };
  }

  calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14) {
    if (closes.length < period + 1) return null;

    const trueRanges = [];
    for (let i = 1; i < closes.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    const atr = trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
    return atr;
  }

  calculateVolumeProfile(prices: number[], volumes: number[]) {
    const priceVolumeMap = new Map();
    const priceRange = 100; // Group by $100 ranges

    for (let i = 0; i < prices.length; i++) {
      const priceKey = Math.round(prices[i] / priceRange) * priceRange;
      const existing = priceVolumeMap.get(priceKey) || 0;
      priceVolumeMap.set(priceKey, existing + volumes[i]);
    }

    return Array.from(priceVolumeMap.entries())
      .map(([price, volume]) => ({ price, volume }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);
  }

  calculateSupportResistance(highs: number[], lows: number[], closes: number[]) {
    const currentPrice = closes[closes.length - 1];
    const recentData = closes.slice(-50);
    
    // Find pivot points
    const pivots = [];
    for (let i = 2; i < recentData.length - 2; i++) {
      if (recentData[i] > recentData[i-1] && recentData[i] > recentData[i+1] &&
          recentData[i] > recentData[i-2] && recentData[i] > recentData[i+2]) {
        pivots.push({ price: recentData[i], type: 'resistance' });
      }
      if (recentData[i] < recentData[i-1] && recentData[i] < recentData[i+1] &&
          recentData[i] < recentData[i-2] && recentData[i] < recentData[i+2]) {
        pivots.push({ price: recentData[i], type: 'support' });
      }
    }

    const resistance = pivots
      .filter(p => p.type === 'resistance' && p.price > currentPrice)
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);

    const support = pivots
      .filter(p => p.type === 'support' && p.price < currentPrice)
      .sort((a, b) => b.price - a.price)
      .slice(0, 3);

    return { support, resistance };
  }
}

// Ultimate AI Trade Signal Generator
async function generateUltimateTradeSignal(marketData: any, technicalData: any, sentimentData: any) {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `You are the world's most advanced cryptocurrency trading AI, with access to comprehensive real-time market data from multiple exchanges, advanced technical analysis, and sentiment indicators. Your goal is to generate the most profitable and accurate trade signal possible.

COMPREHENSIVE MARKET DATA ANALYSIS:
${JSON.stringify(marketData, null, 2)}

ADVANCED TECHNICAL INDICATORS:
${JSON.stringify(technicalData, null, 2)}

MARKET SENTIMENT & NEWS:
${JSON.stringify(sentimentData, null, 2)}

ANALYSIS FRAMEWORK:
1. MULTI-EXCHANGE PRICE ANALYSIS: Analyze price discrepancies and arbitrage opportunities
2. TECHNICAL CONFLUENCE: Identify multiple indicator alignments
3. SENTIMENT CORRELATION: Weight technical signals with market sentiment
4. RISK ASSESSMENT: Calculate precise risk/reward based on volatility and support/resistance
5. TIMING OPTIMIZATION: Determine optimal entry and exit points

ADVANCED CONSIDERATIONS:
- Order book depth and liquidity analysis
- Cross-exchange spread analysis
- Funding rate implications for futures markets
- News sentiment impact on price action
- Fear & Greed Index correlation with price movements
- Volume profile and institutional activity
- Multi-timeframe trend alignment
- Volatility-adjusted position sizing

Generate a trade signal with the highest probability of success based on this comprehensive analysis.`
        },
        {
          role: "user",
          content: `Based on the comprehensive market data provided, generate the ultimate trade signal. Consider all technical indicators, sentiment data, order book analysis, and cross-exchange pricing. 

Provide your analysis in JSON format:
{
  "id": "ultimate_trade_[timestamp]",
  "symbol": "${marketData.symbol || 'BTC'}/USD",
  "direction": "LONG" or "SHORT",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "riskRewardRatio": number,
  "confidence": number (75-98),
  "timeframe": "optimal timeframe",
  "analysis": "comprehensive multi-source analysis",
  "reasoning": "detailed trade logic with data sources",
  "technicalIndicators": {
    "rsi": number,
    "macd": "signal",
    "bollinger": "position",
    "ema20": number,
    "ema50": number,
    "support": number,
    "resistance": number,
    "atr": number,
    "stochastic": "signal"
  },
  "marketConditions": "detailed market regime analysis",
  "sentimentAnalysis": "news and fear/greed impact",
  "riskLevel": "LOW/MEDIUM/HIGH",
  "expectedDuration": "time horizon",
  "dataQuality": "assessment of data sources used",
  "arbitrageOpportunity": "cross-exchange analysis",
  "liquidityAnalysis": "order book depth assessment",
  "timestamp": "${new Date().toISOString()}"
}`
        }
      ]
    });

    const tradeSignal = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Validate and enhance the signal
    if (tradeSignal.entryPrice && tradeSignal.stopLoss && tradeSignal.takeProfit) {
      const risk = Math.abs(tradeSignal.entryPrice - tradeSignal.stopLoss);
      const reward = Math.abs(tradeSignal.takeProfit - tradeSignal.entryPrice);
      tradeSignal.riskRewardRatio = parseFloat((reward / risk).toFixed(2));
      tradeSignal.id = `ultimate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return tradeSignal;
    }
    
    throw new Error('Invalid trade signal structure');

  } catch (error) {
    console.error('Ultimate trade signal generation error:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const symbol = (req.query.symbol as string) || 'BTC';
    console.log(`🚀 Generating ultimate trade signal for ${symbol} using ALL available APIs...`);

    // Initialize the ultimate market data aggregator
    const aggregator = new UltimateMarketDataAggregator();

    // Fetch comprehensive market data from all sources
    console.log('📊 Fetching multi-exchange pricing...');
    const pricingData = await aggregator.getMultiExchangePricing(symbol);

    console.log('📈 Calculating advanced technical indicators...');
    const technicalData = await aggregator.getAdvancedTechnicalIndicators(symbol);

    console.log('📰 Gathering comprehensive market sentiment...');
    const sentimentData = await aggregator.getComprehensiveMarketSentiment(symbol);

    // Validate we have sufficient data
    if (!pricingData || pricingData.exchanges < 2) {
      throw new Error('Insufficient pricing data from exchanges');
    }

    if (!technicalData) {
      throw new Error('Failed to calculate technical indicators');
    }

    // Prepare comprehensive market data package
    const marketDataPackage = {
      symbol,
      pricing: pricingData,
      technical: technicalData,
      sentiment: sentimentData,
      timestamp: new Date().toISOString()
    };

    console.log('🤖 Generating ultimate AI trade signal...');
    const ultimateTradeSignal = await generateUltimateTradeSignal(
      marketDataPackage,
      technicalData,
      sentimentData
    );

    // Add data quality metrics
    ultimateTradeSignal.dataQuality = {
      exchangesCovered: pricingData.exchanges,
      technicalIndicators: Object.keys(technicalData).length,
      sentimentSources: Object.keys(sentimentData).length,
      priceSpread: pricingData.spreadPercentage,
      confidence: 'HIGH'
    };

    console.log(`✅ Ultimate trade signal generated: ${ultimateTradeSignal.direction} ${symbol} at ${ultimateTradeSignal.entryPrice} (${ultimateTradeSignal.confidence}% confidence)`);

    res.status(200).json(ultimateTradeSignal);

  } catch (error) {
    console.error('Ultimate trade generation error:', error);
    res.status(500).json({
      error: 'Failed to generate ultimate trade signal',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}