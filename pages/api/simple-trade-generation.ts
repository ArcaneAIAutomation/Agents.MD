import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple but reliable market data fetcher
async function fetchSimpleMarketData(symbol: string = 'BTC') {
  console.log(`📊 Fetching simple market data for ${symbol}...`);
  
  try {
    // Use CoinGecko as primary source (most reliable)
    const coinId = symbol === 'BTC' ? 'bitcoin' : 'ethereum';
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`;
    
    const headers: any = {};
    if (process.env.COINGECKO_API_KEY) {
      headers['x-cg-pro-api-key'] = process.env.COINGECKO_API_KEY;
    }

    const response = await fetch(url, { 
      headers,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.market_data) {
      throw new Error('No market data available');
    }

    const marketData = data.market_data;
    const sparkline = marketData.sparkline_7d?.price || [];
    
    // Calculate simple technical indicators
    const currentPrice = marketData.current_price.usd;
    const rsi = calculateSimpleRSI(sparkline);
    const sma20 = calculateSMA(sparkline, 20);
    const sma50 = calculateSMA(sparkline, 50);
    
    return {
      symbol,
      currentPrice,
      volume24h: marketData.total_volume.usd,
      marketCap: marketData.market_cap.usd,
      change24h: marketData.price_change_percentage_24h,
      change7d: marketData.price_change_percentage_7d,
      rsi,
      sma20,
      sma50,
      support: currentPrice * 0.95, // Simple support calculation
      resistance: currentPrice * 1.05, // Simple resistance calculation
      sparkline,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Market data fetch error:', error);
    
    // Fallback to static data
    const fallbackPrice = symbol === 'BTC' ? 43000 : 2500;
    return {
      symbol,
      currentPrice: fallbackPrice,
      volume24h: symbol === 'BTC' ? 20000000000 : 8000000000,
      marketCap: symbol === 'BTC' ? 850000000000 : 300000000000,
      change24h: 1.5,
      change7d: -2.1,
      rsi: 55,
      sma20: fallbackPrice * 0.99,
      sma50: fallbackPrice * 0.97,
      support: fallbackPrice * 0.95,
      resistance: fallbackPrice * 1.05,
      sparkline: [],
      timestamp: new Date().toISOString(),
      isFallback: true
    };
  }
}

// Simple RSI calculation
function calculateSimpleRSI(prices: number[]): number {
  if (prices.length < 14) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i < Math.min(15, prices.length); i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Simple Moving Average
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const recent = prices.slice(-period);
  return recent.reduce((sum, price) => sum + price, 0) / period;
}

// Generate simple but effective trade signal
async function generateSimpleTradeSignal(marketData: any) {
  try {
    console.log('🤖 Generating simple trade signal...');
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `You are an expert cryptocurrency trader. Generate a high-probability trade signal based on the provided market data.

MARKET DATA:
- Symbol: ${marketData.symbol}
- Current Price: $${marketData.currentPrice}
- 24h Change: ${marketData.change24h}%
- 7d Change: ${marketData.change7d}%
- RSI: ${marketData.rsi}
- SMA 20: $${marketData.sma20}
- SMA 50: $${marketData.sma50}
- Volume 24h: $${(marketData.volume24h / 1e9).toFixed(2)}B
- Market Cap: $${(marketData.marketCap / 1e9).toFixed(0)}B

Generate a trade signal with proper risk management (minimum 2:1 risk/reward ratio).`
        },
        {
          role: "user",
          content: `Based on the market data, generate a trade signal in JSON format:

{
  "id": "simple_trade_${Date.now()}",
  "symbol": "${marketData.symbol}/USD",
  "direction": "LONG" or "SHORT",
  "entryPrice": ${marketData.currentPrice},
  "stopLoss": number,
  "takeProfit": number,
  "riskRewardRatio": number,
  "confidence": number (70-90),
  "timeframe": "4H",
  "analysis": "market analysis based on provided data",
  "reasoning": "trade logic and risk management",
  "technicalIndicators": {
    "rsi": ${marketData.rsi},
    "macd": "BULLISH/BEARISH/NEUTRAL",
    "sma20": ${marketData.sma20},
    "sma50": ${marketData.sma50},
    "support": ${marketData.support},
    "resistance": ${marketData.resistance}
  },
  "marketConditions": "current market assessment",
  "riskLevel": "LOW/MEDIUM/HIGH",
  "expectedDuration": "4-12 hours",
  "dataQuality": {
    "source": "CoinGecko",
    "confidence": "HIGH",
    "isFallback": ${marketData.isFallback || false}
  },
  "timestamp": "${new Date().toISOString()}"
}`
        }
      ]
    });

    const tradeSignal = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Validate and calculate risk/reward
    if (tradeSignal.entryPrice && tradeSignal.stopLoss && tradeSignal.takeProfit) {
      const risk = Math.abs(tradeSignal.entryPrice - tradeSignal.stopLoss);
      const reward = Math.abs(tradeSignal.takeProfit - tradeSignal.entryPrice);
      tradeSignal.riskRewardRatio = parseFloat((reward / risk).toFixed(2));
      
      return tradeSignal;
    }
    
    throw new Error('Invalid trade signal structure');

  } catch (error) {
    console.error('Simple trade signal generation error:', error);
    
    // Generate fallback signal
    const direction = marketData.rsi < 30 ? 'LONG' : marketData.rsi > 70 ? 'SHORT' : 'LONG';
    const entryPrice = marketData.currentPrice;
    const stopLoss = direction === 'LONG' ? entryPrice * 0.97 : entryPrice * 1.03;
    const takeProfit = direction === 'LONG' ? entryPrice * 1.06 : entryPrice * 0.94;
    
    return {
      id: `simple_fallback_${Date.now()}`,
      symbol: `${marketData.symbol}/USD`,
      direction,
      entryPrice,
      stopLoss,
      takeProfit,
      riskRewardRatio: 2.0,
      confidence: 75,
      timeframe: "4H",
      analysis: `Simple technical analysis shows ${direction.toLowerCase()} opportunity based on RSI (${marketData.rsi.toFixed(1)}) and price action.`,
      reasoning: `${direction} signal based on RSI ${marketData.rsi < 30 ? 'oversold' : marketData.rsi > 70 ? 'overbought' : 'neutral'} condition. Risk management with 3% stop loss and 6% profit target.`,
      technicalIndicators: {
        rsi: marketData.rsi,
        macd: direction === 'LONG' ? 'BULLISH' : 'BEARISH',
        sma20: marketData.sma20,
        sma50: marketData.sma50,
        support: marketData.support,
        resistance: marketData.resistance
      },
      marketConditions: `${marketData.change24h > 0 ? 'Bullish' : 'Bearish'} momentum with ${marketData.rsi < 30 ? 'oversold' : marketData.rsi > 70 ? 'overbought' : 'neutral'} RSI`,
      riskLevel: "MEDIUM",
      expectedDuration: "4-12 hours",
      dataQuality: {
        source: "CoinGecko + Fallback",
        confidence: "MEDIUM",
        isFallback: true
      },
      timestamp: new Date().toISOString()
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const symbol = (req.query.symbol as string) || 'BTC';
    console.log(`🚀 Generating simple trade signal for ${symbol}...`);

    // Fetch market data
    const marketData = await fetchSimpleMarketData(symbol);
    
    // Generate trade signal
    const tradeSignal = await generateSimpleTradeSignal(marketData);
    
    console.log(`✅ Simple trade signal generated: ${tradeSignal.direction} ${symbol} at ${tradeSignal.entryPrice} (${tradeSignal.confidence}% confidence)`);
    
    res.status(200).json(tradeSignal);

  } catch (error) {
    console.error('Simple trade generation error:', error);
    res.status(500).json({
      error: 'Failed to generate simple trade signal',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}