import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import UCIESearchBar from '../../components/UCIE/UCIESearchBar';
import { useTokenSearch } from '../../hooks/useTokenSearch';
import { Search, TrendingUp, Zap, Shield, Brain, BarChart3 } from 'lucide-react';

export default function UCIEHomePage() {
  const router = useRouter();
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  
  const { recentSearches, popularTokens, addRecentSearch } = useTokenSearch();

  const handleTokenSelect = async (symbol: string) => {
    setSelectedToken(symbol);
    setValidating(true);
    setValidationResult(null);
    
    // Add to recent searches
    addRecentSearch(symbol);

    try {
      // Validate token
      const response = await fetch(`/api/ucie/validate?symbol=${encodeURIComponent(symbol)}`);
      const data = await response.json();
      
      setValidationResult(data);
      
      if (data.valid) {
        // Navigate to analysis page
        setTimeout(() => {
          router.push(`/ucie/analyze/${encodeURIComponent(symbol.toUpperCase())}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        success: false,
        valid: false,
        error: 'Validation failed. Please try again.'
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Universal Crypto Intelligence Engine (UCIE) | Bitcoin Sovereign Technology</title>
        <meta name="description" content="The most advanced cryptocurrency analysis platform. AI-powered research, real-time data, and comprehensive intelligence for any token." />
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
              The most advanced cryptocurrency analysis platform in existence. 
              AI-powered research, real-time data from 15+ sources, and 95%+ quality intelligence for Bitcoin and Ethereum.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-12">
            <UCIESearchBar
              onTokenSelect={handleTokenSelect}
              recentSearches={recentSearches}
              popularTokens={popularTokens}
            />
          </div>

          {/* Validation Result */}
          {validating && (
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 mb-12 text-center">
              <div className="inline-block w-12 h-12 border-4 border-bitcoin-orange border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-bitcoin-white text-lg">
                Validating {selectedToken}...
              </p>
            </div>
          )}

          {validationResult && !validating && (
            <div className={`border-2 rounded-xl p-8 mb-12 ${
              validationResult.valid 
                ? 'bg-bitcoin-black border-bitcoin-orange' 
                : 'bg-bitcoin-black border-bitcoin-orange-20'
            }`}>
              {validationResult.valid ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-bitcoin-orange rounded-full mb-4">
                    <Search className="w-8 h-8 text-bitcoin-black" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-bitcoin-white mb-2">
                    Token Validated: {validationResult.symbol}
                  </h3>
                  <p className="text-bitcoin-white-80 mb-6">
                    Redirecting to comprehensive analysis...
                  </p>
                  <div className="inline-block w-8 h-8 border-4 border-bitcoin-orange border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-xl font-bold text-bitcoin-white mb-2">
                    {validationResult.error || 'Token not found'}
                  </h3>
                  {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                    <div className="mt-4">
                      <p className="text-bitcoin-white-60 mb-3">Did you mean:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {validationResult.suggestions.map((suggestion: string) => (
                          <button
                            key={suggestion}
                            onClick={() => handleTokenSelect(suggestion)}
                            className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black min-h-[44px]"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="AI-Powered Research"
              description="Caesar AI conducts deep research with source verification and comprehensive analysis."
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="15+ Technical Indicators"
              description="RSI, MACD, Bollinger Bands, EMA, and more with AI interpretation."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Multi-Source Data"
              description="Real-time data from CoinGecko, CoinMarketCap, exchanges, and more."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Risk Assessment"
              description="Comprehensive risk analysis with volatility metrics and portfolio impact."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Real-Time Updates"
              description="Live price updates, whale transactions, and breaking news alerts."
            />
            <FeatureCard
              icon={<Search className="w-8 h-8" />}
              title="Bitcoin & Ethereum"
              description="Perfected analysis for the two most important cryptocurrencies with 95%+ data quality."
            />
          </div>

          {/* BTC & ETH Focus Banner */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 mb-12">
            <h3 className="text-3xl font-bold text-bitcoin-white mb-4 text-center">
              🎯 Currently Perfecting BTC & ETH
            </h3>
            <p className="text-lg text-bitcoin-white-80 mb-6 text-center max-w-3xl mx-auto">
              We're focusing on providing the absolute best data quality for Bitcoin and Ethereum 
              before expanding to other assets. This ensures you get 95%+ quality intelligence 
              using ALL available resources: APIs, AI, blockchain data, and more.
            </p>
            <div className="flex gap-4 justify-center mb-6">
              <div className="bg-bitcoin-orange text-bitcoin-black px-8 py-4 rounded-lg font-bold text-xl">
                ✓ Bitcoin (BTC)
              </div>
              <div className="bg-bitcoin-orange text-bitcoin-black px-8 py-4 rounded-lg font-bold text-xl">
                ✓ Ethereum (ETH)
              </div>
            </div>
            <p className="text-bitcoin-white-60 text-center text-sm">
              More assets coming soon after we perfect these two!
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
