/**
 * Veritas Protocol - Human-in-the-Loop Alert System
 * 
 * This module provides alert management and email notification functionality
 * for critical data validation issues that require human review.
 */

import { sendEmail } from '../../../email/office365';
import { query, queryOne, queryMany } from '../../../db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AlertNotification {
  severity: 'info' | 'warning' | 'error' | 'fatal';
  symbol: string;
  alertType: 'market_discrepancy' | 'social_impossibility' | 'onchain_inconsistency' | 'fatal_error';
  message: string;
  details: {
    affectedSources: string[];
    discrepancyValue?: number;
    threshold?: number;
    recommendation: string;
  };
  timestamp: string;
  requiresHumanReview: boolean;
}

export interface StoredAlert extends AlertNotification {
  id: string;
  reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
}

// ============================================================================
// VERITAS ALERT SYSTEM CLASS
// ============================================================================

/**
 * Manages alert notifications and human review workflow
 */
class VeritasAlertSystem {
  private alertQueue: AlertNotification[] = [];
  private emailRecipients = ['no-reply@arcane.group']; // Admin email
  
  /**
   * Queue alert for potential human review
   * 
   * @param alert - Alert notification to queue
   */
  async queueAlert(alert: AlertNotification): Promise<void> {
    // Add to in-memory queue
    this.alertQueue.push(alert);
    
    // Send immediate email for fatal errors or alerts requiring review
    if (alert.severity === 'fatal' || alert.requiresHumanReview) {
      await this.sendAlertEmail(alert);
    }
    
    // Store in database for review dashboard
    await this.persistAlert(alert);
    
    console.log(`✅ Alert queued: ${alert.symbol} - ${alert.alertType} (${alert.severity})`);
  }
  
