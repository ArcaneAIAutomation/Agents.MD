/**
 * On-Chain Analytics Panel Component
 * Displays holder distribution, whale transactions, and smart contract security
 */

import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Shield, Activity, Users } from 'lucide-react';

interface HolderData {
  address: string;
  balance: string;
  percentage: number;
  rank: number;
}

interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueUSD: number;
  timestamp: number;
  blockNumber: number;
  type: 'transfer' | 'exchange_deposit' | 'exchange_withdrawal';
}

interface ExchangeFlowData {
  inflow24h: number;
  outflow24h: number;
  netFlow: number;
  trend: 'accumulation' | 'distribution' | 'neutral';
}

interface ContractSecurityScore {
  score: number;
  isVerified: boolean;
  vulnerabilities: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  redFlags: string[];
  warnings: string[];
  strengths: string[];
}

interface OnChainAnalyticsPanelProps {
  symbol: string;
  holderData: HolderData[];
  whaleTransactions: WhaleTransaction[];
  exchangeFlows: ExchangeFlowData;
  smartContractAnalysis: ContractSecurityScore;
  loading?: boolean;
}

export default function OnChainAnalyticsPanel({
  symbol,
  holderData,
  whaleTransactions,
  exchangeFlows,
  smartContractAnalysis,
  loading = false
}: OnChainAnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<'holders' | 'whales' | 'flows' | 'security'>('holders');

  if (loading) {
    return (
      <div className="bitcoin-block">
        <div className="animate-pulse">
          <div className="h-8 bg-bitcoin-orange-20 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-bitcoin-orange-10 rounded"></div>
            <div className="h-4 bg-bitcoin-orange-10 rounded"></div>
            <div className="h-4 bg-bitcoin-orange-10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bitcoin-block">
      {/* Header */}
      <div className="border-b-2 border-bitcoin-orange pb-4 mb-6">
        <h2 className="text-2xl font-bold text-bitcoin-white flex items-center gap-2">
          <Activity className="text-bitcoin-orange" size={28} />
          On-Chain Analytics
        </h2>
        <p className="text-sm text-bitcoin-white-60 italic mt-1">
          Blockchain data and wallet behavior analysis
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('holders')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'holders'
              ? 'bg-bitcoin-orange text-bitcoin-black'
              : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
          }`}
        >
          <Users size={16} className="inline mr-2" />
          Holders
        </button>
        <button
          onClick={() => setActiveTab('whales')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'whales'
              ? 'bg-bitcoin-orange text-bitcoin-black'
              : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
          }`}
        >
          <TrendingUp size={16} className="inline mr-2" />
          Whale Activity
        </button>
        <button
          onClick={() => setActiveTab('flows')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'flows'
              ? 'bg-bitcoin-orange text-bitcoin-black'
              : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
          }`}
        >
          <Activity size={16} className="inline mr-2" />
          Exchange Flows
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'security'
              ? 'bg-bitcoin-orange text-bitcoin-black'
              : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
          }`}
        >
          <Shield size={16} className="inline mr-2" />
          Contract Security
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'holders' && (
          <HolderDistribution holders={holderData} />
        )}
        
        {activeTab === 'whales' && (
          <WhaleTransactionFeed transactions={whaleTransactions} />
        )}
        
        {activeTab === 'flows' && (
          <ExchangeFlows flows={exchangeFlows} />
        )}
        
        {activeTab === 'security' && (
          <ContractSecurity analysis={smartContractAnalysis} />
        )}
      </div>
    </div>
  );
}

