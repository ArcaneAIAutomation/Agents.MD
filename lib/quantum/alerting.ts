/**
 * Alerting System for Quantum BTC Super Spec
 * 
 * Manages:
 * - Critical alerts (immediate response)
 * - Warning alerts (monitor closely)
 * - Info alerts (track trends)
 * 
 * Requirements: 14.1-14.10
 */

import { query } from '../db';
import { performanceMonitor } from './performanceMonitor';

// Alert severity levels
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

// Alert types
export type AlertType =
  | 'SYSTEM_SUSPENSION'
  | 'FATAL_ANOMALY'
  | 'DATABASE_CONNECTION_LOST'
  | 'ALL_APIS_FAILING'
  | 'DATA_QUALITY_LOW'
  | 'API_RELIABILITY_LOW'
  | 'HIGH_ERROR_RATE'
  | 'SLOW_RESPONSE_TIME'
  | 'ACCURACY_DROP'
  | 'ANOMALY_SPIKE'
  | 'USER_ENGAGEMENT_DROP';

export interface Alert {
  id?: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  message: string;
  context?: Record<string, any>;
  triggered_at: Date;
  resolved_at?: Date;
  resolved_by?: string;
  resolution_notes?: string;
}

export interface AlertRule {
  type: AlertType;
  severity: AlertSeverity;
  condition: () => Promise<boolean>;
  title: string;
  messageTemplate: (context: any) => string;
  cooldownMinutes: number; // Prevent alert spam
}

/**
 * Alerting System Class
 * Singleton pattern for centralized alerting
 */
class AlertingSystem {
  private static instance: AlertingSystem;
  private alertRules: AlertRule[] = [];
  private lastAlertTimes: Map<AlertType, Date> = new Map();

  private constructor() {
    this.initializeAlertRules();
  }

  static getInstance(): AlertingSystem {
    if (!AlertingSystem.instance) {
      AlertingSystem.instance = new AlertingSystem();
    }
    return AlertingSystem.instance;
  }

