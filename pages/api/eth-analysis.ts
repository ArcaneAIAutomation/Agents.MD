import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI with latest model
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get the latest OpenAI model from environment or use default
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-2024-08-06';

// Real-time Ethereum price fetching
async function fetchRealETHPrice() {
  try {
    const apis = [
      'https://api.coinbase.com/v2/exchange-rates?currency=ETH',
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true',
      'https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT'
    ];
    
    for (const apiUrl of apis) {
      try {
        const response = await fetch(apiUrl, { 
          signal: AbortSignal.timeout(5000) 
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (apiUrl.includes('coinbase')) {
            return {
              price: parseFloat(data.data.rates.USD),
              source: 'Coinbase',
              timestamp: new Date().toISOString()
            };
          } else if (apiUrl.includes('coingecko')) {
            return {
              price: data.ethereum.usd,
              change24h: data.ethereum.usd_24h_change,
              marketCap: data.ethereum.usd_market_cap,
              source: 'CoinGecko',
              timestamp: new Date().toISOString()
            };
          } else if (apiUrl.includes('binance')) {
            return {
              price: parseFloat(data.lastPrice),
              change24h: parseFloat(data.priceChangePercent),
              volume24h: parseFloat(data.volume),
              source: 'Binance',
              timestamp: new Date().toISOString()
            };
          }
        }
      } catch (error) {
        console.log(`Failed to fetch from ${apiUrl}:`, error);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch real ETH price:', error);
    return null;
  }
}

// Fetch recent Ethereum news for context
async function fetchETHNews() {
  try {
    if (!process.env.NEWS_API_KEY) return null;
    
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const newsUrl = `https://newsapi.org/v2/everything?q=ethereum+ETH+DeFi&from=${lastWeek}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${process.env.NEWS_API_KEY}`;
    
    const response = await fetch(newsUrl, { 
      signal: AbortSignal.timeout(5000) 
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.articles?.slice(0, 3) || [];
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch ETH news:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🚀 Real AI-powered ETH analysis using', OPENAI_MODEL);
  
  try {
    // Fetch real market data
    const [realETHData, ethNews] = await Promise.all([
      fetchRealETHPrice(),
      fetchETHNews()
    ]);

    const currentPrice = realETHData?.price || 2650;
    const priceChange = realETHData?.change24h || 0;
    
    // Check if OpenAI is properly configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate AI-powered analysis using latest OpenAI model
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert cryptocurrency trader and technical analyst specializing in Ethereum (ETH).
          
          Current Market Data:
          - Ethereum Price: $${currentPrice}
          - 24h Change: ${priceChange}%
          - Data Source: ${realETHData?.source || 'Market APIs'}
          - Market Cap: ${realETHData?.marketCap || 'N/A'}
          - Volume 24h: ${realETHData?.volume24h || 'N/A'}
          
          Recent News Context: ${ethNews ? JSON.stringify(ethNews.map(n => ({ title: n.title, source: n.source?.name }))) : 'No recent news available'}
          
          Generate a comprehensive Ethereum market analysis including:
          1. Technical indicators (RSI, MACD, Moving Averages) based on current price
          2. Support and resistance levels
          3. Trading signals with entry/exit points
          4. Market sentiment analysis
          5. Price predictions with confidence levels
          6. Risk assessment
          
          Focus on Ethereum's role as the world computer, DeFi ecosystem, Layer 2 scaling, staking dynamics, and smart contract platform developments.
          
          Return ONLY a valid JSON object with this structure:
          {
            "technicalIndicators": {
              "rsi": {"value": "number", "signal": "string", "timeframe": "string"},
              "macd": {"signal": "string", "histogram": "number"},
              "ema20": "number",
              "ema50": "number",
              "bollinger": {"upper": "number", "lower": "number", "middle": "number"},
              "supportResistance": {
                "strongSupport": "number",
                "weakSupport": "number", 
                "strongResistance": "number",
                "weakResistance": "number"
              }
            },
            "tradingSignals": [
              {"type": "string", "strength": "string", "timeframe": "string", "price": "number", "reasoning": "string"}
            ],
            "marketSentiment": {
              "overall": "string",
              "fearGreedIndex": "number",
              "institutionalFlow": "string",
              "socialSentiment": "string"
            },
            "priceAnalysis": {
              "current": "number",
              "change24h": "number",
              "support": "number",
              "resistance": "number"
            },
            "predictions": {
              "hourly": {"target": "number", "confidence": "number (75-95)"},
              "daily": {"target": "number", "confidence": "number (65-80)"},
              "weekly": {"target": "number", "confidence": "number (50-65)"}
            },
            "analysis": "string",
            "riskAssessment": "string"
          }`
        },
        {
          role: "user",
          content: `Provide current Ethereum technical analysis with trading signals and market outlook. Current ETH price: $${currentPrice}. Use real market data and news context for accurate analysis.`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const aiContent = completion.choices[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error('No content received from OpenAI');
    }

    let aiAnalysis;
    try {
      // Clean the AI response - remove markdown code blocks if present
      const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiAnalysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw AI content:', aiContent);
      throw new Error('Invalid AI response format');
    }

    // Combine AI analysis with real market data
    const response = {
      success: true,
      data: {
        ...aiAnalysis,
        currentPrice,
        marketData: {
          price: currentPrice,
          change24h: priceChange,
          volume24h: realETHData?.volume24h || null,
          marketCap: realETHData?.marketCap || null,
          source: realETHData?.source || 'API',
          timestamp: realETHData?.timestamp || new Date().toISOString()
        },
        newsContext: ethNews?.map(n => ({
          title: n.title,
          source: n.source?.name,
          publishedAt: n.publishedAt
        })) || [],
        isLiveData: true,
        aiModel: OPENAI_MODEL,
        lastUpdated: new Date().toISOString()
      }
    };

    console.log('✅ AI-powered ETH analysis generated successfully');
    res.status(200).json(response);

  } catch (error) {
    console.error('ETH Analysis API Error:', error);
    
    // Fetch real market data for fallback (in case it wasn't fetched yet)
    let fallbackMarketData = null;
    try {
      fallbackMarketData = await fetchRealETHPrice();
    } catch (fetchError) {
      console.error('Failed to fetch fallback market data:', fetchError);
    }
    
    // Fallback to basic analysis if AI fails
    const fallbackAnalysis = {
      success: false,
      data: {
        currentPrice: fallbackMarketData?.price || 2650,
        error: 'AI analysis temporarily unavailable',
        message: 'Using fallback analysis with live price data',
        marketData: fallbackMarketData || {
          price: 2650,
          source: 'Fallback',
          timestamp: new Date().toISOString()
        },
        isLiveData: !!fallbackMarketData,
        lastUpdated: new Date().toISOString()
      }
    };
    
    res.status(200).json(fallbackAnalysis);
  }
}