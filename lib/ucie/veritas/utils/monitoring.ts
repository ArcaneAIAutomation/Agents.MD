/**
 * Veritas Protocol - Monitoring System
 * 
 * Tracks validation metrics, performance, and error rates for monitoring
 * and alerting purposes.
 */

export interface ValidationMetrics {
  timestamp: string;
  symbol: string;
  validationType: 'market' | 'social' | 'onchain' | 'news' | 'full';
  success: boolean;
  duration: number; // milliseconds
  confidenceScore?: number;
  errorType?: string;
  errorMessage?: string;
  alertCount: number;
  fatalAlertCount: number;
}

export interface AggregatedMetrics {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  successRate: number; // percentage
  averageDuration: number; // milliseconds
  averageConfidenceScore: number;
  totalAlerts: number;
  totalFatalAlerts: number;
  errorBreakdown: Record<string, number>;
  validationsByType: Record<string, number>;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface PerformanceThresholds {
  maxDuration: number; // milliseconds
  minSuccessRate: number; // percentage
  maxErrorRate: number; // percentage
  maxFatalAlertRate: number; // percentage
}

class VeritasMonitoring {
  private metrics: ValidationMetrics[] = [];
  private readonly maxMetricsInMemory = 1000;
  
  private readonly defaultThresholds: PerformanceThresholds = {
    maxDuration: 15000, // 15 seconds
    minSuccessRate: 95, // 95%
    maxErrorRate: 5, // 5%
    maxFatalAlertRate: 1 // 1%
  };
  
  /**
   * Record a validation attempt
   */
  recordValidation(metric: ValidationMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics in memory
    if (this.metrics.length > this.maxMetricsInMemory) {
      this.metrics = this.metrics.slice(-this.maxMetricsInMemory);
    }
    
    // Check thresholds and trigger alerts if needed
    this.checkThresholds();
  }
  
  /**
   * Get aggregated metrics for a time range
   */
  getAggregatedMetrics(
    startTime?: Date,
    endTime?: Date
  ): AggregatedMetrics {
    const start = startTime || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const end = endTime || new Date();
    
    const filteredMetrics = this.metrics.filter(m => {
      const timestamp = new Date(m.timestamp);
      return timestamp >= start && timestamp <= end;
    });
    
    if (filteredMetrics.length === 0) {
      return {
        totalValidations: 0,
        successfulValidations: 0,
        failedValidations: 0,
        successRate: 0,
        averageDuration: 0,
        averageConfidenceScore: 0,
        totalAlerts: 0,
        totalFatalAlerts: 0,
        errorBreakdown: {},
        validationsByType: {},
        timeRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      };
    }
    
    const successfulValidations = filteredMetrics.filter(m => m.success).length;
    const failedValidations = filteredMetrics.length - successfulValidations;
    
    const totalDuration = filteredMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalDuration / filteredMetrics.length;
    
    const confidenceScores = filteredMetrics
      .filter(m => m.confidenceScore !== undefined)
      .map(m => m.confidenceScore!);
    const averageConfidenceScore = confidenceScores.length > 0
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
      : 0;
    
    const totalAlerts = filteredMetrics.reduce((sum, m) => sum + m.alertCount, 0);
    const totalFatalAlerts = filteredMetrics.reduce((sum, m) => sum + m.fatalAlertCount, 0);
    
    // Error breakdown
    const errorBreakdown: Record<string, number> = {};
    filteredMetrics
      .filter(m => m.errorType)
      .forEach(m => {
        errorBreakdown[m.errorType!] = (errorBreakdown[m.errorType!] || 0) + 1;
      });
    
    // Validations by type
    const validationsByType: Record<string, number> = {};
    filteredMetrics.forEach(m => {
      validationsByType[m.validationType] = (validationsByType[m.validationType] || 0) + 1;
    });
    
    return {
      totalValidations: filteredMetrics.length,
      successfulValidations,
      failedValidations,
      successRate: (successfulValidations / filteredMetrics.length) * 100,
      averageDuration,
      averageConfidenceScore,
      totalAlerts,
      totalFatalAlerts,
      errorBreakdown,
      validationsByType,
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    };
  }
  
  /**
   * Check if metrics exceed thresholds and trigger alerts
   */
  private checkThresholds(thresholds: PerformanceThresholds = this.defaultThresholds): void {
    const recentMetrics = this.getAggregatedMetrics(
      new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );
    
    const alerts: string[] = [];
    
    // Check success rate
    if (recentMetrics.successRate < thresholds.minSuccessRate) {
      alerts.push(
        `⚠️ Low success rate: ${recentMetrics.successRate.toFixed(1)}% (threshold: ${thresholds.minSuccessRate}%)`
      );
    }
    
    // Check error rate
    const errorRate = (recentMetrics.failedValidations / recentMetrics.totalValidations) * 100;
    if (errorRate > thresholds.maxErrorRate) {
      alerts.push(
        `⚠️ High error rate: ${errorRate.toFixed(1)}% (threshold: ${thresholds.maxErrorRate}%)`
      );
    }
    
    // Check fatal alert rate
    const fatalAlertRate = (recentMetrics.totalFatalAlerts / recentMetrics.totalValidations) * 100;
    if (fatalAlertRate > thresholds.maxFatalAlertRate) {
      alerts.push(
        `🚨 High fatal alert rate: ${fatalAlertRate.toFixed(1)}% (threshold: ${thresholds.maxFatalAlertRate}%)`
      );
    }
    
    // Check average duration
    if (recentMetrics.averageDuration > thresholds.maxDuration) {
      alerts.push(
        `⏱️ Slow validation: ${recentMetrics.averageDuration.toFixed(0)}ms (threshold: ${thresholds.maxDuration}ms)`
      );
    }
    
    // Log alerts
    if (alerts.length > 0) {
      console.warn('Veritas Monitoring Alerts:', alerts);
      // In production, send to monitoring service (e.g., Sentry, DataDog)
    }
  }
  
  /**
   * Get recent validation history
   */
  getRecentValidations(limit: number = 100): ValidationMetrics[] {
    return this.metrics.slice(-limit);
  }
  
  /**
   * Clear all metrics (for testing)
   */
  clearMetrics(): void {
    this.metrics = [];
  }
  
  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): ValidationMetrics[] {
    return [...this.metrics];
  }
}

// Singleton instance
export const veritasMonitoring = new VeritasMonitoring();
