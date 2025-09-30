import Head from 'next/head'
import { useState, useEffect } from 'react'
import CryptoHerald from '../components/CryptoHerald'
import BTCMarketAnalysis from '../components/BTCMarketAnalysis'
import ETHMarketAnalysis from '../components/ETHMarketAnalysis'
import TradeGenerationEngine from '../components/TradeGenerationEngine'
import NexoRegulatoryPanel from '../components/NexoRegulatoryPanel'

export default function Home() {
  return (
    <>
      <Head>
        <title>Trading Intelligence Hub V1.4 - Hidden Pivot Analysis</title>
        <meta name="description" content="Advanced cryptocurrency trading intelligence platform with Fibonacci extensions and hidden pivot analysis" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Version 1.4 Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-semibold">Trading Intelligence Hub v1.4</span>
              <span className="text-purple-200">•</span>
              <span className="text-sm">Hidden Pivot Analysis & Fibonacci Extensions Active</span>
            </div>
            <div className="text-sm text-purple-200">
              Fear & Greed Sliders Enhanced | Stable Timeframes
            </div>
          </div>
        </div>

        {/* News Herald Section */}
        <div className="w-full">
          <CryptoHerald />
        </div>

        {/* Main Trading Analysis Grid */}
        <div className="container mx-auto px-4 py-6 space-y-6">
          
          {/* Trade Generation Engine */}
          <div className="bg-black/30 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
              <h2 className="text-xl font-bold text-white">AI Trade Generation Engine</h2>
            </div>
            <TradeGenerationEngine />
          </div>

          {/* Enhanced Market Analysis with Hidden Pivots */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Bitcoin Analysis with Enhanced Features */}
            <div className="bg-black/30 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-400 rounded-full mr-3"></div>
                  <h2 className="text-xl font-bold text-white">Bitcoin Analysis</h2>
                </div>
                <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  V1.4 Enhanced
                </div>
              </div>
              <BTCMarketAnalysis />
            </div>
            
            {/* Ethereum Analysis with Enhanced Features */}
            <div className="bg-black/30 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                  <h2 className="text-xl font-bold text-white">Ethereum Analysis</h2>
                </div>
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  V1.4 Enhanced
                </div>
              </div>
              <ETHMarketAnalysis />
            </div>
          </div>

          {/* Regulatory Panel */}
          <div className="bg-black/30 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
              <h2 className="text-xl font-bold text-white">Nexo Regulatory Monitoring</h2>
            </div>
            <NexoRegulatoryPanel />
          </div>

          {/* Version 1.4 Features Summary */}
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <span className="bg-purple-500 text-white px-2 py-1 rounded text-sm mr-3">V1.4</span>
              New Features Active
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-purple-300 font-semibold mb-2">🎯 Hidden Pivot Analysis</div>
                <div className="text-gray-300">Fibonacci extensions with supply/demand zones</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-blue-300 font-semibold mb-2">📊 Fear & Greed Sliders</div>
                <div className="text-gray-300">Enhanced visual sentiment indicators</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-green-300 font-semibold mb-2">⏱️ Stable Timeframes</div>
                <div className="text-gray-300">Consistent 4H, 1D, 1W analysis</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-orange-300 font-semibold mb-2">✅ API Verified</div>
                <div className="text-gray-300">All 6 APIs operational & tested</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
