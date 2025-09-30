import Head from 'next/head'
import { useState, useEffect } from 'react'
import CryptoHerald from '../components/CryptoHerald'
import BTCMarketAnalysis from '../components/BTCMarketAnalysis'
import ETHMarketAnalysis from '../components/ETHMarketAnalysis'
import TradeGenerationEngine from '../components/TradeGenerationEngine'
import NexoRegulatoryPanel from '../components/NexoRegulatoryPanel'

// Type definitions
interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  relevanceScore: number;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  volume: string;
  marketCap: string;
}

interface TechnicalAnalysis {
  timeframe: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trend: string;
  support: number;
  resistance: number;
  indicators: {
    rsi: number;
    macd: string;
    sma50?: number;
    sma200?: number;
  };
  recommendation: string;
}

// Mock data generators (replace with real API calls)
const generateNexoNews = (): NewsArticle[] => {
  return [
    {
      id: '1',
      title: 'Nexo Receives Crypto Asset Service Provider License in Lithuania',
      description: 'Nexo has been granted a CASP license by the Bank of Lithuania, strengthening its regulatory compliance in the EU market.',
      url: '#',
      publishedAt: '2025-08-20T10:30:00Z',
      source: 'CryptoNews',
      relevanceScore: 95
    },
    {
      id: '2',
      title: 'UK FCA Reviews Nexo Operations Amid New Crypto Regulations',
      description: 'The Financial Conduct Authority is conducting a comprehensive review of Nexo\'s UK operations following new regulatory guidelines.',
      url: '#',
      publishedAt: '2025-08-20T08:15:00Z',
      source: 'Financial Times',
      relevanceScore: 88
    },
    {
      id: '3',
      title: 'Nexo Implements Enhanced KYC Procedures for UK Customers',
      description: 'In response to regulatory requirements, Nexo has introduced stricter identity verification processes for UK-based users.',
      url: '#',
      publishedAt: '2025-08-19T16:45:00Z',
      source: 'CoinDesk',
      relevanceScore: 82
    },
    {
      id: '4',
      title: 'Nexo Suspends New UK Customer Registrations Pending Regulatory Clarity',
      description: 'The crypto lending platform temporarily halts new UK sign-ups while awaiting clearer guidance from financial regulators.',
      url: '#',
      publishedAt: '2025-08-19T14:20:00Z',
      source: 'Reuters',
      relevanceScore: 90
    },
    {
      id: '5',
      title: 'European Banking Authority Mentions Nexo in Latest Crypto Guidelines',
      description: 'The EBA\'s updated guidelines on crypto asset services specifically reference Nexo\'s business model and regulatory approach.',
      url: '#',
      publishedAt: '2025-08-19T11:00:00Z',
      source: 'Bloomberg',
      relevanceScore: 85
    }
  ];
};

const generateBTCData = (): { marketData: MarketData; analysis: TechnicalAnalysis[] } => {
  return {
    marketData: {
      symbol: 'BTC',
      price: 67845.32,
      change24h: 2.34,
      volume24h: 28500000000,
      volume: '$28.5B',
      marketCap: '$1.34T'
    },
    analysis: [
      {
        timeframe: '1H',
        sentiment: 'BULLISH',
        trend: 'bullish',
        support: 67200,
        resistance: 68500,
        indicators: {
          rsi: 58.2,
          macd: 'bullish crossover',
          sma50: 67100,
          sma200: 65800
        },
        recommendation: 'Short-term uptrend with momentum building. Watch for breakout above 68.5k resistance.'
      },
      {
        timeframe: '4H',
        sentiment: 'NEUTRAL',
        trend: 'neutral',
        support: 66800,
        resistance: 69200,
        indicators: {
          rsi: 52.8,
          macd: 'neutral',
          sma50: 67400,
          sma200: 66200
        },
        recommendation: 'Consolidation phase. Range trading between 66.8k-69.2k. Wait for clear directional break.'
      },
      {
        timeframe: '1D',
        sentiment: 'BULLISH',
        trend: 'bullish',
        support: 65000,
        resistance: 70000,
        indicators: {
          rsi: 61.5,
          macd: 'bullish',
          sma50: 66800,
          sma200: 64500
        },
        recommendation: 'Strong daily uptrend intact. Target 70k with stop loss below 65k support.'
      }
    ]
  };
};

