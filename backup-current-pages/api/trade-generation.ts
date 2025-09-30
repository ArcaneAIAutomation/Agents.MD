import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fetch cryptocurrency market data from multiple timeframes
async function fetchCryptoMarketData(crypto: 'BTC' | 'ETH' = 'BTC') {
  try {
    const coinId = crypto === 'BTC' ? 'bitcoin' : 'ethereum';
    const symbol = crypto === 'BTC' ? 'BTC' : 'ETH';
    
    const endpoints = [
      // Current price and basic info
      `https://api.coinbase.com/v2/exchange-rates?currency=${symbol}`,
      // Historical data (simplified)
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily${process.env.COINGECKO_API_KEY ? `&x_cg_demo_api_key=${process.env.COINGECKO_API_KEY}` : ''}`,
      // Technical indicators (we'll simulate this with coingecko data)
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true${process.env.COINGECKO_API_KEY ? `&x_cg_demo_api_key=${process.env.COINGECKO_API_KEY}` : ''}`
    ];

    const promises = endpoints.map(url => 
      fetch(url).then(res => res.ok ? res.json() : null).catch(() => null)
    );

    const [exchangeData, chartData, detailedData] = await Promise.all(promises);

    // Calculate technical indicators from available data
    const currentPrice = exchangeData?.data?.rates?.USD ? parseFloat(exchangeData.data.rates.USD) : 
                        detailedData?.market_data?.current_price?.usd || (crypto === 'BTC' ? 45000 : 2500);

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
      crypto,
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
    console.error(`Error fetching ${crypto} market data:`, error);
    
    // Fallback data
    return {
      crypto,
      currentPrice: crypto === 'BTC' ? 45000 : 2500,
      sma20: crypto === 'BTC' ? 44500 : 2450,
      sma50: crypto === 'BTC' ? 43000 : 2400,
      rsi: 55,
      support: crypto === 'BTC' ? 42000 : 2300,
      resistance: crypto === 'BTC' ? 47000 : 2600,
      volume24h: crypto === 'BTC' ? 15000000000 : 8000000000,
      marketCap: crypto === 'BTC' ? 850000000000 : 300000000000,
      priceChange24h: 2.5,
      priceChange7d: -1.2,
      prices: [],
      sparkline: []
    };
  }
}

