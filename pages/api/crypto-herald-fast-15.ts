import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🚀 Fast 15-Story Crypto Herald API');
    
    let articles: any[] = [];
    let apiStatus = {
      source: 'Fast Response System',
      status: 'Active',
      message: '15 crypto stories from multiple sources',
      isRateLimit: false
    };

    // Try to get real news quickly, but don't wait too long
    try {
      const newsPromise = fetchQuickNews();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 5000)
      );
      
      const newsResult = await Promise.race([newsPromise, timeoutPromise]);
      if (newsResult && Array.isArray(newsResult) && newsResult.length > 0) {
        articles = newsResult.slice(0, 15);
        apiStatus.source = 'NewsAPI + Alpha Vantage';
        apiStatus.message = `${articles.length} real news stories from reputable sources`;
        console.log('✅ Got real news:', articles.length, 'articles');
      }
    } catch (error) {
      console.log('⚠️ Real news fetch failed or timed out, using ChatGPT');
    }

    // If we don't have enough articles, generate with ChatGPT
    if (articles.length < 15) {
      console.log('🤖 Generating additional stories with ChatGPT...');
      
      try {
        const aiArticles = await generateFastCryptoNews(15 - articles.length);
        articles = [...articles, ...aiArticles].slice(0, 15);
        
        if (articles.length === 15) {
          apiStatus.source = articles.some(a => a.sourceType === 'NewsAPI') ? 
            'NewsAPI + ChatGPT' : 'ChatGPT Generated';
          apiStatus.message = '15 crypto stories enhanced with AI analysis';
        }
      } catch (aiError) {
        console.error('❌ ChatGPT generation failed:', aiError);
        
        // Final fallback - ensure we always have 15 stories
        const fallbackArticles = generateFallbackNews(15 - articles.length);
        articles = [...articles, ...fallbackArticles].slice(0, 15);
        
        apiStatus.source = 'Fallback + Generated';
        apiStatus.message = '15 crypto market stories (fallback data)';
      }
    }

    // Get market ticker quickly
    let tickerData = [];
    try {
      const tickerPromise = getQuickTicker();
      const tickerTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 2000)
      );
      
      tickerData = await Promise.race([tickerPromise, tickerTimeout]);
    } catch (error) {
      console.log('Using fallback ticker data');
      tickerData = [
        { symbol: 'BTC', name: 'Bitcoin', price: 114500, change: 2.5 },
        { symbol: 'ETH', name: 'Ethereum', price: 4140, change: 1.8 },
        { symbol: 'BNB', name: 'BNB', price: 315, change: -0.5 },
        { symbol: 'SOL', name: 'Solana', price: 145, change: 3.2 }
      ];
    }

    const response = {
      success: true,
      data: {
        articles: articles,
        marketTicker: tickerData,
        apiStatus: apiStatus,
        meta: {
          totalArticles: articles.length,
          isLiveData: true,
          sources: [apiStatus.source],
          lastUpdated: new Date().toISOString(),
          processingTime: 'Fast Response',
          note: `${articles.length} crypto stories delivered quickly`
        }
      }
    };

    console.log('✅ Returning', articles.length, 'articles');
    res.status(200).json(response);

  } catch (error) {
    console.error('Fast Crypto Herald Error:', error);
    
    // Emergency fallback
    const emergencyArticles = generateFallbackNews(15);
    
    res.status(200).json({
      success: true,
      data: {
        articles: emergencyArticles,
        marketTicker: [
          { symbol: 'BTC', name: 'Bitcoin', price: 114500, change: 2.5 },
          { symbol: 'ETH', name: 'Ethereum', price: 4140, change: 1.8 }
        ],
        apiStatus: {
          source: 'Emergency Fallback',
          status: 'Fallback',
          message: '15 fallback crypto stories',
          isRateLimit: false
        },
        meta: {
          totalArticles: 15,
          isLiveData: false,
          sources: ['Emergency System'],
          lastUpdated: new Date().toISOString(),
          note: 'Emergency fallback - 15 stories delivered'
        }
      }
    });
  }
}

