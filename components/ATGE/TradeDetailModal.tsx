import React from 'react';
import { X, TrendingUp, Target, Clock, Brain, BarChart3, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { TradeSignal } from './TradeRow';

interface TradeDetailModalProps {
  trade: TradeSignal | null;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function TradeDetailModal({
  trade,
  isOpen,
  onClose,
  className = ''
}: TradeDetailModalProps) {
  if (!isOpen || !trade) return null;

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

  // Get profit/loss color
  const getProfitLossColor = (amount?: number) => {
    if (!amount) return 'text-bitcoin-white-60';
    return amount >= 0 ? 'text-bitcoin-orange' : 'text-red-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bitcoin-black bg-opacity-90">
      <div className={`bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto ${className}`}>
        {/* Header */}
        <div className="sticky top-0 bg-bitcoin-black border-b-2 border-bitcoin-orange p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp size={32} className="text-bitcoin-orange" />
            <div>
              <h2 className="text-2xl font-bold text-bitcoin-white">
                Trade Details
              </h2>
              <p className="text-bitcoin-white-60 text-sm">
                Trade #{trade.id.substring(0, 8)} • {trade.symbol}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
          >
            <X size={32} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Complete Trade Information */}
          <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-6">
            <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
              <Target size={24} className="text-bitcoin-orange" />
              Trade Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Entry Price */}
              <div>
                <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                  Entry Price
                </p>
                <p className="text-3xl font-bold text-bitcoin-white font-mono">
                  ${trade.entryPrice.toFixed(2)}
                </p>
              </div>

              {/* Confidence Score */}
              <div>
                <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                  Confidence Score
                </p>
                <p className="text-3xl font-bold text-bitcoin-orange font-mono">
                  {trade.confidenceScore}%
                </p>
              </div>

              {/* Profit/Loss */}
              <div>
                <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                  Net Profit/Loss
                </p>
                {trade.result?.netProfitLossUsd !== undefined ? (
                  <>
                    <p className={`text-3xl font-bold font-mono ${getProfitLossColor(trade.result.netProfitLossUsd)}`}>
                      {formatCurrency(trade.result.netProfitLossUsd)}
                    </p>
                    <p className={`text-sm font-semibold ${getProfitLossColor(trade.result.profitLossPercentage)}`}>
                      {formatPercentage(trade.result.profitLossPercentage || 0)}
                    </p>
                  </>
                ) : (
                  <p className="text-bitcoin-white-60 text-lg">Pending</p>
                )}
              </div>
            </div>
          </div>

          {/* Price Chart Placeholder */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
              <BarChart3 size={24} className="text-bitcoin-orange" />
              Price Chart with Entry/Exit Markers
            </h3>
            <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-8 text-center">
              <p className="text-bitcoin-white-60">
                Price chart visualization will be implemented here showing:
              </p>
              <ul className="text-bitcoin-white-60 text-sm mt-3 space-y-1">
                <li>• Entry price marker</li>
                <li>• Take profit levels (TP1, TP2, TP3)</li>
                <li>• Stop loss level</li>
                <li>• Actual price movement during trade timeframe</li>
                <li>• Exact timestamps when targets were hit</li>
              </ul>
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
              <Brain size={24} className="text-bitcoin-orange" />
              AI Reasoning
            </h3>
            <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-bitcoin-white-80 leading-relaxed whitespace-pre-wrap">
                {trade.aiReasoning}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2 text-bitcoin-white-60 text-sm">
              <span>Model:</span>
              <span className="font-mono text-bitcoin-white">{trade.aiModelVersion}</span>
            </div>
          </div>

          {/* Data Source & Quality - PROMINENT SECTION */}
          {trade.indicators && (
            <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-6">
              <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
                <Database size={24} className="text-bitcoin-orange" />
                📊 Data Source & Quality
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Timeframe */}
                <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    Timeframe
                  </p>
                  <p className="text-2xl font-bold text-bitcoin-orange font-mono">
                    {trade.indicators.timeframe || trade.timeframe}
                  </p>
                  <p className="text-bitcoin-white-60 text-xs mt-1">
                    Candle period
                  </p>
                </div>

                {/* Data Source */}
                <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    Data Source
                  </p>
                  <p className="text-2xl font-bold text-bitcoin-white">
                    {trade.indicators.dataSource || 'CoinGecko'}
                  </p>
                  <p className="text-bitcoin-white-60 text-xs mt-1">
                    OHLC provider
                  </p>
                </div>

                {/* Data Quality */}
                {trade.indicators.dataQuality !== undefined && (
                  <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4">
                    <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                      Data Quality
                    </p>
                    <p className="text-2xl font-bold text-bitcoin-orange font-mono">
                      {trade.indicators.dataQuality}%
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                        <div 
                          className="bg-bitcoin-orange h-full rounded-full transition-all"
                          style={{ width: `${trade.indicators.dataQuality}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Candle Count */}
                {trade.indicators.candleCount && (
                  <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4">
                    <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                      Candles Used
                    </p>
                    <p className="text-2xl font-bold text-bitcoin-white font-mono">
                      {trade.indicators.candleCount}
                    </p>
                    <p className="text-bitcoin-white-60 text-xs mt-1">
                      Historical data
                    </p>
                  </div>
                )}
              </div>

              {/* Calculated At */}
              {trade.indicators.calculatedAt && (
                <div className="mt-4 p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-bitcoin-white-60 text-sm">Indicators Calculated At:</span>
                    <span className="text-bitcoin-white font-mono text-sm">
                      {new Date(trade.indicators.calculatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Historical Data Source (if available) */}
              {trade.result && (
                <div className="mt-4 p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    Historical Backtest Data
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-bitcoin-white-60 text-xs mb-1">Source</p>
                      <p className="text-bitcoin-white text-sm font-mono">
                        {trade.result.dataSource || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-bitcoin-white-60 text-xs mb-1">Resolution</p>
                      <p className="text-bitcoin-white text-sm font-mono">
                        {trade.result.dataResolution || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-bitcoin-white-60 text-xs mb-1">Quality</p>
                      <p className="text-bitcoin-orange text-sm font-mono font-bold">
                        {trade.result.dataQualityScore || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Technical Indicators at Generation */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
              <BarChart3 size={24} className="text-bitcoin-orange" />
              Technical Indicators at Generation
            </h3>
            {trade.indicators ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* RSI */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    RSI (14)
                  </p>
                  <p className={`text-2xl font-bold font-mono ${
                    trade.indicators.rsiSignal === 'overbought' ? 'text-red-500' :
                    trade.indicators.rsiSignal === 'oversold' ? 'text-bitcoin-orange' :
                    'text-bitcoin-white'
                  }`}>
                    {trade.indicators.rsiValue.toFixed(2)}
                  </p>
                  <p className="text-bitcoin-white-60 text-xs mt-1 uppercase">
                    {trade.indicators.rsiSignal}
                  </p>
                </div>

                {/* MACD */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    MACD
                  </p>
                  <p className={`text-2xl font-bold font-mono ${
                    trade.indicators.macdSignal === 'bullish' ? 'text-bitcoin-orange' :
                    trade.indicators.macdSignal === 'bearish' ? 'text-red-500' :
                    'text-bitcoin-white'
                  }`}>
                    {trade.indicators.macdValue.toFixed(2)}
                  </p>
                  <p className="text-bitcoin-white-60 text-xs mt-1 uppercase">
                    {trade.indicators.macdSignal}
                  </p>
                </div>

                {/* EMA 20 */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    EMA 20
                  </p>
                  <p className="text-2xl font-bold text-bitcoin-white font-mono">
                    ${trade.indicators.ema20.toFixed(2)}
                  </p>
                  <p className="text-bitcoin-white-60 text-xs mt-1">
                    Short-term trend
                  </p>
                </div>

                {/* EMA 50 */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    EMA 50
                  </p>
                  <p className="text-2xl font-bold text-bitcoin-white font-mono">
                    ${trade.indicators.ema50.toFixed(2)}
                  </p>
                  <p className="text-bitcoin-white-60 text-xs mt-1">
                    Medium-term trend
                  </p>
                </div>

                {/* EMA 200 */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    EMA 200
                  </p>
                  <p className="text-2xl font-bold text-bitcoin-white font-mono">
                    ${trade.indicators.ema200.toFixed(2)}
                  </p>
                  <p className="text-bitcoin-white-60 text-xs mt-1">
                    Long-term trend
                  </p>
                </div>

                {/* ATR */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    ATR (14)
                  </p>
                  <p className="text-2xl font-bold text-bitcoin-white font-mono">
                    ${trade.indicators.atr.toFixed(2)}
                  </p>
                  <p className="text-bitcoin-white-60 text-xs mt-1">
                    Volatility measure
                  </p>
                </div>

                {/* Bollinger Bands */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4 md:col-span-2 lg:col-span-3">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    Bollinger Bands
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-bitcoin-white-60 text-xs mb-1">Upper</p>
                      <p className="text-lg font-bold text-bitcoin-white font-mono">
                        ${trade.indicators.bollingerUpper.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-bitcoin-white-60 text-xs mb-1">Middle</p>
                      <p className="text-lg font-bold text-bitcoin-orange font-mono">
                        ${trade.indicators.bollingerMiddle.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-bitcoin-white-60 text-xs mb-1">Lower</p>
                      <p className="text-lg font-bold text-bitcoin-white font-mono">
                        ${trade.indicators.bollingerLower.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Volume */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    Avg Volume
                  </p>
                  <p className="text-2xl font-bold text-bitcoin-white font-mono">
                    {(trade.indicators.volumeAvg / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-bitcoin-white-60 text-xs mt-1">
                    20-period average
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-8 text-center">
                <p className="text-bitcoin-white-60">
                  Technical indicators not available for this trade.
                </p>
                <p className="text-bitcoin-white-60 text-sm mt-2">
                  This data will be captured for future trades.
                </p>
              </div>
            )}
          </div>

          {/* Timeline of Target Hits */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
              <Clock size={24} className="text-bitcoin-orange" />
              Timeline of Events
            </h3>
            <div className="space-y-3">
              {/* Trade Generated */}
              <div className="flex items-start gap-4 p-4 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg">
                <div className="flex-shrink-0 w-12 h-12 bg-bitcoin-orange rounded-full flex items-center justify-center">
                  <TrendingUp size={24} className="text-bitcoin-black" />
                </div>
                <div className="flex-1">
                  <p className="text-bitcoin-white font-bold">Trade Signal Generated</p>
                  <p className="text-bitcoin-white-60 text-sm">
                    {new Date(trade.generatedAt).toLocaleString()}
                  </p>
                  <p className="text-bitcoin-white-80 text-sm mt-1">
                    Entry: ${trade.entryPrice.toFixed(2)} • Confidence: {trade.confidenceScore}%
                  </p>
                </div>
              </div>

              {/* TP1 Hit */}
              {trade.result?.tp1Hit && trade.result.tp1HitAt && (
                <div className="flex items-start gap-4 p-4 bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 bg-bitcoin-orange rounded-full flex items-center justify-center">
                    <CheckCircle size={24} className="text-bitcoin-black" />
                  </div>
                  <div className="flex-1">
                    <p className="text-bitcoin-orange font-bold">TP1 Hit ({trade.tp1Allocation}%)</p>
                    <p className="text-bitcoin-white-60 text-sm">
                      {new Date(trade.result.tp1HitAt).toLocaleString()}
                    </p>
                    <p className="text-bitcoin-white-80 text-sm mt-1">
                      Price: ${trade.result.tp1HitPrice?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* TP2 Hit */}
              {trade.result?.tp2Hit && trade.result.tp2HitAt && (
                <div className="flex items-start gap-4 p-4 bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 bg-bitcoin-orange rounded-full flex items-center justify-center">
                    <CheckCircle size={24} className="text-bitcoin-black" />
                  </div>
                  <div className="flex-1">
                    <p className="text-bitcoin-orange font-bold">TP2 Hit ({trade.tp2Allocation}%)</p>
                    <p className="text-bitcoin-white-60 text-sm">
                      {new Date(trade.result.tp2HitAt).toLocaleString()}
                    </p>
                    <p className="text-bitcoin-white-80 text-sm mt-1">
                      Price: ${trade.result.tp2HitPrice?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* TP3 Hit */}
              {trade.result?.tp3Hit && trade.result.tp3HitAt && (
                <div className="flex items-start gap-4 p-4 bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 bg-bitcoin-orange rounded-full flex items-center justify-center">
                    <CheckCircle size={24} className="text-bitcoin-black" />
                  </div>
                  <div className="flex-1">
                    <p className="text-bitcoin-orange font-bold">TP3 Hit ({trade.tp3Allocation}%)</p>
                    <p className="text-bitcoin-white-60 text-sm">
                      {new Date(trade.result.tp3HitAt).toLocaleString()}
                    </p>
                    <p className="text-bitcoin-white-80 text-sm mt-1">
                      Price: ${trade.result.tp3HitPrice?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Stop Loss Hit */}
              {trade.result?.stopLossHit && trade.result.stopLossHitAt && (
                <div className="flex items-start gap-4 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <XCircle size={24} className="text-bitcoin-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-red-500 font-bold">Stop Loss Hit</p>
                    <p className="text-bitcoin-white-60 text-sm">
                      {new Date(trade.result.stopLossHitAt).toLocaleString()}
                    </p>
                    <p className="text-bitcoin-white-80 text-sm mt-1">
                      Price: ${trade.result.stopLossHitPrice?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Trade Expired */}
              {trade.status === 'expired' && (
                <div className="flex items-start gap-4 p-4 bg-bitcoin-white-60 bg-opacity-10 border border-bitcoin-white-60 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 bg-bitcoin-white-60 rounded-full flex items-center justify-center">
                    <AlertCircle size={24} className="text-bitcoin-black" />
                  </div>
                  <div className="flex-1">
                    <p className="text-bitcoin-white-60 font-bold">Trade Expired</p>
                    <p className="text-bitcoin-white-60 text-sm">
                      {new Date(trade.expiresAt).toLocaleString()}
                    </p>
                    <p className="text-bitcoin-white-80 text-sm mt-1">
                      Timeframe ended without hitting all targets
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Analysis of Outcome */}
          {trade.status === 'completed_success' || trade.status === 'completed_failure' ? (
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
                <Brain size={24} className="text-bitcoin-orange" />
                AI Analysis of Outcome
              </h3>
              <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                <p className="text-bitcoin-white-80 leading-relaxed">
                  AI-powered analysis of why this trade {trade.status === 'completed_success' ? 'succeeded' : 'failed'} will be displayed here once the AI analysis feature is implemented. This will include:
                </p>
                <ul className="text-bitcoin-white-60 text-sm mt-3 space-y-1 ml-4">
                  <li>• Key factors that contributed to the outcome</li>
                  <li>• Market conditions during the trade</li>
                  <li>• Technical indicator analysis</li>
                  <li>• Recommendations for future trades</li>
                </ul>
              </div>
            </div>
          ) : null}

          {/* Market Snapshot at Generation */}
          {trade.snapshot && (
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
                <BarChart3 size={24} className="text-bitcoin-orange" />
                Market Snapshot at Generation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Price */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    Price
                  </p>
                  <p className="text-2xl font-bold text-bitcoin-white font-mono">
                    ${trade.snapshot.price.toFixed(2)}
                  </p>
                </div>

                {/* 24h Change */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    24h Change
                  </p>
                  <p className={`text-2xl font-bold font-mono ${
                    trade.snapshot.priceChange24h >= 0 ? 'text-bitcoin-orange' : 'text-red-500'
                  }`}>
                    {formatPercentage(trade.snapshot.priceChange24h)}
                  </p>
                </div>

                {/* 24h Volume */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    24h Volume
                  </p>
                  <p className="text-2xl font-bold text-bitcoin-white font-mono">
                    ${(trade.snapshot.volume24h / 1000000000).toFixed(2)}B
                  </p>
                </div>

                {/* Market Cap */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    Market Cap
                  </p>
                  <p className="text-2xl font-bold text-bitcoin-white font-mono">
                    ${(trade.snapshot.marketCap / 1000000000).toFixed(2)}B
                  </p>
                </div>

                {/* 24h High */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    24h High
                  </p>
                  <p className="text-2xl font-bold text-bitcoin-orange font-mono">
                    ${trade.snapshot.high24h.toFixed(2)}
                  </p>
                </div>

                {/* 24h Low */}
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                    24h Low
                  </p>
                  <p className="text-2xl font-bold text-red-500 font-mono">
                    ${trade.snapshot.low24h.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="text-bitcoin-white-60 text-xs mt-4">
                Snapshot taken at: {new Date(trade.snapshot.timestamp).toLocaleString()}
              </p>
            </div>
          )}

          {/* Data Source and Quality Score */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
              <Database size={24} className="text-bitcoin-orange" />
              Data Source & Quality
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                  Data Source
                </p>
                <p className="text-bitcoin-white font-bold">
                  {trade.result?.dataSource || 'CoinMarketCap'}
                </p>
              </div>
              <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                  Data Resolution
                </p>
                <p className="text-bitcoin-white font-bold">
                  {trade.result?.dataResolution || '1-minute intervals'}
                </p>
              </div>
              <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
                  Quality Score
                </p>
                <p className="text-bitcoin-orange font-bold font-mono text-2xl">
                  {trade.result?.dataQualityScore ? `${trade.result.dataQualityScore}%` : '100%'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-bitcoin-black border-t-2 border-bitcoin-orange p-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-bitcoin-orange text-bitcoin-black font-bold uppercase tracking-wider px-8 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
