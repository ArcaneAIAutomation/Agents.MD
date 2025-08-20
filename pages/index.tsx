import Layout from '@/components/Layout'
import NexoRegulatoryPanel from '@/components/NexoRegulatoryPanel'
import BTCMarketAnalysis from '@/components/BTCMarketAnalysis'
import ETHMarketAnalysis from '@/components/ETHMarketAnalysis'
import { TrendingUp, AlertTriangle, BarChart3, Zap } from 'lucide-react'

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Trading Intelligence Hub
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Real-time regulatory updates for Nexo.com and AI-powered cryptocurrency market analysis for Bitcoin & Ethereum. 
              Stay ahead with cutting-edge intelligence powered by OpenAI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center px-6 py-3 bg-blue-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">Live Regulatory Monitoring</span>
              </div>
              <div className="flex items-center px-6 py-3 bg-orange-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-orange-600 mr-2" />
                <span className="text-orange-800 font-medium">BTC & ETH AI Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Nexo Regulatory Panel */}
          <div>
            <NexoRegulatoryPanel />
          </div>

          {/* Crypto Market Analysis */}
          <div className="space-y-8">
            {/* BTC Market Analysis */}
            <BTCMarketAnalysis />
            
            {/* ETH Market Analysis */}
            <ETHMarketAnalysis />
          </div>
        </div>
      </section>

      {/* Real-time Status Bar */}
      <section className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">
                <span className="animate-pulse">●</span> LIVE
              </div>
              <div className="text-sm text-gray-400">AI Analysis Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">
                MANUAL
              </div>
              <div className="text-sm text-gray-400">Update Frequency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                <Zap className="h-6 w-6 inline" />
              </div>
              <div className="text-sm text-gray-400">OpenAI Powered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                24/7
              </div>
              <div className="text-sm text-gray-400">Market Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform leverages OpenAI's latest models to provide real-time analysis and insights
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Regulatory Intelligence</h3>
              </div>
              <p className="text-gray-600">
                AI-powered analysis of UK regulatory changes affecting Nexo.com operations, 
                with impact assessments and compliance deadlines.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-8 w-8 text-orange-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Technical Analysis</h3>
              </div>
              <p className="text-gray-600">
                Advanced BTC market analysis with AI-generated trading signals, 
                support/resistance levels, and sentiment analysis.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Real-time Updates</h3>
              </div>
              <p className="text-gray-600">
                Continuous monitoring and analysis with automatic refresh intervals 
                to keep you informed of the latest developments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stay Ahead of the Market
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Get instant alerts for critical regulatory changes and high-confidence trading signals
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium whitespace-nowrap"
            >
              Subscribe to Alerts
            </button>
          </form>
          <p className="text-xs opacity-70 mt-4">
            Real-time regulatory updates • Technical analysis alerts • Market intelligence
          </p>
        </div>
      </section>
    </Layout>
  )
}
