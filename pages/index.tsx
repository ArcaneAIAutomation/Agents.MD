import Layout from '@/components/Layout'
import NexoRegulatoryPanel from '@/components/NexoRegulatoryPanel'
import BTCMarketAnalysis from '@/components/BTCMarketAnalysis'
import ETHMarketAnalysis from '@/components/ETHMarketAnalysis'
import CryptoHerald from '@/components/CryptoHerald'
import { TrendingUp, AlertTriangle, BarChart3, Zap } from 'lucide-react'

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gray-100 py-12 md:py-20 border-b-8 border-black" style={{
        backgroundImage: `
          linear-gradient(0deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent)
        `,
        backgroundSize: '50px 50px'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-black mb-4 md:mb-6 leading-tight" style={{ fontFamily: 'Times, serif' }}>
              TRADING INTELLIGENCE HUB
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-6 md:mb-8 max-w-3xl mx-auto font-medium leading-relaxed">
              Real-time regulatory updates for Nexo.com, AI-powered cryptocurrency market analysis for Bitcoin & Ethereum, 
              plus The Crypto Herald - your vintage newspaper for top market cap crypto news.
            </p>
          </div>
        </div>
      </section>

      {/* Crypto Herald Newspaper - Featured at Top */}
      <section className="w-full bg-gray-50 py-8 md:py-12 border-y-4 border-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <CryptoHerald />
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-6 md:gap-8">
          {/* Nexo Regulatory Panel - Full Width */}
          <div>
            <NexoRegulatoryPanel />
          </div>

          {/* Crypto Market Analysis - Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* BTC Market Analysis */}
            <div>
              <BTCMarketAnalysis />
            </div>
            
            {/* ETH Market Analysis */}
            <div>
              <ETHMarketAnalysis />
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Status Bar */}
      <section className="bg-black text-white py-6 md:py-8 border-t-8 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
            <div>
              <div className="text-lg md:text-2xl font-black text-green-400" style={{ fontFamily: 'Times, serif' }}>
                <span className="animate-pulse">●</span> LIVE
              </div>
              <div className="text-xs md:text-sm text-gray-400 font-bold">AI ANALYSIS ACTIVE</div>
            </div>
            <div>
              <div className="text-lg md:text-2xl font-black text-blue-400" style={{ fontFamily: 'Times, serif' }}>
                MANUAL
              </div>
              <div className="text-xs md:text-sm text-gray-400 font-bold">UPDATE FREQUENCY</div>
            </div>
            <div>
              <div className="text-lg md:text-2xl font-black text-orange-400" style={{ fontFamily: 'Times, serif' }}>
                <Zap className="h-5 md:h-6 w-5 md:w-6 inline" />
              </div>
              <div className="text-xs md:text-sm text-gray-400 font-bold">OPENAI POWERED</div>
            </div>
            <div>
              <div className="text-lg md:text-2xl font-black text-purple-400" style={{ fontFamily: 'Times, serif' }}>
                24/7
              </div>
              <div className="text-xs md:text-sm text-gray-400 font-bold">MARKET MONITORING</div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
