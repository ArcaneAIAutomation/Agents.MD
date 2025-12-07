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
          
          // ✅ CRITICAL: Regenerate Caesar prompt with GPT-5.1 analysis
          console.log('🔄 Regenerating Caesar prompt with GPT-5.1 analysis...');
          try {
            const regenerateResponse = await fetch(`/api/ucie/regenerate-caesar-prompt/${symbol}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gptAnalysis: JSON.stringify(analysis, null, 2)
              })
            });
            
            if (regenerateResponse.ok) {
              const regenerateData = await regenerateResponse.json();
              if (regenerateData.success && regenerateData.caesarPrompt) {
                console.log('✅ Caesar prompt regenerated with GPT-5.1 analysis');
                setPreview(prev => prev ? {
                  ...prev,
                  aiAnalysis: JSON.stringify(analysis, null, 2),
                  caesarPromptPreview: regenerateData.caesarPrompt
                } : null);
              } else {
                console.warn('⚠️ Caesar prompt regeneration returned success=false');
                setPreview(prev => prev ? {
                  ...prev,
                  aiAnalysis: JSON.stringify(analysis, null, 2)
                } : null);
              }
            } else {
              console.warn('⚠️ Caesar prompt regeneration failed, using existing prompt');
              setPreview(prev => prev ? {
                ...prev,
                aiAnalysis: JSON.stringify(analysis, null, 2)
              } : null);
            }
          } catch (regenerateError) {
            console.error('❌ Failed to regenerate Caesar prompt:', regenerateError);
            // Still update with GPT-5.1 analysis even if regeneration fails
            setPreview(prev => prev ? {
              ...prev,
              aiAnalysis: JSON.stringify(analysis, null, 2)
            } : null);
          }
          
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
  }, [gptJobId, gptStatus, symbol]);

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
                This may take 30-60 seconds
              </p>
              <p className="text-bitcoin-white-60 text-xs mt-1">
                60-second API timeouts • 30-minute cache • Automatic retry system
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
                
                {/* ✅ CONDITIONAL DISPLAY: Only show prompt when GPT-5.1 analysis is complete */}
                {gptStatus === 'completed' && preview.caesarPromptPreview ? (
                  <div className="mb-6">
                    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-xs text-bitcoin-white-80 font-mono whitespace-pre-wrap leading-relaxed">
                        {preview.caesarPromptPreview}
                      </pre>
                    </div>
                    <p className="text-xs text-bitcoin-white-60 mt-2">
                      ↑ This is the exact prompt that will be sent to Caesar AI for deep research
                    </p>
                  </div>
                ) : gptStatus === 'queued' || gptStatus === 'processing' ? (
                  <div className="mb-6 p-4 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-bitcoin-orange border-t-transparent"></div>
                      <span className="text-sm text-bitcoin-white font-semibold">
                        Preparing Caesar prompt with GPT-5.1 analysis...
                      </span>
                    </div>
                    <p className="text-xs text-bitcoin-white-60 mb-2">
                      {gptProgress || 'GPT-5.1 is analyzing all collected data to generate comprehensive context for Caesar AI'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-bitcoin-white-60">
                      <span>Elapsed: {gptElapsedTime}s</span>
                      <span>Expected: 30-120s</span>
                    </div>
                    <p className="text-xs text-bitcoin-orange mt-3">
                      ⏳ Caesar prompt will be displayed once GPT-5.1 analysis completes
                    </p>
                  </div>
                ) : gptStatus === 'error' ? (
                  <div className="mb-6 p-4 bg-bitcoin-black border border-bitcoin-orange rounded-lg">
                    <p className="text-sm text-bitcoin-white-80 mb-2">
                      ⚠️ GPT-5.1 analysis encountered an error. Caesar prompt will use collected data without AI enhancement.
                    </p>
                    <p className="text-xs text-bitcoin-white-60">
                      You can still continue with Caesar AI research using the raw data collected from all sources.
                    </p>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg">
                    <p className="text-sm text-bitcoin-white-80 mb-2">
                      📊 Collecting data from all sources...
                    </p>
                    <p className="text-xs text-bitcoin-white-60">
                      Caesar prompt will be generated once all data is collected and GPT-5.1 analysis completes.
                    </p>
                  </div>
                )}
                
                {/* Structured Data Display - Show as summary below the actual prompt */}
                <div className="border-t border-bitcoin-orange-20 pt-4 mt-4">
                  <h4 className="text-sm font-bold text-bitcoin-orange mb-3">
                    📊 Data Summary (Visual Overview)
                  </h4>
                  <div className="space-y-4">
                  {/* Market Data */}
                  {preview.collectedData?.marketData?.success && (
                    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-bitcoin-orange mb-2 flex items-center gap-2">
                        📊 Market Data
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-bitcoin-white-60">Price:</span>
                          <span className="text-bitcoin-white font-mono ml-2">
                            ${preview.collectedData.marketData.priceAggregation?.averagePrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-bitcoin-white-60">24h Change:</span>
                          <span className={`font-mono ml-2 ${(preview.collectedData.marketData.priceAggregation?.averageChange24h || 0) >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white'}`}>
                            {(preview.collectedData.marketData.priceAggregation?.averageChange24h || 0) >= 0 ? '+' : ''}{preview.collectedData.marketData.priceAggregation?.averageChange24h?.toFixed(2)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-bitcoin-white-60">Volume:</span>
                          <span className="text-bitcoin-white font-mono ml-2">
                            ${((preview.collectedData.marketData.priceAggregation?.totalVolume24h || 0) / 1e9).toFixed(2)}B
                          </span>
                        </div>
                        <div>
                          <span className="text-bitcoin-white-60">Market Cap:</span>
                          <span className="text-bitcoin-white font-mono ml-2">
                            ${((preview.collectedData.marketData.marketData?.marketCap || 0) / 1e9).toFixed(2)}B
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sentiment Data - All 5 Sources */}
                  {preview.collectedData?.sentiment?.success && (
                    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-bitcoin-orange mb-3 flex items-center gap-2">
                        💬 Social Sentiment (5/5 Sources)
                      </h4>
                      <div className="space-y-3">
                        {/* Overall Score */}
                        <div className="flex items-center justify-between">
                          <span className="text-bitcoin-white-60 text-sm">Overall Score:</span>
                          <span className="text-bitcoin-orange font-bold text-lg">
                            {preview.collectedData.sentiment.sentiment?.overallScore || 0}/100
                          </span>
                        </div>
                        
                        {/* Distribution */}
                        {preview.collectedData.sentiment.sentiment?.distribution && (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="text-bitcoin-white-60">Positive</div>
                              <div className="text-bitcoin-orange font-bold">
                                {preview.collectedData.sentiment.sentiment.distribution.positive || 0}%
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-bitcoin-white-60">Neutral</div>
                              <div className="text-bitcoin-white font-bold">
                                {preview.collectedData.sentiment.sentiment.distribution.neutral || 0}%
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-bitcoin-white-60">Negative</div>
                              <div className="text-bitcoin-white font-bold">
                                {preview.collectedData.sentiment.sentiment.distribution.negative || 0}%
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Data Sources */}
                        <div className="pt-2 border-t border-bitcoin-orange-20">
                          <div className="text-xs text-bitcoin-white-60 mb-1">Data Sources:</div>
                          <div className="flex flex-wrap gap-2">
                            {preview.collectedData.sentiment.sources?.fearGreed && (
                              <span className="px-2 py-1 bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded text-xs text-bitcoin-white">
                                Fear & Greed Index
                              </span>
                            )}
                            {preview.collectedData.sentiment.sources?.lunarcrush && (
                              <span className="px-2 py-1 bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded text-xs text-bitcoin-white">
                                LunarCrush
                              </span>
                            )}
                            {preview.collectedData.sentiment.sources?.coinmarketcap && (
                              <span className="px-2 py-1 bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded text-xs text-bitcoin-white">
                                CoinMarketCap
                              </span>
                            )}
                            {preview.collectedData.sentiment.sources?.coingecko && (
                              <span className="px-2 py-1 bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded text-xs text-bitcoin-white">
                                CoinGecko
                              </span>
                            )}
                            {preview.collectedData.sentiment.sources?.reddit && (
                              <span className="px-2 py-1 bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded text-xs text-bitcoin-white">
                                Reddit
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Technical Analysis */}
                  {preview.collectedData?.technical?.success && (
                    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-bitcoin-orange mb-2 flex items-center gap-2">
                        📈 Technical Indicators
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {preview.collectedData.technical.indicators?.rsi && (
                          <div>
                            <span className="text-bitcoin-white-60">RSI:</span>
                            <span className="text-bitcoin-white font-mono ml-2">
                              {typeof preview.collectedData.technical.indicators.rsi.value === 'number' 
                                ? preview.collectedData.technical.indicators.rsi.value.toFixed(2)
                                : preview.collectedData.technical.indicators.rsi}
                            </span>
                          </div>
                        )}
                        {preview.collectedData.technical.indicators?.macd && (
                          <div>
                            <span className="text-bitcoin-white-60">MACD:</span>
                            <span className="text-bitcoin-white font-mono ml-2">
                              {preview.collectedData.technical.indicators.macd.signal || 'neutral'}
                            </span>
                          </div>
                        )}
                        {preview.collectedData.technical.indicators?.trend && (
                          <div>
                            <span className="text-bitcoin-white-60">Trend:</span>
                            <span className="text-bitcoin-white font-mono ml-2">
                              {preview.collectedData.technical.indicators.trend.direction || 'neutral'}
                            </span>
                          </div>
                        )}
                        {preview.collectedData.technical.indicators?.volatility && (
                          <div>
                            <span className="text-bitcoin-white-60">Volatility:</span>
                            <span className="text-bitcoin-white font-mono ml-2">
                              {preview.collectedData.technical.indicators.volatility.current || 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* News Headlines */}
                  {preview.collectedData?.news?.success && preview.collectedData.news.articles?.length > 0 && (
                    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-bitcoin-orange mb-2 flex items-center gap-2">
                        📰 Recent News ({preview.collectedData.news.articles.length} articles)
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {preview.collectedData.news.articles.slice(0, 3).map((article: any, i: number) => (
                          <li key={i} className="text-bitcoin-white-80">
                            <span className="text-bitcoin-orange mr-2">•</span>
                            {article.title}
                            {article.sentiment && (
                              <span className="text-bitcoin-white-60 text-xs ml-2">
                                ({article.sentiment})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* On-Chain Data */}
                  {preview.collectedData?.onChain?.success && (
                    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-bitcoin-orange mb-2 flex items-center gap-2">
                        ⛓️ On-Chain Intelligence
                      </h4>
                      {preview.collectedData.onChain.whaleActivity && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-bitcoin-white-60">Whale Transactions:</span>
                            <span className="text-bitcoin-white font-mono">
                              {preview.collectedData.onChain.whaleActivity.summary?.totalTransactions || 
                               preview.collectedData.onChain.whaleActivity.totalTransactions || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-bitcoin-white-60">Total Value:</span>
                            <span className="text-bitcoin-white font-mono">
                              ${((preview.collectedData.onChain.whaleActivity.summary?.totalValueUSD || 
                                  preview.collectedData.onChain.whaleActivity.totalValueUSD || 0) / 1e6).toFixed(2)}M
                            </span>
                          </div>
                          {(preview.collectedData.onChain.whaleActivity.summary?.exchangeDeposits || 
                            preview.collectedData.onChain.whaleActivity.exchangeDeposits) !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-bitcoin-white-60">Exchange Flow:</span>
                              <span className="text-bitcoin-white font-mono">
                                {(() => {
                                  const deposits = preview.collectedData.onChain.whaleActivity.summary?.exchangeDeposits || 
                                                  preview.collectedData.onChain.whaleActivity.exchangeDeposits || 0;
                                  const withdrawals = preview.collectedData.onChain.whaleActivity.summary?.exchangeWithdrawals || 
                                                     preview.collectedData.onChain.whaleActivity.exchangeWithdrawals || 0;
                                  const netFlow = withdrawals - deposits;
                                  return `${netFlow > 0 ? '+' : ''}${netFlow} (${netFlow > 0 ? 'Bullish' : netFlow < 0 ? 'Bearish' : 'Neutral'})`;
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* GPT-5.1 Analysis Summary */}
                  {preview.aiAnalysis && (
                    <div className="bg-bitcoin-orange-10 border border-bitcoin-orange rounded-lg p-4">
                      <h4 className="text-sm font-bold text-bitcoin-orange mb-2 flex items-center gap-2">
                        🤖 GPT-5.1 AI Analysis
                      </h4>
                      <div className="text-sm text-bitcoin-white-80 max-h-48 overflow-y-auto">
                        {(() => {
                          try {
                            const analysis = JSON.parse(preview.aiAnalysis);
                            if (analysis.gptJobId) {
                              return (
                                <div className="space-y-2">
                                  <p className="text-bitcoin-orange font-semibold">
                                    ⏳ Analysis in progress...
                                  </p>
                                  <p className="text-xs text-bitcoin-white-60">
                                    Job ID: {analysis.gptJobId}
                                  </p>
                                </div>
                              );
                            }
                            return <p>{preview.aiAnalysis}</p>;
                          } catch {
                            return <p className="whitespace-pre-wrap">{preview.aiAnalysis}</p>;
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Data Quality Summary */}
                  <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-bitcoin-orange mb-2">
                      ✅ Data Quality Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Overall Quality:</span>
                        <span className="text-bitcoin-orange font-bold">{preview.dataQuality}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Working APIs:</span>
                        <span className="text-bitcoin-white">{preview.apiStatus?.working?.length || 0}/{preview.apiStatus?.total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Success Rate:</span>
                        <span className="text-bitcoin-white">{preview.apiStatus?.successRate || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                <p className="text-xs text-bitcoin-white-60 mt-4 pt-3 border-t border-bitcoin-orange-20">
                  This comprehensive data will be sent to Caesar AI for deep institutional-grade research and analysis.
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