// Holder Distribution Component
function HolderDistribution({ holders }: { holders: HolderData[] }) {
  const top10Percentage = holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0);
  const top50Percentage = holders.slice(0, 50).reduce((sum, h) => sum + h.percentage, 0);
  const top100Percentage = holders.reduce((sum, h) => sum + h.percentage, 0);

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="stat-label">Top 10 Holders</p>
          <p className="stat-value text-bitcoin-orange">{top10Percentage.toFixed(2)}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Top 50 Holders</p>
          <p className="stat-value text-bitcoin-orange">{top50Percentage.toFixed(2)}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Top 100 Holders</p>
          <p className="stat-value text-bitcoin-orange">{top100Percentage.toFixed(2)}%</p>
        </div>
      </div>

      {/* Concentration Warning */}
      {top10Percentage > 50 && (
        <div className="bg-bitcoin-orange-10 border border-bitcoin-orange rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-bitcoin-orange flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-bitcoin-white font-semibold mb-1">High Concentration Risk</p>
              <p className="text-bitcoin-white-80 text-sm">
                Top 10 holders control {top10Percentage.toFixed(1)}% of supply. This creates significant centralization risk.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Holder List */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-bitcoin-white mb-3">Top 100 Holders</h3>
        <div className="max-h-[500px] overflow-y-auto">
          {holders.map((holder) => (
            <div
              key={holder.address}
              className="flex items-center justify-between p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg hover:border-bitcoin-orange transition-all mb-2"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-bitcoin-white-60 font-mono text-sm flex-shrink-0">
                  #{holder.rank}
                </span>
                <span className="text-bitcoin-white font-mono text-sm truncate">
                  {holder.address.slice(0, 10)}...{holder.address.slice(-8)}
                </span>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-bitcoin-orange font-bold">
                  {holder.percentage.toFixed(4)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Whale Transaction Feed Component
function WhaleTransactionFeed({ transactions }: { transactions: WhaleTransaction[] }) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = Date.now();
    const diff = now - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours < 1) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'exchange_deposit':
        return 'text-bitcoin-white-80';
      case 'exchange_withdrawal':
        return 'text-bitcoin-orange';
      default:
        return 'text-bitcoin-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exchange_deposit':
        return <TrendingDown size={16} />;
      case 'exchange_withdrawal':
        return <TrendingUp size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-bitcoin-white mb-4">
        Recent Whale Transactions ({transactions.length})
      </h3>
      
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="text-bitcoin-orange-30 mx-auto mb-4" size={48} />
          <p className="text-bitcoin-white-60">No whale transactions detected</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {transactions.map((tx) => (
            <div
              key={tx.hash}
              className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={getTypeColor(tx.type)}>
                    {getTypeIcon(tx.type)}
                  </span>
                  <span className="text-bitcoin-white font-semibold capitalize">
                    {tx.type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-bitcoin-white-60 text-sm">
                  {formatTime(tx.timestamp)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-bitcoin-white-60 text-sm">Value:</span>
                  <span className="text-bitcoin-orange font-bold font-mono">
                    ${tx.valueUSD.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-bitcoin-white-60 text-sm">From:</span>
                  <span className="text-bitcoin-white font-mono text-sm">
                    {tx.from.slice(0, 10)}...{tx.from.slice(-8)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-bitcoin-white-60 text-sm">To:</span>
                  <span className="text-bitcoin-white font-mono text-sm">
                    {tx.to.slice(0, 10)}...{tx.to.slice(-8)}
                  </span>
                </div>
                
                <div className="pt-2 border-t border-bitcoin-orange-20">
                  <a
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bitcoin-orange text-sm hover:underline"
                  >
                    View on Etherscan →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Exchange Flows Component
function ExchangeFlows({ flows }: { flows: ExchangeFlowData }) {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'accumulation':
        return 'text-bitcoin-orange';
      case 'distribution':
        return 'text-bitcoin-white-80';
      default:
        return 'text-bitcoin-white-60';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'accumulation':
        return <TrendingUp className="text-bitcoin-orange" size={24} />;
      case 'distribution':
        return <TrendingDown className="text-bitcoin-white-80" size={24} />;
      default:
        return <Activity className="text-bitcoin-white-60" size={24} />;
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-bitcoin-white mb-4">24-Hour Exchange Flows</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="stat-label">Inflow</p>
          <p className="stat-value text-bitcoin-white">
            ${flows.inflow24h.toLocaleString()}
          </p>
        </div>
        
        <div className="stat-card">
          <p className="stat-label">Outflow</p>
          <p className="stat-value text-bitcoin-orange">
            ${flows.outflow24h.toLocaleString()}
          </p>
        </div>
        
        <div className="stat-card">
          <p className="stat-label">Net Flow</p>
          <p className={`stat-value ${flows.netFlow >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'}`}>
            {flows.netFlow >= 0 ? '+' : ''}${flows.netFlow.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          {getTrendIcon(flows.trend)}
          <div>
            <h4 className="text-xl font-bold text-bitcoin-white capitalize">
              {flows.trend}
            </h4>
            <p className="text-bitcoin-white-60 text-sm">Current market trend</p>
          </div>
        </div>
        
        <div className="space-y-2">
          {flows.trend === 'accumulation' && (
            <p className="text-bitcoin-white-80">
              More tokens are leaving exchanges than entering, suggesting holders are accumulating and reducing sell pressure. This is typically bullish.
            </p>
          )}
          
          {flows.trend === 'distribution' && (
            <p className="text-bitcoin-white-80">
              More tokens are entering exchanges than leaving, suggesting holders are preparing to sell. This is typically bearish.
            </p>
          )}
          
          {flows.trend === 'neutral' && (
            <p className="text-bitcoin-white-80">
              Exchange flows are balanced with no clear directional bias. Market is in equilibrium.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Contract Security Component
function ContractSecurity({ analysis }: { analysis: ContractSecurityScore }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-bitcoin-orange';
    if (score >= 60) return 'text-bitcoin-white';
    if (score >= 40) return 'text-bitcoin-white-80';
    return 'text-bitcoin-white-60';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-bitcoin-orange text-bitcoin-black';
      case 'high':
        return 'bg-bitcoin-orange-50 text-bitcoin-white';
      case 'medium':
        return 'bg-bitcoin-orange-30 text-bitcoin-white';
      default:
        return 'bg-bitcoin-orange-10 text-bitcoin-white-80';
    }
  };

  return (
    <div>
      {/* Security Score */}
      <div className="text-center mb-8">
        <div className="inline-block">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(247, 147, 26, 0.2)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#F7931A"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(analysis.score / 100) * 351.86} 351.86`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-4xl font-bold font-mono ${getScoreColor(analysis.score)}`}>
                {analysis.score}
              </span>
            </div>
          </div>
          <p className="text-bitcoin-white-60 text-sm">Security Score</p>
        </div>
      </div>

      {/* Verification Status */}
      <div className="mb-6">
        {analysis.isVerified ? (
          <div className="flex items-center gap-2 text-bitcoin-orange">
            <Shield size={20} />
            <span className="font-semibold">Contract Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-bitcoin-white-60">
            <AlertTriangle size={20} />
            <span className="font-semibold">Contract Not Verified</span>
          </div>
        )}
      </div>

      {/* Vulnerabilities */}
      {analysis.vulnerabilities.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold text-bitcoin-white mb-3">
            Vulnerabilities ({analysis.vulnerabilities.length})
          </h4>
          <div className="space-y-2">
            {analysis.vulnerabilities.map((vuln, index) => (
              <div
                key={index}
                className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3"
              >
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getSeverityColor(vuln.severity)}`}>
                    {vuln.severity}
                  </span>
                  <div className="flex-1">
                    <p className="text-bitcoin-white font-semibold mb-1">{vuln.type}</p>
                    <p className="text-bitcoin-white-80 text-sm">{vuln.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
      {analysis.redFlags.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold text-bitcoin-white mb-3">
            Red Flags ({analysis.redFlags.length})
          </h4>
          <div className="space-y-2">
            {analysis.redFlags.map((flag, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-bitcoin-white-80"
              >
                <AlertTriangle className="text-bitcoin-orange flex-shrink-0 mt-1" size={16} />
                <span className="text-sm">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-bitcoin-white mb-3">
            Security Strengths ({analysis.strengths.length})
          </h4>
          <div className="space-y-2">
            {analysis.strengths.map((strength, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-bitcoin-orange"
              >
                <Shield className="flex-shrink-0 mt-1" size={16} />
                <span className="text-sm">{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
