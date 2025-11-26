/**
 * Einstein 100000x Trade Generation Engine - Real-Time P/L Updater
 * 
 * This module provides real-time P/L updates for executed trades by fetching
 * current market prices every 30 seconds and recalculating unrealized P/L.
 * 
 * Requirements: 14.3, 17.2
 */

import { query } from '../../db';
import { tradeExecutionTracker } from './tracker';
import { TradeSignal, PLCalculation } from '../types';

/**
 * Configuration for real-time P/L updates
 */
interface RealTimePLConfig {
  updateInterval: number; // milliseconds (default: 30000 = 30 seconds)
  significantChangeThreshold: number; // percentage (default: 5%)
  enableWebSocket: boolean; // WebSocket support (optional)
}

/**
 * P/L Update Result
 */
interface PLUpdateResult {
  tradeId: string;
  symbol: string;
  currentPrice: number;
  pl: PLCalculation;
  significantChange: boolean;
  previousPL?: number;
  changePercent?: number;
}

/**
 * Real-Time P/L Updater
 * 
 * Automatically fetches current market prices and updates unrealized P/L
 * for all executed trades at regular intervals.
 */
export class RealTimePLUpdater {
  private intervalId: NodeJS.Timeout | null = null;
  private config: RealTimePLConfig;
  private lastPLValues: Map<string, number> = new Map();
  private updateCallbacks: Array<(results: PLUpdateResult[]) => void> = [];

  constructor(config?: Partial<RealTimePLConfig>) {
    this.config = {
      updateInterval: config?.updateInterval || 30000, // 30 seconds
      significantChangeThreshold: config?.significantChangeThreshold || 5, // 5%
      enableWebSocket: config?.enableWebSocket || false
    };
  }

  /**
   * Start real-time P/L updates
   * 
   * Begins fetching market prices and updating P/L at configured interval.
   */
  start(): void {
    if (this.intervalId) {
      console.log('⚠️ Real-time P/L updater already running');
      return;
    }

    console.log(`🚀 Starting real-time P/L updates (interval: ${this.config.updateInterval}ms)`);

    // Run initial update immediately
    this.updateAllTrades().catch(error => {
      console.error('❌ Initial P/L update failed:', error);
    });

    // Schedule periodic updates
    this.intervalId = setInterval(() => {
      this.updateAllTrades().catch(error => {
        console.error('❌ Periodic P/L update failed:', error);
      });
    }, this.config.updateInterval);
  }

  /**
   * Stop real-time P/L updates
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Real-time P/L updates stopped');
    }
  }

  /**
   * Register a callback for P/L updates
   * 
   * @param callback - Function to call when P/L is updated
   */
  onUpdate(callback: (results: PLUpdateResult[]) => void): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Update P/L for all executed trades
   * 
   * Fetches current market prices and recalculates unrealized P/L for all
   * trades with status EXECUTED or PARTIAL_CLOSE.
   * 
   * @returns Array of update results
   */
  async updateAllTrades(): Promise<PLUpdateResult[]> {
    try {
      // Fetch all executed trades
      const result = await query(
        `SELECT * FROM einstein_trade_signals 
         WHERE status IN ('EXECUTED', 'PARTIAL_CLOSE')
         ORDER BY created_at DESC`
      );

      if (result.rows.length === 0) {
        console.log('ℹ️ No executed trades to update');
        return [];
      }

      console.log(`📊 Updating P/L for ${result.rows.length} executed trades...`);

      // Get unique symbols
      const symbols = [...new Set(result.rows.map(row => row.symbol))];

      // Fetch current prices for all symbols
      const priceMap = await this.fetchCurrentPrices(symbols);

      // Update each trade
      const updateResults: PLUpdateResult[] = [];

      for (const row of result.rows) {
        const trade = this.parseTradeFromDB(row);
        const currentPrice = priceMap.get(trade.symbol);

        if (!currentPrice) {
          console.warn(`⚠️ No price data for ${trade.symbol}, skipping`);
          continue;
        }

        try {
          // Calculate new P/L
          const pl = tradeExecutionTracker.calculateUnrealizedPL(trade, currentPrice);

          // Check for significant change
          const previousPL = this.lastPLValues.get(trade.id);
          let significantChange = false;
          let changePercent: number | undefined;

          if (previousPL !== undefined) {
            const plChange = Math.abs(pl.profitLoss - previousPL);
            const plChangePercent = (plChange / Math.abs(previousPL)) * 100;
            
            if (plChangePercent >= this.config.significantChangeThreshold) {
              significantChange = true;
              changePercent = plChangePercent;
            }
          }

          // Store current P/L for next comparison
          this.lastPLValues.set(trade.id, pl.profitLoss);

          // Update trade in database
          await tradeExecutionTracker.updateCurrentPrice(trade.id, currentPrice);

          // Add to results
          updateResults.push({
            tradeId: trade.id,
            symbol: trade.symbol,
            currentPrice,
            pl,
            significantChange,
            previousPL,
            changePercent
          });

          if (significantChange) {
            console.log(
              `🔔 Significant P/L change for ${trade.symbol}: ` +
              `${previousPL?.toFixed(2)} → ${pl.profitLoss.toFixed(2)} ` +
              `(${changePercent?.toFixed(1)}% change)`
            );
          }
        } catch (error) {
          console.error(`❌ Failed to update P/L for trade ${trade.id}:`, error);
        }
      }

      // Notify callbacks
      this.notifyCallbacks(updateResults);

      console.log(`✅ Updated P/L for ${updateResults.length} trades`);
      return updateResults;
    } catch (error) {
      console.error('❌ Failed to update all trades:', error);
      throw error;
    }
  }

