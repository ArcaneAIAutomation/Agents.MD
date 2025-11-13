import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Clock, Target, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export interface TradeSignal {
  id: string;
  userId: string;
  symbol: string;
  status: 'active' | 'completed_success' | 'completed_failure' | 'expired' | 'incomplete_data';
  
  // Entry & Exit
  entryPrice: number;
  
  // Take Profit Levels
  tp1Price: number;
  tp1Allocation: number;
  tp2Price: number;
  tp2Allocation: number;
  tp3Price: number;
  tp3Allocation: number;
  
  // Stop Loss
  stopLossPrice: number;
  stopLossPercentage: number;
  
  // Timeframe
  timeframe: '1h' | '4h' | '1d' | '1w';
  timeframeHours: number;
  
  // AI Analysis
  confidenceScore: number;
  riskRewardRatio: number;
  marketCondition: 'trending' | 'ranging' | 'volatile';
  aiReasoning: string;
  aiModelVersion: string;
  
  // Timestamps
  generatedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Technical Indicators (at generation time)
  indicators?: {
    rsiValue: number;
    rsiSignal: 'overbought' | 'oversold' | 'neutral';
    macdValue: number;
    macdSignal: 'bullish' | 'bearish' | 'neutral';
    ema20: number;
    ema50: number;
    ema200: number;
    bollingerUpper: number;
    bollingerMiddle: number;
    bollingerLower: number;
    volumeAvg: number;
    atr: number;
  };
  
  // Market Snapshot (at generation time)
  snapshot?: {
    price: number;
    volume24h: number;
    marketCap: number;
    priceChange24h: number;
    high24h: number;
    low24h: number;
    timestamp: Date;
  };
  
  // Results (if completed)
  result?: {
    actualEntryPrice: number;
    actualExitPrice?: number;
    tp1Hit: boolean;
    tp1HitAt?: Date;
    tp1HitPrice?: number;
    tp2Hit: boolean;
    tp2HitAt?: Date;
    tp2HitPrice?: number;
    tp3Hit: boolean;
    tp3HitAt?: Date;
    tp3HitPrice?: number;
    stopLossHit: boolean;
    stopLossHitAt?: Date;
    stopLossHitPrice?: number;
    profitLossUsd?: number;
    profitLossPercentage?: number;
    tradeDurationMinutes?: number;
    netProfitLossUsd?: number;
    dataSource?: string;
    dataResolution?: string;
    dataQualityScore?: number;
  };
}

interface TradeRowProps {
  trade: TradeSignal;
  onClick?: () => void;
  className?: string;
}

// Mobile viewport detection hook
function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return isMobile;
}

