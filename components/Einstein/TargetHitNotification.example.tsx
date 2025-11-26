import React, { useState } from 'react';
import TargetHitNotification from './TargetHitNotification';
import { useTargetHitNotifications } from '../../hooks/useTargetHitNotifications';
import { TradeSignal } from '../../lib/einstein/types';

/**
 * Example: Target Hit Notification Integration
 * 
 * This example demonstrates how to integrate the target hit notification
 * system into the Einstein Trade History or Dashboard components.
 * 
 * Requirements: 14.4, 16.4
 */

export default function TargetHitNotificationExample() {
  // Example trades (in real implementation, fetch from API)
  const [trades] = useState<TradeSignal[]>([
    {
      id: 'trade-1',
      symbol: 'BTC',
      positionType: 'LONG',
      entry: 95000,
      stopLoss: 93000,
      takeProfits: {
        tp1: { price: 97000, allocation: 50 },
        tp2: { price: 99000, allocation: 30 },
        tp3: { price: 101000, allocation: 20 }
      },
      confidence: {
        overall: 85,
        technical: 88,
        sentiment: 82,
        onChain: 84,
        risk: 86
      },
      riskReward: 2.5,
      positionSize: 0.1,
      maxLoss: 200,
      timeframe: '4h',
      createdAt: new Date().toISOString(),
      status: 'EXECUTED',
      executionStatus: {
        executedAt: new Date().toISOString(),
        entryPrice: 95000,
        currentPrice: 97500,
        percentFilled: 100
      },
      dataQuality: {
        overall: 95,
        market: 98,
        sentiment: 92,
        onChain: 94,
        technical: 96,
        sources: {
          successful: ['CoinGecko', 'CoinMarketCap', 'Kraken'],
          failed: []
        }
      },
      analysis: {
        technical: {},
        sentiment: {},
        onChain: {},
        risk: {},
        reasoning: {
          technical: 'Strong bullish momentum',
          sentiment: 'Positive social sentiment',
          onChain: 'Whale accumulation detected',
          risk: 'Low risk entry point',
          overall: 'High probability long setup'
        },
        timeframeAlignment: {
          '15m': 'BULLISH',
          '1h': 'BULLISH',
          '4h': 'BULLISH',
          '1d': 'BULLISH',
          alignment: 100
        }
      }
    } as TradeSignal
  ]);

  // Use the target hit notifications hook
  const {
    notifications,
    checking,
    checkTargetsHit,
    markPartialClose,
    dismissNotification,
    dismissAllNotifications
  } = useTargetHitNotifications(trades, {
    checkInterval: 30000, // Check every 30 seconds
    autoCheck: true,
    maxNotifications: 3
  });

  return (
    <div className="min-h-screen bg-bitcoin-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-bitcoin-white mb-2">
            Target Hit Notifications Example
          </h1>
          <p className="text-bitcoin-white-80 mb-4">
            This example demonstrates the target hit notification system.
            Notifications appear when TP1, TP2, TP3, or stop-loss targets are hit.
          </p>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={checkTargetsHit}
              disabled={checking}
              className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? 'Checking...' : 'Check Targets Now'}
            </button>

            {notifications.length > 0 && (
              <button
                onClick={dismissAllNotifications}
                className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black"
              >
                Dismiss All ({notifications.length})
              </button>
            )}
          </div>
        </div>

        {/* Trade List */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6">
          <h2 className="text-xl font-bold text-bitcoin-white mb-4">
            Executed Trades
          </h2>

          {trades.map(trade => (
            <div
              key={trade.id}
              className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4 mb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-bitcoin-white">
                    {trade.symbol} {trade.positionType}
                  </h3>
                  <p className="text-bitcoin-white-60 text-sm">
                    Entry: ${trade.entry.toFixed(2)} • Current: ${trade.executionStatus?.currentPrice?.toFixed(2)}
                  </p>
                </div>
                <span className="bg-green-500 text-bitcoin-black text-xs font-bold px-3 py-1 rounded-full">
                  {trade.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-2">
                  <p className="text-bitcoin-white-60 text-xs mb-1">TP1</p>
                  <p className="text-bitcoin-orange font-mono text-sm font-bold">
                    ${trade.takeProfits.tp1.price.toFixed(2)}
                  </p>
                </div>
                <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-2">
                  <p className="text-bitcoin-white-60 text-xs mb-1">TP2</p>
                  <p className="text-bitcoin-orange font-mono text-sm font-bold">
                    ${trade.takeProfits.tp2.price.toFixed(2)}
                  </p>
                </div>
                <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-2">
                  <p className="text-bitcoin-white-60 text-xs mb-1">TP3</p>
                  <p className="text-bitcoin-orange font-mono text-sm font-bold">
                    ${trade.takeProfits.tp3.price.toFixed(2)}
                  </p>
                </div>
                <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-2">
                  <p className="text-bitcoin-white-60 text-xs mb-1">Stop Loss</p>
                  <p className="text-red-500 font-mono text-sm font-bold">
                    ${trade.stopLoss.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-xl p-6 mt-6">
          <h3 className="text-lg font-bold text-bitcoin-white mb-2">
            How It Works
          </h3>
          <ul className="text-bitcoin-white-80 text-sm space-y-2">
            <li>• Notifications automatically check every 30 seconds for target hits</li>
            <li>• When a target is hit, a notification appears in the bottom-right corner</li>
            <li>• Click "Mark Partial Close" to record the exit with custom percentage</li>
            <li>• Click "Ignore" to dismiss the notification without action</li>
            <li>• Multiple notifications can be shown at once (max 3)</li>
            <li>• Notifications are automatically dismissed after recording a partial close</li>
          </ul>
        </div>
      </div>

      {/* Render Notifications */}
      <div className="fixed bottom-4 right-4 space-y-4 z-50">
        {notifications.map(notification => (
          <TargetHitNotification
            key={notification.id}
            tradeId={notification.tradeId}
            symbol={notification.symbol}
            positionType={notification.positionType}
            currentPrice={notification.currentPrice}
            targetHit={notification.targetHit}
            targetPrice={notification.targetPrice}
            message={notification.message}
            onClose={() => dismissNotification(notification.id)}
            onMarkPartialClose={markPartialClose}
          />
        ))}
      </div>
    </div>
  );
}
