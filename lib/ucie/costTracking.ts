/**
 * API Cost Tracking System for UCIE
 * 
 * Tracks and monitors API costs across all services to prevent
 * unexpected expenses and optimize API usage.
 * 
 * Features:
 * - Real-time cost tracking per API
 * - Daily/monthly cost aggregation
 * - Cost alerts and thresholds
 * - Cost optimization recommendations
 * - Historical cost analysis
 * 
 * Requirements: 13.5, 14.2
 */

import { API_SERVICES, apiKeyManager } from './apiKeyManager';

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface CostEntry {
  serviceName: string;
  timestamp: Date;
  cost: number;
  currency: string;
  requestType: string;
  metadata?: Record<string, any>;
}

export interface CostSummary {
  serviceName: string;
  totalCost: number;
  requestCount: number;
  averageCostPerRequest: number;
  currency: string;
  period: {
    start: Date;
    end: Date;
  };
}

export interface CostAlert {
  serviceName: string;
  threshold: number;
  currentCost: number;
  percentage: number;
  severity: 'warning' | 'critical';
  message: string;
}

export interface CostOptimization {
  serviceName: string;
  currentCost: number;
  potentialSavings: number;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
}

// =============================================================================
// Cost Tracker Class
// =============================================================================

class CostTracker {
  private costHistory: CostEntry[] = [];
  private costThresholds: Map<string, number> = new Map();
  private alerts: CostAlert[] = [];

