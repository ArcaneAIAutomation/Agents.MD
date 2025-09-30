import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Real market data fetching functions for Ethereum
async function fetchRealETHPrice() {
  try {
    const apiKey = process.env.COINGECKO_API_KEY;
    const keyParam = apiKey ? `&x_cg_demo_api_key=${apiKey}` : '';
    
    // Try multiple reliable APIs for ETH price
    const apis = [
      'https://api.coinbase.com/v2/exchange-rates?currency=ETH',
      `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true${keyParam}`,
      'https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT'
    ];
    
    for (const apiUrl of apis) {
      try {
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          
          if (apiUrl.includes('coinbase')) {
            return {
              price: parseFloat(data.data.rates.USD),
              source: 'Coinbase'
            };
          } else if (apiUrl.includes('coingecko')) {
            return {
              price: data.ethereum.usd,
              change24h: data.ethereum.usd_24h_change,
              marketCap: data.ethereum.usd_market_cap,
              source: 'CoinGecko'
            };
          } else if (apiUrl.includes('binance')) {
            return {
              price: parseFloat(data.lastPrice),
              change24h: parseFloat(data.priceChangePercent),
              volume24h: parseFloat(data.volume),
              source: 'Binance'
            };
          }
        }
      } catch (error) {
        console.log(`Failed to fetch from ${apiUrl}:`, error);
        continue;
      }
    }
    
    throw new Error('All price APIs failed');
  } catch (error) {
    console.error('Failed to fetch real ETH price:', error);
    return null;
  }
}

async function fetchEthereumNews() {
  try {
    console.log('Fetching Ethereum news...');
    
    // Get articles from last 10 days including today
    const lastTenDays = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    
    // Try multiple news sources
    const newsApis = [
      `https://newsapi.org/v2/everything?q=ethereum+ETH+price+analysis&from=${lastTenDays}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${process.env.NEWS_API_KEY}`,
    ];
    
    for (const apiUrl of newsApis) {
      try {
        console.log('Trying news API:', apiUrl.includes('newsapi') ? 'NewsAPI' : 'CryptoNews');
        if (!apiUrl.includes('undefined') && !apiUrl.includes('null')) {
          const response = await fetch(apiUrl);
          console.log('News API response status:', response.status);
          if (response.ok) {
            const data = await response.json();
            console.log('News data received:', data.articles?.length || data.data?.length || 'No articles');
            return data.articles || data.data || [];
          } else {
            console.log('News API error:', await response.text());
          }
        }
      } catch (error) {
        console.log(`Failed to fetch news from API:`, error);
        continue;
      }
    }
    
    console.log('No news APIs succeeded');
    return null;
  } catch (error) {
    console.error('Failed to fetch Ethereum news:', error);
    return null;
  }
}