  /**
   * Send email notification for alert
   * 
   * @param alert - Alert to send via email
   */
  async sendAlertEmail(alert: AlertNotification): Promise<void> {
    const subject = `[Veritas Alert - ${alert.severity.toUpperCase()}] ${alert.symbol} - ${alert.alertType}`;
    
    const body = this.generateEmailTemplate(alert);
    
    try {
      const result = await sendEmail({
        to: this.emailRecipients.join(','),
        subject,
        body,
      });
      
      if (result.success) {
        console.log(`📧 Alert email sent for ${alert.symbol} - ${alert.alertType}`);
      } else {
        console.error(`❌ Failed to send alert email: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Failed to send alert email:', error);
      // Don't throw - email failure shouldn't break validation
    }
  }
  
  /**
   * Generate HTML email template for alert
   * 
   * @param alert - Alert notification
   * @returns HTML email body
   */
  private generateEmailTemplate(alert: AlertNotification): string {
    const severityColor = {
      info: '#3B82F6',
      warning: '#F59E0B',
      error: '#EF4444',
      fatal: '#DC2626'
    }[alert.severity];
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #000000;
            color: #FFFFFF;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            border-left: 4px solid ${severityColor};
          }
          .content {
            background: #F9FAFB;
            padding: 20px;
            border-radius: 0 0 8px 8px;
          }
          .severity-badge {
            display: inline-block;
            background: ${severityColor};
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
          }
          .detail-box {
            background: white;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 3px solid #F7931A;
          }
          .detail-label {
            font-weight: 600;
            color: #666;
            font-size: 14px;
          }
          .detail-value {
            color: #000;
            margin-top: 5px;
          }
          .warning-box {
            background: #FEF3C7;
            border: 1px solid #F59E0B;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 0;">🔔 Veritas Protocol Alert</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.8;">Data Validation System</p>
        </div>
        
        <div class="content">
          <div style="margin-bottom: 20px;">
            <span class="severity-badge">${alert.severity}</span>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">Symbol</div>
            <div class="detail-value" style="font-size: 18px; font-weight: bold;">${alert.symbol}</div>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">Alert Type</div>
            <div class="detail-value">${alert.alertType.replace(/_/g, ' ').toUpperCase()}</div>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">Message</div>
            <div class="detail-value">${alert.message}</div>
          </div>
          
          <h3 style="color: #000; margin-top: 25px;">Details</h3>
          
          <div class="detail-box">
            <div class="detail-label">Affected Sources</div>
            <div class="detail-value">${alert.details.affectedSources.join(', ')}</div>
          </div>
          
          ${alert.details.discrepancyValue ? `
          <div class="detail-box">
            <div class="detail-label">Discrepancy Value</div>
            <div class="detail-value">${alert.details.discrepancyValue}%</div>
          </div>
          ` : ''}
          
          ${alert.details.threshold ? `
          <div class="detail-box">
            <div class="detail-label">Threshold</div>
            <div class="detail-value">${alert.details.threshold}%</div>
          </div>
          ` : ''}
          
          <div class="detail-box">
            <div class="detail-label">Recommendation</div>
            <div class="detail-value">${alert.details.recommendation}</div>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">Timestamp</div>
            <div class="detail-value">${new Date(alert.timestamp).toLocaleString()}</div>
          </div>
          
          ${alert.requiresHumanReview ? `
          <div class="warning-box">
            <strong>⚠️ This alert requires human review</strong>
            <p style="margin: 5px 0 0 0;">Please review this alert in the Veritas admin dashboard and take appropriate action.</p>
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>This is an automated alert from the Veritas Protocol data validation system.</p>
          <p>Bitcoin Sovereign Technology - Universal Crypto Intelligence Engine</p>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Persist alert to database for review dashboard
   * 
   * @param alert - Alert to persist
   */
  private async persistAlert(alert: AlertNotification): Promise<void> {
    try {
      await query(
        `INSERT INTO veritas_alerts (
          symbol,
          severity,
          alert_type,
          message,
          details,
          timestamp,
          requires_human_review,
          reviewed,
          reviewed_by,
          reviewed_at,
          review_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          alert.symbol,
          alert.severity,
          alert.alertType,
          alert.message,
          JSON.stringify(alert.details),
          alert.timestamp,
          alert.requiresHumanReview,
          false,
          null,
          null,
          null
        ]
      );
      
      console.log(`✅ Alert persisted to database: ${alert.symbol} - ${alert.alertType}`);
    } catch (error) {
      console.error('❌ Failed to persist alert to database:', error);
      // Don't throw - database failure shouldn't break validation
    }
  }
  
  /**
   * Get pending alerts for review dashboard
   * 
   * @returns Array of pending alerts
   */
  async getPendingAlerts(): Promise<StoredAlert[]> {
    try {
      const alerts = await queryMany<StoredAlert>(
        `SELECT * FROM veritas_alerts
         WHERE reviewed = false
         ORDER BY timestamp DESC`
      );
      
      return alerts.map(alert => ({
        ...alert,
        details: typeof alert.details === 'string' 
          ? JSON.parse(alert.details as string)
          : alert.details
      }));
    } catch (error) {
      console.error('❌ Failed to fetch pending alerts:', error);
      return [];
    }
  }
  
  /**
   * Get all alerts (pending and reviewed)
   * 
   * @param limit - Maximum number of alerts to return
   * @returns Array of alerts
   */
  async getAllAlerts(limit: number = 100): Promise<StoredAlert[]> {
    try {
      const alerts = await queryMany<StoredAlert>(
        `SELECT * FROM veritas_alerts
         ORDER BY timestamp DESC
         LIMIT $1`,
        [limit]
      );
      
      return alerts.map(alert => ({
        ...alert,
        details: typeof alert.details === 'string'
          ? JSON.parse(alert.details as string)
          : alert.details
      }));
    } catch (error) {
      console.error('❌ Failed to fetch alerts:', error);
      return [];
    }
  }
  
  /**
   * Mark alert as reviewed
   * 
   * @param alertId - ID of alert to mark as reviewed
   * @param reviewedBy - User who reviewed the alert
   * @param notes - Optional review notes
   */
  async markAsReviewed(
    alertId: string,
    reviewedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      await query(
        `UPDATE veritas_alerts
         SET reviewed = true,
             reviewed_by = $1,
             reviewed_at = NOW(),
             review_notes = $2
         WHERE id = $3`,
        [reviewedBy, notes || null, alertId]
      );
      
      console.log(`✅ Alert marked as reviewed: ${alertId}`);
    } catch (error) {
      console.error('❌ Failed to mark alert as reviewed:', error);
      throw error;
    }
  }
  
  /**
   * Get alert statistics
   * 
   * @returns Alert statistics
   */
  async getAlertStatistics(): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }> {
    try {
      const [totalResult, pendingResult, reviewedResult, severityResult, typeResult] = await Promise.all([
        queryOne<{ count: string }>('SELECT COUNT(*) as count FROM veritas_alerts'),
        queryOne<{ count: string }>('SELECT COUNT(*) as count FROM veritas_alerts WHERE reviewed = false'),
        queryOne<{ count: string }>('SELECT COUNT(*) as count FROM veritas_alerts WHERE reviewed = true'),
        queryMany<{ severity: string; count: string }>('SELECT severity, COUNT(*) as count FROM veritas_alerts GROUP BY severity'),
        queryMany<{ alert_type: string; count: string }>('SELECT alert_type, COUNT(*) as count FROM veritas_alerts GROUP BY alert_type')
      ]);
      
      const bySeverity: Record<string, number> = {};
      severityResult.forEach(row => {
        bySeverity[row.severity] = parseInt(row.count);
      });
      
      const byType: Record<string, number> = {};
      typeResult.forEach(row => {
        byType[row.alert_type] = parseInt(row.count);
      });
      
      return {
        total: parseInt(totalResult?.count || '0'),
        pending: parseInt(pendingResult?.count || '0'),
        reviewed: parseInt(reviewedResult?.count || '0'),
        bySeverity,
        byType
      };
    } catch (error) {
      console.error('❌ Failed to fetch alert statistics:', error);
      return {
        total: 0,
        pending: 0,
        reviewed: 0,
        bySeverity: {},
        byType: {}
      };
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton instance of the Veritas Alert System
 */
export const veritasAlertSystem = new VeritasAlertSystem();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Notify fatal error via alert system
 * 
 * @param symbol - Cryptocurrency symbol
 * @param alertType - Type of alert
 * @param message - Alert message
 * @param details - Alert details
 */
export async function notifyFatalError(
  symbol: string,
  alertType: AlertNotification['alertType'],
  message: string,
  details: AlertNotification['details']
): Promise<void> {
  await veritasAlertSystem.queueAlert({
    severity: 'fatal',
    symbol,
    alertType,
    message,
    details,
    timestamp: new Date().toISOString(),
    requiresHumanReview: true
  });
}

/**
 * Notify warning via alert system
 * 
 * @param symbol - Cryptocurrency symbol
 * @param alertType - Type of alert
 * @param message - Alert message
 * @param details - Alert details
 * @param requiresReview - Whether alert requires human review
 */
export async function notifyWarning(
  symbol: string,
  alertType: AlertNotification['alertType'],
  message: string,
  details: AlertNotification['details'],
  requiresReview: boolean = false
): Promise<void> {
  await veritasAlertSystem.queueAlert({
    severity: 'warning',
    symbol,
    alertType,
    message,
    details,
    timestamp: new Date().toISOString(),
    requiresHumanReview: requiresReview
  });
}

/**
 * Notify error via alert system
 * 
 * @param symbol - Cryptocurrency symbol
 * @param alertType - Type of alert
 * @param message - Alert message
 * @param details - Alert details
 * @param requiresReview - Whether alert requires human review
 */
export async function notifyError(
  symbol: string,
  alertType: AlertNotification['alertType'],
  message: string,
  details: AlertNotification['details'],
  requiresReview: boolean = true
): Promise<void> {
  await veritasAlertSystem.queueAlert({
    severity: 'error',
    symbol,
    alertType,
    message,
    details,
    timestamp: new Date().toISOString(),
    requiresHumanReview: requiresReview
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default veritasAlertSystem;
