import { useState, useEffect, useCallback } from 'react';
import { tradeExecutionTracker } from '../lib/einstein/execution/tracker';
import { TradeSignal, TargetStatus } from '../lib/einstein/types';

/**
 * Hook for managing target hit notifications
 * 
 * Monitors executed trades and displays notifications when targets are hit.
 * Provides functionality to mark partial closes and update trade status.
 * 
 * Requirements: 14.4, 16.4
 */

interface TargetHitNotification {
  id: string;
  tradeId: string;
  symbol: string;
  positionType: 'LONG' | 'SHORT';
  currentPrice: number;
  targetHit: 'TP1' | 'TP2' | 'TP3' | 'STOP_LOSS';
  targetPrice: number;
  message: string;
  timestamp: string;
}

interface UseTargetHitNotificationsOptions {
  /**
   * Interval in milliseconds to check for target hits
   * Default: 30000 (30 seconds)
   */
  checkInterval?: number;

  /**
   * Whether to automatically check for target hits
   * Default: true
   */
  autoCheck?: boolean;

  /**
   * Maximum number of notifications to show at once
   * Default: 3
   */
  maxNotifications?: number;
}

export function useTargetHitNotifications(
  trades: TradeSignal[],
  options: UseTargetHitNotificationsOptions = {}
) {
  const {
    checkInterval = 30000, // 30 seconds
    autoCheck = true,
    maxNotifications = 3
  } = options;

  const [notifications, setNotifications] = useState<TargetHitNotification[]>([]);
  const [checking, setChecking] = useState(false);

  /**
   * Fetch current market price for a symbol
   */
  const fetchCurrentPrice = async (symbol: string): Promise<number> => {
    try {
      // Use CoinGecko API to get current price
      const coinId = symbol.toLowerCase() === 'btc' ? 'bitcoin' : 
                     symbol.toLowerCase() === 'eth' ? 'ethereum' : 
                     symbol.toLowerCase();

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch current price');
      }

      const data = await response.json();
      return data[coinId]?.usd || 0;
    } catch (error) {
      console.error('❌ Failed to fetch current price:', error);
      return 0;
    }
  };

  /**
   * Check if any targets are hit for executed trades
   */
  const checkTargetsHit = useCallback(async () => {
    if (checking) return;

    try {
      setChecking(true);

      // Filter for executed trades only
      const executedTrades = trades.filter(
        trade => trade.status === 'EXECUTED' || trade.status === 'PARTIAL_CLOSE'
      );

      if (executedTrades.length === 0) {
        return;
      }

      // Check each trade for target hits
      const newNotifications: TargetHitNotification[] = [];

      for (const trade of executedTrades) {
        // Fetch current price
        const currentPrice = await fetchCurrentPrice(trade.symbol);

        if (currentPrice === 0) {
          console.warn(`⚠️ Could not fetch price for ${trade.symbol}`);
          continue;
        }

        // Check if targets are hit
        const targetStatus = tradeExecutionTracker.checkTargetsHit(trade, currentPrice);

        // Create notification if any target is hit
        if (targetStatus.suggestUpdate && targetStatus.message) {
          // Determine which target was hit
          let targetHit: 'TP1' | 'TP2' | 'TP3' | 'STOP_LOSS';
          let targetPrice: number;

          if (targetStatus.stopLossHit) {
            targetHit = 'STOP_LOSS';
            targetPrice = trade.stopLoss;
          } else if (targetStatus.tp3Hit) {
            targetHit = 'TP3';
            targetPrice = trade.takeProfits.tp3.price;
          } else if (targetStatus.tp2Hit) {
            targetHit = 'TP2';
            targetPrice = trade.takeProfits.tp2.price;
          } else {
            targetHit = 'TP1';
            targetPrice = trade.takeProfits.tp1.price;
          }

          // Check if notification already exists for this trade and target
          const existingNotification = notifications.find(
            n => n.tradeId === trade.id && n.targetHit === targetHit
          );

          if (!existingNotification) {
            newNotifications.push({
              id: `${trade.id}-${targetHit}-${Date.now()}`,
              tradeId: trade.id,
              symbol: trade.symbol,
              positionType: trade.positionType,
              currentPrice,
              targetHit,
              targetPrice,
              message: targetStatus.message,
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      // Add new notifications (limit to maxNotifications)
      if (newNotifications.length > 0) {
        setNotifications(prev => {
          const combined = [...prev, ...newNotifications];
          return combined.slice(-maxNotifications);
        });
      }

    } catch (error) {
      console.error('❌ Failed to check targets:', error);
    } finally {
      setChecking(false);
    }
  }, [trades, checking, notifications, maxNotifications]);

  /**
   * Mark a partial close for a trade
   */
  const markPartialClose = async (
    tradeId: string,
    exitPrice: number,
    percentage: number,
    target: string
  ): Promise<void> => {
    try {
      // Call API to record partial close
      const response = await fetch('/api/einstein/partial-close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tradeId,
          exitPrice,
          percentage,
          target
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark partial close');
      }

      console.log(`✅ Partial close recorded for trade ${tradeId}`);

      // Remove notification for this trade and target
      setNotifications(prev =>
        prev.filter(n => !(n.tradeId === tradeId && n.targetHit === target))
      );

    } catch (error) {
      console.error('❌ Failed to mark partial close:', error);
      throw error;
    }
  };

  /**
   * Dismiss a notification
   */
  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  /**
   * Dismiss all notifications
   */
  const dismissAllNotifications = () => {
    setNotifications([]);
  };

  /**
   * Auto-check for target hits at regular intervals
   */
  useEffect(() => {
    if (!autoCheck) return;

    // Initial check
    checkTargetsHit();

    // Set up interval
    const intervalId = setInterval(() => {
      checkTargetsHit();
    }, checkInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoCheck, checkInterval, checkTargetsHit]);

  return {
    notifications,
    checking,
    checkTargetsHit,
    markPartialClose,
    dismissNotification,
    dismissAllNotifications
  };
}
