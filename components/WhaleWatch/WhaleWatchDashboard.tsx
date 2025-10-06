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

  const fetchWhaleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/whale-watch/detect?threshold=100');
      
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
    try {
      setAnalyzingTx(whale.txHash);
      
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
        // Update whale with job ID
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
    const maxAttempts = 60; // 2 minutes max
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.error('Analysis polling timeout');
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
      
      try {
        const response = await fetch(`/api/whale-watch/analysis/${jobId}`);
        
        if (!response.ok) {
          throw new Error(`Polling error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'completed' && data.analysis) {
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
        } else if (data.status === 'failed') {
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
          // Still processing, poll again in 2 seconds
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Retry on error
        setTimeout(poll, 3000);
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
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">BEARISH</span>;
      case 'exchange_withdrawal':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">BULLISH</span>;
      default:
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">NEUTRAL</span>;
    }
  };

  // Initial state - no data loaded yet
  if (!whaleData && !loading && !error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">🐋</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Bitcoin Whale Watch</h3>
            <p className="text-gray-600 mb-6">
              Click below to scan for large Bitcoin transactions (&gt;100 BTC)
            </p>
            <button
              onClick={fetchWhaleData}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Scanning blockchain for whale transactions...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            🐋 Bitcoin Whale Watch
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Live tracking of large BTC transactions (&gt;100 BTC)
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <div className="text-right">
              <div className="text-xs text-gray-500">Last Updated</div>
              <div className="text-sm font-medium text-gray-700">
                {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          )}
          <button
            onClick={fetchWhaleData}
            disabled={loading}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            title="Refresh whale data"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner (non-blocking) */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error loading whale data</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={fetchWhaleData}
              className="ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-gray-700 font-medium">Active Whales</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">{whaleData?.count || 0}</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-gray-700 font-medium">Withdrawals</div>
          <div className="text-3xl font-bold text-green-600 mt-1">
            {whaleData?.whales.filter(w => w.type === 'exchange_withdrawal').length || 0}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-gray-700 font-medium">Deposits</div>
          <div className="text-3xl font-bold text-red-600 mt-1">
            {whaleData?.whales.filter(w => w.type === 'exchange_deposit').length || 0}
          </div>
        </div>
      </div>

      {/* Whale Transactions */}
      {whaleData && whaleData.whales.length > 0 ? (
        <div className="space-y-4">
          {whaleData.whales.map((whale, index) => (
            <div
              key={whale.txHash}
              className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                {/* Left: Icon and Type */}
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br ${getTypeColor(whale.type)} text-white flex-shrink-0`}>
                    {getTypeIcon(whale.type)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg font-bold text-gray-900">
                        {getTypeLabel(whale.type)}
                      </span>
                      {getImpactBadge(whale.type)}
                    </div>
                    <p className="text-sm text-gray-600">{whale.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(whale.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right">
                  <div className="text-2xl md:text-3xl font-bold text-gray-900">
                    {whale.amount.toFixed(2)} BTC
                  </div>
                  <div className="text-lg text-gray-600">
                    ${(whale.amountUSD / 1000000).toFixed(2)}M
                  </div>
                  <a
                    href={`https://blockchain.com/btc/tx/${whale.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                  >
                    View on Blockchain →
                  </a>
                </div>
              </div>

              {/* Addresses (Mobile: Collapsed, Desktop: Visible) */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 font-medium">From:</span>
                    <div className="text-gray-700 font-mono mt-1 break-all">
                      {whale.fromAddress.substring(0, 20)}...
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">To:</span>
                    <div className="text-gray-700 font-mono mt-1 break-all">
                      {whale.toAddress.substring(0, 20)}...
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis Section */}
              {!whale.analysisJobId && !whale.analysis && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => analyzeTransaction(whale)}
                    disabled={analyzingTx === whale.txHash}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all font-medium disabled:opacity-50"
                  >
                    {analyzingTx === whale.txHash ? (
                      <span className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Starting AI Analysis...
                      </span>
                    ) : (
                      <span>🤖 Analyze with Caesar AI</span>
                    )}
                  </button>
                </div>
              )}

              {whale.analysisStatus === 'analyzing' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-purple-600 animate-spin mr-2" />
                      <span className="text-purple-700 font-medium">Caesar AI is analyzing... (1-2 minutes)</span>
                    </div>
                  </div>
                </div>
              )}

              {whale.analysisStatus === 'failed' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-red-700 font-medium">Analysis failed</span>
                      </div>
                      <button
                        onClick={() => analyzeTransaction(whale)}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                      >
                        Retry Analysis
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {whale.analysisStatus === 'completed' && whale.analysis && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-purple-900 flex items-center">
                        🤖 Caesar AI Analysis
                      </h4>
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
                        {whale.analysis.confidence}% Confidence
                      </span>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-semibold text-gray-900">Type:</span>
                        <span className="ml-2 text-gray-700">{whale.analysis.transaction_type?.replace(/_/g, ' ').toUpperCase()}</span>
                      </div>
                      
                      <div>
                        <span className="font-semibold text-gray-900">Reasoning:</span>
                        <p className="text-gray-700 mt-1">{whale.analysis.reasoning}</p>
                      </div>
                      
                      {whale.analysis.key_findings && whale.analysis.key_findings.length > 0 && (
                        <div>
                          <span className="font-semibold text-gray-900">Key Findings:</span>
                          <ul className="mt-1 space-y-1">
                            {whale.analysis.key_findings.map((finding: string, idx: number) => (
                              <li key={idx} className="text-gray-700">• {finding}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {whale.analysis.trader_action && (
                        <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mt-3">
                          <span className="font-semibold text-gray-900">💡 Trader Action:</span>
                          <p className="text-gray-700 mt-1">{whale.analysis.trader_action}</p>
                        </div>
                      )}
                      
                      {whale.analysis.sources && whale.analysis.sources.length > 0 && (
                        <div className="mt-3">
                          <span className="font-semibold text-gray-900">📚 Sources ({whale.analysis.sources.length}):</span>
                          <div className="mt-2 space-y-1">
                            {whale.analysis.sources.slice(0, 3).map((source: any, idx: number) => (
                              <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-600 hover:text-blue-800 text-xs"
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
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No whale transactions detected</p>
          <p className="text-gray-500 text-sm mt-2">
            Monitoring for transactions &gt;100 BTC
          </p>
        </div>
      )}
    </div>
  );
}
