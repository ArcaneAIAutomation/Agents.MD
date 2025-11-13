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
          content="AI-powered Bitcoin trade signal generation with GPT-4o. Real-time analysis, backtested results, and complete transparency." 
        />
        <meta name="keywords" content="Bitcoin, AI trading, trade signals, GPT-4o, cryptocurrency, technical analysis" />
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
                  <div className="text-xl font-bold text-bitcoin-orange font-mono">GPT-4o</div>
                  <div className="text-sm text-bitcoin-white-60">AI Model</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Target size={24} className="text-bitcoin-orange" />
                  </div>
                  <div className="text-xl font-bold text-bitcoin-orange font-mono">3 Targets</div>
                  <div className="text-sm text-bitcoin-white-60">Take Profit</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Shield size={24} className="text-bitcoin-orange" />
                  </div>
                  <div className="text-xl font-bold text-bitcoin-orange font-mono">$1000</div>
                  <div className="text-sm text-bitcoin-white-60">Standard Size</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <TrendingUp size={24} className="text-bitcoin-orange" />
                  </div>
                  <div className="text-xl font-bold text-bitcoin-orange font-mono">100%</div>
                  <div className="text-sm text-bitcoin-white-60">Real Data</div>
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
                  The AI Trade Generation Engine uses GPT-4o to analyze real-time market data, 
                  technical indicators, social sentiment, and on-chain metrics to generate 
                  comprehensive trade signals. Each signal includes entry price, 3 take-profit 
                  levels, stop loss, timeframe, and confidence score. All trades are automatically 
                  backtested against 100% real historical data to verify accuracy.
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
