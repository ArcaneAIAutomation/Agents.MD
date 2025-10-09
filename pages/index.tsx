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

      <div className="min-h-screen bg-bitcoin-black">
        {/* News Herald Section with Enhanced Header */}
        <div className="w-full">
          <CryptoHerald />
        </div>

        {/* Main Newspaper Content */}
        <div className="container mx-auto px-4 py-8 space-y-8">
          
          {/* Trade Generation Engine - Front Page Story */}
          <div className="bitcoin-block">
            <div className="border-b-2 border-bitcoin-orange px-6 py-3 bg-bitcoin-black">
              <h2 className="text-2xl font-bold text-bitcoin-white">
                📈 AI TRADE GENERATION ENGINE
              </h2>
              <p className="text-sm text-bitcoin-white-60 italic mt-1">
                Advanced algorithmic trading signals powered by artificial intelligence
              </p>
            </div>
            <div className="p-6">
              <TradeGenerationEngine />
            </div>
          </div>

          {/* Bitcoin Market Report */}
          <div className="bitcoin-block">
            <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-bitcoin-white">
                    ₿ BITCOIN MARKET REPORT
                  </h2>
                  <p className="text-sm text-bitcoin-white-60 italic mt-1">
                    Digital gold analysis with real-time market intelligence
                  </p>
                </div>
                <div className="bg-bitcoin-orange text-bitcoin-black px-3 py-1 text-xs font-bold tracking-wide rounded">
                  ENHANCED
                </div>
              </div>
            </div>
            <div className="p-6">
              <BTCMarketAnalysis />
            </div>
          </div>
          
          {/* Ethereum Market Report */}
          <div className="bitcoin-block">
            <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-bitcoin-white">
                    ⟠ ETHEREUM MARKET REPORT
                  </h2>
                  <p className="text-sm text-bitcoin-white-60 italic mt-1">
                    Smart contract platform analysis with DeFi insights
                  </p>
                </div>
                <div className="bg-bitcoin-orange text-bitcoin-black px-3 py-1 text-xs font-bold tracking-wide rounded">
                  ENHANCED
                </div>
              </div>
            </div>
            <div className="p-6">
              <ETHMarketAnalysis />
            </div>
          </div>

          {/* Whale Watch - Live Tracking */}
          <div className="bitcoin-block">
            <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-3">
              <h2 className="text-2xl font-bold text-bitcoin-white">
                🐋 BITCOIN WHALE WATCH
              </h2>
              <p className="text-sm text-bitcoin-white-60 italic mt-1">
                Real-time tracking of large Bitcoin transactions and market movements
              </p>
            </div>
            <div className="p-6">
              <WhaleWatchDashboard />
            </div>
          </div>

          {/* Regulatory Panel - Bottom Story */}
          <div className="bitcoin-block">
            <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-3">
              <h2 className="text-2xl font-bold text-bitcoin-white">
                ⚖️ REGULATORY WATCH
              </h2>
              <p className="text-sm text-bitcoin-white-60 italic mt-1">
                Latest regulatory developments and compliance monitoring
              </p>
            </div>
            <div className="p-6">
              <NexoRegulatoryPanel />
            </div>
          </div>

          {/* Features Summary - Newspaper Style */}
          <div className="bitcoin-block">
            <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-3">
              <h3 className="text-2xl font-bold text-bitcoin-white">
                📰 INTELLIGENCE CAPABILITIES
              </h3>
              <p className="text-sm text-bitcoin-white-60 italic mt-1">
                AI-powered market analysis with real-time blockchain intelligence
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* BTC/ETH Trade Generation Engine */}
                <div className="bitcoin-block-subtle hover:border-bitcoin-orange transition-all relative">
                  <div className="absolute top-2 right-2 bg-bitcoin-orange text-bitcoin-black text-xs px-2 py-1 rounded font-bold">
                    LIVE
                  </div>
                  <div className="text-bitcoin-white font-bold mb-2 flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <span>BTC/ETH Trade Engine</span>
                  </div>
                  <div className="text-bitcoin-white-60 text-sm leading-relaxed">
                    GPT-4o powered trade generation with confidence scoring and risk management
                  </div>
                </div>

                {/* Whale Watch with Caesar API */}
                <div className="bitcoin-block-subtle hover:border-bitcoin-orange transition-all relative">
                  <div className="absolute top-2 right-2 bg-bitcoin-orange text-bitcoin-black text-xs px-2 py-1 rounded font-bold">
                    LIVE
                  </div>
                  <div className="text-bitcoin-white font-bold mb-2 flex items-center gap-2">
                    <span className="text-xl">🐋</span>
                    <span>Whale Watch</span>
                  </div>
                  <div className="text-bitcoin-white-60 text-sm leading-relaxed">
                    Track large wallet movements with Caesar API-powered context analysis
                  </div>
                </div>

                {/* Technical Analysis */}
                <div className="bitcoin-block-subtle hover:border-bitcoin-orange transition-all relative">
                  <div className="absolute top-2 right-2 bg-bitcoin-orange text-bitcoin-black text-xs px-2 py-1 rounded font-bold">
                    LIVE
                  </div>
                  <div className="text-bitcoin-white font-bold mb-2 flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <span>Multi-Timeframe Analysis</span>
                  </div>
                  <div className="text-bitcoin-white-60 text-sm leading-relaxed">
                    15m, 1h, 4h, 1d technical indicators with supply/demand zones
                  </div>
                </div>

                {/* Real-Time News */}
                <div className="bitcoin-block-subtle hover:border-bitcoin-orange transition-all relative">
                  <div className="absolute top-2 right-2 bg-bitcoin-orange text-bitcoin-black text-xs px-2 py-1 rounded font-bold">
                    LIVE
                  </div>
                  <div className="text-bitcoin-white font-bold mb-2 flex items-center gap-2">
                    <span className="text-xl">📰</span>
                    <span>Live News Feed</span>
                  </div>
                  <div className="text-bitcoin-white-60 text-sm leading-relaxed">
                    Real-time crypto news with AI sentiment analysis and market impact
                  </div>
                </div>
              </div>

              {/* Additional Features Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-bitcoin-orange-20">
                <div className="text-center p-3 bg-bitcoin-black rounded border border-bitcoin-orange-30 hover:border-bitcoin-orange transition-colors">
                  <div className="text-bitcoin-white font-bold text-lg">Caesar AI</div>
                  <div className="text-bitcoin-white-60 text-xs">Research Engine</div>
                </div>
                <div className="text-center p-3 bg-bitcoin-black rounded border border-bitcoin-orange-30 hover:border-bitcoin-orange transition-colors">
                  <div className="text-bitcoin-white font-bold text-lg">GPT-4o</div>
                  <div className="text-bitcoin-white-60 text-xs">Trade Analysis</div>
                </div>
                <div className="text-center p-3 bg-bitcoin-black rounded border border-bitcoin-orange-30 hover:border-bitcoin-orange transition-colors">
                  <div className="text-bitcoin-white font-bold text-lg">24/7</div>
                  <div className="text-bitcoin-white-60 text-xs">Live Monitoring</div>
                </div>
                <div className="text-center p-3 bg-bitcoin-black rounded border border-bitcoin-orange-30 hover:border-bitcoin-orange transition-colors">
                  <div className="text-bitcoin-white font-bold text-lg">Mobile</div>
                  <div className="text-bitcoin-white-60 text-xs">Optimized</div>
                </div>
              </div>
            </div>
          </div>

          {/* Newspaper Footer */}
          <div className="border-t-2 border-bitcoin-orange mt-12 bg-bitcoin-black">
            <div className="container mx-auto px-4 py-6">
              <div className="text-center">
                <p className="text-sm text-bitcoin-white-60">
                  © 2024 The Crypto Herald • Real-Time Market Intelligence Platform
                </p>
                <p className="text-xs mt-2 italic text-bitcoin-white-60">
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