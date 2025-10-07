import Head from 'next/head'
import { useState, useEffect } from 'react'
import CryptoHerald from '../components/CryptoHerald'
import BTCMarketAnalysis from '../components/BTCMarketAnalysis'
import ETHMarketAnalysis from '../components/ETHMarketAnalysis'
import TradeGenerationEngine from '../components/TradeGenerationEngine'
import NexoRegulatoryPanel from '../components/NexoRegulatoryPanel'
import WhaleWatchDashboard from '../components/WhaleWatch/WhaleWatchDashboard'

export default function Home() {
  return (
    <>
      <Head>
        <title>The Crypto Herald - Real-Time Market Intelligence</title>
        <meta name="description" content="Professional cryptocurrency market analysis and trading intelligence in classic newspaper format" />
        <link rel="icon" href="/favicon.ico" />

      </Head>

      <div className="min-h-screen mobile-bg-secondary">
        {/* News Herald Section with Enhanced Header */}
        <div className="w-full">
          <CryptoHerald />
        </div>

        {/* Main Newspaper Content */}
        <div className="container mx-auto px-4 py-8 space-y-8 mobile-text-primary">
          
          {/* Trade Generation Engine - Front Page Story */}
          <div className="mobile-bg-card border-2 border-gray-900 shadow-lg">
            <div className="border-b-2 border-gray-900 mobile-bg-secondary px-6 py-3">
              <h2 className="text-2xl font-bold mobile-text-primary font-serif">
                📈 AI TRADE GENERATION ENGINE
              </h2>
              <p className="text-sm mobile-text-secondary font-serif italic mt-1">
                Advanced algorithmic trading signals powered by artificial intelligence
              </p>
            </div>
            <div className="p-6">
              <TradeGenerationEngine />
            </div>
          </div>

          {/* Market Analysis - Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Bitcoin Analysis - Left Column */}
            <div className="mobile-bg-card border-2 border-gray-900 shadow-lg">
              <div className="border-b-2 border-gray-900 bg-orange-50 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mobile-text-primary font-serif">
                      ₿ BITCOIN MARKET REPORT
                    </h2>
                    <p className="text-sm mobile-text-secondary font-serif italic mt-1">
                      Digital gold analysis with real-time market intelligence
                    </p>
                  </div>
                  <div className="bg-orange-600 text-white px-3 py-1 text-xs font-bold tracking-wide">
                    ENHANCED
                  </div>
                </div>
              </div>
              <div className="p-6">
                <BTCMarketAnalysis />
              </div>
            </div>
            
            {/* Ethereum Analysis - Right Column */}
            <div className="mobile-bg-card border-2 border-gray-900 shadow-lg">
              <div className="border-b-2 border-gray-900 bg-blue-50 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mobile-text-primary font-serif">
                      ⟠ ETHEREUM MARKET REPORT
                    </h2>
                    <p className="text-sm mobile-text-secondary font-serif italic mt-1">
                      Smart contract platform analysis with DeFi insights
                    </p>
                  </div>
                  <div className="bg-blue-600 text-white px-3 py-1 text-xs font-bold tracking-wide">
                    ENHANCED
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ETHMarketAnalysis />
              </div>
            </div>
          </div>

          {/* Whale Watch - Live Tracking */}
          <div className="mobile-bg-card border-2 border-gray-900 shadow-lg">
            <div className="border-b-2 border-gray-900 bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-3">
              <h2 className="text-2xl font-bold mobile-text-primary font-serif">
                🐋 BITCOIN WHALE WATCH
              </h2>
              <p className="text-sm mobile-text-secondary font-serif italic mt-1">
                Real-time tracking of large Bitcoin transactions and market movements
              </p>
            </div>
            <div className="p-6">
              <WhaleWatchDashboard />
            </div>
          </div>

          {/* Regulatory Panel - Bottom Story */}
          <div className="mobile-bg-card border-2 border-gray-900 shadow-lg">
            <div className="border-b-2 border-gray-900 bg-red-50 px-6 py-3">
              <h2 className="text-2xl font-bold mobile-text-primary font-serif">
                ⚖️ REGULATORY WATCH
              </h2>
              <p className="text-sm mobile-text-secondary font-serif italic mt-1">
                Latest regulatory developments and compliance monitoring
              </p>
            </div>
            <div className="p-6">
              <NexoRegulatoryPanel />
            </div>
          </div>

          {/* Features Summary - Newspaper Style */}
          <div className="mobile-bg-card border-2 border-gray-900 shadow-lg">
            <div className="border-b-2 border-gray-900 mobile-bg-secondary px-6 py-3">
              <h3 className="text-2xl font-bold mobile-text-primary font-serif">
                📰 INTELLIGENCE CAPABILITIES
              </h3>
              <p className="text-sm mobile-text-secondary font-serif italic mt-1">
                AI-powered market analysis with real-time blockchain intelligence
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* BTC/ETH Trade Generation Engine */}
                <div className="border-2 border-gray-800 p-4 bg-gradient-to-br from-purple-50 to-purple-100 mobile-bg-card hover:shadow-md transition-shadow relative">
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">
                    LIVE
                  </div>
                  <div className="mobile-text-primary font-bold mb-2 font-serif flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <span>BTC/ETH Trade Engine</span>
                  </div>
                  <div className="mobile-text-secondary text-sm leading-relaxed">
                    GPT-4o powered trade generation with confidence scoring and risk management
                  </div>
                </div>

                {/* Whale Watch with Caesar API */}
                <div className="border-2 border-gray-800 p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 mobile-bg-card hover:shadow-md transition-shadow relative">
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">
                    LIVE
                  </div>
                  <div className="mobile-text-primary font-bold mb-2 font-serif flex items-center gap-2">
                    <span className="text-xl">🐋</span>
                    <span>Whale Watch</span>
                  </div>
                  <div className="mobile-text-secondary text-sm leading-relaxed">
                    Track large wallet movements with Caesar API-powered context analysis
                  </div>
                </div>

                {/* Technical Analysis */}
                <div className="border-2 border-gray-800 p-4 bg-gradient-to-br from-blue-50 to-blue-100 mobile-bg-card hover:shadow-md transition-shadow relative">
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">
                    LIVE
                  </div>
                  <div className="mobile-text-primary font-bold mb-2 font-serif flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <span>Multi-Timeframe Analysis</span>
                  </div>
                  <div className="mobile-text-secondary text-sm leading-relaxed">
                    15m, 1h, 4h, 1d technical indicators with supply/demand zones
                  </div>
                </div>

                {/* Real-Time News */}
                <div className="border-2 border-gray-800 p-4 bg-gradient-to-br from-green-50 to-green-100 mobile-bg-card hover:shadow-md transition-shadow relative">
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">
                    LIVE
                  </div>
                  <div className="mobile-text-primary font-bold mb-2 font-serif flex items-center gap-2">
                    <span className="text-xl">📰</span>
                    <span>Live News Feed</span>
                  </div>
                  <div className="mobile-text-secondary text-sm leading-relaxed">
                    Real-time crypto news with AI sentiment analysis and market impact
                  </div>
                </div>
              </div>

              {/* Additional Features Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t-2 border-gray-300">
                <div className="text-center p-3 bg-gray-50 mobile-bg-card rounded border border-gray-300">
                  <div className="mobile-text-primary font-bold text-lg font-serif">Caesar AI</div>
                  <div className="mobile-text-secondary text-xs">Research Engine</div>
                </div>
                <div className="text-center p-3 bg-gray-50 mobile-bg-card rounded border border-gray-300">
                  <div className="mobile-text-primary font-bold text-lg font-serif">GPT-4o</div>
                  <div className="mobile-text-secondary text-xs">Trade Analysis</div>
                </div>
                <div className="text-center p-3 bg-gray-50 mobile-bg-card rounded border border-gray-300">
                  <div className="mobile-text-primary font-bold text-lg font-serif">24/7</div>
                  <div className="mobile-text-secondary text-xs">Live Monitoring</div>
                </div>
                <div className="text-center p-3 bg-gray-50 mobile-bg-card rounded border border-gray-300">
                  <div className="mobile-text-primary font-bold text-lg font-serif">Mobile</div>
                  <div className="mobile-text-secondary text-xs">Optimized</div>
                </div>
              </div>
            </div>
          </div>

          {/* Newspaper Footer */}
          <div className="mobile-bg-card border-t-4 border-gray-900 mt-12">
            <div className="container mx-auto px-4 py-6">
              <div className="text-center mobile-text-secondary font-serif">
                <p className="text-sm">
                  © 2024 The Crypto Herald • Real-Time Market Intelligence Platform
                </p>
                <p className="text-xs mt-2 italic">
                  "All the crypto news that's fit to trade" • Powered by AI & Live Market Data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}