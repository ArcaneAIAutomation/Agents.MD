/**
 * Enhanced On-Chain Analytics Panel for UCIE
 * 
 * Displays comprehensive blockchain analysis with:
 * - Network metrics (hash rate, difficulty, mempool)
 * - Whale activity with exchange flow detection
 * - Exchange deposits/withdrawals analysis
 * - Cold wallet movements
 * - Net flow sentiment (bullish/bearish)
 * 
 * Updated: November 27, 2025 - Enhanced whale tracking with exchange flows
 */

import React, { useState } from 'react';
import { Activity, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, Wallet, AlertCircle } from 'lucide-react';

interface EnhancedOnChainPanelProps {
  data: any;
  loading?: boolean;
  error?: string | null;
}

export default function EnhancedOnChainPanel({
  data,
  loading = false,
  error = null,
}: EnhancedOnChainPanelProps) {
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  if (loading) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
          On-Chain Analytics
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-bitcoin-white-60">Loading blockchain data...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
          On-Chain Analytics
        </h2>
        <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4">
          <p className="text-bitcoin-white-80">{error || 'No on-chain data available'}</p>
        </div>
      </div>
    );
  }

  const { symbol, chain, networkMetrics, whaleActivity, mempoolAnalysis } = data;

  // Determine flow sentiment display
  const getFlowSentimentDisplay = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return {
          color: 'text-bitcoin-orange',
          bgColor: 'bg-bitcoin-orange-10',
          borderColor: 'border-bitcoin-orange',
          icon: <TrendingUp className="w-5 h-5" />,
          label: 'BULLISH'
        };
      case 'bearish':
        return {
          color: 'text-bitcoin-white-60',
          bgColor: 'bg-bitcoin-black',
          borderColor: 'border-bitcoin-white-60',
          icon: <TrendingDown className="w-5 h-5" />,
          label: 'BEARISH'
        };
      default:
        return {
          color: 'text-bitcoin-white-80',
          bgColor: 'bg-bitcoin-black',
          borderColor: 'border-bitcoin-orange-20',
          icon: <Activity className="w-5 h-5" />,
          label: 'NEUTRAL'
        };
    }
  };

  const flowDisplay = getFlowSentimentDisplay(whaleActivity?.summary?.flowSentiment || 'neutral');

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      {/* Header */}
      <div className="border-b-2 border-bitcoin-orange pb-4 mb-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
          On-Chain Analytics
        </h2>
        <p className="text-sm text-bitcoin-white-60 italic">
          {symbol} blockchain metrics and whale activity
        </p>
      </div>

      {/* Network Metrics */}
      {networkMetrics && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-bitcoin-white mb-4">
            Network Metrics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              label="Hash Rate"
              value={`${(networkMetrics.hashRate / 1000000).toFixed(2)} EH/s`}
              subtext="Network security"
              icon={<Activity className="w-4 h-4 text-bitcoin-orange" />}
            />
            <MetricCard
              label="Block Height"
              value={networkMetrics.latestBlockHeight.toLocaleString()}
              subtext="Current block"
              icon={<Activity className="w-4 h-4 text-bitcoin-orange" />}
            />
            <MetricCard
              label="Mempool Size"
              value={networkMetrics.mempoolSize.toLocaleString()}
              subtext={`${mempoolAnalysis?.congestion || 'low'} congestion`}
              icon={<AlertCircle className="w-4 h-4 text-bitcoin-orange" />}
            />
            <MetricCard
              label="Avg Fee"
              value={`${networkMetrics.recommendedFeePerVByte} sat/vB`}
              subtext="Recommended fee"
            />
            <MetricCard
              label="Block Time"
              value={`${networkMetrics.blockTime} min`}
              subtext="Average time"
            />
            <MetricCard
              label="Circulating Supply"
              value={`${(networkMetrics.totalCirculating / 1000000).toFixed(2)}M`}
              subtext={`of ${(networkMetrics.maxSupply / 1000000).toFixed(0)}M max`}
            />
          </div>
        </div>
      )}

      {/* Whale Activity */}
      {whaleActivity && whaleActivity.summary && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🐋</span>
            Whale Activity ({whaleActivity.timeframe})
          </h3>

          {/* Flow Sentiment Banner */}
          <div className={`${flowDisplay.bgColor} border-2 ${flowDisplay.borderColor} rounded-lg p-4 mb-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={flowDisplay.color}>
                  {flowDisplay.icon}
                </div>
                <div>
                  <p className="text-sm text-bitcoin-white-60 uppercase tracking-wider">
                    Net Flow Sentiment
                  </p>
                  <p className={`text-2xl font-bold ${flowDisplay.color}`}>
                    {flowDisplay.label}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-bitcoin-white-60">Net Flow</p>
                <p className={`text-2xl font-mono font-bold ${flowDisplay.color}`}>
                  {whaleActivity.summary.netFlow > 0 ? '+' : ''}
                  {whaleActivity.summary.netFlow}
                </p>
              </div>
            </div>
          </div>

          {/* Exchange Flow Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="w-5 h-5 text-bitcoin-white-60" />
                <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider">
                  Exchange Deposits
                </p>
              </div>
              <p className="text-3xl font-mono font-bold text-bitcoin-white mb-1">
                {whaleActivity.summary.exchangeDeposits}
              </p>
              <p className="text-xs text-bitcoin-white-60">
                Potential selling pressure
              </p>
            </div>

            <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] transition-all">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="w-5 h-5 text-bitcoin-orange" />
                <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider">
                  Exchange Withdrawals
                </p>
              </div>
              <p className="text-3xl font-mono font-bold text-bitcoin-orange mb-1">
                {whaleActivity.summary.exchangeWithdrawals}
              </p>
              <p className="text-xs text-bitcoin-white-60">
                Accumulation signal
              </p>
            </div>

            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-bitcoin-orange" />
                <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider">
                  Cold Wallet Moves
                </p>
              </div>
              <p className="text-3xl font-mono font-bold text-bitcoin-white mb-1">
                {whaleActivity.summary.coldWalletMovements}
              </p>
              <p className="text-xs text-bitcoin-white-60">
                Whale-to-whale transfers
              </p>
            </div>
          </div>

          {/* Whale Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <MetricCard
              label="Total Transactions"
              value={whaleActivity.summary.totalTransactions}
              subtext={`>${whaleActivity.minThreshold}`}
            />
            <MetricCard
              label="Total Value"
              value={`$${(whaleActivity.summary.totalValueUSD / 1000000000).toFixed(2)}B`}
              subtext="Combined value"
            />
            <MetricCard
              label="Largest TX"
              value={`$${(whaleActivity.summary.largestTransaction / 1000000).toFixed(1)}M`}
              subtext="Single transaction"
            />
            <MetricCard
              label="Avg Size"
              value={`${whaleActivity.summary.averageSize.toFixed(0)} bytes`}
              subtext="Transaction size"
            />
          </div>

          {/* Recent Whale Transactions */}
          {whaleActivity.transactions && whaleActivity.transactions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-bold text-bitcoin-white">
                  Recent Whale Transactions
                </h4>
                {whaleActivity.transactions.length > 5 && (
                  <button
                    onClick={() => setShowAllTransactions(!showAllTransactions)}
                    className="text-sm text-bitcoin-orange hover:text-bitcoin-white transition-colors"
                  >
                    {showAllTransactions ? 'Show Less' : `Show All (${whaleActivity.transactions.length})`}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {(showAllTransactions ? whaleActivity.transactions : whaleActivity.transactions.slice(0, 5)).map((tx: any, index: number) => (
                  <div
                    key={tx.hash}
                    className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 hover:border-bitcoin-orange transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-bitcoin-white-60 font-mono">
                        {tx.hash.substring(0, 16)}...{tx.hash.substring(tx.hash.length - 8)}
                      </span>
                      <span className="text-xs text-bitcoin-white-60">
                        {new Date(tx.time * 1000).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-mono font-bold text-bitcoin-orange">
                          ${(tx.valueUSD / 1000000).toFixed(2)}M
                        </p>
                        <p className="text-xs text-bitcoin-white-60">
                          {tx.valueBTC.toFixed(2)} BTC
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-bitcoin-white-60">
                          {tx.inputs} inputs → {tx.outputs} outputs
                        </p>
                        <p className="text-xs text-bitcoin-white-60">
                          Fee: {(tx.fee / 100000000).toFixed(8)} BTC
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data Quality Indicator */}
      <div className="mt-6 pt-4 border-t border-bitcoin-orange-20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-bitcoin-white-60">Data Quality</span>
          <span className="text-bitcoin-orange font-mono font-bold">
            {data.dataQuality || 0}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper Component

function MetricCard({ 
  label, 
  value, 
  subtext, 
  icon 
}: { 
  label: string; 
  value: string | number; 
  subtext: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 hover:border-bitcoin-orange transition-all">
      {icon && (
        <div className="mb-2">
          {icon}
        </div>
      )}
      <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-lg font-mono font-bold text-bitcoin-white">
        {value}
      </p>
      <p className="text-xs text-bitcoin-white-60 mt-1">
        {subtext}
      </p>
    </div>
  );
}