  /**
   * Fetch current market prices for multiple symbols
   * 
   * Uses CoinGecko API as primary source with fallback to CoinMarketCap.
   * 
   * @param symbols - Array of cryptocurrency symbols (e.g., ['BTC', 'ETH'])
   * @returns Map of symbol to current price
   */
  private async fetchCurrentPrices(symbols: string[]): Promise<Map<string, number>> {
    const priceMap = new Map<string, number>();

    try {
      // Convert symbols to CoinGecko IDs
      const coinGeckoIds = symbols.map(symbol => this.symbolToCoinGeckoId(symbol));

      // Fetch prices from CoinGecko
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?` +
        `ids=${coinGeckoIds.join(',')}&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
            ...(process.env.COINGECKO_API_KEY && {
              'x-cg-pro-api-key': process.env.COINGECKO_API_KEY
            })
          }
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      // Map prices back to symbols
      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        const coinGeckoId = coinGeckoIds[i];
        const price = data[coinGeckoId]?.usd;

        if (price) {
          priceMap.set(symbol, price);
        }
      }

      console.log(`✅ Fetched prices for ${priceMap.size}/${symbols.length} symbols`);
    } catch (error) {
      console.error('❌ Failed to fetch prices from CoinGecko:', error);

      // Fallback to CoinMarketCap
      try {
        await this.fetchPricesFromCoinMarketCap(symbols, priceMap);
      } catch (fallbackError) {
        console.error('❌ Fallback to CoinMarketCap also failed:', fallbackError);
      }
    }

    return priceMap;
  }

  /**
   * Fallback: Fetch prices from CoinMarketCap
   * 
   * @param symbols - Array of cryptocurrency symbols
   * @param priceMap - Map to populate with prices
   */
  private async fetchPricesFromCoinMarketCap(
    symbols: string[],
    priceMap: Map<string, number>
  ): Promise<void> {
    if (!process.env.COINMARKETCAP_API_KEY) {
      throw new Error('CoinMarketCap API key not configured');
    }

    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?` +
      `symbol=${symbols.join(',')}&convert=USD`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data = await response.json();

    for (const symbol of symbols) {
      const price = data.data[symbol]?.quote?.USD?.price;
      if (price) {
        priceMap.set(symbol, price);
      }
    }

    console.log(`✅ Fetched prices from CoinMarketCap for ${priceMap.size}/${symbols.length} symbols`);
  }

  /**
   * Convert symbol to CoinGecko ID
   * 
   * @param symbol - Cryptocurrency symbol (e.g., 'BTC')
   * @returns CoinGecko ID (e.g., 'bitcoin')
   */
  private symbolToCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'MATIC': 'matic-network',
      'DOT': 'polkadot',
      'AVAX': 'avalanche-2',
      'LINK': 'chainlink'
    };

    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  /**
   * Parse trade signal from database row
   * 
   * @param row - Database row
   * @returns Parsed trade signal
   */
  private parseTradeFromDB(row: any): TradeSignal {
    return {
      id: row.id,
      symbol: row.symbol,
      positionType: row.position_type,
      entry: parseFloat(row.entry),
      stopLoss: parseFloat(row.stop_loss),
      takeProfits: row.take_profits,
      confidence: row.confidence,
      riskReward: parseFloat(row.risk_reward),
      positionSize: parseFloat(row.position_size),
      maxLoss: parseFloat(row.max_loss),
      timeframe: row.timeframe,
      createdAt: row.created_at,
      lastRefreshed: row.last_refreshed,
      status: row.status,
      executionStatus: row.execution_status,
      dataQuality: row.data_quality,
      analysis: row.analysis,
      dataSourceHealth: row.data_source_health
    };
  }

  /**
   * Notify all registered callbacks
   * 
   * @param results - Array of update results
   */
  private notifyCallbacks(results: PLUpdateResult[]): void {
    for (const callback of this.updateCallbacks) {
      try {
        callback(results);
      } catch (error) {
        console.error('❌ Callback error:', error);
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): RealTimePLConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * 
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<RealTimePLConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart if interval changed and updater is running
    if (config.updateInterval && this.intervalId) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get statistics about P/L updates
   */
  getStatistics(): {
    trackedTrades: number;
    lastUpdateTime: string | null;
    isRunning: boolean;
  } {
    return {
      trackedTrades: this.lastPLValues.size,
      lastUpdateTime: null, // Could track this if needed
      isRunning: this.intervalId !== null
    };
  }
}

// Export singleton instance
export const realTimePLUpdater = new RealTimePLUpdater();