export default function TradeRow({ trade, onClick, className = '' }: TradeRowProps) {
  const isMobile = useMobileViewport();
  const [isExpanded, setIsExpanded] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Format time duration
  const formatDuration = (minutes: number) => {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = Math.floor(minutes % 60);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get status color and icon
  const getStatusDisplay = () => {
    switch (trade.status) {
      case 'active':
        return {
          color: 'text-bitcoin-orange',
          bgColor: 'bg-bitcoin-orange bg-opacity-10 border-bitcoin-orange',
          icon: <Clock size={16} />,
          label: 'Active'
        };
      case 'completed_success':
        return {
          color: 'text-bitcoin-orange',
          bgColor: 'bg-bitcoin-orange bg-opacity-20 border-bitcoin-orange',
          icon: <CheckCircle size={16} />,
          label: 'Success'
        };
      case 'completed_failure':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-500 bg-opacity-20 border-red-500',
          icon: <XCircle size={16} />,
          label: 'Failure'
        };
      case 'expired':
        return {
          color: 'text-bitcoin-white-60',
          bgColor: 'bg-bitcoin-white-60 bg-opacity-10 border-bitcoin-white-60',
          icon: <AlertCircle size={16} />,
          label: 'Expired'
        };
      case 'incomplete_data':
        return {
          color: 'text-bitcoin-white-60',
          bgColor: 'bg-bitcoin-white-60 bg-opacity-10 border-bitcoin-white-60',
          icon: <AlertCircle size={16} />,
          label: 'Incomplete'
        };
    }
  };

  // Get confidence score color
  const getConfidenceColor = (score: number) => {
    if (score >= 70) return 'text-bitcoin-orange';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get profit/loss color
  const getProfitLossColor = (amount?: number) => {
    if (!amount) return 'text-bitcoin-white-60';
    return amount >= 0 ? 'text-bitcoin-orange' : 'text-red-500';
  };

  // Get row background color based on status
  const getRowBgColor = () => {
    if (trade.status === 'completed_success') {
      return 'bg-bitcoin-orange bg-opacity-5 border-bitcoin-orange';
    } else if (trade.status === 'completed_failure') {
      return 'bg-red-500 bg-opacity-5 border-red-500';
    } else if (trade.status === 'active') {
      return 'bg-bitcoin-orange bg-opacity-5 border-bitcoin-orange-20';
    }
    return 'bg-bitcoin-black border-bitcoin-orange-20';
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div
      className={`border-2 ${getRowBgColor()} rounded-xl overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.2)] ${className}`}
    >
      {/* Main Row - Mobile Card Layout */}
      <div
        className="p-3 md:p-4 cursor-pointer min-h-[48px]"
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (onClick) onClick();
        }}
      >
        <div className={`grid gap-3 md:gap-4 items-center ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-12'}`}>
          {/* Trade ID & Date - Mobile Optimized */}
          <div className={isMobile ? '' : 'md:col-span-2'}>
            <div className={isMobile ? 'flex items-center justify-between' : ''}>
              <div>
                <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-1">
                  {isMobile ? 'ID' : 'Trade ID'}
                </p>
                <p className="text-bitcoin-white font-mono text-sm font-bold">
                  #{trade.id.substring(0, 8)}
                </p>
                <p className="text-bitcoin-white-60 text-xs mt-1">
                  {new Date(trade.generatedAt).toLocaleDateString()}
                </p>
              </div>
              {isMobile && (
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${statusDisplay.bgColor}`}>
                  <span className={statusDisplay.color}>{statusDisplay.icon}</span>
                  <span className={`${statusDisplay.color} font-bold text-xs`}>{statusDisplay.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Entry & Targets (3 cols) */}
          <div className="md:col-span-3">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-1">
              Entry & Targets
            </p>
            <div className="space-y-1">
              <p className="text-bitcoin-white text-sm">
                <span className="text-bitcoin-white-60">Entry:</span> <span className="font-mono font-bold">${trade.entryPrice.toFixed(2)}</span>
              </p>
              <p className="text-bitcoin-orange text-xs">
                TP1: ${trade.tp1Price.toFixed(2)} • TP2: ${trade.tp2Price.toFixed(2)} • TP3: ${trade.tp3Price.toFixed(2)}
              </p>
              <p className="text-red-500 text-xs">
                SL: ${trade.stopLossPrice.toFixed(2)} ({trade.stopLossPercentage.toFixed(1)}%)
              </p>
            </div>
          </div>

          {/* Confidence (1 col) */}
          <div className="md:col-span-1">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-1">
              Confidence
            </p>
            <p className={`text-2xl font-bold font-mono ${getConfidenceColor(trade.confidenceScore)}`}>
              {trade.confidenceScore}%
            </p>
          </div>

          {/* Profit/Loss - Mobile Optimized */}
          <div className={isMobile ? '' : 'md:col-span-2'}>
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-1">
              Profit/Loss
            </p>
            {trade.result?.netProfitLossUsd !== undefined ? (
              <>
                <p className={`font-bold font-mono ${isMobile ? 'text-xl' : 'text-2xl'} ${getProfitLossColor(trade.result.netProfitLossUsd)}`}>
                  {formatCurrency(trade.result.netProfitLossUsd)}
                </p>
                <p className={`text-sm font-semibold ${getProfitLossColor(trade.result.profitLossPercentage)}`}>
                  {formatPercentage(trade.result.profitLossPercentage || 0)}
                </p>
              </>
            ) : (
              <p className="text-bitcoin-white-60 text-sm">Pending</p>
            )}
          </div>

          {/* Duration (1 col) */}
          <div className="md:col-span-1">
            <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-1">
              Duration
            </p>
            {trade.result?.tradeDurationMinutes !== undefined ? (
              <p className="text-bitcoin-white font-mono text-sm font-bold">
                {formatDuration(trade.result.tradeDurationMinutes)}
              </p>
            ) : (
              <p className="text-bitcoin-white-60 text-sm">{trade.timeframe}</p>
            )}
          </div>

          {/* Status - Desktop Only (shown in mobile header) */}
          {!isMobile && (
            <div className="md:col-span-2">
              <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-1">
                Status
              </p>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${statusDisplay.bgColor}`}>
                <span className={statusDisplay.color}>{statusDisplay.icon}</span>
                <span className={`${statusDisplay.color} font-bold text-sm`}>{statusDisplay.label}</span>
              </div>
            </div>
          )}

          {/* Expand Icon - Mobile Centered, Desktop Right */}
          <div className={`flex ${isMobile ? 'justify-center mt-2' : 'md:col-span-1 justify-end'}`}>
            {isExpanded ? (
              <ChevronUp size={isMobile ? 20 : 24} className="text-bitcoin-orange" />
            ) : (
              <ChevronDown size={isMobile ? 20 : 24} className="text-bitcoin-orange" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details - Mobile Optimized */}
      {isExpanded && (
        <div className="border-t-2 border-bitcoin-orange-20 p-3 md:p-4 bg-bitcoin-black bg-opacity-50">
          <div className={`grid gap-4 md:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {/* Left Column - Targets Hit */}
            <div>
              <h4 className="text-bitcoin-white font-bold mb-3 flex items-center gap-2">
                <Target size={18} className="text-bitcoin-orange" />
                Targets Hit
              </h4>
              <div className="space-y-2">
                {/* TP1 */}
                <div className={`p-3 rounded-lg border ${trade.result?.tp1Hit ? 'bg-bitcoin-orange bg-opacity-10 border-bitcoin-orange' : 'bg-bitcoin-black border-bitcoin-orange-20'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-bitcoin-white-60 text-sm">TP1 ({trade.tp1Allocation}%)</span>
                    {trade.result?.tp1Hit ? (
                      <CheckCircle size={16} className="text-bitcoin-orange" />
                    ) : (
                      <XCircle size={16} className="text-bitcoin-white-60" />
                    )}
                  </div>
                  {trade.result?.tp1Hit && trade.result.tp1HitPrice && trade.result.tp1HitAt && (
                    <div className="mt-1">
                      <p className="text-bitcoin-orange text-sm font-mono font-bold">
                        ${trade.result.tp1HitPrice.toFixed(2)}
                      </p>
                      <p className="text-bitcoin-white-60 text-xs">
                        {new Date(trade.result.tp1HitAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* TP2 */}
                <div className={`p-3 rounded-lg border ${trade.result?.tp2Hit ? 'bg-bitcoin-orange bg-opacity-10 border-bitcoin-orange' : 'bg-bitcoin-black border-bitcoin-orange-20'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-bitcoin-white-60 text-sm">TP2 ({trade.tp2Allocation}%)</span>
                    {trade.result?.tp2Hit ? (
                      <CheckCircle size={16} className="text-bitcoin-orange" />
                    ) : (
                      <XCircle size={16} className="text-bitcoin-white-60" />
                    )}
                  </div>
                  {trade.result?.tp2Hit && trade.result.tp2HitPrice && trade.result.tp2HitAt && (
                    <div className="mt-1">
                      <p className="text-bitcoin-orange text-sm font-mono font-bold">
                        ${trade.result.tp2HitPrice.toFixed(2)}
                      </p>
                      <p className="text-bitcoin-white-60 text-xs">
                        {new Date(trade.result.tp2HitAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* TP3 */}
                <div className={`p-3 rounded-lg border ${trade.result?.tp3Hit ? 'bg-bitcoin-orange bg-opacity-10 border-bitcoin-orange' : 'bg-bitcoin-black border-bitcoin-orange-20'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-bitcoin-white-60 text-sm">TP3 ({trade.tp3Allocation}%)</span>
                    {trade.result?.tp3Hit ? (
                      <CheckCircle size={16} className="text-bitcoin-orange" />
                    ) : (
                      <XCircle size={16} className="text-bitcoin-white-60" />
                    )}
                  </div>
                  {trade.result?.tp3Hit && trade.result.tp3HitPrice && trade.result.tp3HitAt && (
                    <div className="mt-1">
                      <p className="text-bitcoin-orange text-sm font-mono font-bold">
                        ${trade.result.tp3HitPrice.toFixed(2)}
                      </p>
                      <p className="text-bitcoin-white-60 text-xs">
                        {new Date(trade.result.tp3HitAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stop Loss */}
                <div className={`p-3 rounded-lg border ${trade.result?.stopLossHit ? 'bg-red-500 bg-opacity-10 border-red-500' : 'bg-bitcoin-black border-bitcoin-orange-20'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-bitcoin-white-60 text-sm">Stop Loss</span>
                    {trade.result?.stopLossHit ? (
                      <AlertCircle size={16} className="text-red-500" />
                    ) : (
                      <CheckCircle size={16} className="text-bitcoin-orange" />
                    )}
                  </div>
                  {trade.result?.stopLossHit && trade.result.stopLossHitPrice && trade.result.stopLossHitAt && (
                    <div className="mt-1">
                      <p className="text-red-500 text-sm font-mono font-bold">
                        ${trade.result.stopLossHitPrice.toFixed(2)}
                      </p>
                      <p className="text-bitcoin-white-60 text-xs">
                        {new Date(trade.result.stopLossHitAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Trade Details */}
            <div>
              <h4 className="text-bitcoin-white font-bold mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-bitcoin-orange" />
                Trade Details
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                  <p className="text-bitcoin-white-60 text-xs mb-1">Timeframe</p>
                  <p className="text-bitcoin-white font-bold">{trade.timeframe} ({trade.timeframeHours}h)</p>
                </div>

                <div className="p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                  <p className="text-bitcoin-white-60 text-xs mb-1">Market Condition</p>
                  <p className="text-bitcoin-white font-bold capitalize">{trade.marketCondition}</p>
                </div>

                <div className="p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                  <p className="text-bitcoin-white-60 text-xs mb-1">Risk/Reward Ratio</p>
                  <p className="text-bitcoin-orange font-bold font-mono">{trade.riskRewardRatio.toFixed(2)}:1</p>
                </div>

                <div className="p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                  <p className="text-bitcoin-white-60 text-xs mb-1">AI Model</p>
                  <p className="text-bitcoin-white text-sm font-mono">{trade.aiModelVersion}</p>
                </div>

                <div className="p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                  <p className="text-bitcoin-white-60 text-xs mb-1">Generated</p>
                  <p className="text-bitcoin-white text-sm">{new Date(trade.generatedAt).toLocaleString()}</p>
                </div>

                <div className="p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                  <p className="text-bitcoin-white-60 text-xs mb-1">Expires</p>
                  <p className="text-bitcoin-white text-sm">{new Date(trade.expiresAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* View Full Details Button - Touch-friendly */}
          <div className="mt-4 md:mt-6 text-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick();
              }}
              className={`bg-bitcoin-orange text-bitcoin-black font-bold uppercase tracking-wider px-4 md:px-6 py-3 min-h-[48px] rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] ${isMobile ? 'w-full text-xs' : ''}`}
            >
              View Full Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
