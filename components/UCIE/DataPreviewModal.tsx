/**
 * UCIE Data Preview Modal
 * 
 * Displays collected data summary before Caesar AI analysis
 * Gives users option to Continue or Cancel
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import DataSourceExpander from './DataSourceExpander';

interface DataPreviewModalProps {
  symbol: string;
  isOpen: boolean;
  onContinue: (previewData: DataPreview) => void; // ✅ Pass preview data to Caesar
  onCancel: () => void;
}

interface DataPreview {
  symbol: string;
  timestamp: string;
  dataQuality: number;
  summary: string;
  aiAnalysis: string | null; // ✅ Full AI analysis (GPT-5.1)
  caesarPromptPreview: string; // ✅ Caesar prompt preview
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
    total: number;
    successRate: number;
  };
}

export default function DataPreviewModal({
  symbol,
  isOpen,
  onContinue,
  onCancel
}: DataPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<DataPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // GPT-5.1 polling state
  const [gptJobId, setGptJobId] = useState<number | null>(null);
  const [gptStatus, setGptStatus] = useState<'idle' | 'queued' | 'processing' | 'completed' | 'error'>('idle');
  const [gptProgress, setGptProgress] = useState<string>('');
  const [gptElapsedTime, setGptElapsedTime] = useState<number>(0);

  useEffect(() => {
    if (isOpen && symbol) {
      fetchDataPreview();
    }
  }, [isOpen, symbol]);
  
  // Poll for GPT-5.1 results
  useEffect(() => {
    if (!gptJobId || gptStatus === 'completed' || gptStatus === 'error') {
      return;
    }
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/ucie/openai-summary-poll/${gptJobId}`);
        if (!response.ok) {
          throw new Error(`Poll failed: ${response.status}`);
        }
        
        const data = await response.json();
        setGptStatus(data.status);
        
        if (data.progress) {
          setGptProgress(data.progress);
        }
        
        if (data.status === 'completed' && data.result) {
          // Parse and update preview with GPT-5.1 analysis
          const analysis = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          
          setPreview(prev => prev ? {
            ...prev,
            aiAnalysis: JSON.stringify(analysis, null, 2)
          } : null);
          
          console.log('✅ GPT-5.1 analysis completed:', analysis);
        }
        
        if (data.status === 'error') {
          console.error('❌ GPT-5.1 analysis failed:', data.error);
          setGptProgress('Analysis failed');
        }
      } catch (err) {
        console.error('❌ GPT-5.1 polling error:', err);
      }
    }, 3000); // Poll every 3 seconds
    
    // Track elapsed time
    const startTime = Date.now();
    const timeInterval = setInterval(() => {
      setGptElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => {
      clearInterval(pollInterval);
      clearInterval(timeInterval);
    };
  }, [gptJobId, gptStatus]);

  const fetchDataPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      // ✅ FORCE FRESH DATA: Always fetch fresh data when user clicks BTC/ETH
      // Add timestamp to prevent any caching
      const timestamp = Date.now();
      
      // ✅ EXTENDED TIMEOUT: 70 seconds to allow for 3 retries (3 x 10s) + delays (2 x 10s) + processing (10s)
      // This ensures the automatic retry logic has time to complete
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 70000); // 70 seconds
      
      console.log(`🔄 Fetching data with 70-second timeout (allows 3 automatic retries)...`);
      
      const response = await fetch(`/api/ucie/preview-data/${symbol}?refresh=true&t=${timestamp}`, {
        credentials: 'include', // Required for authentication cookie
        cache: 'no-store', // Prevent browser caching
        signal: controller.signal, // ✅ Add timeout signal
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setPreview(data.data);
        console.log('✅ Preview data loaded:', {
          dataQuality: data.data.dataQuality,
          sources: data.data.apiStatus.working.length,
          attempts: data.data.retryInfo?.attempts || 1,
          timestamp: data.data.timestamp,
          gptJobId: data.data.gptJobId
        });
        
        // ✅ CRITICAL: Check for GPT-5.1 jobId at top level (primary location)
        if (data.data.gptJobId) {
          console.log(`🚀 GPT-5.1 job ${data.data.gptJobId} detected, starting polling...`);
          setGptJobId(parseInt(data.data.gptJobId));
          setGptStatus('queued');
          setGptProgress('GPT-5.1 analysis queued...');
        } 
        // Fallback: Check if GPT-5.1 analysis was started (legacy location)
        else if (data.data.aiAnalysis) {
          try {
            const aiData = JSON.parse(data.data.aiAnalysis);
            if (aiData.gptJobId) {
              console.log(`🚀 GPT-5.1 job ${aiData.gptJobId} detected (legacy), starting polling...`);
              setGptJobId(parseInt(aiData.gptJobId));
              setGptStatus('queued');
              setGptProgress('GPT-5.1 analysis queued...');
            }
          } catch (err) {
            // aiAnalysis is not JSON, it's the actual analysis text
            console.log('✅ GPT-5.1 analysis already complete in preview');
          }
        }
      } else {
        setError(data.error || 'Failed to load data preview');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(`Failed to fetch data preview: ${errorMessage}`);
      console.error('Data preview error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bitcoin-black bg-opacity-90 p-4">
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-[0_0_40px_rgba(247,147,26,0.5)]">
        {/* Header */}
        <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-bitcoin-white">
              Data Collection Preview
            </h2>
            <p className="text-sm text-bitcoin-white-60 mt-1">
              Review collected data and ChatGPT 5.1 analysis before proceeding
            </p>
            <p className="text-xs text-bitcoin-orange mt-1">
              All data cached in database • 13+ sources • Ready for full analysis
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-bitcoin-orange border-t-transparent"></div>
              <p className="text-bitcoin-white-80 mt-4">
                Collecting data from {symbol}...
              </p>
              <p className="text-bitcoin-white-60 text-sm mt-2">
                This may take 20-60 seconds
              </p>
              <p className="text-bitcoin-white-60 text-xs mt-1">
                Automatic retry system ensures 100% data collection
              </p>
            </div>
          )}

          {error && (
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-8 text-center">
              <XCircle className="mx-auto text-bitcoin-orange mb-4" size={64} />
              <h3 className="text-2xl font-bold text-bitcoin-white mb-3">
                Data Collection Error
              </h3>
              <p className="text-bitcoin-white-80 text-lg mb-4">
                {error}
              </p>
              <p className="text-bitcoin-white-60 mb-6">
                Please try again or contact support if the issue persists.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={onCancel}
                  className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] min-h-[48px]"
                >
                  ← Go Back
                </button>
                <button
                  onClick={fetchDataPreview}
                  className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-8 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px]"
                >
                  Retry Collection
                </button>
              </div>
            </div>
          )}

          {preview && !loading && !error && (
            <div className="space-y-6">
              {/* Data Quality Score */}
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-bitcoin-white">
                    Data Quality Score
                  </h3>
                  <span className={`text-3xl font-mono font-bold ${
                    preview.dataQuality >= 80 ? 'text-bitcoin-orange' :
                    preview.dataQuality >= 60 ? 'text-bitcoin-white' :
                    'text-bitcoin-white-60'
                  }`}>
                    {preview.dataQuality}%
                  </span>
                </div>
                <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-bitcoin-orange h-full transition-all duration-500"
                    style={{ width: `${preview.dataQuality}%` }}
                  />
                </div>
                <p className="text-sm text-bitcoin-white-60 mt-2">
                  {preview.apiStatus.working.length} of {preview.apiStatus.total} data sources available
                </p>
              </div>

              {/* API Status */}
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <h3 className="text-lg font-bold text-bitcoin-white mb-3">
                  Data Sources
                </h3>
                <div className="space-y-3">
                  {/* Market Data */}
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-bitcoin-orange hover:bg-opacity-5 transition-colors">
                    {preview.collectedData.marketData?.success ? (
                      <CheckCircle className="text-bitcoin-orange flex-shrink-0 mt-0.5" size={20} />
                    ) : (
                      <XCircle className="text-bitcoin-white-60 flex-shrink-0 mt-0.5" size={20} />
                    )}
                    <div className="flex-1">
                      <span className={`font-semibold ${preview.collectedData.marketData?.success ? 'text-bitcoin-white' : 'text-bitcoin-white-60 line-through'}`}>
                        Market Data
                      </span>
                      <p className="text-xs text-bitcoin-white-60 mt-0.5">
                        Real-time price, volume, market cap from CoinGecko, CoinMarketCap, Kraken
                      </p>
                    </div>
                  </div>

                  {/* Technical */}
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-bitcoin-orange hover:bg-opacity-5 transition-colors">
                    {preview.collectedData.technical?.success ? (
                      <CheckCircle className="text-bitcoin-orange flex-shrink-0 mt-0.5" size={20} />
                    ) : (
                      <XCircle className="text-bitcoin-white-60 flex-shrink-0 mt-0.5" size={20} />
                    )}
                    <div className="flex-1">
                      <span className={`font-semibold ${preview.collectedData.technical?.success ? 'text-bitcoin-white' : 'text-bitcoin-white-60 line-through'}`}>
                        Technical Analysis
                      </span>
                      <p className="text-xs text-bitcoin-white-60 mt-0.5">
                        RSI, MACD, EMA, Bollinger Bands, ATR, Stochastic indicators
                      </p>
                    </div>
                  </div>

                  {/* News */}
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-bitcoin-orange hover:bg-opacity-5 transition-colors">
                    {preview.collectedData.news?.success ? (
                      <CheckCircle className="text-bitcoin-orange flex-shrink-0 mt-0.5" size={20} />
                    ) : (
                      <XCircle className="text-bitcoin-white-60 flex-shrink-0 mt-0.5" size={20} />
                    )}
                    <div className="flex-1">
                      <span className={`font-semibold ${preview.collectedData.news?.success ? 'text-bitcoin-white' : 'text-bitcoin-white-60 line-through'}`}>
                        News & Events
                      </span>
                      <p className="text-xs text-bitcoin-white-60 mt-0.5">
                        Latest cryptocurrency news from NewsAPI and CryptoCompare
                      </p>
                    </div>
                  </div>

                  {/* Sentiment */}
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-bitcoin-orange hover:bg-opacity-5 transition-colors">
                    {preview.collectedData.sentiment?.success ? (
                      <CheckCircle className="text-bitcoin-orange flex-shrink-0 mt-0.5" size={20} />
                    ) : (
                      <XCircle className="text-bitcoin-white-60 flex-shrink-0 mt-0.5" size={20} />
                    )}
                    <div className="flex-1">
                      <span className={`font-semibold ${preview.collectedData.sentiment?.success ? 'text-bitcoin-white' : 'text-bitcoin-white-60 line-through'}`}>
                        Social Sentiment
                      </span>
                      <p className="text-xs text-bitcoin-white-60 mt-0.5">
                        Community sentiment from Twitter, Reddit, LunarCrush social metrics
                      </p>
                    </div>
                  </div>

                  {/* On-Chain */}
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-bitcoin-orange hover:bg-opacity-5 transition-colors">
                    {preview.collectedData.onChain?.success ? (
                      <CheckCircle className="text-bitcoin-orange flex-shrink-0 mt-0.5" size={20} />
                    ) : (
                      <XCircle className="text-bitcoin-white-60 flex-shrink-0 mt-0.5" size={20} />
                    )}
                    <div className="flex-1">
                      <span className={`font-semibold ${preview.collectedData.onChain?.success ? 'text-bitcoin-white' : 'text-bitcoin-white-60 line-through'}`}>
                        On-Chain Analytics
                      </span>
                      <p className="text-xs text-bitcoin-white-60 mt-0.5">
                        Blockchain data, whale movements, network activity from Etherscan/Blockchain.com
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-bitcoin-white-60 mt-3 pt-3 border-t border-bitcoin-orange-20">
                  {preview.apiStatus.working.length} of {preview.apiStatus.total} sources available • 
                  {preview.apiStatus.successRate >= 80 ? ' Excellent' : preview.apiStatus.successRate >= 60 ? ' Good' : ' Fair'} data quality
                </p>
              </div>

              {/* Market Overview */}
              {preview.collectedData.marketData?.success && preview.collectedData.marketData?.priceAggregation && (
                <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-bitcoin-white mb-3">
                    Market Overview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">
                        Price
                      </p>
                      <p className="text-xl font-mono font-bold text-bitcoin-orange">
                        ${preview.collectedData.marketData.priceAggregation.averagePrice?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">
                        24h Change
                      </p>
                      <p className={`text-xl font-mono font-bold flex items-center gap-1 ${
                        (preview.collectedData.marketData.priceAggregation.averageChange24h || 0) > 0
                          ? 'text-bitcoin-orange'
                          : (preview.collectedData.marketData.priceAggregation.averageChange24h || 0) < 0
                          ? 'text-bitcoin-white-60'
                          : 'text-bitcoin-white'
                      }`}>
                        {(preview.collectedData.marketData.priceAggregation.averageChange24h || 0) > 0 && <TrendingUp size={20} />}
                        {(preview.collectedData.marketData.priceAggregation.averageChange24h || 0) < 0 && <TrendingDown size={20} />}
                        {(preview.collectedData.marketData.priceAggregation.averageChange24h || 0) === 0 && <Minus size={20} />}
                        {preview.collectedData.marketData.priceAggregation.averageChange24h?.toFixed(2) || 'N/A'}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">
                        Volume 24h
                      </p>
                      <p className="text-xl font-mono font-bold text-bitcoin-white">
                        ${((preview.collectedData.marketData.priceAggregation.totalVolume24h || 0) / 1e9)?.toFixed(2) || 'N/A'}B
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">
                        Market Cap
                      </p>
                      <p className="text-xl font-mono font-bold text-bitcoin-white">
                        ${((preview.collectedData.marketData.marketData?.marketCap || 0) / 1e9)?.toFixed(2) || 'N/A'}B
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* GPT-5.1 AI Analysis */}
              <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4">
                <h3 className="text-lg font-bold text-bitcoin-white mb-3 flex items-center gap-2">
                  <span className="text-bitcoin-orange">🤖</span>
                  ChatGPT 5.1 AI Analysis
                  {(preview.aiAnalysis || preview.summary) && (
                    <span className="text-xs text-bitcoin-white-60 font-normal ml-2">
                      ({(preview.aiAnalysis || preview.summary).split(' ').length.toLocaleString()} words)
                    </span>
                  )}
                  {gptStatus === 'queued' || gptStatus === 'processing' ? (
                    <span className="text-xs text-bitcoin-orange font-normal ml-2 animate-pulse">
                      • Analyzing... ({gptElapsedTime}s)
                    </span>
                  ) : null}
                </h3>
                
                {/* GPT-5.1 Progress Indicator */}
                {(gptStatus === 'queued' || gptStatus === 'processing') && (
                  <div className="mb-4 p-3 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-bitcoin-orange border-t-transparent"></div>
                      <span className="text-sm text-bitcoin-white font-semibold">
                        {gptProgress || 'GPT-5.1 analysis in progress...'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-bitcoin-white-60">
                      <span>Elapsed: {gptElapsedTime}s</span>
                      <span>Expected: 30-120s</span>
                    </div>
                  </div>
                )}
                
                <div className="prose prose-invert max-w-none">
                  <div className="text-bitcoin-white-80 leading-relaxed max-h-96 overflow-y-auto space-y-4">
                    {/* ✅ HUMAN-READABLE FORMAT: Parse JSON and display in simple language */}
                    {(() => {
                      try {
                        // Try to parse as JSON first
                        const analysis = typeof (preview.aiAnalysis || preview.summary) === 'string' 
                          ? JSON.parse(preview.aiAnalysis || preview.summary)
                          : (preview.aiAnalysis || preview.summary);
                        
                        return (
                          <div className="space-y-6">
                            {/* Executive Summary */}
                            {analysis.summary && (
                              <div>
                                <h4 className="text-lg font-bold text-bitcoin-orange mb-2">
                                  📊 What's Happening?
                                </h4>
                                <p className="text-bitcoin-white-80 leading-relaxed">
                                  {analysis.summary}
                                </p>
                              </div>
                            )}
                            
                            {/* Confidence Score */}
                            {analysis.confidence && (
                              <div>
                                <h4 className="text-lg font-bold text-bitcoin-orange mb-2">
                                  🎯 How Sure Are We?
                                </h4>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-3">
                                    <div 
                                      className="bg-bitcoin-orange h-full rounded-full transition-all"
                                      style={{ width: `${analysis.confidence}%` }}
                                    />
                                  </div>
                                  <span className="text-bitcoin-orange font-bold font-mono">
                                    {analysis.confidence}%
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Key Insights */}
                            {analysis.key_insights && analysis.key_insights.length > 0 && (
                              <div>
                                <h4 className="text-lg font-bold text-bitcoin-orange mb-2">
                                  💡 Important Things to Know
                                </h4>
                                <ul className="space-y-2">
                                  {analysis.key_insights.map((insight: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-bitcoin-orange mt-1">•</span>
                                      <span className="text-bitcoin-white-80">{insight}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Market Outlook */}
                            {analysis.market_outlook && (
                              <div>
                                <h4 className="text-lg font-bold text-bitcoin-orange mb-2">
                                  🔮 What Might Happen Next?
                                </h4>
                                <p className="text-bitcoin-white-80 leading-relaxed">
                                  {analysis.market_outlook}
                                </p>
                              </div>
                            )}
                            
                            {/* Risk Factors */}
                            {analysis.risk_factors && analysis.risk_factors.length > 0 && (
                              <div>
                                <h4 className="text-lg font-bold text-bitcoin-orange mb-2">
                                  ⚠️ Things to Watch Out For
                                </h4>
                                <ul className="space-y-2">
                                  {analysis.risk_factors.map((risk: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-bitcoin-orange mt-1">•</span>
                                      <span className="text-bitcoin-white-80">{risk}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Opportunities */}
                            {analysis.opportunities && analysis.opportunities.length > 0 && (
                              <div>
                                <h4 className="text-lg font-bold text-bitcoin-orange mb-2">
                                  ✨ Good Things to Look For
                                </h4>
                                <ul className="space-y-2">
                                  {analysis.opportunities.map((opp: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-bitcoin-orange mt-1">•</span>
                                      <span className="text-bitcoin-white-80">{opp}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Technical Summary */}
                            {analysis.technical_summary && (
                              <div>
                                <h4 className="text-lg font-bold text-bitcoin-orange mb-2">
                                  📈 What the Charts Say
                                </h4>
                                <p className="text-bitcoin-white-80 leading-relaxed">
                                  {analysis.technical_summary}
                                </p>
                              </div>
                            )}
                            
                            {/* Sentiment Summary */}
                            {analysis.sentiment_summary && (
                              <div>
                                <h4 className="text-lg font-bold text-bitcoin-orange mb-2">
                                  💬 What People Are Saying
                                </h4>
                                <p className="text-bitcoin-white-80 leading-relaxed">
                                  {analysis.sentiment_summary}
                                </p>
                              </div>
                            )}
                            
                            {/* Recommendation */}
                            {analysis.recommendation && (
                              <div className="bg-bitcoin-orange-10 border border-bitcoin-orange rounded-lg p-4">
                                <h4 className="text-lg font-bold text-bitcoin-orange mb-2">
                                  🎯 Our Suggestion
                                </h4>
                                <p className="text-bitcoin-white font-semibold">
                                  {analysis.recommendation}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      } catch (error) {
                        // Fallback to plain text if JSON parsing fails
                        const text = (preview.aiAnalysis || preview.summary);
                        return text.split('\n\n').map((paragraph, index) => {
                          if (paragraph.trim()) {
                            return (
                              <p key={index} className="text-bitcoin-white-80">
                                {paragraph.trim()}
                              </p>
                            );
                          }
                          return null;
                        });
                      }
                    })()}
                  </div>
                </div>
                <p className="text-xs text-bitcoin-white-60 mt-3 pt-3 border-t border-bitcoin-orange-20">
                  Powered by ChatGPT 5.1 (Latest) with enhanced reasoning • Real-time market data analysis
                </p>
              </div>

              {/* Caesar Prompt Preview */}
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <h3 className="text-lg font-bold text-bitcoin-white mb-3 flex items-center gap-2">
                  <span className="text-bitcoin-orange">📋</span>
                  Caesar AI Research Prompt Preview
                  <span className="text-xs text-bitcoin-white-60 font-normal ml-2">
                    (What will be sent to Caesar)
                  </span>
                </h3>
                <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-3 max-h-96 overflow-y-auto">
                  <pre className="text-xs text-bitcoin-white-80 whitespace-pre-wrap font-mono leading-relaxed">
                    {preview.caesarPromptPreview}
                  </pre>
                </div>
                <p className="text-xs text-bitcoin-white-60 mt-2">
                  This comprehensive prompt includes all collected data, AI insights, and research instructions that will be sent to Caesar AI for deep analysis.
                </p>
              </div>

              {/* Data Source Expander */}
              <DataSourceExpander
                collectedData={preview.collectedData}
                apiStatus={preview.apiStatus}
              />

              {/* What Happens Next */}
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <h3 className="text-lg font-bold text-bitcoin-white mb-3">
                  What Happens Next?
                </h3>
                <ul className="space-y-2 text-bitcoin-white-80">
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">•</span>
                    <span>
                      You'll see <strong className="text-bitcoin-white">all collected data panels</strong> with real-time information
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">•</span>
                    <span>
                      <strong className="text-bitcoin-white">ChatGPT 5.1 AI Analysis</strong> button will be available for deeper insights (2-10 min)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">•</span>
                    <span>
                      Optional: <strong className="text-bitcoin-white">Caesar AI Deep Dive</strong> for comprehensive research (15-20 min)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange mt-1">•</span>
                    <span>
                      All analysis backed by <strong className="text-bitcoin-white">real-time data</strong> and source citations
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {preview && !loading && !error && (
          <div className="border-t-2 border-bitcoin-orange bg-bitcoin-black px-6 py-4 flex items-center justify-between gap-4">
            <button
              onClick={onCancel}
              className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] min-h-[48px]"
            >
              Cancel Analysis
            </button>
            <button
              onClick={() => preview && onContinue(preview)}
              disabled={preview.dataQuality < 60}
              className={`font-bold uppercase tracking-wider px-8 py-3 rounded-lg transition-all min-h-[48px] ${
                preview.dataQuality < 60
                  ? 'bg-bitcoin-black text-bitcoin-white-60 border-2 border-bitcoin-white-60 cursor-not-allowed opacity-50'
                  : 'bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95'
              }`}
              title={preview.dataQuality < 60 ? 'Data quality must be at least 60% to continue' : 'Continue with Full Analysis'}
            >
              {preview.dataQuality < 60 ? (
                <>
                  <AlertCircle className="inline-block mr-2" size={20} />
                  Insufficient Data ({preview.dataQuality}%)
                </>
              ) : (
                'Continue with Full Analysis →'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
