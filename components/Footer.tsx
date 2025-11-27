import Link from 'next/link'
import { AlertTriangle, BarChart3, Zap } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t-4 md:border-t-8 border-black" style={{
      backgroundImage: `
        linear-gradient(0deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent),
        linear-gradient(90deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent)
      `,
      backgroundSize: '25px 25px sm:50px sm:50px'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* Header Section */}
        <div className="text-center border-b-2 md:border-b-4 border-black pb-4 md:border-b-0 md:pb-0 mb-4 md:mb-6 lg:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-black mb-2 md:mb-4 leading-tight" style={{ fontFamily: 'Times, serif' }}>
            BITCOIN SOVEREIGN TECHNOLOGY
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-800 font-bold max-w-3xl mx-auto px-2 leading-relaxed">
            Your comprehensive source for cryptocurrency market analysis, regulatory intelligence, and financial news
          </p>
        </div>

        {/* Main Content - Stacked vertically on mobile, grid on larger screens */}
        <div className="flex flex-col space-y-4 md:grid md:grid-cols-3 md:gap-6 lg:gap-8 md:space-y-0 mb-4 md:mb-6 lg:mb-8">
          {/* Services Column */}
          <div className="bg-gray-50 border-2 md:border-4 border-black p-3 md:p-4 lg:p-6">
            <h3 className="text-base md:text-lg lg:text-xl font-black text-black mb-2 md:mb-3 lg:mb-4 border-b-2 border-black pb-1 md:pb-2" style={{ fontFamily: 'Times, serif' }}>
              OUR SERVICES
            </h3>
            <div className="space-y-3">
              <div className="flex items-center min-h-[44px] py-2 hover:bg-gray-100 rounded px-2 -mx-2 transition-colors duration-150 cursor-pointer touch-manipulation">
                <AlertTriangle className="h-5 w-5 text-black mr-3 flex-shrink-0" />
                <span className="text-black font-bold text-sm">NEXO REGULATORY MONITORING</span>
              </div>
              <div className="flex items-center min-h-[44px] py-2 hover:bg-gray-100 rounded px-2 -mx-2 transition-colors duration-150 cursor-pointer touch-manipulation">
                <BarChart3 className="h-5 w-5 text-black mr-3 flex-shrink-0" />
                <span className="text-black font-bold text-sm">BTC & ETH AI ANALYSIS</span>
              </div>
              <div className="flex items-center min-h-[44px] py-2 hover:bg-gray-100 rounded px-2 -mx-2 transition-colors duration-150 cursor-pointer touch-manipulation">
                <Zap className="h-5 w-5 text-black mr-3 flex-shrink-0" />
                <span className="text-black font-bold text-sm">CRYPTO HERALD NEWSPAPER</span>
              </div>
            </div>
          </div>

          {/* Technology Column */}
          <div className="bg-gray-50 border-2 md:border-4 border-black p-3 md:p-4 lg:p-6">
            <h3 className="text-base md:text-lg lg:text-xl font-black text-black mb-2 md:mb-3 lg:mb-4 border-b-2 border-black pb-1 md:pb-2" style={{ fontFamily: 'Times, serif' }}>
              POWERED BY AI
            </h3>
            <div className="space-y-2 text-sm">
              <div className="min-h-[44px] flex items-center py-2 hover:bg-gray-100 rounded px-2 -mx-2 transition-colors duration-150 cursor-pointer touch-manipulation">
                <p className="text-black font-bold">• ChatGPT 5.1 (Latest) Analysis Engine</p>
              </div>
              <div className="min-h-[44px] flex items-center py-2 hover:bg-gray-100 rounded px-2 -mx-2 transition-colors duration-150 cursor-pointer touch-manipulation">
                <p className="text-black font-bold">• Real-time Market Data Integration</p>
              </div>
              <div className="min-h-[44px] flex items-center py-2 hover:bg-gray-100 rounded px-2 -mx-2 transition-colors duration-150 cursor-pointer touch-manipulation">
                <p className="text-black font-bold">• Multi-Source News Aggregation</p>
              </div>
              <div className="min-h-[44px] flex items-center py-2 hover:bg-gray-100 rounded px-2 -mx-2 transition-colors duration-150 cursor-pointer touch-manipulation">
                <p className="text-black font-bold">• Advanced Technical Indicators</p>
              </div>
              <div className="min-h-[44px] flex items-center py-2 hover:bg-gray-100 rounded px-2 -mx-2 transition-colors duration-150 cursor-pointer touch-manipulation">
                <p className="text-black font-bold">• Regulatory Change Detection</p>
              </div>
            </div>
          </div>

          {/* Status Column */}
          <div className="bg-gray-50 border-2 md:border-4 border-black p-3 md:p-4 lg:p-6">
            <h3 className="text-base md:text-lg lg:text-xl font-black text-black mb-2 md:mb-3 lg:mb-4 border-b-2 border-black pb-1 md:pb-2" style={{ fontFamily: 'Times, serif' }}>
              SYSTEM STATUS
            </h3>
            <div className="space-y-3 md:space-y-3">
              <div className="flex items-center justify-between min-h-[44px] py-2">
                <span className="text-black font-bold text-sm">API STATUS:</span>
                <span className="text-green-600 font-black text-sm bg-green-50 px-2 py-1 rounded border border-green-200">● ONLINE</span>
              </div>
              <div className="flex items-center justify-between min-h-[44px] py-2">
                <span className="text-black font-bold text-sm">DATA FEED:</span>
                <span className="text-green-600 font-black text-sm bg-green-50 px-2 py-1 rounded border border-green-200">● ACTIVE</span>
              </div>
              <div className="flex items-center justify-between min-h-[44px] py-2">
                <span className="text-black font-bold text-sm">AI ENGINE:</span>
                <span className="text-green-600 font-black text-sm bg-green-50 px-2 py-1 rounded border border-green-200">● OPERATIONAL</span>
              </div>
              <div className="flex items-center justify-between min-h-[44px] py-2">
                <span className="text-black font-bold text-sm">NEWS WIRE:</span>
                <span className="text-green-600 font-black text-sm bg-green-50 px-2 py-1 rounded border border-green-200">● LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t-2 md:border-t-4 border-black pt-3 md:pt-4 lg:pt-6">
          <div className="flex flex-col space-y-3 md:flex-row md:justify-between md:items-center md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-black font-black text-sm md:text-base lg:text-lg leading-tight" style={{ fontFamily: 'Times, serif' }}>
                © {currentYear} BITCOIN SOVEREIGN TECHNOLOGY
              </p>
              <p className="text-gray-700 font-bold text-xs md:text-sm mt-1">
                ALL RIGHTS RESERVED • POWERED BY ARTIFICIAL INTELLIGENCE
              </p>
            </div>
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 md:space-x-6">
              <button className="text-black font-bold text-xs md:text-sm border-2 border-black px-4 py-3 text-center whitespace-nowrap min-h-[44px] hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 touch-manipulation">
                MANUAL LOADING ENABLED
              </button>
              <button className="text-black font-bold text-xs md:text-sm border-2 border-black px-4 py-3 text-center whitespace-nowrap min-h-[44px] hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 touch-manipulation">
                REAL-TIME ANALYSIS
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