  /**
   * Initialize alert rules based on design document
   */
  private initializeAlertRules(): void {
    // CRITICAL ALERTS (Immediate Response)
    this.alertRules.push({
      type: 'SYSTEM_SUSPENSION',
      severity: 'CRITICAL',
      condition: async () => {
        const result = await query(
          `SELECT COUNT(*) as count
           FROM quantum_anomaly_logs
           WHERE system_suspended = true
           AND detected_at > NOW() - INTERVAL '5 minutes'`
        );
        return parseInt(result.rows[0]?.count || '0') > 0;
      },
      title: 'System Suspension Triggered',
      messageTemplate: (ctx) =>
        `The Quantum system has been suspended due to ${ctx.reason}. Immediate action required.`,
      cooldownMinutes: 5,
    });

    this.alertRules.push({
      type: 'FATAL_ANOMALY',
      severity: 'CRITICAL',
      condition: async () => {
        const result = await query(
          `SELECT COUNT(*) as count
           FROM quantum_anomaly_logs
           WHERE severity = 'FATAL'
           AND detected_at > NOW() - INTERVAL '5 minutes'`
        );
        return parseInt(result.rows[0]?.count || '0') > 0;
      },
      title: 'Fatal Anomaly Detected',
      messageTemplate: (ctx) =>
        `A fatal anomaly has been detected: ${ctx.description}. System integrity at risk.`,
      cooldownMinutes: 5,
    });

    this.alertRules.push({
      type: 'DATABASE_CONNECTION_LOST',
      severity: 'CRITICAL',
      condition: async () => {
        try {
          await query('SELECT 1');
          return false;
        } catch (error) {
          return true;
        }
      },
      title: 'Database Connection Lost',
      messageTemplate: () =>
        'Unable to connect to Supabase database. All operations halted.',
      cooldownMinutes: 2,
    });

    this.alertRules.push({
      type: 'ALL_APIS_FAILING',
      severity: 'CRITICAL',
      condition: async () => {
        const avgResponseTime = await performanceMonitor.getAverageAPIResponseTime(
          '',
          '5m'
        );
        const errorRate = await performanceMonitor.getErrorRate('5m');
        return errorRate > 90; // 90%+ failure rate
      },
      title: 'All APIs Failing',
      messageTemplate: (ctx) =>
        `All external APIs are failing. Error rate: ${ctx.errorRate}%. System cannot generate trades.`,
      cooldownMinutes: 5,
    });

    // WARNING ALERTS (Monitor Closely)
    this.alertRules.push({
      type: 'DATA_QUALITY_LOW',
      severity: 'WARNING',
      condition: async () => {
        const result = await query(
          `SELECT AVG(data_quality_score) as avg_quality
           FROM btc_trades
           WHERE generated_at > NOW() - INTERVAL '3 hours'`
        );
        const avgQuality = parseFloat(result.rows[0]?.avg_quality || '100');
        return avgQuality < 70;
      },
      title: 'Data Quality Below Threshold',
      messageTemplate: (ctx) =>
        `Average data quality has been below 70% for 3 consecutive hours. Current: ${ctx.avgQuality}%`,
      cooldownMinutes: 30,
    });

    this.alertRules.push({
      type: 'API_RELIABILITY_LOW',
      severity: 'WARNING',
      condition: async () => {
        const result = await query(
          `SELECT 
             api_reliability_cmc,
             api_reliability_coingecko,
             api_reliability_kraken,
             api_reliability_blockchain,
             api_reliability_lunarcrush
           FROM prediction_accuracy_database
           ORDER BY created_at DESC
           LIMIT 1`
        );
        
        if (result.rows.length === 0) return false;
        
        const reliabilities = Object.values(result.rows[0]);
        return reliabilities.some(r => parseFloat(r as string) < 90);
      },
      title: 'API Reliability Below 90%',
      messageTemplate: (ctx) =>
        `One or more APIs have reliability below 90%: ${ctx.failingAPIs.join(', ')}`,
      cooldownMinutes: 60,
    });

    this.alertRules.push({
      type: 'HIGH_ERROR_RATE',
      severity: 'WARNING',
      condition: async () => {
        const errorRate = await performanceMonitor.getErrorRate('1h');
        return errorRate > 5;
      },
      title: 'High Error Rate Detected',
      messageTemplate: (ctx) =>
        `Error rate has exceeded 5% in the last hour. Current: ${ctx.errorRate}%`,
      cooldownMinutes: 30,
    });

    this.alertRules.push({
      type: 'SLOW_RESPONSE_TIME',
      severity: 'WARNING',
      condition: async () => {
        const avgResponseTime = await performanceMonitor.getAverageAPIResponseTime(
          '',
          '1h'
        );
        return avgResponseTime > 10000; // 10 seconds
      },
      title: 'Slow Response Times',
      messageTemplate: (ctx) =>
        `Average response time has exceeded 10 seconds. Current: ${ctx.avgResponseTime}ms`,
      cooldownMinutes: 30,
    });

    // INFO ALERTS (Track Trends)
    this.alertRules.push({
      type: 'ACCURACY_DROP',
      severity: 'INFO',
      condition: async () => {
        const result = await query(
          `SELECT overall_accuracy_rate
           FROM prediction_accuracy_database
           ORDER BY created_at DESC
           LIMIT 1`
        );
        const accuracy = parseFloat(result.rows[0]?.overall_accuracy_rate || '100');
        return accuracy < 60;
      },
      title: 'Accuracy Rate Below 60%',
      messageTemplate: (ctx) =>
        `Overall accuracy rate has dropped below 60%. Current: ${ctx.accuracy}%`,
      cooldownMinutes: 120,
    });

    this.alertRules.push({
      type: 'ANOMALY_SPIKE',
      severity: 'INFO',
      condition: async () => {
        const recentResult = await query(
          `SELECT COUNT(*) as recent_count
           FROM quantum_anomaly_logs
           WHERE detected_at > NOW() - INTERVAL '1 hour'`
        );
        
        const previousResult = await query(
          `SELECT COUNT(*) as previous_count
           FROM quantum_anomaly_logs
           WHERE detected_at BETWEEN NOW() - INTERVAL '2 hours' AND NOW() - INTERVAL '1 hour'`
        );
        
        const recentCount = parseInt(recentResult.rows[0]?.recent_count || '0');
        const previousCount = parseInt(previousResult.rows[0]?.previous_count || '0');
        
        return previousCount > 0 && recentCount > previousCount * 1.5;
      },
      title: 'Anomaly Count Increased 50%',
      messageTemplate: (ctx) =>
        `Anomaly count has increased by 50% in the last hour. Recent: ${ctx.recentCount}, Previous: ${ctx.previousCount}`,
      cooldownMinutes: 60,
    });

    this.alertRules.push({
      type: 'USER_ENGAGEMENT_DROP',
      severity: 'INFO',
      condition: async () => {
        const recentResult = await query(
          `SELECT COUNT(DISTINCT user_id) as recent_users
           FROM btc_trades
           WHERE generated_at > NOW() - INTERVAL '24 hours'`
        );
        
        const previousResult = await query(
          `SELECT COUNT(DISTINCT user_id) as previous_users
           FROM btc_trades
           WHERE generated_at BETWEEN NOW() - INTERVAL '48 hours' AND NOW() - INTERVAL '24 hours'`
        );
        
        const recentUsers = parseInt(recentResult.rows[0]?.recent_users || '0');
        const previousUsers = parseInt(previousResult.rows[0]?.previous_users || '0');
        
        return previousUsers > 0 && recentUsers < previousUsers * 0.75;
      },
      title: 'User Engagement Dropped 25%',
      messageTemplate: (ctx) =>
        `User engagement has dropped by 25% in the last 24 hours. Recent: ${ctx.recentUsers}, Previous: ${ctx.previousUsers}`,
      cooldownMinutes: 240,
    });
  }

