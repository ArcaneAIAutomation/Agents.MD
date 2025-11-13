import Head from 'next/head';
import Navigation from '../components/Navigation';
import ATGEInterface from '../components/ATGE/ATGEInterface';
import { TrendingUp, Zap, Target, Shield } from 'lucide-react';

export default function ATGEPage() {
  return (
    <>
      <Head>
        <title>AI Trade Generation Engine - Bitcoin Sovereign Technology</title>
        <meta 
          name="description" 
          content="Ultimate AI-powered Bitcoin trade signals with Dual AI (GPT-5 + Gemini 2.0). 13 real-time data sources, 4 timeframes, 100% transparency." 
        />
        <meta name="keywords" content="Bitcoin, AI trading, trade signals, GPT-5, Gemini AI, cryptocurrency, technical analysis, real-time data" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <div className="min-h-screen bg-bitcoin-black">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="bitcoin-block mb-8">
            <div className="border-b-2 border-bitcoin-orange px-6 py-4 bg-bitcoin-black">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={32} className="text-bitcoin-orange" />
                <h1 className="text-3xl md:text-4xl font-bold text-bitcoin-white">
                  AI Trade Generation Engine
                </h1>
              </div>
              <p className="text-sm text-bitcoin-white-60 italic mt-2">
                Advanced AI-powered trade signal generation with 100% real data backtesting
              </p>
            </div>
            
            {/* Key Features Grid */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Zap size={24} className="text-bitcoin-orange" />
                  </div>
                  <div className="text-xl font-bold text-bitcoin-orange font-mono">Dual AI</div>
                  <div className="text-sm text-bitcoin-white-60">GPT-5 + Gemini</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Target size={24} className="text-bitcoin-orange" />
                  </div>
                  <div className="text-xl font-bold text-bitcoin-orange font-mono">13 APIs</div>
                  <div className="text-sm text-bitcoin-white-60">Data Sources</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Shield size={24} className="text-bitcoin-orange" />
                  </div>
                  <div className="text-xl font-bold text-bitcoin-orange font-mono">4 Timeframes</div>
                  <div className="text-sm text-bitcoin-white-60">15m/1h/4h/1d</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <TrendingUp size={24} className="text-bitcoin-orange" />
                  </div>
                  <div className="text-xl font-bold text-bitcoin-orange font-mono">100%</div>
                  <div className="text-sm text-bitcoin-white-60">Real-Time Data</div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Banner */}
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-2 h-2 rounded-full bg-bitcoin-orange animate-pulse"></div>
              </div>
              <div className="flex-1">
                <h3 className="text-bitcoin-white font-semibold mb-1">
                  How It Works
                </h3>
                <p className="text-bitcoin-white-60 text-sm leading-relaxed">
                  The Ultimate AI Trade Generation Engine uses <span className="text-bitcoin-orange font-semibold">Dual AI Analysis</span> (OpenAI GPT-5 + Google Gemini 2.5 Pro) to analyze real-time data from <span className="text-bitcoin-orange font-semibold">13 APIs</span>: Market data (CoinMarketCap, CoinGecko, Kraken), Technical indicators (Binance - 500 candles), Social sentiment (LunarCrush, Twitter, Reddit), On-chain metrics (Blockchain.com, Etherscan), and News (NewsAPI). Each trade includes entry price, 3 take-profit levels, stop loss, timeframe (15m/1h/4h/1d), confidence score, and comprehensive AI reasoning. All data is <span className="text-bitcoin-orange font-semibold">force-refreshed</span> for 100% real-time accuracy with complete data source attribution.
                </p>
              </div>
            </div>
          </div>

          {/* ATGE Interface Component */}
          <ATGEInterface />

          {/* Disclaimer */}
          <div className="mt-8 bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-4">
            <div className="text-center">
              <p className="text-bitcoin-white-60 text-xs leading-relaxed">
                <strong className="text-bitcoin-orange">Disclaimer:</strong> This is an AI-powered 
                analysis tool for educational and informational purposes only. Past performance does 
                not guarantee future results. All trading involves risk. Always conduct your own 
                research and consult with a qualified financial advisor before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
