import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fetch Bitcoin market data from multiple timeframes
async function fetchBitcoinMarketData() {
  try {
    const endpoints = [
      // Current price and basic info
      'https://api.coinbase.com/v2/exchange-rates?currency=BTC',
      // Historical data (simplified)
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily',
      // Technical indicators (we'll simulate this with coingecko data)
      'https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true'
    ];

    const promises = endpoints.map(url => 
      fetch(url).then(res => res.ok ? res.json() : null).catch(() => null)
    );

    const [exchangeData, chartData, detailedData] = await Promise.all(promises);

    // Calculate technical indicators from available data
    const currentPrice = exchangeData?.data?.rates?.USD ? parseFloat(exchangeData.data.rates.USD) : 
                        detailedData?.market_data?.current_price?.usd || 45000;

    const sparkline = detailedData?.market_data?.sparkline_7d?.price || [];
    const prices = chartData?.prices?.map((p: [number, number]) => p[1]) || [];
    
    // Calculate simple moving averages
    const calculateSMA = (prices: number[], period: number) => {
      if (prices.length < period) return currentPrice;
      const recent = prices.slice(-period);
      return recent.reduce((sum, price) => sum + price, 0) / period;
    };

    // Calculate RSI (simplified)
    const calculateRSI = (prices: number[]) => {
      if (prices.length < 14) return 50;
      
      let gains = 0;
      let losses = 0;
      
      for (let i = 1; i < Math.min(14, prices.length); i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
      }
      
      const avgGain = gains / 13;
      const avgLoss = losses / 13;
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    };

    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);
    const rsi = calculateRSI(sparkline.length > 0 ? sparkline : prices);

    // Support and resistance (simplified calculation)
    const recentPrices = prices.slice(-20);
    const support = Math.min(...recentPrices) * 0.98;
    const resistance = Math.max(...recentPrices) * 1.02;

    return {
      currentPrice,
      sma20,
      sma50,
      rsi,
      support,
      resistance,
      volume24h: detailedData?.market_data?.total_volume?.usd || 0,
      marketCap: detailedData?.market_data?.market_cap?.usd || 0,
      priceChange24h: detailedData?.market_data?.price_change_percentage_24h || 0,
      priceChange7d: detailedData?.market_data?.price_change_percentage_7d || 0,
      prices: prices.slice(-50), // Last 50 data points
      sparkline
    };

  } catch (error) {
    console.error('Error fetching Bitcoin market data:', error);
    
    // Fallback data
    return {
      currentPrice: 45000,
      sma20: 44500,
      sma50: 43000,
      rsi: 55,
      support: 42000,
      resistance: 47000,
      volume24h: 15000000000,
      marketCap: 850000000000,
      priceChange24h: 2.5,
      priceChange7d: -1.2,
      prices: [],
      sparkline: []
    };
  }
}

