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
                📰 PLATFORM FEATURES
              </h3>
              <p className="text-sm mobile-text-secondary font-serif italic mt-1">
                Advanced trading intelligence capabilities now active
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border border-gray-300 p-4 bg-purple-50 mobile-bg-card">
                  <div className="mobile-text-primary font-bold mb-2 font-serif">🎯 Hidden Pivot Analysis</div>
                  <div className="mobile-text-secondary text-sm">Fibonacci extensions with supply/demand zones</div>
                </div>
                <div className="border border-gray-300 p-4 bg-blue-50 mobile-bg-card">
                  <div className="mobile-text-primary font-bold mb-2 font-serif">📊 Fear & Greed Sliders</div>
                  <div className="mobile-text-secondary text-sm">Enhanced visual sentiment indicators</div>
                </div>
                <div className="border border-gray-300 p-4 bg-green-50 mobile-bg-card">
                  <div className="mobile-text-primary font-bold mb-2 font-serif">⏱️ Stable Timeframes</div>
                  <div className="mobile-text-secondary text-sm">Consistent 4H, 1D, 1W analysis</div>
                </div>
                <div className="border border-gray-300 p-4 bg-orange-50 mobile-bg-card">
                  <div className="mobile-text-primary font-bold mb-2 font-serif">✅ API Verified</div>
                  <div className="mobile-text-secondary text-sm">All 6 APIs operational & tested</div>
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