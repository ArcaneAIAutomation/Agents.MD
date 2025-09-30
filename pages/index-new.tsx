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
        <title>Trading Intelligence Hub</title>
        <meta name="description" content="Advanced cryptocurrency trading intelligence platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* News Herald Section */}
        <div className="w-full">
          <CryptoHerald />
        </div>

        {/* Market Analysis Section */}
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Bitcoin and Ethereum Analysis */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-black/30 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <BTCMarketAnalysis />
            </div>
            <div className="bg-black/30 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <ETHMarketAnalysis />
            </div>
          </div>

          {/* Trade Generation and Nexo Panel */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-black/30 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <TradeGenerationEngine />
            </div>
            <div className="bg-black/30 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <NexoRegulatoryPanel />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
