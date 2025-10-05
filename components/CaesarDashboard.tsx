import React from 'react';
import { useCaesarMarketData, useCaesarTradeSignals, useCaesarNews, useCaesarHealth } from '../hooks/useCaesarData';
import { TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle } from 'lucide-react';

interface CaesarDashboardProps {
  symbol: string;
}

export default function CaesarDashboard({ symbol }: CaesarDashboardProps) {
  const { data: marketData, loading: marketLoading, error: marketError } = useCaesarMarketData({ symbol });
  const { data: signals, loading: signalsLoading, error: signalsError } = useCaesarTradeSignals({ symbol });
  const { data: news, loading: newsLoading } = useCaesarNews([symbol], 10);
  const { health } = useCaesarHealth();

  return (
    <div className="w-full space-y-6">
      {/* Caesar API Health Status */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-purple-400" />
            <span className="text-white font-semibold">Caesar API Status</span>
          </div>
          <div className="flex items-center gap-2">
            {health?.status === 'healthy' ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">Online</span>
                <span className="text-gray-400 text-xs">({health.latency}ms)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Market Data Section */}
      <div className="bg-black/40 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-400" />
          {symbol} Market Data
        </h2>

        {marketLoading && (
          <div className="text-gray-400 animate-pulse">Loading market data from Caesar API...</div>
        )}

        {marketError && (
          <div className="bg-red-900/20 border border-red-500/30 rounded p-4 text-red-400">
            <AlertCircle className="w-5 h-5 inline mr-2" />
            {marketError}
          </div>
        )}

        {marketData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Current Price</div>
              <div className="text-2xl font-bold text-white">
                ${marketData.market?.price?.toLocaleString() || 'N/A'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">24h Change</div>
              <div className={`text-2xl font-bold flex items-center gap-2 ${
                (marketData.market?.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {(marketData.market?.change24h || 0) >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                {marketData.market?.change24h?.toFixed(2) || '0.00'}%
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">24h Volume</div>
              <div className="text-2xl font-bold text-white">
                ${(marketData.market?.volume24h / 1e9)?.toFixed(2) || '0'}B
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-900/30 to-yellow-900/30 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Market Cap</div>
              <div className="text-2xl font-bold text-white">
                ${(marketData.market?.marketCap / 1e9)?.toFixed(2) || '0'}B
              </div>
            </div>
          </div>
        )}

        {/* Technical Analysis */}
        {marketData?.technical && (
          <div className="mt-6 space-y-4">
            <h3 className="text-xl font-semibold text-white">Technical Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">Trend</div>
                <div className={`text-lg font-bold capitalize ${
                  marketData.technical.signals?.trend === 'bullish' ? 'text-green-400' :
                  marketData.technical.signals?.trend === 'bearish' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {marketData.technical.signals?.trend || 'N/A'}
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">Signal Strength</div>
                <div className="text-lg font-bold text-white">
                  {marketData.technical.signals?.strength || 0}/100
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">Recommendation</div>
                <div className={`text-lg font-bold uppercase ${
                  marketData.technical.signals?.recommendation === 'buy' ? 'text-green-400' :
                  marketData.technical.signals?.recommendation === 'sell' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {marketData.technical.signals?.recommendation || 'N/A'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">RSI</div>
                <div className="text-lg font-bold text-white">
                  {marketData.technical.indicators?.rsi?.toFixed(2) || 'N/A'}
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">MACD</div>
                <div className="text-lg font-bold text-white">
                  {marketData.technical.indicators?.macd?.value?.toFixed(2) || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trade Signals Section */}
      <div className="bg-black/40 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">AI Trade Signals</h2>

        {signalsLoading && (
          <div className="text-gray-400 animate-pulse">Loading trade signals from Caesar API...</div>
        )}

        {signalsError && (
          <div className="bg-red-900/20 border border-red-500/30 rounded p-4 text-red-400">
            <AlertCircle className="w-5 h-5 inline mr-2" />
            {signalsError}
          </div>
        )}

        {signals && signals.length > 0 && (
          <div className="space-y-4">
            {signals.map((signal: any, index: number) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  signal.action === 'buy'
                    ? 'bg-green-900/20 border-green-500/30'
                    : 'bg-red-900/20 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold uppercase ${
                      signal.action === 'buy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {signal.action}
                    </span>
                    <span className="text-gray-400">
                      Confidence: {(signal.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm">{signal.timeframe}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <div className="text-gray-400 text-xs">Entry Price</div>
                    <div className="text-white font-semibold">${signal.entryPrice?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Stop Loss</div>
                    <div className="text-red-400 font-semibold">${signal.stopLoss?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Take Profit</div>
                    <div className="text-green-400 font-semibold">
                      ${signal.takeProfit?.[0]?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="text-gray-300 text-sm bg-black/30 rounded p-3">
                  {signal.reasoning}
                </div>
              </div>
            ))}
          </div>
        )}

        {signals && signals.length === 0 && (
          <div className="text-gray-400 text-center py-8">
            No active trade signals at this time
          </div>
        )}
      </div>

      {/* News Section */}
      <div className="bg-black/40 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Latest News</h2>

        {newsLoading && (
          <div className="text-gray-400 animate-pulse">Loading news from Caesar API...</div>
        )}

        {news && news.length > 0 && (
          <div className="space-y-3">
            {news.map((item: any, index: number) => (
              <div
                key={index}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">{item.summary}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        item.sentiment === 'positive' ? 'bg-green-900/30 text-green-400' :
                        item.sentiment === 'negative' ? 'bg-red-900/30 text-red-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {item.sentiment}
                      </span>
                      <span className="text-gray-500">{item.source}</span>
                      <span className="text-gray-500">
                        {new Date(item.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