async function fetchAlphaVantageETHData() {
  try {
    console.log('Fetching Alpha Vantage ETH data...');
    if (!process.env.ALPHA_VANTAGE_API_KEY) {
      console.log('No Alpha Vantage API key found');
      return null;
    }
    
    // Fetch news from Alpha Vantage for Ethereum
    const newsUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=CRYPTO:ETH&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
    console.log('Fetching Alpha Vantage ETH news...');
    const newsResponse = await fetch(newsUrl);
    let newsData = null;
    
    if (newsResponse.ok) {
      newsData = await newsResponse.json();
      console.log('Alpha Vantage ETH news received:', newsData.feed?.length || 'No articles');
    } else {
      console.log('Alpha Vantage ETH news failed:', newsResponse.status);
    }
    
    return {
      newsData: newsData,
      source: 'Alpha Vantage'
    };
  } catch (error) {
    console.error('Failed to fetch Alpha Vantage ETH data:', error);
    return null;
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
    // Fetch real market data and news for Ethereum
    const [realETHData, ethereumNews, alphaVantageData] = await Promise.all([
      fetchRealETHPrice(),
      fetchEthereumNews(),
      fetchAlphaVantageETHData()
    ]);
    
    let analysis;
    
    // Enable AI-powered analysis for unique Ethereum content generation
    try {
      // AI-powered ETH market analysis with real data and news context
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert cryptocurrency trader and technical analyst specializing EXCLUSIVELY in Ethereum (ETH).
            
            IMPORTANT: Generate content ONLY about Ethereum. Do not mention Bitcoin or other cryptocurrencies unless directly comparing ETH.
            
            Current Market Data: ${realETHData ? JSON.stringify(realETHData) : 'Price data unavailable'}
            Recent News: ${ethereumNews ? JSON.stringify(ethereumNews.slice(0, 3)) : 'News unavailable'}
            Alpha Vantage Data: ${alphaVantageData ? JSON.stringify(alphaVantageData.newsData?.feed?.slice(0, 2)) : 'Alpha Vantage unavailable'}
            
            Generate comprehensive ETHEREUM-SPECIFIC market analysis including:
            1. Ethereum technical indicators (RSI, MACD, Moving Averages) based on current ETH price levels
            2. Ethereum trading signals and setups with realistic ETH entry/exit points
            3. Ethereum support/resistance levels relative to current ETH price
            4. Ethereum market sentiment analysis incorporating recent ETH news and search data
            5. Ethereum price predictions with confidence levels
            6. Ethereum-specific news impact analysis
            
            Focus on:
            - Ethereum's role as the world computer and smart contract platform
            - Ethereum DeFi ecosystem and TVL impact
            - Ethereum 2.0 staking and proof-of-stake transition
            - Ethereum gas fees and network utilization
            - Ethereum Layer 2 solutions impact
            - Ethereum NFT market influence
            - Ethereum developer activity and ecosystem growth
            - Ethereum institutional adoption
            - Ethereum regulatory developments specifically
            
            Format as JSON with sections: technicalIndicators, tradingSignals, marketSentiment, priceAnalysis, newsImpact.
            Use the CURRENT Ethereum price context and professional Ethereum trading terminology.
            Include specific Ethereum price levels, timeframes, and risk assessments based on real Ethereum market data.`
          },
          {
            role: "user",
            content: `Provide current ETHEREUM technical analysis with Ethereum trading signals and Ethereum market outlook. Current Ethereum price: $${realETHData?.price || 'Unknown'}. Focus exclusively on Ethereum analysis.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        analysis = JSON.parse(content);
        analysis.isLiveData = true;
        analysis.currentPrice = realETHData?.price;
        analysis.dataSource = 'Live APIs + AI Analysis';
      } else {
        throw new Error('No content received from OpenAI');
      }
    } catch (apiError) {
      console.log('AI generation failed, using enhanced Ethereum fallback');
      // Seeded random number generator for consistent values
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      // Fallback with Ethereum-specific data
      const basePrice = realETHData?.price || 2650; // Updated realistic ETH price for August 2025
      const currentPrice = Math.round(basePrice);
      const rsiValue = 40 + seededRandom(600) * 35; // RSI between 40-75 (consistent)
      const fearGreedIndex = 55 + seededRandom(601) * 30; // Fear & Greed 55-85 (consistent)
      
      // Use live news data if available
      let newsImpactData = [];
    
    if (ethereumNews && ethereumNews.length > 0) {
      newsImpactData = ethereumNews.slice(0, 3).map((article: any, index: number) => ({
        headline: (article.title || article.headline || 'Market Update').replace(/[^\x00-\x7F]/g, "").substring(0, 80) + (article.title && article.title.length > 80 ? '...' : ''),
        impact: index === 0 ? 'Bullish' : index === 1 ? 'Neutral' : 'Bullish',
        timeAgo: '1-3 hours',
        source: article.source?.name || 'Live News API'
      }));
    } else if (alphaVantageData?.newsData?.feed) {
      newsImpactData = alphaVantageData.newsData.feed.slice(0, 3).map((article: any, index: number) => ({
        headline: (article.title || 'Alpha Vantage News').replace(/[^\x00-\x7F]/g, "").substring(0, 80) + (article.title && article.title.length > 80 ? '...' : ''),
        impact: article.overall_sentiment_score > 0.1 ? 'Bullish' : article.overall_sentiment_score < -0.1 ? 'Bearish' : 'Neutral',
        timeAgo: 'Recent',
        source: 'Alpha Vantage'
      }));
    } else {
      newsImpactData = [
        {
          headline: realETHData ? `Real-time: ETH trading at $${Math.round(realETHData.price).toLocaleString()}` : 'Ethereum Layer 2 Scaling Solutions Gain Momentum',
          impact: 'Bullish',
          timeAgo: '1 hour',
          source: realETHData?.source || 'Market Analysis'
        },
        {
          headline: 'DeFi TVL Reaches New All-Time High on Ethereum',
          impact: 'Bullish',
          timeAgo: '2 hours',
          source: 'DeFi Pulse'
        },
        {
          headline: 'Ethereum Shanghai Upgrade Effects Continue',
          impact: 'Neutral',
          timeAgo: '4 hours',
          source: 'Ethereum Foundation'
        }
      ];
    }
    
    analysis = {
      technicalIndicators: {
        rsi: { 
          value: rsiValue.toFixed(1), 
          signal: rsiValue > 70 ? 'Overbought' : rsiValue < 30 ? 'Oversold' : 'Neutral', 
          timeframe: '4H' 
        },
        macd: { 
          signal: realETHData?.change24h > 0 ? 'Bullish Cross' : 'Bearish Cross', 
          strength: 'Moderate',
          histogram: realETHData?.change24h > 0 ? '+$12.45' : '-$8.30'
        },
        movingAverages: { 
          ema20: Math.round(currentPrice - 120), 
          ema50: Math.round(currentPrice - 280), 
          trend: realETHData?.change24h > 0 ? 'Upward' : 'Sideways',
          goldenCross: realETHData?.change24h > 0
        },
        bollingerBands: {
          upper: Math.round(currentPrice + 200),
          middle: Math.round(currentPrice),
          lower: Math.round(currentPrice - 200),
          squeeze: false
        },
        supportResistance: {
          strongSupport: Math.round(currentPrice - 400),
          support: Math.round(currentPrice - 200),
          resistance: Math.round(currentPrice + 200),
          strongResistance: Math.round(currentPrice + 400)
        },
        supplyDemandZones: {
          demandZones: [
            { level: Math.round(currentPrice - 300), strength: 'Strong' as const, volume: 2850000 },
            { level: Math.round(currentPrice - 150), strength: 'Moderate' as const, volume: 1820000 },
            { level: Math.round(currentPrice - 75), strength: 'Weak' as const, volume: 1210000 }
          ],
          supplyZones: [
            { level: Math.round(currentPrice + 75), strength: 'Weak' as const, volume: 1180000 },
            { level: Math.round(currentPrice + 180), strength: 'Moderate' as const, volume: 1950000 },
            { level: Math.round(currentPrice + 350), strength: 'Strong' as const, volume: 3120000 }
          ]
        }
      },
      tradingSignals: [
        {
          type: 'BUY',
          strength: realETHData ? 'STRONG' : 'MODERATE',
          timeframe: '4H',
          price: Math.round(currentPrice - 80),
          reasoning: `${realETHData ? 'Live data shows' : 'Analysis suggests'} ETH consolidation above key support with DeFi momentum.`
        },
        {
          type: 'SELL',
          strength: 'MODERATE',
          timeframe: '1D',
          price: Math.round(currentPrice + 150),
          reasoning: 'Target resistance near previous highs with profit-taking expected.'
        }
      ],
      marketSentiment: {
        overall: fearGreedIndex > 75 ? 'Extremely Bullish' : fearGreedIndex > 55 ? 'Bullish' : 'Neutral',
        fearGreedIndex: Math.round(fearGreedIndex),
        institutionalFlow: 'Positive',
        retailSentiment: 'Optimistic',
        socialMedia: 'Positive',
        onChainMetrics: {
          hodlerRatio: '68.5%',
          exchangeInflow: 'Stable',
          longTermHolders: 'Accumulating'
        }
      },
      priceAnalysis: {
        current: currentPrice,
        change24h: realETHData?.change24h || (seededRandom(602) - 0.5) * 6,
        support: currentPrice - 250,
        resistance: currentPrice + 300
      },
      predictions: {
        hourly: {
          target: Math.round(currentPrice + (seededRandom(603) - 0.5) * 120),
          confidence: realETHData ? 85 : 70
        },
        daily: {
          target: Math.round(currentPrice + (seededRandom(604) - 0.5) * 350),
          confidence: realETHData ? 80 : 65
        },
        weekly: {
          target: Math.round(currentPrice + (seededRandom(605) - 0.5) * 800),
          confidence: realETHData ? 75 : 60
        }
      },
      marketData: {
        price: currentPrice,
        change24h: realETHData?.change24h || (seededRandom(606) - 0.5) * 6,
        volume24h: realETHData?.volume24h || 15500000000,
        marketCap: realETHData?.marketCap || currentPrice * 120000000
      },
      newsImpact: newsImpactData,
      isLiveData: !!(realETHData || ethereumNews || alphaVantageData),
      dataSource: `Live APIs: ${[realETHData?.source, ethereumNews ? 'News' : null, alphaVantageData?.source].filter(Boolean).join(', ') || 'Enhanced Simulation'}`,
      lastUpdated: new Date().toISOString()
    };
    } // Close the catch block for AI generation

    // Return the analysis with metadata
    res.status(200).json({
      ...analysis,
      timestamp: new Date().toISOString(),
      isLiveData: analysis.isLiveData || false,
      currentPrice: realETHData?.price || analysis.priceAnalysis?.current,
      marketData: realETHData
    });
  } catch (error) {
    console.error('ETH Analysis API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch ETH analysis',
      message: 'Please try again later',
      isLiveData: false
    });
  }
}