  /**
   * Check all alert rules and trigger alerts if conditions are met
   */
  async checkAlerts(): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    for (const rule of this.alertRules) {
      try {
        // Check cooldown
        const lastAlertTime = this.lastAlertTimes.get(rule.type);
        if (lastAlertTime) {
          const minutesSinceLastAlert =
            (Date.now() - lastAlertTime.getTime()) / 60000;
          if (minutesSinceLastAlert < rule.cooldownMinutes) {
            continue; // Skip this rule due to cooldown
          }
        }

        // Check condition
        const shouldTrigger = await rule.condition();
        if (shouldTrigger) {
          // Gather context for message
          const context = await this.gatherAlertContext(rule.type);
          
          // Create alert
          const alert: Alert = {
            severity: rule.severity,
            type: rule.type,
            title: rule.title,
            message: rule.messageTemplate(context),
            context,
            triggered_at: new Date(),
          };

          // Store alert
          await this.storeAlert(alert);
          
          // Update last alert time
          this.lastAlertTimes.set(rule.type, new Date());
          
          triggeredAlerts.push(alert);

          // Log to console based on severity
          this.logAlert(alert);
        }
      } catch (error) {
        console.error(`Error checking alert rule ${rule.type}:`, error);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Gather context data for alert message
   */
  private async gatherAlertContext(alertType: AlertType): Promise<any> {
    const context: any = {};

    try {
      switch (alertType) {
        case 'SYSTEM_SUSPENSION':
          const suspensionResult = await query(
            `SELECT description, anomaly_type
             FROM quantum_anomaly_logs
             WHERE system_suspended = true
             ORDER BY detected_at DESC
             LIMIT 1`
          );
          context.reason = suspensionResult.rows[0]?.anomaly_type || 'Unknown';
          break;

        case 'FATAL_ANOMALY':
          const anomalyResult = await query(
            `SELECT description
             FROM quantum_anomaly_logs
             WHERE severity = 'FATAL'
             ORDER BY detected_at DESC
             LIMIT 1`
          );
          context.description = anomalyResult.rows[0]?.description || 'Unknown';
          break;

        case 'ALL_APIS_FAILING':
          context.errorRate = await performanceMonitor.getErrorRate('5m');
          break;

        case 'DATA_QUALITY_LOW':
          const qualityResult = await query(
            `SELECT AVG(data_quality_score) as avg_quality
             FROM btc_trades
             WHERE generated_at > NOW() - INTERVAL '3 hours'`
          );
          context.avgQuality = parseFloat(qualityResult.rows[0]?.avg_quality || '0').toFixed(2);
          break;

        case 'API_RELIABILITY_LOW':
          const reliabilityResult = await query(
            `SELECT 
               api_reliability_cmc,
               api_reliability_coingecko,
               api_reliability_kraken,
               api_reliability_blockchain,
               api_reliability_lunarcrush
             FROM prediction_accuracy_database
             ORDER BY created_at DESC
             LIMIT 1`
          );
          const failingAPIs: string[] = [];
          if (reliabilityResult.rows.length > 0) {
            const row = reliabilityResult.rows[0];
            if (parseFloat(row.api_reliability_cmc) < 90) failingAPIs.push('CMC');
            if (parseFloat(row.api_reliability_coingecko) < 90) failingAPIs.push('CoinGecko');
            if (parseFloat(row.api_reliability_kraken) < 90) failingAPIs.push('Kraken');
            if (parseFloat(row.api_reliability_blockchain) < 90) failingAPIs.push('Blockchain.com');
            if (parseFloat(row.api_reliability_lunarcrush) < 90) failingAPIs.push('LunarCrush');
          }
          context.failingAPIs = failingAPIs;
          break;

        case 'HIGH_ERROR_RATE':
          context.errorRate = (await performanceMonitor.getErrorRate('1h')).toFixed(2);
          break;

        case 'SLOW_RESPONSE_TIME':
          context.avgResponseTime = Math.round(
            await performanceMonitor.getAverageAPIResponseTime('', '1h')
          );
          break;

        case 'ACCURACY_DROP':
          const accuracyResult = await query(
            `SELECT overall_accuracy_rate
             FROM prediction_accuracy_database
             ORDER BY created_at DESC
             LIMIT 1`
          );
          context.accuracy = parseFloat(accuracyResult.rows[0]?.overall_accuracy_rate || '0').toFixed(2);
          break;

        case 'ANOMALY_SPIKE':
          const recentAnomalies = await query(
            `SELECT COUNT(*) as count
             FROM quantum_anomaly_logs
             WHERE detected_at > NOW() - INTERVAL '1 hour'`
          );
          const previousAnomalies = await query(
            `SELECT COUNT(*) as count
             FROM quantum_anomaly_logs
             WHERE detected_at BETWEEN NOW() - INTERVAL '2 hours' AND NOW() - INTERVAL '1 hour'`
          );
          context.recentCount = parseInt(recentAnomalies.rows[0]?.count || '0');
          context.previousCount = parseInt(previousAnomalies.rows[0]?.count || '0');
          break;

        case 'USER_ENGAGEMENT_DROP':
          const recentUsers = await query(
            `SELECT COUNT(DISTINCT user_id) as count
             FROM btc_trades
             WHERE generated_at > NOW() - INTERVAL '24 hours'`
          );
          const previousUsers = await query(
            `SELECT COUNT(DISTINCT user_id) as count
             FROM btc_trades
             WHERE generated_at BETWEEN NOW() - INTERVAL '48 hours' AND NOW() - INTERVAL '24 hours'`
          );
          context.recentUsers = parseInt(recentUsers.rows[0]?.count || '0');
          context.previousUsers = parseInt(previousUsers.rows[0]?.count || '0');
          break;
      }
    } catch (error) {
      console.error('Error gathering alert context:', error);
    }

    return context;
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: Alert): Promise<void> {
    try {
      await query(
        `INSERT INTO system_alerts
         (severity, type, title, message, context, triggered_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          alert.severity,
          alert.type,
          alert.title,
          alert.message,
          JSON.stringify(alert.context || {}),
          alert.triggered_at,
        ]
      );
    } catch (error) {
      console.error('Failed to store alert:', error);
    }
  }

  /**
   * Log alert to console with appropriate formatting
   */
  private logAlert(alert: Alert): void {
    const emoji = {
      CRITICAL: '🚨',
      WARNING: '⚠️',
      INFO: 'ℹ️',
    }[alert.severity];

    const message = `${emoji} [${alert.severity}] ${alert.title}: ${alert.message}`;

    switch (alert.severity) {
      case 'CRITICAL':
        console.error(message);
        break;
      case 'WARNING':
        console.warn(message);
        break;
      case 'INFO':
        console.info(message);
        break;
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolutionNotes: string
  ): Promise<void> {
    try {
      await query(
        `UPDATE system_alerts
         SET resolved_at = NOW(),
             resolved_by = $1,
             resolution_notes = $2
         WHERE id = $3`,
        [resolvedBy, resolutionNotes, alertId]
      );
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(severity?: AlertSeverity): Promise<Alert[]> {
    try {
      let sql = `SELECT * FROM system_alerts
                 WHERE resolved_at IS NULL`;
      const params: any[] = [];

      if (severity) {
        sql += ` AND severity = $1`;
        params.push(severity);
      }

      sql += ` ORDER BY triggered_at DESC`;

      const result = await query(sql, params);
      return result.rows.map(row => ({
        id: row.id,
        severity: row.severity,
        type: row.type,
        title: row.title,
        message: row.message,
        context: row.context,
        triggered_at: new Date(row.triggered_at),
        resolved_at: row.resolved_at ? new Date(row.resolved_at) : undefined,
        resolved_by: row.resolved_by,
        resolution_notes: row.resolution_notes,
      }));
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }
}

// Export singleton instance
export const alertingSystem = AlertingSystem.getInstance();
