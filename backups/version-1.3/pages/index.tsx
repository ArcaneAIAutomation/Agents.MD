import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import CryptoHerald from '../components/CryptoHerald';
import BTCMarketAnalysis from '../components/BTCMarketAnalysis';
import ETHMarketAnalysis from '../components/ETHMarketAnalysis';
import TradeGenerationEngine from '../components/TradeGenerationEngine';
import NexoRegulatoryPanel from '../components/NexoRegulatoryPanel';

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>The Crypto Herald - Trading Intelligence Hub</title>
        <meta name="description" content="Advanced cryptocurrency market intelligence and trading analysis platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* The Crypto Herald - Main News Section */}
        <CryptoHerald />
        
        {/* Market Analysis Grid */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Bitcoin Market Analysis */}
            <div className="space-y-6">
              <BTCMarketAnalysis />
            </div>
            
            {/* Ethereum Market Analysis */}
            <div className="space-y-6">
              <ETHMarketAnalysis />
            </div>
          </div>
          
          {/* Trade Generation Engine and Regulatory Panel - Side by Side */}
          <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
            <TradeGenerationEngine />
            <NexoRegulatoryPanel />
          </div>
        </div>
      </main>
    </Layout>
  );
}
