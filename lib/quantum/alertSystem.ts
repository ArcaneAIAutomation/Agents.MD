/**
 * Quantum BTC Alert System
 * 
 * Monitors system health and sends alerts for critical, warning, and info events
 * Requirements: 14.1-14.10
 */

import { query } from '../db';
import { performanceMonitor } from './performanceMonitor';

// Alert severity levels
export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

// Alert types
export enum AlertType {
  SYSTEM_SUSPENSION = 'SYSTEM_SUSPENSION',
  FATAL_ANOMALY = 'FATAL_ANOMALY',
  DATABASE_CONNECTION_LOST = 'DATABASE_CONNECTION_LOST',
  ALL_APIS_FAILING = 'ALL_APIS_FAILING',
  DATA_QUALITY_LOW = 'DATA_QUALITY_LOW',
  API_RELIABILITY_LOW = 'API_RELIABILITY_LOW',
  HIGH_ERROR_RATE = 'HIGH_ERROR_RATE',
  SLOW_RESPONSE_TIME = 'SLOW_RESPONSE_TIME',
  ACCURACY_DROP = 'ACCURACY_DROP',
  ANOMALY_SPIKE = 'ANOMALY_SPIKE',
  USER_ENGAGEMENT_DROP = 'USER_ENGAGEMENT_DROP'
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  details?: any;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * Alert System Class
 * Monitors system health and triggers alerts
 */
class AlertSystem {
  private static instance: AlertSystem;
  private alerts: Map<string, Alert>;
  private alertHandlers: Map<AlertSeverity, ((alert: Alert) => void)[]>;
  private monitoringInterval?: NodeJS.Timeout;

  private constructor() {
    this.alerts = new Map();
    this.alertHandlers = new Map();
    this.initializeDefaultHandlers();
  }

