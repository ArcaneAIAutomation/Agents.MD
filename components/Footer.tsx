import Link from 'next/link'
import { AlertTriangle, BarChart3, Zap } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t-8 border-black" style={{
      backgroundImage: `
        linear-gradient(0deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent),
        linear-gradient(90deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent)
      `,
      backgroundSize: '50px 50px'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header Section */}
        <div className="text-center border-b-4 border-black pb-6 md:pb-8 mb-6 md:mb-8">
          <h2 className="text-2xl md:text-4xl font-black text-black mb-2 md:mb-4" style={{ fontFamily: 'Times, serif' }}>
            TRADING INTELLIGENCE HUB
          </h2>
          <p className="text-base md:text-lg text-gray-700 font-bold max-w-3xl mx-auto">
            Your comprehensive source for cryptocurrency market analysis, regulatory intelligence, and financial news
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Services Column */}
          <div className="bg-gray-50 border-4 border-black p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-black text-black mb-3 md:mb-4 border-b-2 border-black pb-2" style={{ fontFamily: 'Times, serif' }}>
              OUR SERVICES
            </h3>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center">
                <AlertTriangle className="h-4 md:h-5 w-4 md:w-5 text-black mr-2" />
                <span className="text-black font-bold text-xs md:text-sm">NEXO REGULATORY MONITORING</span>
              </div>
              <div className="flex items-center">
                <BarChart3 className="h-4 md:h-5 w-4 md:w-5 text-black mr-2" />
                <span className="text-black font-bold text-xs md:text-sm">BTC & ETH AI ANALYSIS</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-4 md:h-5 w-4 md:w-5 text-black mr-2" />
                <span className="text-black font-bold text-xs md:text-sm">CRYPTO HERALD NEWSPAPER</span>
              </div>
            </div>
          </div>

          {/* Technology Column */}
          <div className="bg-gray-50 border-4 border-black p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-black text-black mb-3 md:mb-4 border-b-2 border-black pb-2" style={{ fontFamily: 'Times, serif' }}>
              POWERED BY AI
            </h3>
            <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <p className="text-black font-bold">• OpenAI GPT-4 Analysis Engine</p>
              <p className="text-black font-bold">• Real-time Market Data Integration</p>
              <p className="text-black font-bold">• Multi-Source News Aggregation</p>
              <p className="text-black font-bold">• Advanced Technical Indicators</p>
              <p className="text-black font-bold">• Regulatory Change Detection</p>
            </div>
          </div>

          {/* Status Column */}
          <div className="bg-gray-50 border-4 border-black p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-black text-black mb-3 md:mb-4 border-b-2 border-black pb-2" style={{ fontFamily: 'Times, serif' }}>
              SYSTEM STATUS
            </h3>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-black font-bold text-xs md:text-sm">API STATUS:</span>
                <span className="text-green-600 font-black text-xs md:text-sm">● ONLINE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black font-bold text-xs md:text-sm">DATA FEED:</span>
                <span className="text-green-600 font-black text-xs md:text-sm">● ACTIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black font-bold text-xs md:text-sm">AI ENGINE:</span>
                <span className="text-green-600 font-black text-xs md:text-sm">● OPERATIONAL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black font-bold text-xs md:text-sm">NEWS WIRE:</span>
                <span className="text-green-600 font-black text-xs md:text-sm">● LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t-4 border-black pt-4 md:pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-black font-black text-base md:text-lg" style={{ fontFamily: 'Times, serif' }}>
                © {currentYear} TRADING INTELLIGENCE HUB
              </p>
              <p className="text-gray-600 font-bold text-xs md:text-sm">
                ALL RIGHTS RESERVED • POWERED BY ARTIFICIAL INTELLIGENCE
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 md:space-x-6">
              <span className="text-black font-bold text-xs md:text-sm border-2 border-black px-2 md:px-3 py-1 text-center">
                MANUAL LOADING ENABLED
              </span>
              <span className="text-black font-bold text-xs md:text-sm border-2 border-black px-2 md:px-3 py-1 text-center">
                REAL-TIME ANALYSIS
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
