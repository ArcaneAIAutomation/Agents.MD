/**
 * Data Source Expander Component
 * 
 * Displays expandable sections showing detailed data from each API source
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Database, CheckCircle, XCircle } from 'lucide-react';

interface DataSourceExpanderProps {
  collectedData: {
    marketData: any;
    sentiment: any;
    technical: any;
    news: any;
    onChain: any;
  };
  apiStatus: {
    working: string[];
    failed: string[];
  };
}

export default function DataSourceExpander({ collectedData, apiStatus }: DataSourceExpanderProps) {
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  const toggleSource = (source: string) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(source)) {
        newSet.delete(source);
      } else {
        newSet.add(source);
      }
      return newSet;
    });
  };

  const isWorking = (source: string) => apiStatus.working.includes(source);

  const dataSources = [
    {
      id: 'Market Data',
      data: collectedData.marketData,
      icon: <Database className="w-5 h-5" />,
      description: 'Real-time price, volume, and market cap data'
    },
    {
      id: 'Sentiment',
      data: collectedData.sentiment,
      icon: <Database className="w-5 h-5" />,
      description: 'Social sentiment analysis from multiple platforms'
    },
    {
      id: 'Technical',
      data: collectedData.technical,
      icon: <Database className="w-5 h-5" />,
      description: 'Technical indicators and chart analysis'
    },
    {
      id: 'News',
      data: collectedData.news,
      icon: <Database className="w-5 h-5" />,
      description: 'Latest news and developments'
    },
    {
      id: 'On-Chain',
      data: collectedData.onChain,
      icon: <Database className="w-5 h-5" />,
      description: 'Blockchain analytics and whale activity'
    }
  ];

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
      <h3 className="text-lg font-bold text-bitcoin-white mb-3 flex items-center gap-2">
        <Database className="w-5 h-5 text-bitcoin-orange" />
        Collected Data by Source
      </h3>
      <p className="text-sm text-bitcoin-white-60 mb-4">
        Click on any source to view the detailed data collected
      </p>

      <div className="space-y-2">
        {dataSources.map((source) => {
          const isExpanded = expandedSources.has(source.id);
          const working = isWorking(source.id);
          // ✅ FIX: Check if data exists (not just success flag)
          const hasData = source.data && (
            source.data.success || // API response format
            source.data.symbol || // Direct data format
            source.data.overallScore !== undefined || // Sentiment format
            source.data.chain || // On-chain format
            Object.keys(source.data).length > 0 // Any data
          );

          return (
            <div
              key={source.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                working
                  ? 'border-bitcoin-orange-20 hover:border-bitcoin-orange'
                  : 'border-bitcoin-white-20 opacity-60'
              }`}
            >
              {/* Header */}
              <button
                onClick={() => working && toggleSource(source.id)}
                disabled={!working}
                className={`w-full flex items-center justify-between p-3 transition-colors ${
                  working
                    ? 'hover:bg-bitcoin-orange-5 cursor-pointer'
                    : 'cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  {working ? (
                    <CheckCircle className="text-bitcoin-orange flex-shrink-0" size={20} />
                  ) : (
                    <XCircle className="text-bitcoin-white-60 flex-shrink-0" size={20} />
                  )}
                  <div className="text-left">
                    <div className="font-semibold text-bitcoin-white">
                      {source.id}
                    </div>
                    <div className="text-xs text-bitcoin-white-60">
                      {source.description}
                    </div>
                  </div>
                </div>
                {working && (
                  <div className="text-bitcoin-orange">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                )}
              </button>

              {/* Expanded Content */}
              {isExpanded && hasData && (
                <div className="border-t border-bitcoin-orange-20 p-4 bg-bitcoin-black">
                  <div className="space-y-3">
                    {/* Render data based on source type */}
                    {source.id === 'Market Data' && renderMarketData(source.data)}
                    {source.id === 'Sentiment' && renderSentimentData(source.data)}
                    {source.id === 'Technical' && renderTechnicalData(source.data)}
                    {source.id === 'News' && renderNewsData(source.data)}
                    {source.id === 'On-Chain' && renderOnChainData(source.data)}
                  </div>
                </div>
              )}

              {isExpanded && !hasData && working && (
                <div className="border-t border-bitcoin-orange-20 p-4 bg-bitcoin-black text-center">
                  <p className="text-bitcoin-white-60 text-sm">
                    No data available from this source
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Render functions for each data type
function renderMarketData(data: any) {
  // ✅ FIX: Handle both API response format and direct data format
  const actualData = data.data || data;
  const agg = actualData.priceAggregation;
  
  return (
    <div className="space-y-3">
      <DataRow label="Aggregated Price" value={agg?.averagePrice ? `$${agg.averagePrice.toLocaleString()}` : '$N/A'} />
      <DataRow label="24h Volume" value={agg?.totalVolume24h ? `$${agg.totalVolume24h.toLocaleString()}` : '$N/A'} />
      <DataRow label="Market Cap" value={actualData.marketData?.marketCap ? `$${actualData.marketData.marketCap.toLocaleString()}` : '$N/A'} />
      <DataRow label="24h Change" value={agg?.averageChange24h ? `${agg.averageChange24h.toFixed(2)}%` : 'N/A%'} />
      <DataRow label="Data Quality" value={`${actualData.dataQuality || 0}%`} />
      
      {agg?.prices && agg.prices.length > 0 && (
        <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
          <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
            Price Sources ({agg.prices.length})
          </p>
          <div className="space-y-1">
            {agg.prices.map((price: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-bitcoin-white-80">{price.exchange || price.source}</span>
                <span className="text-bitcoin-orange font-mono">${price.price?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderSentimentData(data: any) {
  // ✅ FIX: Handle both API response format and direct data format
  const actualData = data.data || data; // API returns { success: true, data: {...} }
  
  // The API returns: { overallScore, sentiment, lunarCrush, reddit, twitter, dataQuality }
  const overallScore = actualData.overallScore || 50;
  const sentimentLabel = actualData.sentiment || 'neutral';
  const lunarCrush = actualData.lunarCrush;
  const reddit = actualData.reddit;
  
  // Use overallScore as the recent score
  const recentAvgScore = overallScore;
  
  // Determine trend based on overall score (0-100 scale)
  const getTrendDescription = (score: number) => {
    if (score >= 80) return 'Strongly Bullish';
    if (score >= 60) return 'Bullish';
    if (score >= 55) return 'Slightly Bullish';
    if (score >= 45) return 'Neutral';
    if (score >= 40) return 'Slightly Bearish';
    if (score >= 20) return 'Bearish';
    return 'Strongly Bearish';
  };
  
  const trendDescription = getTrendDescription(recentAvgScore);
  const trendColor = recentAvgScore >= 60 ? 'text-bitcoin-orange' : 
                     recentAvgScore <= 40 ? 'text-bitcoin-white-60' : 
                     'text-bitcoin-white';
  
  // Use LunarCrush volume change as momentum indicator
  const momentum = lunarCrush?.socialVolumeChange24h || 0;
  const momentumText = momentum > 0 ? `↑ +${momentum.toFixed(1)}%` : momentum < 0 ? `↓ ${momentum.toFixed(1)}%` : '→ Stable';
  const momentumColor = momentum > 0 ? 'text-bitcoin-orange' : momentum < 0 ? 'text-bitcoin-white-60' : 'text-bitcoin-white';
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center py-2 border-b border-bitcoin-orange-20">
        <span className="text-sm text-bitcoin-white-60">Current Sentiment</span>
        <span className={`text-sm font-mono font-semibold ${trendColor}`}>
          {trendDescription}
        </span>
      </div>
      <DataRow 
        label="Overall Sentiment Score" 
        value={`${recentAvgScore}/100`} 
      />
      <div className="flex justify-between items-center py-2 border-b border-bitcoin-orange-20">
        <span className="text-sm text-bitcoin-white-60">Social Volume Change (24h)</span>
        <span className={`text-sm font-mono font-semibold ${momentumColor}`}>{momentumText}</span>
      </div>
      <DataRow label="Data Quality" value={`${actualData.dataQuality || 0}%`} />
      
      {lunarCrush && (
        <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
          <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
            LunarCrush Metrics
          </p>
          <div className="space-y-2">
            <DataRow 
              label="Galaxy Score" 
              value={`${lunarCrush.galaxyScore || 0}/100`} 
            />
            <DataRow 
              label="Social Score" 
              value={`${lunarCrush.socialScore || 0}/100`} 
            />
            <DataRow 
              label="AltRank" 
              value={`#${lunarCrush.altRank || 'N/A'}`} 
            />
            <DataRow 
              label="Social Volume" 
              value={`${(lunarCrush.socialVolume || 0).toLocaleString()}`} 
            />
            <DataRow 
              label="Social Dominance" 
              value={`${(lunarCrush.socialDominance || 0).toFixed(2)}%`} 
            />
            <DataRow 
              label="Mentions" 
              value={`${(lunarCrush.mentions || 0).toLocaleString()}`} 
            />
            <DataRow 
              label="Interactions" 
              value={`${(lunarCrush.interactions || 0).toLocaleString()}`} 
            />
            <DataRow 
              label="Contributors" 
              value={`${(lunarCrush.contributors || 0).toLocaleString()}`} 
            />
          </div>
        </div>
      )}
      
      {reddit && (
        <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
          <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
            Reddit Metrics
          </p>
          <div className="space-y-2">
            <DataRow 
              label="Mentions (24h)" 
              value={`${reddit.mentions24h || 0}`} 
            />
            <DataRow 
              label="Sentiment" 
              value={`${reddit.sentiment || 0}/100`} 
            />
            <DataRow 
              label="Active Subreddits" 
              value={reddit.activeSubreddits?.join(', ') || 'N/A'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Keep the old sources section if needed, but it's not in the current API response
*/

function renderTechnicalData(data: any) {
  // ✅ FIX: Handle both API response format and direct data format
  const actualData = data.data || data;
  const indicators = actualData.indicators;
  const signals = actualData.signals;
  const timeframe = data.timeframe || '1h';
  
  // Helper to get signal color
  const getSignalColor = (signal: string) => {
    if (signal === 'bullish' || signal === 'buy' || signal === 'overbought') return 'text-bitcoin-orange';
    if (signal === 'bearish' || signal === 'sell' || signal === 'oversold') return 'text-bitcoin-white-60';
    return 'text-bitcoin-white';
  };
  
  return (
    <div className="space-y-3">
      <DataRow label="Timeframe" value={timeframe.toUpperCase()} />
      <DataRow label="Data Quality" value={`${actualData.dataQuality || 0}%`} />
      
      {signals && (
        <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
          <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
            Overall Signal
          </p>
          <div className="p-3 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xl font-bold uppercase ${getSignalColor(signals.overall)}`}>
                {signals.overall}
              </span>
              <span className="text-sm text-bitcoin-white-60">
                {signals.confidence}% confidence
              </span>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-bitcoin-orange">Buy: {signals.buySignals || 0}</span>
              <span className="text-bitcoin-white">Neutral: {signals.neutralSignals || 0}</span>
              <span className="text-bitcoin-white-60">Sell: {signals.sellSignals || 0}</span>
            </div>
            {signals.reasons && signals.reasons.length > 0 && (
              <div className="mt-2 pt-2 border-t border-bitcoin-orange-20">
                <p className="text-xs text-bitcoin-white-60 mb-1">Key Signals:</p>
                {signals.reasons.map((reason: string, i: number) => (
                  <p key={i} className="text-xs text-bitcoin-white-80">• {reason}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {indicators && (
        <>
          {/* RSI - Relative Strength Index */}
          {indicators.rsi && (
            <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
              <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
                RSI (Relative Strength Index)
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Value</span>
                  <span className={`text-lg font-mono font-bold ${getSignalColor(indicators.rsi.signal)}`}>
                    {indicators.rsi.value?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Signal</span>
                  <span className={`text-sm font-semibold uppercase ${getSignalColor(indicators.rsi.signal)}`}>
                    {indicators.rsi.signal}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Strength</span>
                  <span className="text-sm text-bitcoin-white">{indicators.rsi.strength}</span>
                </div>
                <div className="text-xs text-bitcoin-white-60 italic mt-2">
                  RSI measures momentum: &lt;30 oversold, &gt;70 overbought
                </div>
              </div>
            </div>
          )}
          
          {/* MACD - Moving Average Convergence Divergence */}
          {indicators.macd && (
            <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
              <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
                MACD (Trend Momentum)
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Trend</span>
                  <span className={`text-lg font-semibold uppercase ${getSignalColor(indicators.macd.trend)}`}>
                    {indicators.macd.trend}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">MACD Line</span>
                  <span className="text-sm font-mono text-bitcoin-white">
                    {indicators.macd.value?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Signal Line</span>
                  <span className="text-sm font-mono text-bitcoin-white">
                    {indicators.macd.signal?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Histogram</span>
                  <span className={`text-sm font-mono ${indicators.macd.histogram > 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                    {indicators.macd.histogram?.toFixed(2)}
                  </span>
                </div>
                {indicators.macd.crossover && indicators.macd.crossover !== 'none' && (
                  <div className="p-2 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded mt-2">
                    <p className="text-xs text-bitcoin-orange font-semibold">
                      🎯 {indicators.macd.crossover.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* EMA - Exponential Moving Averages */}
          {indicators.ema && (
            <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
              <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
                EMA (Moving Averages)
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Trend</span>
                  <span className={`text-sm font-semibold uppercase ${getSignalColor(indicators.ema.trend)}`}>
                    {indicators.ema.trend}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">EMA 9</span>
                  <span className="text-sm font-mono text-bitcoin-white">
                    ${indicators.ema.ema9?.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">EMA 21</span>
                  <span className="text-sm font-mono text-bitcoin-white">
                    ${indicators.ema.ema21?.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">EMA 50</span>
                  <span className="text-sm font-mono text-bitcoin-white">
                    ${indicators.ema.ema50?.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">EMA 200</span>
                  <span className="text-sm font-mono text-bitcoin-white">
                    ${indicators.ema.ema200?.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Alignment</span>
                  <span className="text-sm text-bitcoin-white">{indicators.ema.alignment}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Bollinger Bands */}
          {indicators.bollingerBands && (
            <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
              <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
                Bollinger Bands
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Upper Band</span>
                  <span className="text-sm font-mono text-bitcoin-white">
                    ${indicators.bollingerBands.upper?.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Middle Band</span>
                  <span className="text-sm font-mono text-bitcoin-orange">
                    ${indicators.bollingerBands.middle?.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Lower Band</span>
                  <span className="text-sm font-mono text-bitcoin-white">
                    ${indicators.bollingerBands.lower?.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Position</span>
                  <span className="text-sm text-bitcoin-white uppercase">
                    {indicators.bollingerBands.position?.replace('_', ' ')}
                  </span>
                </div>
                {indicators.bollingerBands.squeeze && (
                  <div className="p-2 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded mt-2">
                    <p className="text-xs text-bitcoin-orange font-semibold">
                      ⚠️ SQUEEZE DETECTED - Volatility breakout likely
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Stochastic Oscillator */}
          {indicators.stochastic && (
            <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
              <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
                Stochastic Oscillator
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">%K Line</span>
                  <span className="text-sm font-mono text-bitcoin-white">
                    {indicators.stochastic.k?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">%D Line</span>
                  <span className="text-sm font-mono text-bitcoin-white">
                    {indicators.stochastic.d?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Signal</span>
                  <span className={`text-sm font-semibold uppercase ${getSignalColor(indicators.stochastic.signal)}`}>
                    {indicators.stochastic.signal}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* ATR - Average True Range */}
          {indicators.atr && (
            <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
              <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
                ATR (Volatility Measure)
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Value</span>
                  <span className="text-sm font-mono text-bitcoin-white">
                    ${indicators.atr.value?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">Volatility</span>
                  <span className={`text-sm font-semibold uppercase ${
                    indicators.atr.volatility === 'high' ? 'text-bitcoin-orange' :
                    indicators.atr.volatility === 'low' ? 'text-bitcoin-white-60' :
                    'text-bitcoin-white'
                  }`}>
                    {indicators.atr.volatility}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bitcoin-white-60">% of Price</span>
                  <span className="text-sm font-mono text-bitcoin-white">
                    {indicators.atr.percentOfPrice?.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function renderNewsData(data: any) {
  // ✅ FIX: Handle both API response format and direct data format
  const actualData = data.data || data;
  const articles = actualData.articles || [];
  
  return (
    <div className="space-y-3">
      <DataRow label="Articles Found" value={articles.length.toString()} />
      <DataRow label="Data Quality" value={`${actualData.dataQuality || 0}%`} />
      
      {articles.length > 0 && (
        <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
          <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
            Recent Articles (Top 5)
          </p>
          <div className="space-y-2">
            {articles.slice(0, 5).map((article: any, index: number) => (
              <div key={index} className="p-2 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded">
                <p className="text-sm font-semibold text-bitcoin-white mb-1">
                  {article.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-bitcoin-white-60">
                  <span>{article.source}</span>
                  {article.publishedAt && (
                    <>
                      <span>•</span>
                      <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderOnChainData(data: any) {
  // ✅ FIX: Handle both API response format and direct data format
  const actualData = data.data || data; // API returns { success: true, data: {...} }
  const networkMetrics = actualData.networkMetrics;
  const whaleActivity = actualData.whaleActivity;
  const mempoolAnalysis = actualData.mempoolAnalysis;
  
  // Format large numbers for readability
  const formatHashRate = (hashRate: number) => {
    // Hash rate is in H/s, convert to EH/s (1 EH/s = 1e18 H/s)
    // But the API returns it in a different unit, so we need to check the actual value
    // If hashRate is ~945922301220, it's likely in GH/s, so divide by 1e9 to get EH/s
    if (hashRate > 1e15) {
      // Value is in H/s
      const exaHash = hashRate / 1e18;
      return `${exaHash.toFixed(2)} EH/s`;
    } else if (hashRate > 1e12) {
      // Value is in TH/s
      const exaHash = hashRate / 1e6;
      return `${exaHash.toFixed(2)} EH/s`;
    } else {
      // Value is in GH/s (most likely based on API data)
      const exaHash = hashRate / 1e9;
      return `${exaHash.toFixed(2)} EH/s`;
    }
  };
  
  const formatDifficulty = (difficulty: number) => {
    const trillion = difficulty / 1e12;
    return `${trillion.toFixed(2)}T`;
  };
  
  return (
    <div className="space-y-3">
      <DataRow label="Data Quality" value={`${actualData.dataQuality || 0}%`} />
      
      {networkMetrics && (
        <>
          <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
            <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
              Network Health
            </p>
            <div className="space-y-2">
              <DataRow 
                label="Hash Rate" 
                value={formatHashRate(networkMetrics.hashRate)} 
              />
              <DataRow 
                label="Mining Difficulty" 
                value={formatDifficulty(networkMetrics.difficulty)} 
              />
              <DataRow 
                label="Average Block Time" 
                value={`${networkMetrics.blockTime?.toFixed(2)} min`} 
              />
              <DataRow 
                label="Circulating Supply" 
                value={`${networkMetrics.totalCirculating?.toLocaleString()} BTC`} 
              />
            </div>
          </div>
        </>
      )}
      
      {whaleActivity?.summary && (
        <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
          <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
            Whale Activity (Last Hour)
          </p>
          <div className="space-y-2">
            <DataRow 
              label="Large Transactions" 
              value={whaleActivity.summary.totalTransactions?.toString() || '0'} 
            />
            <DataRow 
              label="Total Value" 
              value={`$${whaleActivity.summary.totalValueUSD?.toLocaleString(undefined, {maximumFractionDigits: 0}) || '0'}`} 
            />
            <DataRow 
              label="Total BTC Moved" 
              value={`${whaleActivity.summary.totalValueBTC?.toFixed(2) || '0'} BTC`} 
            />
            <DataRow 
              label="Largest Transaction" 
              value={`$${whaleActivity.summary.largestTransaction?.toLocaleString(undefined, {maximumFractionDigits: 0}) || '0'}`} 
            />
          </div>
          
          {whaleActivity.transactions && whaleActivity.transactions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
                Recent Whale Transactions
              </p>
              <div className="space-y-2">
                {whaleActivity.transactions.slice(0, 3).map((tx: any, index: number) => (
                  <div key={index} className="p-2 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-bitcoin-white-60">
                        {tx.valueBTC?.toFixed(2)} BTC
                      </span>
                      <span className="text-xs font-mono font-semibold text-bitcoin-orange">
                        ${tx.valueUSD?.toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                    </div>
                    <div className="text-xs text-bitcoin-white-60 font-mono truncate">
                      {tx.hash?.substring(0, 16)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {mempoolAnalysis && (
        <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
          <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
            Mempool Status
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-bitcoin-white-60">Congestion</span>
              <span className={`text-sm font-semibold uppercase ${
                mempoolAnalysis.congestion === 'low' ? 'text-bitcoin-orange' :
                mempoolAnalysis.congestion === 'medium' ? 'text-bitcoin-white' :
                'text-bitcoin-white-60'
              }`}>
                {mempoolAnalysis.congestion}
              </span>
            </div>
            <DataRow 
              label="Recommended Fee" 
              value={`${mempoolAnalysis.recommendedFee} sat/vB`} 
            />
          </div>
        </div>
      )}
      
      {!networkMetrics && !whaleActivity && !mempoolAnalysis && (
        <p className="text-sm text-bitcoin-white-60 italic">
          Limited on-chain data available
        </p>
      )}
    </div>
  );
}

// Helper component for data rows
function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-bitcoin-orange-20 last:border-0">
      <span className="text-sm text-bitcoin-white-60">{label}</span>
      <span className="text-sm font-mono font-semibold text-bitcoin-white">{value}</span>
    </div>
  );
}
