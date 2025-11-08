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
          const hasData = source.data && source.data.success;

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
  const agg = data.priceAggregation;
  
  return (
    <div className="space-y-3">
      <DataRow label="Aggregated Price" value={agg?.averagePrice ? `$${agg.averagePrice.toLocaleString()}` : '$N/A'} />
      <DataRow label="24h Volume" value={agg?.totalVolume24h ? `$${agg.totalVolume24h.toLocaleString()}` : '$N/A'} />
      <DataRow label="Market Cap" value={data.marketData?.marketCap ? `$${data.marketData.marketCap.toLocaleString()}` : '$N/A'} />
      <DataRow label="24h Change" value={agg?.averageChange24h ? `${agg.averageChange24h.toFixed(2)}%` : 'N/A%'} />
      <DataRow label="Data Quality" value={`${data.dataQuality || 0}%`} />
      
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
  const sentiment = data.sentiment;
  const sources = data.sources;
  const distribution = sentiment?.distribution;
  const trends24h = sentiment?.trends?.['24h'] || [];
  
  // Get recent trend (last 3 hours average)
  const recentTrend = trends24h.slice(-3);
  const recentAvgScore = recentTrend.length > 0 
    ? recentTrend.reduce((sum: number, t: any) => sum + (t.score || 0), 0) / recentTrend.length
    : sentiment?.overallScore || 0;
  
  // Determine trend based on recent average score
  const getTrend = (score: number) => {
    if (score > 5) return 'Bullish';
    if (score < -5) return 'Bearish';
    return 'Neutral';
  };
  
  const getTrendDescription = (score: number) => {
    if (score > 10) return 'Strongly Bullish';
    if (score > 5) return 'Bullish';
    if (score > 0) return 'Slightly Bullish';
    if (score === 0) return 'Neutral';
    if (score > -5) return 'Slightly Bearish';
    if (score > -10) return 'Bearish';
    return 'Strongly Bearish';
  };
  
  const trend = getTrend(recentAvgScore);
  const trendDescription = getTrendDescription(recentAvgScore);
  const trendColor = recentAvgScore > 0 ? 'text-bitcoin-orange' : 
                     recentAvgScore < 0 ? 'text-bitcoin-white-60' : 
                     'text-bitcoin-white';
  
  // Calculate momentum (comparing last hour to previous hour)
  const lastHour = trends24h.slice(-1)[0];
  const prevHour = trends24h.slice(-2, -1)[0];
  const momentum = lastHour && prevHour ? lastHour.score - prevHour.score : 0;
  const momentumText = momentum > 0 ? '↑ Improving' : momentum < 0 ? '↓ Declining' : '→ Stable';
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
        label="Sentiment Score (3h avg)" 
        value={recentAvgScore !== undefined ? `${recentAvgScore.toFixed(1)}/100` : 'N/A'} 
      />
      <div className="flex justify-between items-center py-2 border-b border-bitcoin-orange-20">
        <span className="text-sm text-bitcoin-white-60">Momentum</span>
        <span className={`text-sm font-mono font-semibold ${momentumColor}`}>{momentumText}</span>
      </div>
      <DataRow 
        label="Confidence" 
        value={sentiment?.confidence ? `${sentiment.confidence}%` : 'N/A'} 
      />
      <DataRow label="Data Quality" value={`${data.dataQuality || 0}%`} />
      
      {distribution && (
        <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
          <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
            Sentiment Distribution
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-bitcoin-white-80">Positive</span>
              <span className="text-sm font-mono font-semibold text-bitcoin-orange">
                {distribution.positive?.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-bitcoin-white-80">Neutral</span>
              <span className="text-sm font-mono font-semibold text-bitcoin-white">
                {distribution.neutral?.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-bitcoin-white-80">Negative</span>
              <span className="text-sm font-mono font-semibold text-bitcoin-white-60">
                {distribution.negative?.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
      
      {sources && (
        <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
          <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
            Active Sources
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(sources).map(([source, active]) => (
              <span
                key={source}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  active
                    ? 'bg-bitcoin-orange text-bitcoin-black'
                    : 'bg-bitcoin-black border border-bitcoin-white-20 text-bitcoin-white-60'
                }`}
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderTechnicalData(data: any) {
  const indicators = data.indicators;
  const signals = data.signals;
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
      <DataRow label="Data Quality" value={`${data.dataQuality || 0}%`} />
      
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
  const articles = data.articles || [];
  
  return (
    <div className="space-y-3">
      <DataRow label="Articles Found" value={articles.length.toString()} />
      <DataRow label="Data Quality" value={`${data.dataQuality || 0}%`} />
      
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
  const networkMetrics = data.networkMetrics;
  const whaleActivity = data.whaleActivity;
  const mempoolAnalysis = data.mempoolAnalysis;
  
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
      <DataRow label="Data Quality" value={`${data.dataQuality || 0}%`} />
      
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
