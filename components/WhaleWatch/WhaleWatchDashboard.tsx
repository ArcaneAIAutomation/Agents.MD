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
}

interface WhaleData {
  success: boolean;
  whales: WhaleTransaction[];
  count: number;
  threshold: number;
}

export default function WhaleWatchDashboard() {
  const [whaleData, setWhaleData] = useState<WhaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchWhaleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/whale-watch/detect?threshold=100');
      const data = await response.json();
      
      if (data.success) {
        setWhaleData(data);
        setLastUpdate(new Date());
      } else {
        setError(data.error || 'Failed to fetch whale data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch whale data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhaleData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchWhaleData, 60000);
    return () => clearInterval(interval);
  }, []);

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

  if (loading && !whaleData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Loading whale transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={fetchWhaleData}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
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
          <div className="text-right">
            <div className="text-xs text-gray-500">Last Updated</div>
            <div className="text-sm font-medium text-gray-700">
              {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          <button
            onClick={fetchWhaleData}
            disabled={loading}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

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