// Generate trade signal using advanced AI analysis with reasoning
async function generateTradeSignal(marketData: any) {
  try {
    const cryptoName = marketData.crypto === 'BTC' ? 'Bitcoin' : 'Ethereum';
    const symbol = `${marketData.crypto}/USD`;
    
    const completion = await openai.chat.completions.create({
      model: "o1-preview", // Latest reasoning model with chain-of-thought capabilities
      messages: [
        {
          role: "user",
          content: `You are an elite cryptocurrency trading algorithm with deep expertise in technical analysis, market structure, quantitative finance, and risk management. 

You must analyze ${cryptoName} market data across multiple timeframes and generate a single, high-probability trade signal using advanced step-by-step reasoning.

CRITICAL MARKET DATA:
- Current ${cryptoName} Price: $${marketData.currentPrice}
- SMA 20: $${marketData.sma20} | SMA 50: $${marketData.sma50}
- RSI: ${marketData.rsi.toFixed(1)} | Volume 24h: $${(marketData.volume24h / 1e9).toFixed(2)}B
- Support: $${marketData.support} | Resistance: $${marketData.resistance}
- 24h Change: ${marketData.priceChange24h.toFixed(2)}% | 7d Change: ${marketData.priceChange7d.toFixed(2)}%
- Market Cap: $${(marketData.marketCap / 1e9).toFixed(0)}B

REASONING FRAMEWORK - Think through each step:

1. MARKET REGIME ANALYSIS:
   - What is the current trend direction across timeframes?
   - Is the market in accumulation, distribution, or trending phase?
   - How does volume confirm or contradict price action?

2. TECHNICAL CONFLUENCE:
   - What story do the moving averages tell us?
   - How does RSI context affect entry timing?
   - Where are the most significant support/resistance zones?

3. RISK ASSESSMENT:
   - What is the maximum reasonable risk for this setup?
   - Where would this trade idea be invalidated?
   - What external factors could impact this trade?

4. ENTRY OPTIMIZATION:
   - What is the optimal entry strategy?
   - Should we wait for confirmation or enter at market?
   - How does current volatility affect position sizing?

5. EXIT STRATEGY:
   - Where are logical profit-taking levels?
   - What risk/reward ratio justifies this trade?
   - How long should this trade be held?

ADVANCED CONSIDERATIONS:
- Market microstructure and liquidity
- Institutional vs retail sentiment indicators
- Correlation with traditional markets (SPY, DXY, Gold)
- ${cryptoName}-specific factors (network activity, on-chain metrics${marketData.crypto === 'ETH' ? ', DeFi ecosystem health, gas fees' : ''})
- Seasonal patterns and time-of-day effects
- Options/futures expiry influences
- Regulatory news impact potential

STRICT TRADING RULES:
- Minimum 1:2.5 risk/reward ratio
- Stop loss must be at logical technical levels
- Entry within 1.5% of current price for immediate execution
- Confidence level must reflect genuine probability assessment
- Account for realistic slippage and trading fees
- No trade recommendations during extreme market uncertainty

Please think through this systematically, then provide your final trade recommendation in JSON format:

{
  "id": "unique_trade_id",
  "symbol": "${symbol}",
  "direction": "LONG" or "SHORT",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "riskRewardRatio": number,
  "confidence": number (65-95),
  "timeframe": "4H",
  "analysis": "comprehensive step-by-step market analysis with reasoning",
  "reasoning": "detailed trade logic, entry triggers, risk management rationale",
  "technicalIndicators": {
    "rsi": ${marketData.rsi.toFixed(1)},
    "macd": "BULLISH/BEARISH/NEUTRAL",
    "sma20": ${marketData.sma20},
    "sma50": ${marketData.sma50},
    "support": ${marketData.support},
    "resistance": ${marketData.resistance},
    "bollinger": {
      "upper": ${marketData.resistance * 1.025},
      "lower": ${marketData.support * 0.975},
      "middle": ${(marketData.resistance + marketData.support) / 2}
    }
  },
  "marketConditions": "detailed current market regime and structure assessment",
  "riskLevel": "LOW/MEDIUM/HIGH",
  "expectedDuration": "time horizon with supporting reasoning",
  "timestamp": "${new Date().toISOString()}"
}`
        }
      ],
      // Note: o1 models don't use temperature or max_tokens parameters
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
    console.error('Error generating trade signal with o1-preview:', error);
    
    // Enhanced fallback signal with reasoning-inspired analysis
    const isRSIOverBought = marketData.rsi > 70;
    const isRSIOverSold = marketData.rsi < 30;
    const isPriceAboveSMA20 = marketData.currentPrice > marketData.sma20;
    const isPriceAboveSMA50 = marketData.currentPrice > marketData.sma50;
    const isUpTrend = marketData.sma20 > marketData.sma50;
    const isStrongVolume = marketData.volume24h > (marketData.crypto === 'BTC' ? 20000000000 : 8000000000);
    
    // Multi-factor analysis (inspired by o1 reasoning)
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    if (isRSIOverSold) bullishSignals += 2;
    if (isPriceAboveSMA20) bullishSignals += 1;
    if (isPriceAboveSMA50) bullishSignals += 1;
    if (isUpTrend) bullishSignals += 1;
    if (marketData.priceChange24h > 2) bullishSignals += 1;
    
    if (isRSIOverBought) bearishSignals += 2;
    if (!isPriceAboveSMA20) bearishSignals += 1;
    if (!isPriceAboveSMA50) bearishSignals += 1;
    if (!isUpTrend) bearishSignals += 1;
    if (marketData.priceChange24h < -2) bearishSignals += 1;
    
    const direction = bullishSignals > bearishSignals ? 'LONG' : 'SHORT';
    const confidence = 60 + Math.min(25, Math.abs(bullishSignals - bearishSignals) * 5);
    
    const entryPrice = marketData.currentPrice;
    const stopLoss = direction === 'LONG' 
      ? Math.max(marketData.support, entryPrice * 0.975)  // 2.5% or support level
      : Math.min(marketData.resistance, entryPrice * 1.025); // 2.5% or resistance level
    const takeProfit = direction === 'LONG'
      ? entryPrice + (entryPrice - stopLoss) * 2.5  // 1:2.5 ratio
      : entryPrice - (stopLoss - entryPrice) * 2.5; // 1:2.5 ratio

    return {
      id: `o1_fallback_${Date.now()}`,
      symbol: `${marketData.crypto}/USD`,
      direction,
      entryPrice,
      stopLoss,
      takeProfit,
      riskRewardRatio: 2.5,
      confidence,
      timeframe: "4H",
      analysis: `Multi-factor technical analysis indicates ${direction === 'LONG' ? 'bullish' : 'bearish'} bias. RSI at ${marketData.rsi.toFixed(1)} ${isRSIOverSold ? '(oversold)' : isRSIOverBought ? '(overbought)' : '(neutral)'}. Price ${isPriceAboveSMA20 ? 'above' : 'below'} SMA20 and ${isPriceAboveSMA50 ? 'above' : 'below'} SMA50. Trend is ${isUpTrend ? 'bullish' : 'bearish'} with ${isStrongVolume ? 'strong' : 'moderate'} volume participation.`,
      reasoning: `${direction} signal generated through systematic multi-factor analysis. Bullish factors: ${bullishSignals}, Bearish factors: ${bearishSignals}. Entry at current market price with stop loss ${direction === 'LONG' ? 'below' : 'above'} key technical level (${direction === 'LONG' ? 'support' : 'resistance'}). Take profit targets 1:2.5 risk/reward ratio. Market conditions support ${confidence}% confidence level.`,
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
          middle: (marketData.resistance + marketData.support) / 2
        }
      },
      marketConditions: `${isUpTrend ? 'Bullish' : 'Bearish'} trend structure with ${isStrongVolume ? 'elevated' : 'normal'} volume. RSI showing ${isRSIOverSold ? 'oversold' : isRSIOverBought ? 'overbought' : 'neutral'} conditions.`,
      riskLevel: confidence > 75 ? "LOW" : confidence > 65 ? "MEDIUM" : "HIGH",
      expectedDuration: "4-12 hours based on 4H timeframe analysis",
      timestamp: new Date().toISOString(),
      isFallback: true,
      model: "fallback_with_o1_reasoning"
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
    // Get crypto parameter from query (default to BTC)
    const crypto = (req.query.crypto as 'BTC' | 'ETH') || 'BTC';
    
    // Fetch comprehensive cryptocurrency market data
    console.log(`Fetching ${crypto} market data for trade analysis...`);
    const marketData = await fetchCryptoMarketData(crypto);
    
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
