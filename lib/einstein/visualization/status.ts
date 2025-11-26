/**
 * Visual Status Manager
 * 
 * Manages visual indicators, badges, and status displays for the Einstein Trade Engine.
 * Provides consistent, Bitcoin Sovereign-styled visual components for trade status,
 * data quality, P/L indicators, refresh functionality, and API health monitoring.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

import React from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TradeStatus {
  status: 'PENDING' | 'EXECUTED' | 'PARTIAL_CLOSE' | 'CLOSED';
  executedAt?: string;
  entryPrice?: number;
  exitPrices?: ExitPrice[];
  percentFilled?: number;
}

export interface ExitPrice {
  target: 'TP1' | 'TP2' | 'TP3' | 'STOP_LOSS';
  price: number;
  percentage: number;
  timestamp: string;
}

export interface PLCalculation {
  profitLoss: number;
  profitLossPercent: number;
  isProfit: boolean;
  color: 'green' | 'red';
  icon: 'up' | 'down';
}

export interface DataSourceHealth {
  overall: number; // 0-100
  sources: {
    name: string;
    status: 'SUCCESS' | 'FAILED' | 'SLOW';
    responseTime: number;
    error?: string;
  }[];
  lastChecked: string;
}

export interface StatusBadgeProps {
  status: 'PENDING' | 'EXECUTED' | 'PARTIAL_CLOSE' | 'CLOSED';
  color: 'orange' | 'green' | 'blue' | 'gray';
  icon: string;
  pulsing?: boolean;
}

export interface DataQualityBadgeProps {
  quality: number; // 0-100
  color: 'green' | 'orange' | 'red';
  text: string;
  icon: 'checkmark' | 'warning' | 'error';
}

// ============================================================================
// Visual Status Manager Class
// ============================================================================

export class VisualStatusManager {
  /**
   * Render status badge for trade execution status
   * Requirement 15.1: Display status badge with appropriate color
   */
  renderStatusBadge(status: TradeStatus): JSX.Element {
    const badgeProps = this.getStatusBadgeProps(status.status);
    
    return (
      <div
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg
          border-2 font-bold text-sm uppercase tracking-wider
          transition-all duration-300
          ${this.getStatusColorClasses(badgeProps.color)}
          ${badgeProps.pulsing ? 'animate-pulse' : ''}
        `}
      >
        <span className="text-lg">{badgeProps.icon}</span>
        <span>{status.status.replace('_', ' ')}</span>
        {status.percentFilled && status.status === 'PARTIAL_CLOSE' && (
          <span className="ml-1 text-xs">({status.percentFilled}%)</span>
        )}
      </div>
    );
  }

  /**
   * Render data quality badge with color coding
   * Requirement 15.2: Display data quality percentage with color coding
   */
  renderDataQualityBadge(quality: number): JSX.Element {
    const badgeProps = this.getDataQualityBadgeProps(quality);
    
    return (
      <div
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg
          border-2 font-bold text-sm
          transition-all duration-300
          ${this.getQualityColorClasses(badgeProps.color)}
        `}
      >
        <span className="text-lg">{this.getQualityIcon(badgeProps.icon)}</span>
        <span>{badgeProps.text}</span>
        <span className="ml-1 font-mono">{quality}%</span>
      </div>
    );
  }

  /**
   * Render P/L indicator with color coding and arrow
   * Requirements 15.3, 15.4: Display P/L with appropriate color and icon
   */
  renderPLIndicator(pl: PLCalculation): JSX.Element {
    const isProfit = pl.isProfit;
    const colorClass = isProfit ? 'text-bitcoin-orange' : 'text-bitcoin-white-80';
    const bgClass = isProfit 
      ? 'bg-bitcoin-orange bg-opacity-10' 
      : 'bg-bitcoin-white bg-opacity-5';
    const arrow = pl.icon === 'up' ? '↑' : '↓';
    
    return (
      <div
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg
          ${bgClass} border border-bitcoin-orange-20
          font-mono font-bold transition-all duration-300
          ${isProfit ? 'shadow-[0_0_15px_rgba(247,147,26,0.3)]' : ''}
        `}
      >
        <span className={`text-2xl ${colorClass}`}>{arrow}</span>
        <div className="flex flex-col">
          <span className={`text-lg ${colorClass}`}>
            ${Math.abs(pl.profitLoss).toFixed(2)}
          </span>
          <span className={`text-xs ${colorClass} opacity-80`}>
            {pl.profitLossPercent > 0 ? '+' : ''}{pl.profitLossPercent.toFixed(2)}%
          </span>
        </div>
      </div>
    );
  }

  /**
   * Render refresh button with loading state
   * Requirement 15.5: Display refresh button with loading spinner
   */
  renderRefreshButton(isRefreshing: boolean, lastRefresh: string): JSX.Element {
    const timeSinceRefresh = this.getTimeSinceRefresh(lastRefresh);
    
    return (
      <button
        disabled={isRefreshing}
        className={`
          flex items-center gap-3 px-6 py-3 rounded-lg
          bg-bitcoin-orange text-bitcoin-black
          border-2 border-bitcoin-orange
          font-bold uppercase tracking-wider
          transition-all duration-300
          ${isRefreshing 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)]'
          }
        `}
      >
        {isRefreshing ? (
          <>
            <span className="animate-spin text-xl">⟳</span>
            <span>Verifying Data...</span>
          </>
        ) : (
          <>
            <span className="text-xl">⟳</span>
            <span>Refresh</span>
          </>
        )}
        {!isRefreshing && lastRefresh && (
          <span className="text-xs opacity-80 normal-case">
            {timeSinceRefresh}
          </span>
        )}
      </button>
    );
  }

  /**
   * Render data source health panel
   * Requirement 18.1-18.5: Display all API sources with status indicators
   */
  renderDataSourceHealth(health: DataSourceHealth): JSX.Element {
    const overallColor = this.getHealthColor(health.overall);
    
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        {/* Header with overall health score */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-bitcoin-white">
            Data Source Health
          </h3>
          <div className={`
            px-4 py-2 rounded-lg border-2 font-bold
            ${this.getQualityColorClasses(overallColor)}
          `}>
            <span className="font-mono">{health.overall}%</span>
          </div>
        </div>

        {/* Source list */}
        <div className="space-y-3">
          {health.sources.map((source, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-bitcoin-black border border-bitcoin-orange-20 hover:border-bitcoin-orange transition-all"
            >
              {/* Source name and status */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {this.getSourceStatusIcon(source.status)}
                </span>
                <div>
                  <div className="font-semibold text-bitcoin-white">
                    {source.name}
                  </div>
                  {source.error && (
                    <div className="text-xs text-bitcoin-white-60 mt-1">
                      {source.error}
                    </div>
                  )}
                </div>
              </div>

              {/* Response time */}
              <div className="text-right">
                <div className={`
                  font-mono text-sm
                  ${source.status === 'SUCCESS' ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}
                `}>
                  {source.responseTime}ms
                </div>
                {source.status === 'SLOW' && (
                  <div className="text-xs text-bitcoin-orange mt-1">
                    Slow Response
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Last checked timestamp */}
        <div className="mt-4 text-xs text-bitcoin-white-60 text-center">
          Last checked: {new Date(health.lastChecked).toLocaleString()}
        </div>
      </div>
    );
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getStatusBadgeProps(status: string): StatusBadgeProps {
    switch (status) {
      case 'PENDING':
        return {
          status: 'PENDING',
          color: 'orange',
          icon: '⏳',
          pulsing: true
        };
      case 'EXECUTED':
        return {
          status: 'EXECUTED',
          color: 'green',
          icon: '✓',
          pulsing: false
        };
      case 'PARTIAL_CLOSE':
        return {
          status: 'PARTIAL_CLOSE',
          color: 'blue',
          icon: '◐',
          pulsing: false
        };
      case 'CLOSED':
        return {
          status: 'CLOSED',
          color: 'gray',
          icon: '■',
          pulsing: false
        };
      default:
        return {
          status: 'PENDING',
          color: 'orange',
          icon: '?',
          pulsing: false
        };
    }
  }

  private getDataQualityBadgeProps(quality: number): DataQualityBadgeProps {
    if (quality >= 90) {
      return {
        quality,
        color: 'green',
        text: '100% Data Verified',
        icon: 'checkmark'
      };
    } else if (quality >= 70) {
      return {
        quality,
        color: 'orange',
        text: 'Data Quality Warning',
        icon: 'warning'
      };
    } else {
      return {
        quality,
        color: 'red',
        text: 'Insufficient Data',
        icon: 'error'
      };
    }
  }

  private getStatusColorClasses(color: string): string {
    switch (color) {
      case 'orange':
        return 'bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange';
      case 'green':
        return 'bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange';
      case 'blue':
        return 'bg-bitcoin-orange bg-opacity-50 text-bitcoin-white border-bitcoin-orange';
      case 'gray':
        return 'bg-bitcoin-white bg-opacity-10 text-bitcoin-white-80 border-bitcoin-white-60';
      default:
        return 'bg-bitcoin-black text-bitcoin-orange border-bitcoin-orange';
    }
  }

  private getQualityColorClasses(color: string): string {
    switch (color) {
      case 'green':
        return 'bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange shadow-[0_0_20px_rgba(247,147,26,0.3)]';
      case 'orange':
        return 'bg-bitcoin-orange bg-opacity-50 text-bitcoin-white border-bitcoin-orange';
      case 'red':
        return 'bg-bitcoin-white bg-opacity-10 text-bitcoin-white border-bitcoin-white-60';
      default:
        return 'bg-bitcoin-black text-bitcoin-orange border-bitcoin-orange';
    }
  }

  private getQualityIcon(icon: string): string {
    switch (icon) {
      case 'checkmark':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
      default:
        return '?';
    }
  }

  private getHealthColor(health: number): 'green' | 'orange' | 'red' {
    if (health >= 90) return 'green';
    if (health >= 70) return 'orange';
    return 'red';
  }

  private getSourceStatusIcon(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return '✓';
      case 'FAILED':
        return '✗';
      case 'SLOW':
        return '⚠';
      default:
        return '?';
    }
  }

  private getTimeSinceRefresh(lastRefresh: string): string {
    if (!lastRefresh) return '';
    
    const now = new Date();
    const refreshTime = new Date(lastRefresh);
    const diffMs = now.getTime() - refreshTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours}h ago`;
    }
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const visualStatusManager = new VisualStatusManager();