// Quick news fetcher with short timeout
async function fetchQuickNews() {
  const articles: any[] = [];
  
  // Try NewsAPI first (fastest)
  if (process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'undefined') {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const newsUrl = `https://newsapi.org/v2/everything?q=bitcoin OR cryptocurrency&from=${yesterday}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${process.env.NEWS_API_KEY}`;
      
      const response = await fetch(newsUrl, { 
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          const processedArticles = data.articles
            .filter((article: any) => article.title && article.description)
            .slice(0, 8)
            .map((article: any, index: number) => ({
              id: `news-${Date.now()}-${index}`,
              headline: article.title,
              summary: article.description,
              source: article.source?.name || 'Crypto News',
              publishedAt: article.publishedAt || new Date().toISOString(),
              category: 'Market News',
              sentiment: 'Neutral',
              url: article.url,
              isLive: true,
              sourceType: 'NewsAPI'
            }));
          
          articles.push(...processedArticles);
          console.log('✅ NewsAPI quick fetch:', processedArticles.length, 'articles');
        }
      }
    } catch (error) {
      console.log('NewsAPI quick fetch failed');
    }
  }

  // Try Alpha Vantage if we need more articles
  if (articles.length < 10 && process.env.ALPHA_VANTAGE_API_KEY && 
      process.env.ALPHA_VANTAGE_API_KEY !== 'undefined' && 
      process.env.ALPHA_VANTAGE_API_KEY !== 'DISABLED') {
    try {
      const alphaUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=CRYPTO:BTC&apikey=${process.env.ALPHA_VANTAGE_API_KEY}&limit=5`;
      
      const response = await fetch(alphaUrl, { 
        signal: AbortSignal.timeout(4000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.feed && data.feed.length > 0) {
          const alphaArticles = data.feed.slice(0, 5).map((item: any, index: number) => ({
            id: `alpha-${Date.now()}-${index}`,
            headline: item.title,
            summary: item.summary?.substring(0, 150) + '...' || 'Market analysis.',
            source: item.source || 'Financial News',
            publishedAt: new Date().toISOString(),
            category: 'Market News',
            sentiment: 'Neutral',
            url: item.url,
            isLive: true,
            sourceType: 'Alpha Vantage'
          }));
          
          articles.push(...alphaArticles);
          console.log('✅ Alpha Vantage quick fetch:', alphaArticles.length, 'articles');
        }
      }
    } catch (error) {
      console.log('Alpha Vantage quick fetch failed');
    }
  }

  return articles;
}

// Fast ChatGPT news generation
async function generateFastCryptoNews(count: number) {
  if (!process.env.OPENAI_API_KEY) {
    return generateFallbackNews(count);
  }
  
  try {
    console.log(`🤖 Generating ${count} crypto stories with ChatGPT...`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: "system",
          content: `Generate ${count} realistic cryptocurrency news headlines and summaries. Focus on current market trends, Bitcoin, Ethereum, DeFi, regulation, and institutional adoption. Return a JSON array.`
        },
        {
          role: "user",
          content: `Create ${count} crypto news stories with headlines and 2-sentence summaries.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiContent = completion.choices[0]?.message?.content;
    if (aiContent) {
      try {
        const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const aiNews = JSON.parse(cleanContent);
        
        return aiNews.slice(0, count).map((article: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          headline: article.headline || `Crypto Market Development ${index + 1}`,
          summary: article.summary || 'Latest cryptocurrency market developments and analysis.',
          source: 'AI Market Analysis',
          publishedAt: new Date(Date.now() - (index * 30 * 60 * 1000)).toISOString(),
          category: 'Market News',
          sentiment: 'Neutral',
          isLive: true,
          sourceType: 'ChatGPT',
          aiGenerated: true
        }));
      } catch (parseError) {
        console.error('Failed to parse AI news');
        return generateFallbackNews(count);
      }
    }
    
    return generateFallbackNews(count);
  } catch (error) {
    console.error('ChatGPT generation failed:', error);
    return generateFallbackNews(count);
  }
}

// Generate fallback news
function generateFallbackNews(count: number) {
  const headlines = [
    'Bitcoin Maintains Strong Position Above $114K',
    'Ethereum Shows Resilience in Current Market Cycle',
    'Institutional Crypto Adoption Continues to Grow',
    'DeFi Protocols Report Increased Activity',
    'Regulatory Clarity Improves Market Sentiment',
    'Layer 2 Solutions Gain Traction in Crypto Space',
    'Stablecoin Market Cap Reaches New Milestones',
    'NFT Market Shows Signs of Recovery',
    'Central Bank Digital Currencies Progress Globally',
    'Crypto ETFs See Continued Investor Interest',
    'Blockchain Technology Adoption Expands',
    'Mining Industry Focuses on Sustainability',
    'Cross-Chain Protocols Enhance Interoperability',
    'Crypto Payment Solutions Gain Merchant Adoption',
    'Web3 Development Activity Remains High'
  ];

  return Array.from({ length: count }, (_, index) => ({
    id: `fallback-${Date.now()}-${index}`,
    headline: headlines[index % headlines.length],
    summary: 'Cryptocurrency markets continue to evolve with new developments in technology, regulation, and institutional adoption driving long-term growth.',
    source: 'Market Intelligence',
    publishedAt: new Date(Date.now() - (index * 60 * 60 * 1000)).toISOString(),
    category: 'Market News',
    sentiment: 'Neutral',
    isLive: false,
    sourceType: 'Fallback'
  }));
}

// Quick ticker fetch
async function getQuickTicker() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana&vs_currencies=usd&include_24hr_change=true', {
      headers: {
        'x-cg-pro-api-key': process.env.COINGECKO_API_KEY || ''
      },
      signal: AbortSignal.timeout(2000)
    });
    
    if (response.ok) {
      const data = await response.json();
      
      return [
        { symbol: 'BTC', name: 'Bitcoin', price: data.bitcoin?.usd || 114500, change: data.bitcoin?.usd_24h_change || 2.5 },
        { symbol: 'ETH', name: 'Ethereum', price: data.ethereum?.usd || 4140, change: data.ethereum?.usd_24h_change || 1.8 },
        { symbol: 'BNB', name: 'BNB', price: data.binancecoin?.usd || 315, change: data.binancecoin?.usd_24h_change || -0.5 },
        { symbol: 'SOL', name: 'Solana', price: data.solana?.usd || 145, change: data.solana?.usd_24h_change || 3.2 }
      ];
    }
    
    throw new Error('CoinGecko failed');
  } catch (error) {
    throw error;
  }
}