// Components
const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="news-card p-6 mb-4">
      <div className="flex justify-between items-start mb-3">
        <span className="crypto-badge bg-blue-100 text-blue-800">
          Score: {article.relevanceScore}/100
        </span>
        <span className="text-sm text-gray-500">{formatDate(article.publishedAt)}</span>
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
        {article.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-3">
        {article.description}
      </p>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500">{article.source}</span>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Read More →
        </button>
      </div>
    </div>
  );
};

const MarketDataCard: React.FC<{ data: MarketData }> = ({ data }) => {
  const isPositive = data.change24h > 0;
  
  return (
    <div className="news-card p-6 mb-6">
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Bitcoin Market Data
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-500">Price</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${data.price.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">24h Change</p>
          <p className={`text-xl font-semibold ${isPositive ? 'price-up' : 'price-down'}`}>
            {isPositive ? '+' : ''}{data.change24h}%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Volume</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{data.volume}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Market Cap</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{data.marketCap}</p>
        </div>
      </div>
    </div>
  );
};

const TechnicalAnalysisCard: React.FC<{ analysis: TechnicalAnalysis }> = ({ analysis }) => {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return '↗️';
      case 'bearish': return '↘️';
      default: return '→';
    }
  };

  return (
    <div className="news-card p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          {analysis.timeframe} Analysis
        </h4>
        <span className={`flex items-center font-semibold ${getTrendColor(analysis.trend)}`}>
          {getTrendIcon(analysis.trend)} {analysis.trend.toUpperCase()}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Support</p>
          <p className="font-semibold text-green-600">${analysis.support.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Resistance</p>
          <p className="font-semibold text-red-600">${analysis.resistance.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">RSI</p>
          <p className="font-semibold text-gray-900 dark:text-white">{analysis.indicators.rsi}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">MACD</p>
          <p className="font-semibold text-gray-900 dark:text-white">{analysis.indicators.macd}</p>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Trading Recommendation:
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {analysis.recommendation}
        </p>
      </div>
    </div>
  );
};

export default function Home() {
  const [nexoNews] = useState(generateNexoNews());
  const [btcData] = useState(generateBTCData());
  const [lastUpdate] = useState('9:14:53 AM');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Crypto News Hub - Real-time Updates</title>
        <meta name="description" content="Real-time cryptocurrency news and market analysis" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🚀 Crypto News Hub
            </h1>
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdate}
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Real-time cryptocurrency news and market analysis
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Trade Generation Engine */}
        <section className="mb-12">
          <TradeGenerationEngine />
        </section>

        {/* Market Analysis Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {/* Bitcoin Market Analysis */}
          <section>
            <BTCMarketAnalysis />
          </section>

          {/* Ethereum Market Analysis */}
          <section>
            <ETHMarketAnalysis />
          </section>
        </div>

        {/* Crypto Herald */}
        <section className="mb-12">
          <CryptoHerald />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Nexo Regulatory Updates */}
          <section>
            <NexoRegulatoryPanel />
            
            <div className="mt-8">
              <div className="flex items-center mb-6">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Nexo.com UK Regulatory Updates
                </h2>
              </div>
              
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  📊 Monitoring regulatory changes and news for Nexo exchange operations in the UK and EU
                </p>
              </div>

              {nexoNews.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </section>

          {/* Bitcoin Market Analysis */}
          <section>
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Bitcoin Market Analysis
              </h2>
            </div>

            {btcData && (
              <>
                <MarketDataCard data={btcData.marketData} />
                
                <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    📈 Technical analysis across multiple timeframes with popular indicators
                  </p>
                </div>

                {btcData.analysis.map((analysis, index) => (
                  <TechnicalAnalysisCard key={index} analysis={analysis} />
                ))}
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2025 Crypto News Hub - Powered by AI Agents | Data updates every 5 minutes
          </p>
        </div>
      </footer>
    </div>
  );
}