  public static getInstance(): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem();
    }
    return AlertSystem.instance;
  }

  /**
   * Initialize default alert handlers
   */
  private initializeDefaultHandlers(): void {
    // Critical alerts - log to console and database
    this.registerHandler(AlertSeverity.CRITICAL, (alert) => {
      console.error('🚨 CRITICAL ALERT:', alert.message, alert.details);
      this.logAlertToDatabase(alert);
    });

    // Warning alerts - log to console
    this.registerHandler(AlertSeverity.WARNING, (alert) => {
      console.warn('⚠️ WARNING ALERT:', alert.message, alert.details);
      this.logAlertToDatabase(alert);
    });

    // Info alerts - log to console
    this.registerHandler(AlertSeverity.INFO, (alert) => {
      console.info('ℹ️ INFO ALERT:', alert.message, alert.details);
    });
  }

  /**
   * Register a custom alert handler
   */
  registerHandler(severity: AlertSeverity, handler: (alert: Alert) => void): void {
    if (!this.alertHandlers.has(severity)) {
      this.alertHandlers.set(severity, []);
    }
    this.alertHandlers.get(severity)!.push(handler);
  }

  /**
   * Trigger an alert
   */
  async triggerAlert(
    type: AlertType,
    severity: AlertSeverity,
    message: string,
    details?: any
  ): Promise<Alert> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      type,
      severity,
      message,
      details,
      timestamp: new Date(),
      resolved: false
    };

    // Store alert
    this.alerts.set(alert.id, alert);

    // Execute handlers
    const handlers = this.alertHandlers.get(severity) || [];
    handlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('Alert handler failed:', error);
      }
    });

    return alert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      alert.resolvedBy = resolvedBy;

      // Update in database
      await this.logAlertToDatabase(alert);
    }
  }

  /**
   * Log alert to database (quantum_anomaly_logs)
   */
  private async logAlertToDatabase(alert: Alert): Promise<void> {
    try {
      await query(
        `INSERT INTO quantum_anomaly_logs (
          anomaly_type,
          severity,
          description,
          affected_sources,
          impact,
          system_suspended,
          detected_at,
          resolved_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          alert.type,
          alert.severity,
          alert.message,
          JSON.stringify(alert.details?.affectedSources || []),
          alert.details?.impact || 'Unknown impact',
          alert.type === AlertType.SYSTEM_SUSPENSION,
          alert.timestamp,
          alert.resolvedAt || null
        ]
      );
    } catch (error) {
      console.error('Failed to log alert to database:', error);
    }
  }

  /**
   * Start monitoring system health
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    this.monitoringInterval = setInterval(async () => {
      await this.checkSystemHealth();
    }, intervalMs);

    console.log(`Alert system monitoring started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('Alert system monitoring stopped');
    }
  }

  /**
   * Check system health and trigger alerts
   */
  private async checkSystemHealth(): Promise<void> {
    try {
      const health = await performanceMonitor.getSystemHealth();
      const apiStats = await performanceMonitor.getAPIStats(undefined, 1);
      const errorStats = performanceMonitor.getErrorStats();

      // Check for critical alerts
      await this.checkCriticalAlerts(health, apiStats, errorStats);

      // Check for warning alerts
      await this.checkWarningAlerts(health, apiStats, errorStats);

      // Check for info alerts
      await this.checkInfoAlerts(health, apiStats, errorStats);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  /**
   * Check for critical alerts
   */
  private async checkCriticalAlerts(health: any, apiStats: any[], errorStats: any): Promise<void> {
    // All APIs failing
    const allApisFailing = apiStats.every((stat: any) => parseFloat(stat.success_rate) < 50);
    if (allApisFailing && apiStats.length > 0) {
      await this.triggerAlert(
        AlertType.ALL_APIS_FAILING,
        AlertSeverity.CRITICAL,
        'All APIs are experiencing high failure rates',
        { apiStats, threshold: '50%' }
      );
    }

    // High error rate
    if (errorStats.errorRate > 50) {
      await this.triggerAlert(
        AlertType.HIGH_ERROR_RATE,
        AlertSeverity.CRITICAL,
        `Error rate critically high: ${errorStats.errorRate.toFixed(2)}%`,
        { errorStats, threshold: '50%' }
      );
    }

    // Extremely slow response time
    if (health.avgResponseTime > 10000) {
      await this.triggerAlert(
        AlertType.SLOW_RESPONSE_TIME,
        AlertSeverity.CRITICAL,
        `Average response time critically slow: ${health.avgResponseTime}ms`,
        { avgResponseTime: health.avgResponseTime, threshold: '10000ms' }
      );
    }
  }

  /**
   * Check for warning alerts
   */
  private async checkWarningAlerts(health: any, apiStats: any[], errorStats: any): Promise<void> {
    // Low API reliability
    const lowReliabilityAPIs = apiStats.filter((stat: any) => parseFloat(stat.success_rate) < 90);
    if (lowReliabilityAPIs.length > 0) {
      await this.triggerAlert(
        AlertType.API_RELIABILITY_LOW,
        AlertSeverity.WARNING,
        `${lowReliabilityAPIs.length} API(s) have reliability below 90%`,
        { apis: lowReliabilityAPIs.map((s: any) => s.api_name), threshold: '90%' }
      );
    }

    // Elevated error rate
    if (errorStats.errorRate > 5 && errorStats.errorRate <= 50) {
      await this.triggerAlert(
        AlertType.HIGH_ERROR_RATE,
        AlertSeverity.WARNING,
        `Error rate elevated: ${errorStats.errorRate.toFixed(2)}%`,
        { errorStats, threshold: '5%' }
      );
    }

    // Slow response time
    if (health.avgResponseTime > 5000 && health.avgResponseTime <= 10000) {
      await this.triggerAlert(
        AlertType.SLOW_RESPONSE_TIME,
        AlertSeverity.WARNING,
        `Average response time slow: ${health.avgResponseTime}ms`,
        { avgResponseTime: health.avgResponseTime, threshold: '5000ms' }
      );
    }
  }

  /**
   * Check for info alerts
   */
  private async checkInfoAlerts(health: any, apiStats: any[], errorStats: any): Promise<void> {
    // Check for anomaly spikes
    try {
      const anomalyCount = await query(
        `SELECT COUNT(*) as count 
         FROM quantum_anomaly_logs 
         WHERE detected_at >= NOW() - INTERVAL '1 hour'`
      );

      const count = parseInt(anomalyCount.rows[0]?.count || '0');
      if (count > 10) {
        await this.triggerAlert(
          AlertType.ANOMALY_SPIKE,
          AlertSeverity.INFO,
          `Anomaly count increased: ${count} in last hour`,
          { count, threshold: 10 }
        );
      }
    } catch (error) {
      console.error('Failed to check anomaly count:', error);
    }
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.severity === severity && !alert.resolved);
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): any {
    const alerts = Array.from(this.alerts.values());
    const activeAlerts = alerts.filter(a => !a.resolved);

    return {
      total: alerts.length,
      active: activeAlerts.length,
      resolved: alerts.length - activeAlerts.length,
      bySeverity: {
        critical: activeAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
        warning: activeAlerts.filter(a => a.severity === AlertSeverity.WARNING).length,
        info: activeAlerts.filter(a => a.severity === AlertSeverity.INFO).length
      },
      byType: activeAlerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Clear resolved alerts older than specified days
   */
  clearOldAlerts(days: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    this.alerts.forEach((alert, id) => {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < cutoffDate) {
        this.alerts.delete(id);
      }
    });
  }
}

// Export singleton instance
export const alertSystem = AlertSystem.getInstance();

/**
 * Convenience functions for triggering specific alerts
 */
export async function alertSystemSuspension(reason: string, details?: any): Promise<Alert> {
  return alertSystem.triggerAlert(
    AlertType.SYSTEM_SUSPENSION,
    AlertSeverity.CRITICAL,
    `System suspended: ${reason}`,
    details
  );
}

export async function alertFatalAnomaly(anomalyType: string, details?: any): Promise<Alert> {
  return alertSystem.triggerAlert(
    AlertType.FATAL_ANOMALY,
    AlertSeverity.CRITICAL,
    `Fatal anomaly detected: ${anomalyType}`,
    details
  );
}

export async function alertDataQualityLow(score: number, details?: any): Promise<Alert> {
  return alertSystem.triggerAlert(
    AlertType.DATA_QUALITY_LOW,
    AlertSeverity.WARNING,
    `Data quality low: ${score}% (minimum 70% required)`,
    { ...details, score, threshold: 70 }
  );
}

export async function alertAccuracyDrop(currentRate: number, details?: any): Promise<Alert> {
  return alertSystem.triggerAlert(
    AlertType.ACCURACY_DROP,
    AlertSeverity.INFO,
    `Accuracy rate dropped to ${currentRate}%`,
    { ...details, currentRate }
  );
}
