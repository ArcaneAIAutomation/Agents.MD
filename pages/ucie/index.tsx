import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { TrendingUp, Zap, Shield, Brain, BarChart3, ArrowRight } from 'lucide-react';
import { Bitcoin, Coins } from 'lucide-react';

export default function UCIEHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAnalyze = (symbol: 'BTC' | 'ETH') => {
    setLoading(symbol);
    // Navigate to analysis page
    router.push(`/ucie/analyze/${symbol}`);
  };

  return (
    <Layout>
      <Head>
        <title>Universal Crypto Intelligence Engine (UCIE) | Bitcoin Sovereign Technology</title>
        <meta name="description" content="The most advanced cryptocurrency analysis platform. ChatGPT 5.1 (Latest) powered research, real-time data, and comprehensive intelligence for any token." />
      </Head>

      <div className="min-h-screen bg-bitcoin-black py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-bitcoin-white mb-4">
              Universal Crypto Intelligence Engine
            </h1>
            <p className="text-xl md:text-2xl text-bitcoin-orange font-mono mb-2">
              UCIE
            </p>
            <p className="text-lg text-bitcoin-white-80 max-w-3xl mx-auto">
              The most advanced Bitcoin analysis platform in existence. 
              ChatGPT 5.1 (Latest) powered research, real-time data from 13+ sources, and 95%+ quality intelligence focused exclusively on Bitcoin.
            </p>
          </div>

          {/* Analysis Selection - Bitcoin Only */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-bitcoin-white text-center mb-8">
              Bitcoin Comprehensive Analysis
            </h2>
            
            <div className="max-w-2xl mx-auto">
              {/* Bitcoin Button - Centered */}
              <button
                onClick={() => handleAnalyze('BTC')}
                disabled={loading !== null}
                className="w-full group bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 transition-all hover:bg-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[200px] flex flex-col items-center justify-center"
              >
                {loading === 'BTC' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-bitcoin-orange border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-bitcoin-white text-lg font-semibold">Loading Bitcoin Analysis...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 mb-4 text-bitcoin-orange group-hover:text-bitcoin-black transition-colors">
                      <Bitcoin className="w-full h-full" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-bold text-bitcoin-white group-hover:text-bitcoin-black mb-2 transition-colors">
                      Bitcoin
                    </h3>
                    <p className="text-xl font-mono text-bitcoin-orange group-hover:text-bitcoin-black mb-4 transition-colors">
                      BTC
                    </p>
                    <div className="flex items-center gap-2 text-bitcoin-white-80 group-hover:text-bitcoin-black transition-colors">
                      <span className="text-sm font-semibold">Start Comprehensive Analysis</span>
                      <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-bitcoin-white-60 mt-6 text-sm">
              Click to launch comprehensive real-time Bitcoin analysis with 95%+ data quality
            </p>
            <p className="text-center text-bitcoin-white-60 mt-2 text-xs">
              Focused exclusively on Bitcoin for maximum accuracy and depth
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="AI-Powered Research"
              description="ChatGPT 5.1 (Latest) and Caesar AI conduct deep research with source verification and comprehensive analysis."
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Advanced Charting"
              description="TradingView integration with 100+ indicators, drawing tools, and professional analysis."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Real-Time WebSocket"
              description="Live price updates from multiple exchanges with sub-second latency."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Risk Assessment"
              description="Comprehensive risk analysis with volatility metrics and portfolio impact."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Multi-Asset Support"
              description="100+ cryptocurrencies supported with intelligent data source selection."
            />
            <FeatureCard
              icon={<Bitcoin className="w-8 h-8" />}
              title="Database-Backed Cache"
              description="Lightning-fast responses with persistent caching and 84% cost reduction."
            />
          </div>

          {/* Bitcoin Focus Banner */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 mb-12">
            <h3 className="text-3xl font-bold text-bitcoin-white mb-4 text-center">
              🎯 Exclusively Focused on Bitcoin
            </h3>
            <p className="text-lg text-bitcoin-white-80 mb-6 text-center max-w-3xl mx-auto">
              UCIE provides unparalleled depth and accuracy by focusing exclusively on Bitcoin.
              Our specialized approach delivers 95%+ data quality with comprehensive analysis from 13+ sources,
              ensuring you get the most accurate and actionable intelligence available.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-bitcoin-orange text-bitcoin-black px-4 py-3 rounded-lg font-bold text-center">
                ✓ 95%+ Data Quality
              </div>
              <div className="bg-bitcoin-orange text-bitcoin-black px-4 py-3 rounded-lg font-bold text-center">
                ✓ 13+ Data Sources
              </div>
              <div className="bg-bitcoin-orange text-bitcoin-black px-4 py-3 rounded-lg font-bold text-center">
                ✓ ChatGPT 5.1 AI
              </div>
            </div>
            <p className="text-bitcoin-white-60 text-center text-sm">
              Maximum accuracy and depth through exclusive Bitcoin focus
            </p>
          </div>

          {/* Feature Status */}
          <div className="bg-bitcoin-orange text-bitcoin-black rounded-xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Real-Time Intelligence Available Now
            </h2>
            <p className="text-lg mb-6">
              All features are live with 100% real data from multiple sources.
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm font-semibold">
              <div className="bg-bitcoin-black text-bitcoin-orange px-4 py-2 rounded-lg">
                ✓ Market Data (Real-time)
              </div>
              <div className="bg-bitcoin-black text-bitcoin-orange px-4 py-2 rounded-lg">
                ✓ On-Chain Analysis
              </div>
              <div className="bg-bitcoin-black text-bitcoin-orange px-4 py-2 rounded-lg">
                ✓ Technical Indicators
              </div>
              <div className="bg-bitcoin-black text-bitcoin-orange px-4 py-2 rounded-lg">
                ✓ News Aggregation
              </div>
              <div className="bg-bitcoin-black text-bitcoin-orange px-4 py-2 rounded-lg">
                ✓ Social Sentiment
              </div>
              <div className="bg-bitcoin-black text-bitcoin-orange px-4 py-2 rounded-lg">
                ✓ AI Research
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6 transition-all hover:border-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.2)]">
      <div className="text-bitcoin-orange mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-bitcoin-white mb-2">
        {title}
      </h3>
      <p className="text-bitcoin-white-80">
        {description}
      </p>
    </div>
  );
}