  /**
   * Record a cost entry
   */
  recordCost(
    serviceName: string,
    requestType: string = 'standard',
    metadata?: Record<string, any>
  ): void {
    const config = API_SERVICES[serviceName];
    if (!config) {
      console.warn(`Unknown service for cost tracking: ${serviceName}`);
      return;
    }

    const entry: CostEntry = {
      serviceName,
      timestamp: new Date(),
      cost: config.cost.perRequest,
      currency: config.cost.currency,
      requestType,
      metadata,
    };

    this.costHistory.push(entry);

    // Check if threshold exceeded
    this.checkThreshold(serviceName);

    // Keep only last 30 days of history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.costHistory = this.costHistory.filter(
      (entry) => entry.timestamp >= thirtyDaysAgo
    );
  }

  /**
   * Set cost threshold for a service
   */
  setThreshold(serviceName: string, threshold: number): void {
    this.costThresholds.set(serviceName, threshold);
  }

  /**
   * Check if cost threshold is exceeded
   */
  private checkThreshold(serviceName: string): void {
    const threshold = this.costThresholds.get(serviceName);
    if (!threshold) return;

    const monthlyCost = this.getMonthlyCost(serviceName);
    const percentage = (monthlyCost / threshold) * 100;

    // Remove existing alerts for this service
    this.alerts = this.alerts.filter((alert) => alert.serviceName !== serviceName);

    if (percentage >= 100) {
      this.alerts.push({
        serviceName,
        threshold,
        currentCost: monthlyCost,
        percentage,
        severity: 'critical',
        message: `${serviceName} has exceeded monthly cost threshold ($${monthlyCost.toFixed(2)} / $${threshold.toFixed(2)})`,
      });
    } else if (percentage >= 80) {
      this.alerts.push({
        serviceName,
        threshold,
        currentCost: monthlyCost,
        percentage,
        severity: 'warning',
        message: `${serviceName} is approaching monthly cost threshold ($${monthlyCost.toFixed(2)} / $${threshold.toFixed(2)})`,
      });
    }
  }

  /**
   * Get cost summary for a service
   */
  getCostSummary(
    serviceName: string,
    startDate?: Date,
    endDate?: Date
  ): CostSummary {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const entries = this.costHistory.filter(
      (entry) =>
        entry.serviceName === serviceName &&
        entry.timestamp >= start &&
        entry.timestamp <= end
    );

    const totalCost = entries.reduce((sum, entry) => sum + entry.cost, 0);
    const requestCount = entries.length;
    const averageCostPerRequest = requestCount > 0 ? totalCost / requestCount : 0;
    const currency = entries[0]?.currency || 'USD';

    return {
      serviceName,
      totalCost,
      requestCount,
      averageCostPerRequest,
      currency,
      period: { start, end },
    };
  }

  /**
   * Get daily cost for a service
   */
  getDailyCost(serviceName: string, date?: Date): number {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return this.costHistory
      .filter(
        (entry) =>
          entry.serviceName === serviceName &&
          entry.timestamp >= startOfDay &&
          entry.timestamp <= endOfDay
      )
      .reduce((sum, entry) => sum + entry.cost, 0);
  }

  /**
   * Get monthly cost for a service
   */
  getMonthlyCost(serviceName: string, date?: Date): number {
    const targetDate = date || new Date();
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    return this.costHistory
      .filter(
        (entry) =>
          entry.serviceName === serviceName &&
          entry.timestamp >= startOfMonth &&
          entry.timestamp <= endOfMonth
      )
      .reduce((sum, entry) => sum + entry.cost, 0);
  }

  /**
   * Get total cost across all services
   */
  getTotalCost(startDate?: Date, endDate?: Date): number {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    return this.costHistory
      .filter((entry) => entry.timestamp >= start && entry.timestamp <= end)
      .reduce((sum, entry) => sum + entry.cost, 0);
  }

  /**
   * Get cost breakdown by service
   */
  getCostBreakdown(startDate?: Date, endDate?: Date): CostSummary[] {
    const services = Object.keys(API_SERVICES);
    return services.map((service) => this.getCostSummary(service, startDate, endDate));
  }

  /**
   * Get active cost alerts
   */
  getAlerts(): CostAlert[] {
    return this.alerts;
  }

  /**
   * Get cost optimization recommendations
   */
  getOptimizations(): CostOptimization[] {
    const optimizations: CostOptimization[] = [];
    const monthlyCosts = Object.keys(API_SERVICES).map((service) => ({
      service,
      cost: this.getMonthlyCost(service),
    }));

    // Check for expensive services with alternatives
    monthlyCosts.forEach(({ service, cost }) => {
      if (cost > 10) {
        // $10/month threshold
        if (service === 'COINMARKETCAP' && cost > 10) {
          optimizations.push({
            serviceName: service,
            currentCost: cost,
            potentialSavings: cost * 0.8, // Estimate 80% savings
            recommendation:
              'Consider using CoinGecko as primary source (free tier) and CoinMarketCap as fallback',
            priority: 'high',
          });
        }

        if (service === 'OPENAI' && cost > 50) {
          optimizations.push({
            serviceName: service,
            currentCost: cost,
            potentialSavings: cost * 0.3, // Estimate 30% savings
            recommendation:
              'Implement caching for AI responses to reduce redundant API calls',
            priority: 'high',
          });
        }

        if (service === 'CAESAR' && cost > 20) {
          optimizations.push({
            serviceName: service,
            currentCost: cost,
            potentialSavings: cost * 0.4, // Estimate 40% savings
            recommendation:
              'Use lower compute units (1-2) for standard analysis, reserve 5-7 for deep dives',
            priority: 'medium',
          });
        }
      }
    });

    // Check for unused services
    const usageStats = apiKeyManager.getAllUsageStats();
    usageStats.forEach((stats) => {
      if (stats.requestCount === 0 && API_SERVICES[stats.serviceName]?.cost.perRequest > 0) {
        optimizations.push({
          serviceName: stats.serviceName,
          currentCost: 0,
          potentialSavings: 0,
          recommendation: `${stats.serviceName} is configured but not being used. Consider removing API key.`,
          priority: 'low',
        });
      }
    });

    return optimizations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get cost projection for next month
   */
  getProjectedMonthlyCost(): Record<string, number> {
    const projection: Record<string, number> = {};
    const services = Object.keys(API_SERVICES);

    services.forEach((service) => {
      // Get last 7 days of costs
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentCost = this.costHistory
        .filter(
          (entry) =>
            entry.serviceName === service && entry.timestamp >= sevenDaysAgo
        )
        .reduce((sum, entry) => sum + entry.cost, 0);

      // Project to 30 days
      projection[service] = (recentCost / 7) * 30;
    });

    return projection;
  }

  /**
   * Export cost history as CSV
   */
  exportToCsv(): string {
    const headers = ['Timestamp', 'Service', 'Cost', 'Currency', 'Request Type'];
    const rows = this.costHistory.map((entry) => [
      entry.timestamp.toISOString(),
      entry.serviceName,
      entry.cost.toFixed(4),
      entry.currency,
      entry.requestType,
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  /**
   * Clear cost history
   */
  clearHistory(): void {
    this.costHistory = [];
    this.alerts = [];
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const costTracker = new CostTracker();

// =============================================================================
// Default Cost Thresholds
// =============================================================================

// Set default monthly cost thresholds
costTracker.setThreshold('OPENAI', 100); // $100/month
costTracker.setThreshold('CAESAR', 50); // $50/month
costTracker.setThreshold('COINMARKETCAP', 10); // $10/month
costTracker.setThreshold('LUNARCRUSH', 0); // Free tier
costTracker.setThreshold('NEWSAPI', 0); // Free tier

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Record API usage with cost tracking
 */
export function recordApiUsage(
  serviceName: string,
  success: boolean,
  requestType: string = 'standard',
  metadata?: Record<string, any>
): void {
  // Record in API key manager
  apiKeyManager.recordUsage(serviceName, success);

  // Record cost
  if (success) {
    costTracker.recordCost(serviceName, requestType, metadata);
  }
}

/**
 * Get cost report
 */
export function getCostReport(days: number = 30): {
  summary: {
    totalCost: number;
    dailyAverage: number;
    projectedMonthly: number;
  };
  breakdown: CostSummary[];
  alerts: CostAlert[];
  optimizations: CostOptimization[];
} {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const endDate = new Date();

  const totalCost = costTracker.getTotalCost(startDate, endDate);
  const dailyAverage = totalCost / days;
  const projectedMonthly = dailyAverage * 30;

  return {
    summary: {
      totalCost,
      dailyAverage,
      projectedMonthly,
    },
    breakdown: costTracker.getCostBreakdown(startDate, endDate),
    alerts: costTracker.getAlerts(),
    optimizations: costTracker.getOptimizations(),
  };
}
