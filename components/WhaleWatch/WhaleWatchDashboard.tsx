import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle, RefreshCw } from 'lucide-react';

interface WhaleTransaction {
  txHash: string;
  blockchain: 'BTC';
  amount: number;
  amountUSD: number;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  type: 'exchange_deposit' | 'exchange_withdrawal' | 'whale_to_whale' | 'unknown';
  description: string;
  analysisJobId?: string;
  analysis?: any;
  analysisStatus?: 'pending' | 'analyzing' | 'completed' | 'failed';
}

interface WhaleData {
  success: boolean;
  whales: WhaleTransaction[];
  count: number;
  threshold: number;
}

export default function WhaleWatchDashboard() {
  const [whaleData, setWhaleData] = useState<WhaleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [analyzingTx, setAnalyzingTx] = useState<string | null>(null);
  
  // Track if any transaction is currently being analyzed (includes both starting and in-progress)
  const hasActiveAnalysis = (whaleData?.whales.some(w => w.analysisStatus === 'analyzing') || analyzingTx !== null);

  const fetchWhaleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/whale-watch/detect?threshold=50');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setWhaleData(data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch whale data');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch whale data';
      setError(errorMsg);
      console.error('Whale detection error:', err);
      // Don't clear existing data on error
    } finally {
      setLoading(false);
    }
  };

  const analyzeTransaction = async (whale: WhaleTransaction) => {
    // Guard clause: Prevent execution if any analysis is already in progress
    if (analyzingTx !== null || whaleData?.whales.some(w => w.analysisStatus === 'analyzing')) {
      console.log('⚠️ Analysis already in progress, ignoring click');
      return;
    }
    
    try {
      // Immediately set analyzing state to prevent race condition
      setAnalyzingTx(whale.txHash);
      
      // Also immediately update the whale status to 'analyzing' to lock UI
      if (whaleData) {
        const updatedWhales = whaleData.whales.map(w =>
          w.txHash === whale.txHash
            ? { ...w, analysisStatus: 'analyzing' as const }
            : w
        );
        setWhaleData({ ...whaleData, whales: updatedWhales });
      }
      
      // Start Caesar analysis
      const response = await fetch('/api/whale-watch/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whale),
      });
      
      if (!response.ok) {
        throw new Error(`Analysis API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.jobId) {
        // Update whale with job ID (keep analyzing status)
        if (whaleData) {
          const updatedWhales = whaleData.whales.map(w =>
            w.txHash === whale.txHash
              ? { ...w, analysisJobId: data.jobId, analysisStatus: 'analyzing' as const }
              : w
          );
          setWhaleData({ ...whaleData, whales: updatedWhales });
        }
        
        // Poll for results
        pollAnalysis(whale.txHash, data.jobId);
      } else {
        throw new Error(data.error || 'Failed to start analysis');
      }
    } catch (error) {
      console.error('Failed to start analysis:', error);
      // Mark as failed
      if (whaleData) {
        const updatedWhales = whaleData.whales.map(w =>
          w.txHash === whale.txHash
            ? { ...w, analysisStatus: 'failed' as const }
            : w
        );
        setWhaleData({ ...whaleData, whales: updatedWhales });
      }
    } finally {
      setAnalyzingTx(null);
    }
  };

  const pollAnalysis = async (txHash: string, jobId: string) => {
    const maxAttempts = 10; // 10 minutes max (10 attempts × 60 seconds = 600 seconds)
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.error('❌ Analysis polling timeout after', attempts, 'attempts');
        // Mark as failed after timeout
        setWhaleData(prev => {
          if (!prev) return prev;
          const updatedWhales = prev.whales.map(w =>
            w.txHash === txHash
              ? { ...w, analysisStatus: 'failed' as const }
              : w
          );
          return { ...prev, whales: updatedWhales };
        });
        return;
      }
      attempts++;
      
      console.log(`📊 Polling attempt ${attempts}/${maxAttempts} for job ${jobId}`);
      
      try {
        const response = await fetch(`/api/whale-watch/analysis/${jobId}`);
        
        if (!response.ok) {
          console.error(`❌ Polling HTTP error: ${response.status}`);
          throw new Error(`Polling error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`📡 Poll response:`, JSON.stringify(data, null, 2));
        
        // Check if API call itself failed
        if (data.success === false) {
          console.error('❌ API returned success: false', data.error);
          throw new Error(data.error || 'API request failed');
        }
        
        if (data.status === 'completed' && data.analysis) {
          console.log('✅ Analysis completed!', data.analysis);
          // Update whale with completed analysis
          setWhaleData(prev => {
            if (!prev) return prev;
            const updatedWhales = prev.whales.map(w =>
              w.txHash === txHash
                ? { ...w, analysis: data.analysis, analysisStatus: 'completed' as const, sources: data.sources }
                : w
            );
            return { ...prev, whales: updatedWhales };
          });
        } else if (data.status === 'failed' || data.status === 'cancelled' || data.status === 'expired') {
          console.error(`❌ Analysis ${data.status} on server`);
          // Mark as failed
          setWhaleData(prev => {
            if (!prev) return prev;
            const updatedWhales = prev.whales.map(w =>
              w.txHash === txHash
                ? { ...w, analysisStatus: 'failed' as const }
                : w
            );
            return { ...prev, whales: updatedWhales };
          });
        } else {
          console.log(`⏳ Still ${data.status}, polling again in 60s...`);
          // Still processing, poll again in 60 seconds
          setTimeout(poll, 60000);
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
        // Don't retry on error - just mark as failed
        console.error('❌ Marking analysis as failed due to polling error');
        setWhaleData(prev => {
          if (!prev) return prev;
          const updatedWhales = prev.whales.map(w =>
            w.txHash === txHash
              ? { ...w, analysisStatus: 'failed' as const }
              : w
          );
          return { ...prev, whales: updatedWhales };
        });
      }
    };
    
    poll();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'exchange_deposit':
        return 'from-red-500 to-red-600';
      case 'exchange_withdrawal':
        return 'from-green-500 to-green-600';
      case 'whale_to_whale':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exchange_deposit':
        return <TrendingDown className="h-6 w-6" />;
      case 'exchange_withdrawal':
        return <TrendingUp className="h-6 w-6" />;
      default:
        return <Activity className="h-6 w-6" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'exchange_deposit':
        return 'Exchange Deposit';
      case 'exchange_withdrawal':
        return 'Exchange Withdrawal';
      case 'whale_to_whale':
        return 'Whale Transfer';
      default:
        return 'Unknown';
    }
  };

  const getImpactBadge = (type: string) => {
    switch (type) {
      case 'exchange_deposit':
        return <span className="px-2 py-1 bg-bitcoin-orange text-bitcoin-black text-xs font-bold rounded uppercase">BEARISH</span>;
      case 'exchange_withdrawal':
        return <span className="px-2 py-1 bg-bitcoin-orange text-bitcoin-black text-xs font-bold rounded uppercase">BULLISH</span>;
      default:
        return <span className="px-2 py-1 border border-bitcoin-orange text-bitcoin-orange text-xs font-bold rounded uppercase">NEUTRAL</span>;
    }
  };

  // Initial state - no data loaded yet
  if (!whaleData && !loading && !error) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-6 whale-watch-initial-state">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-2xl">
            <div className="text-6xl mb-4">🐋</div>
            <h3 className="text-2xl font-bold text-bitcoin-white mb-2">Bitcoin Whale Watch</h3>
            <p className="text-bitcoin-white-80 mb-2">
              Click below to scan for large Bitcoin transactions (&gt;50 BTC)
            </p>
            <p className="text-sm text-bitcoin-white-60 mb-6">
              AI analysis powered by Caesar API • Analysis takes 5-7 minutes typically (max 10 minutes) • Will timeout if not completed
            </p>
            <button
              onClick={fetchWhaleData}
              className="btn-bitcoin-primary px-8 py-4 text-lg font-bold rounded-lg transition-all"
            >
              🔍 Scan for Whale Transactions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !whaleData) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-bitcoin-orange animate-spin mx-auto mb-4" />
            <p className="text-bitcoin-white font-medium">Scanning blockchain for whale transactions...</p>
            <p className="text-bitcoin-white-60 text-sm mt-2">This may take a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-bitcoin-white flex items-center">
            🐋 Bitcoin Whale Watch
          </h2>
          <p className="text-sm text-bitcoin-white-60 mt-1">
            Live tracking of large BTC transactions (&gt;50 BTC) • Caesar AI analysis: 5-7 min (max 10 min timeout)
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <div className="text-right">
              <div className="text-xs text-bitcoin-white-60">Last Updated</div>
              <div className="text-sm font-medium text-bitcoin-white">
                {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          )}
          <button
            onClick={fetchWhaleData}
            disabled={loading}
            className="p-2 bg-bitcoin-orange text-bitcoin-black rounded-lg hover:bg-bitcoin-black hover:text-bitcoin-orange hover:border hover:border-bitcoin-orange transition-all disabled:opacity-50"
            title="Refresh whale data"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Analysis Banner */}
      {hasActiveAnalysis && (
        <div className="mb-4 bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 animate-pulse">
          <div className="flex items-center">
            <RefreshCw className="h-5 w-5 text-bitcoin-orange animate-spin mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-bitcoin-white font-bold">🤖 Caesar AI Analysis in Progress</p>
              <p className="text-bitcoin-white-80 text-sm">
                Other transactions are temporarily disabled to prevent API overload. This typically takes 5-7 minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner (non-blocking) */}
      {error && (
        <div className="mb-4 bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-bitcoin-orange mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-bitcoin-white font-medium">Error loading whale data</p>
              <p className="text-bitcoin-white-80 text-sm">{error}</p>
            </div>
            <button
              onClick={fetchWhaleData}
              className="ml-4 btn-bitcoin-primary px-4 py-2 rounded transition-all text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 hover:shadow-bitcoin-glow transition-all">
          <div className="stat-label text-sm text-bitcoin-white-60 font-medium uppercase">Active Whales</div>
          <div className="stat-value text-3xl font-bold text-bitcoin-orange mt-1 font-mono">{whaleData?.count || 0}</div>
        </div>
        
        <div className="stat-card bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 hover:shadow-bitcoin-glow transition-all">
          <div className="stat-label text-sm text-bitcoin-white-60 font-medium uppercase">Withdrawals</div>
          <div className="stat-value text-3xl font-bold text-bitcoin-orange mt-1 font-mono">
            {whaleData?.whales.filter(w => w.type === 'exchange_withdrawal').length || 0}
          </div>
        </div>
        
        <div className="stat-card bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 hover:shadow-bitcoin-glow transition-all">
          <div className="stat-label text-sm text-bitcoin-white-60 font-medium uppercase">Deposits</div>
          <div className="stat-value text-3xl font-bold text-bitcoin-orange mt-1 font-mono">
            {whaleData?.whales.filter(w => w.type === 'exchange_deposit').length || 0}
          </div>
        </div>
      </div>

      {/* Whale Transactions */}
      {whaleData && whaleData.whales.length > 0 ? (
        <div className="space-y-4">
          {whaleData.whales.map((whale, index) => {
            // Check if this transaction is being analyzed or if another one is
            const isThisAnalyzing = whale.analysisStatus === 'analyzing';
            const isOtherAnalyzing = hasActiveAnalysis && !isThisAnalyzing;
            const isDisabled = isOtherAnalyzing;
            
            return (
            <div
              key={whale.txHash}
              className={`bitcoin-block border-2 rounded-lg p-4 transition-all ${
                isDisabled 
                  ? 'border-bitcoin-orange opacity-30 cursor-not-allowed bg-bitcoin-black pointer-events-none' 
                  : isThisAnalyzing
                  ? 'border-bitcoin-orange shadow-bitcoin-glow bg-bitcoin-black'
                  : 'border-bitcoin-orange hover:shadow-bitcoin-glow bg-bitcoin-black'
              }`}
              style={isDisabled ? { pointerEvents: 'none' } : undefined}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                {/* Left: Icon and Type */}
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-lg border-2 border-bitcoin-orange bg-bitcoin-black text-bitcoin-orange flex-shrink-0`}>
                    {getTypeIcon(whale.type)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg font-bold text-bitcoin-white">
                        {getTypeLabel(whale.type)}
                      </span>
                      {getImpactBadge(whale.type)}
                    </div>
                    <p className="text-sm text-bitcoin-white-80">{whale.description}</p>
                    <p className="text-xs text-bitcoin-white-60 mt-1">
                      {new Date(whale.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right">
                  <div className="price-display text-2xl md:text-3xl font-bold text-bitcoin-orange font-mono">
                    {whale.amount.toFixed(2)} BTC
                  </div>
                  <div className="text-lg text-bitcoin-white-80 font-mono">
                    ${(whale.amountUSD / 1000000).toFixed(2)}M
                  </div>
                  <a
                    href={`https://blockchain.com/btc/tx/${whale.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-bitcoin-orange hover:text-bitcoin-white mt-1 inline-block transition-colors"
                  >
                    View on Blockchain →
                  </a>
                </div>
              </div>

              {/* Addresses (Mobile: Collapsed, Desktop: Visible) */}
              <div className="mt-4 pt-4 border-t border-bitcoin-orange-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-bitcoin-white-60 font-medium uppercase">From:</span>
                    <div className="text-bitcoin-white font-mono mt-1 break-all">
                      {whale.fromAddress.substring(0, 20)}...
                    </div>
                  </div>
                  <div>
                    <span className="text-bitcoin-white-60 font-medium uppercase">To:</span>
                    <div className="text-bitcoin-white font-mono mt-1 break-all">
                      {whale.toAddress.substring(0, 20)}...
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis Section */}
              {!whale.analysisJobId && !whale.analysis && (
                <div className="mt-4 pt-4 border-t border-bitcoin-orange">
                  <button
                    onClick={() => analyzeTransaction(whale)}
                    disabled={analyzingTx === whale.txHash || isDisabled}
                    className={`btn-bitcoin-primary w-full py-3 rounded-lg transition-all font-bold uppercase text-base shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 ${
                      isDisabled
                        ? 'opacity-30 cursor-not-allowed'
                        : ''
                    } disabled:opacity-50`}
                    title={isDisabled ? 'Please wait for the current analysis to complete' : 'Analyze this transaction with Caesar AI'}
                  >
                    {analyzingTx === whale.txHash ? (
                      <span className="flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                        Starting AI Analysis...
                      </span>
                    ) : isDisabled ? (
                      <span className="flex items-center justify-center">
                        ⏳ Analysis in progress on another transaction
                      </span>
                    ) : (
                      <span>🤖 Analyze with Caesar AI</span>
                    )}
                  </button>
                  {isDisabled && (
                    <p className="text-xs text-bitcoin-white-60 text-center mt-2">
                      Please wait for the current analysis to complete before starting another
                    </p>
                  )}
                </div>
              )}

              {whale.analysisStatus === 'analyzing' && (
                <div className="mt-4 pt-4 border-t border-bitcoin-orange">
                  <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 shadow-[0_0_20px_rgba(247,147,26,0.3)]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="flex items-center">
                        <RefreshCw className="h-5 w-5 text-bitcoin-orange animate-spin mr-2" />
                        <span className="text-bitcoin-white font-medium">Caesar AI is researching...</span>
                      </div>
                      <p className="text-bitcoin-white-80 text-sm">
                        This typically takes 5-7 minutes with deep research (max 10 minutes)
                      </p>
                      <p className="text-bitcoin-white-60 text-xs">
                        Checking status every 60 seconds • Analyzing market data, news, and historical patterns
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {whale.analysisStatus === 'failed' && (
                <div className="mt-4 pt-4 border-t border-bitcoin-orange">
                  <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-bitcoin-orange mr-2" />
                        <span className="text-bitcoin-white font-medium">Analysis failed</span>
                      </div>
                      <button
                        onClick={() => analyzeTransaction(whale)}
                        disabled={isDisabled}
                        className={`btn-bitcoin-primary px-4 py-2 rounded transition-all text-sm uppercase font-bold shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 ${
                          isDisabled
                            ? 'opacity-30 cursor-not-allowed'
                            : ''
                        }`}
                        title={isDisabled ? 'Please wait for the current analysis to complete' : 'Retry analysis'}
                      >
                        Retry Analysis
                      </button>
                    </div>
                    {isDisabled && (
                      <p className="text-xs text-bitcoin-white-60 mt-2">
                        Another analysis is in progress. Please wait before retrying.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {whale.analysisStatus === 'completed' && whale.analysis && (
                <div className="mt-4 pt-4 border-t border-bitcoin-orange">
                  <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 shadow-[0_0_20px_rgba(247,147,26,0.3)]">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-bitcoin-white flex items-center">
                        🤖 Caesar AI Analysis
                      </h4>
                      <span className="px-2 py-1 bg-bitcoin-orange text-bitcoin-black text-xs font-bold rounded uppercase font-mono">
                        {whale.analysis.confidence}% Confidence
                      </span>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-semibold text-bitcoin-white">Type:</span>
                        <span className="ml-2 text-bitcoin-orange font-mono">{whale.analysis.transaction_type?.replace(/_/g, ' ').toUpperCase()}</span>
                      </div>
                      
                      <div>
                        <span className="font-semibold text-bitcoin-white">Reasoning:</span>
                        <p className="text-bitcoin-white-80 mt-1">{whale.analysis.reasoning}</p>
                      </div>
                      
                      {whale.analysis.key_findings && whale.analysis.key_findings.length > 0 && (
                        <div>
                          <span className="font-semibold text-bitcoin-white">Key Findings:</span>
                          <ul className="mt-1 space-y-1">
                            {whale.analysis.key_findings.map((finding: string, idx: number) => (
                              <li key={idx} className="text-bitcoin-white-80">• {finding}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {whale.analysis.trader_action && (
                        <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded p-3 mt-3">
                          <span className="font-semibold text-bitcoin-orange">💡 Trader Action:</span>
                          <p className="text-bitcoin-white-80 mt-1">{whale.analysis.trader_action}</p>
                        </div>
                      )}
                      
                      {whale.analysis.sources && whale.analysis.sources.length > 0 && (
                        <div className="mt-3">
                          <span className="font-semibold text-bitcoin-white">📚 Sources ({whale.analysis.sources.length}):</span>
                          <div className="mt-2 space-y-1">
                            {whale.analysis.sources.slice(0, 3).map((source: any, idx: number) => (
                              <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-bitcoin-orange hover:text-bitcoin-white text-xs transition-colors"
                              >
                                {idx + 1}. {source.title} →
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Activity className="h-16 w-16 text-bitcoin-orange mx-auto mb-4" />
          <p className="text-bitcoin-white text-lg font-medium">No whale transactions detected</p>
          <p className="text-bitcoin-white-60 text-sm mt-2">
            Monitoring for transactions &gt;50 BTC
          </p>
        </div>
      )}
    </div>
  );
}