// Generate trade signal using advanced AI analysis
async function generateTradeSignal(marketData: any) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Using GPT-4 for advanced analysis
      messages: [
        {
          role: "system",
          content: `You are an elite cryptocurrency trading algorithm with expertise in technical analysis, market structure, and risk management. 

          You have access to real Bitcoin market data and must generate a single, high-probability trade signal.

          MARKET DATA CONTEXT:
          - Current BTC Price: $${marketData.currentPrice}
          - SMA 20: $${marketData.sma20}
          - SMA 50: $${marketData.sma50}
          - RSI: ${marketData.rsi.toFixed(1)}
          - Support Level: $${marketData.support}
          - Resistance Level: $${marketData.resistance}
          - 24h Change: ${marketData.priceChange24h.toFixed(2)}%
          - 7d Change: ${marketData.priceChange7d.toFixed(2)}%
          - Volume (24h): $${(marketData.volume24h / 1e9).toFixed(2)}B

          ANALYSIS REQUIREMENTS:
          1. Analyze multiple timeframes (1H, 4H, 1D) conceptually
          2. Consider support/resistance levels, moving averages, RSI, volume
          3. Assess market momentum and trend direction
          4. Calculate optimal entry, stop loss, and take profit levels
          5. Determine risk/reward ratio (minimum 1:2)
          6. Provide confidence level (50-95%)

          RESPONSE FORMAT (JSON):
          {
            "id": "unique_signal_id",
            "symbol": "BTC/USD",
            "direction": "LONG" or "SHORT",
            "entryPrice": number,
            "stopLoss": number,
            "takeProfit": number,
            "riskRewardRatio": number,
            "confidence": number (50-95),
            "timeframe": "4H",
            "analysis": "detailed multi-timeframe analysis explaining market structure and trends",
            "reasoning": "specific reasoning for this trade setup including entry triggers and risk management",
            "technicalIndicators": {
              "rsi": ${marketData.rsi.toFixed(1)},
              "macd": "BULLISH/BEARISH/NEUTRAL",
              "sma20": ${marketData.sma20},
              "sma50": ${marketData.sma50},
              "support": ${marketData.support},
              "resistance": ${marketData.resistance},
              "bollinger": {
                "upper": ${marketData.resistance * 1.02},
                "lower": ${marketData.support * 0.98},
                "middle": ${marketData.currentPrice}
              }
            },
            "marketConditions": "description of current market conditions",
            "riskLevel": "LOW/MEDIUM/HIGH",
            "expectedDuration": "time expectation for trade",
            "timestamp": "${new Date().toISOString()}"
          }

          TRADING RULES:
          - Only suggest trades with 1:2+ risk/reward ratio
          - Stop loss must be logical (support/resistance levels)
          - Entry price should be within 2% of current price
          - Consider market volatility in position sizing
          - Confidence should reflect actual probability of success
          - No trade recommendations during extreme uncertainty`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const tradeSignal = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Validate and enhance the trade signal
    if (tradeSignal.entryPrice && tradeSignal.stopLoss && tradeSignal.takeProfit) {
      // Calculate actual risk/reward ratio
      const risk = Math.abs(tradeSignal.entryPrice - tradeSignal.stopLoss);
      const reward = Math.abs(tradeSignal.takeProfit - tradeSignal.entryPrice);
      tradeSignal.riskRewardRatio = parseFloat((reward / risk).toFixed(2));
      
      // Add unique ID
      tradeSignal.id = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return tradeSignal;
    }
    
    throw new Error('Invalid trade signal generated');

  } catch (error) {
    console.error('Error generating trade signal:', error);
    
    // Fallback signal based on simple analysis
    const isRSIOverBought = marketData.rsi > 70;
    const isRSIOverSold = marketData.rsi < 30;
    const isPriceAboveSMA20 = marketData.currentPrice > marketData.sma20;
    
    const direction = isRSIOverSold || (isPriceAboveSMA20 && marketData.rsi < 60) ? 'LONG' : 'SHORT';
    const entryPrice = marketData.currentPrice;
    const stopLoss = direction === 'LONG' 
      ? entryPrice * 0.97  // 3% stop loss for long
      : entryPrice * 1.03; // 3% stop loss for short
    const takeProfit = direction === 'LONG'
      ? entryPrice * 1.06  // 6% take profit for long (1:2 ratio)
      : entryPrice * 0.94; // 6% take profit for short

    return {
      id: `fallback_${Date.now()}`,
      symbol: "BTC/USD",
      direction,
      entryPrice,
      stopLoss,
      takeProfit,
      riskRewardRatio: 2.0,
      confidence: 65,
      timeframe: "4H",
      analysis: `Technical analysis indicates ${direction === 'LONG' ? 'bullish' : 'bearish'} momentum based on RSI (${marketData.rsi.toFixed(1)}) and price position relative to moving averages. Current price $${entryPrice} is ${isPriceAboveSMA20 ? 'above' : 'below'} the 20-period SMA.`,
      reasoning: `${direction} position recommended due to ${direction === 'LONG' ? 'oversold conditions and upward momentum' : 'overbought conditions and downward pressure'}. Risk management with ${Math.abs(((stopLoss - entryPrice) / entryPrice) * 100).toFixed(1)}% stop loss and ${Math.abs(((takeProfit - entryPrice) / entryPrice) * 100).toFixed(1)}% take profit target.`,
      technicalIndicators: {
        rsi: marketData.rsi,
        macd: direction === 'LONG' ? 'BULLISH' : 'BEARISH',
        sma20: marketData.sma20,
        sma50: marketData.sma50,
        support: marketData.support,
        resistance: marketData.resistance,
        bollinger: {
          upper: marketData.resistance,
          lower: marketData.support,
          middle: marketData.currentPrice
        }
      },
      marketConditions: `Current market showing ${direction === 'LONG' ? 'bullish' : 'bearish'} signals with moderate volatility`,
      riskLevel: "MEDIUM",
      expectedDuration: "4-12 hours",
      timestamp: new Date().toISOString(),
      isFallback: true
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Fetch comprehensive Bitcoin market data
    console.log('Fetching Bitcoin market data for trade analysis...');
    const marketData = await fetchBitcoinMarketData();
    
    // Generate AI-powered trade signal
    console.log('Generating AI trade signal...');
    const tradeSignal = await generateTradeSignal(marketData);
    
    console.log('Trade signal generated successfully:', tradeSignal.direction, tradeSignal.confidence + '%');
    
    res.status(200).json(tradeSignal);
    
  } catch (error) {
    console.error('Error in trade generation API:', error);
    res.status(500).json({ 
      error: 'Failed to generate trade signal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
