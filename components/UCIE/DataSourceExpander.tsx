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
  
  // Determine trend based on score
  const getTrend = (score: number) => {
    if (score > 5) return 'Bullish';
    if (score < -5) return 'Bearish';
    return 'Neutral';
  };
  
  const trend = getTrend(sentiment?.overallScore || 0);
  const trendColor = trend === 'Bullish' ? 'text-bitcoin-orange' : 
                     trend === 'Bearish' ? 'text-bitcoin-white-60' : 
                     'text-bitcoin-white';
  
  return (
    <div className="space-y-3">
      <DataRow 
        label="Overall Score" 
        value={sentiment?.overallScore !== undefined ? `${sentiment.overallScore}/100` : 'N/A'} 
      />
      <div className="flex justify-between items-center py-2 border-b border-bitcoin-orange-20">
        <span className="text-sm text-bitcoin-white-60">Trend</span>
        <span className={`text-sm font-mono font-semibold ${trendColor}`}>{trend}</span>
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
  
  return (
    <div className="space-y-3">
      <DataRow label="Data Quality" value={`${data.dataQuality || 0}%`} />
      
      {indicators && (
        <>
          {indicators.rsi && (
            <div className="p-3 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded">
              <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">RSI</p>
              <p className="text-lg font-mono font-bold text-bitcoin-orange">
                {indicators.rsi.value?.toFixed(2)} - {indicators.rsi.signal}
              </p>
            </div>
          )}
          
          {indicators.macd && (
            <div className="p-3 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded">
              <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">MACD</p>
              <p className="text-lg font-mono font-bold text-bitcoin-orange">
                {indicators.macd.signal}
              </p>
            </div>
          )}
          
          {indicators.trend && (
            <div className="p-3 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded">
              <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">Trend</p>
              <p className="text-lg font-mono font-bold text-bitcoin-orange">
                {indicators.trend.direction} ({indicators.trend.strength})
              </p>
            </div>
          )}
          
          {indicators.volatility && (
            <DataRow label="Volatility" value={indicators.volatility.current} />
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
    const exaHash = hashRate / 1e18;
    return `${exaHash.toFixed(2)} EH/s`;
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
