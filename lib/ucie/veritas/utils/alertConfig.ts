/**
 * Veritas Protocol - Alert Configuration
 * 
 * Defines alert rules and thresholds for monitoring validation health.
 */

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  condition: (metrics: any) => boolean;
  message: (metrics: any) => string;
  enabled: boolean;
}

export interface AlertConfig {
  rules: AlertRule[];
  notificationChannels: {
    email?: {
      enabled: boolean;
      recipients: string[];
    };
    slack?: {
      enabled: boolean;
      webhookUrl: string;
    };
    console?: {
      enabled: boolean;
    };
  };
}

/**
 * Default alert rules for Veritas Protocol
 */
export const defaultAlertRules: AlertRule[] = [
  {
    id: 'high-error-rate',
    name: 'High Error Rate',
    description: 'Validation error rate exceeds 5% in the last hour',
    severity: 'error',
    condition: (metrics) => {
      const errorRate = (metrics.failedValidations / metrics.totalValidations) * 100;
      return errorRate > 5;
    },
    message: (metrics) => {
      const errorRate = (metrics.failedValidations / metrics.totalValidations) * 100;
      return `Validation error rate is ${errorRate.toFixed(1)}% (threshold: 5%)`;
    },
    enabled: true
  },
  {
    id: 'low-success-rate',
    name: 'Low Success Rate',
    description: 'Validation success rate below 95% in the last hour',
    severity: 'warning',
    condition: (metrics) => {
      return metrics.successRate < 95;
    },
    message: (metrics) => {
      return `Validation success rate is ${metrics.successRate.toFixed(1)}% (threshold: 95%)`;
    },
    enabled: true
  },
  {
    id: 'high-fatal-alert-rate',
    name: 'High Fatal Alert Rate',
    description: 'Fatal alerts exceed 1% of validations in the last hour',
    severity: 'critical',
    condition: (metrics) => {
      const fatalAlertRate = (metrics.totalFatalAlerts / metrics.totalValidations) * 100;
      return fatalAlertRate > 1;
    },
    message: (metrics) => {
      const fatalAlertRate = (metrics.totalFatalAlerts / metrics.totalValidations) * 100;
      return `Fatal alert rate is ${fatalAlertRate.toFixed(1)}% (threshold: 1%)`;
    },
    enabled: true
  },
  {
    id: 'slow-validation',
    name: 'Slow Validation Performance',
    description: 'Average validation duration exceeds 15 seconds',
    severity: 'warning',
    condition: (metrics) => {
      return metrics.averageDuration > 15000;
    },
    message: (metrics) => {
      return `Average validation duration is ${(metrics.averageDuration / 1000).toFixed(1)}s (threshold: 15s)`;
    },
    enabled: true
  },
  {
    id: 'low-confidence-score',
    name: 'Low Confidence Scores',
    description: 'Average confidence score below 70% in the last hour',
    severity: 'warning',
    condition: (metrics) => {
      return metrics.averageConfidenceScore < 70;
    },
    message: (metrics) => {
      return `Average confidence score is ${metrics.averageConfidenceScore.toFixed(1)}% (threshold: 70%)`;
    },
    enabled: true
  },
  {
    id: 'no-validations',
    name: 'No Validations',
    description: 'No validations performed in the last hour',
    severity: 'info',
    condition: (metrics) => {
      return metrics.totalValidations === 0;
    },
    message: () => {
      return 'No validations performed in the last hour';
    },
    enabled: true
  },
  {
    id: 'specific-error-spike',
    name: 'Specific Error Type Spike',
    description: 'A specific error type accounts for >50% of errors',
    severity: 'error',
    condition: (metrics) => {
      if (metrics.failedValidations === 0) return false;
      
      const maxErrorCount = Math.max(...Object.values(metrics.errorBreakdown));
      const errorRate = (maxErrorCount / metrics.failedValidations) * 100;
      return errorRate > 50;
    },
    message: (metrics) => {
      const maxErrorType = Object.entries(metrics.errorBreakdown)
        .reduce((max, [type, count]) => 
          count > max.count ? { type, count } : max,
          { type: '', count: 0 }
        );
      const errorRate = (maxErrorType.count / metrics.failedValidations) * 100;
      return `Error type "${maxErrorType.type}" accounts for ${errorRate.toFixed(1)}% of failures`;
    },
    enabled: true
  }
];

/**
 * Default alert configuration
 */
export const defaultAlertConfig: AlertConfig = {
  rules: defaultAlertRules,
  notificationChannels: {
    email: {
      enabled: process.env.VERITAS_EMAIL_ALERTS === 'true',
      recipients: [process.env.VERITAS_ALERT_EMAIL || 'no-reply@arcane.group']
    },
    slack: {
      enabled: process.env.VERITAS_SLACK_ALERTS === 'true',
      webhookUrl: process.env.VERITAS_SLACK_WEBHOOK_URL || ''
    },
    console: {
      enabled: true // Always log to console
    }
  }
};

/**
 * Evaluate alert rules against metrics
 */
export function evaluateAlertRules(
  metrics: any,
  config: AlertConfig = defaultAlertConfig
): Array<{ rule: AlertRule; triggered: boolean; message: string }> {
  return config.rules
    .filter(rule => rule.enabled)
    .map(rule => ({
      rule,
      triggered: rule.condition(metrics),
      message: rule.condition(metrics) ? rule.message(metrics) : ''
    }));
}

/**
 * Send alert notifications
 */
export async function sendAlertNotifications(
  alerts: Array<{ rule: AlertRule; triggered: boolean; message: string }>,
  config: AlertConfig = defaultAlertConfig
): Promise<void> {
  const triggeredAlerts = alerts.filter(a => a.triggered);
  
  if (triggeredAlerts.length === 0) {
    return;
  }
  
  // Console logging
  if (config.notificationChannels.console?.enabled) {
    console.warn('🚨 Veritas Protocol Alerts:');
    triggeredAlerts.forEach(alert => {
      const emoji = {
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌',
        critical: '🚨'
      }[alert.rule.severity];
      
      console.warn(`${emoji} [${alert.rule.severity.toUpperCase()}] ${alert.rule.name}: ${alert.message}`);
    });
  }
  
  // Email notifications (if configured)
  if (config.notificationChannels.email?.enabled) {
    // TODO: Implement email sending using existing Office 365 integration
    // This would use the same email system as the alert system in alertSystem.ts
  }
  
  // Slack notifications (if configured)
  if (config.notificationChannels.slack?.enabled && config.notificationChannels.slack.webhookUrl) {
    // TODO: Implement Slack webhook notifications
  }
}
