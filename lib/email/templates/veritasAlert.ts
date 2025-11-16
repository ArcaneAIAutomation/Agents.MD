/**
 * Veritas Alert Email Template
 * 
 * Professional HTML email template for Veritas Protocol validation alerts
 */

import { AlertNotification } from '../../ucie/veritas/utils/alertSystem';

/**
 * Generate HTML email for Veritas alert
 * 
 * @param alert Alert notification
 * @returns HTML email content
 */
export function generateVeritasAlertEmail(alert: AlertNotification): string {
  const severityColor = {
    info: '#3b82f6',
    warning: '#f59e0b',
    error: '#ef4444',
    fatal: '#dc2626'
  };
  
  const severityEmoji = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    fatal: '🚨'
  };
  
  const color = severityColor[alert.severity];
  const emoji = severityEmoji[alert.severity];
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Veritas Protocol Alert</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #111827;
          background-color: #f9fafb;
          padding: 20px;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .header {
          background: ${color};
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        
        .header p {
          font-size: 16px;
          opacity: 0.95;
        }
        
        .content {
          padding: 30px 20px;
        }
        
        .alert-box {
          background: #f9fafb;
          border-left: 4px solid ${color};
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        
        .detail-grid {
          display: grid;
          gap: 15px;
          margin: 20px 0;
        }
        
        .detail-item {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .detail-label {
          font-weight: 600;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        
        .detail-value {
          color: #111827;
          font-size: 15px;
          word-wrap: break-word;
        }
        
        .detail-value.large {
          font-size: 20px;
          font-weight: 700;
        }
        
        .detail-value.severity {
          color: ${color};
          font-weight: 700;
          text-transform: uppercase;
        }
        
        .recommendation {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        
        .recommendation-title {
          font-weight: 700;
          color: #92400e;
          margin-bottom: 10px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .recommendation-text {
          color: #78350f;
          font-size: 15px;
        }
        
        .review-badge {
          background: #dc2626;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 700;
          text-align: center;
          margin: 20px 0;
          font-size: 15px;
        }
        
        .sources-list {
          list-style: none;
          padding: 0;
        }
        
        .sources-list li {
          background: white;
          padding: 10px 15px;
          margin: 5px 0;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          font-size: 14px;
        }
        
        .sources-list li:before {
          content: "•";
          color: ${color};
          font-weight: bold;
          display: inline-block;
          width: 1em;
          margin-right: 8px;
        }
        
        .footer {
          background: #f9fafb;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }
        
        .footer p {
          font-size: 13px;
          color: #6b7280;
          margin: 8px 0;
        }
        
        .footer-logo {
          font-weight: 700;
          color: #111827;
          margin-bottom: 5px;
        }
        
        @media only screen and (max-width: 600px) {
          body {
            padding: 10px;
          }
          
          .header {
            padding: 20px 15px;
          }
          
          .header h1 {
            font-size: 22px;
          }
          
          .content {
            padding: 20px 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${emoji} Veritas Protocol Alert</h1>
          <p>Data Validation Issue Detected</p>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Symbol</div>
                <div class="detail-value large">${alert.symbol}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Severity</div>
                <div class="detail-value severity">${alert.severity}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Alert Type</div>
                <div class="detail-value">${alert.alertType.replace(/_/g, ' ').toUpperCase()}</div>
              </div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Message</div>
              <div class="detail-value">${alert.message}</div>
            </div>
          </div>
          
          <h3 style="margin: 25px 0 15px 0; color: #111827; font-size: 18px;">Details</h3>
          
          <div class="detail-item">
            <div class="detail-label">Affected Sources</div>
            <ul class="sources-list">
              ${alert.details.affectedSources.map(source => `<li>${source}</li>`).join('')}
            </ul>
          </div>
          
          ${alert.details.discrepancyValue ? `
          <div class="detail-item">
            <div class="detail-label">Discrepancy Value</div>
            <div class="detail-value">${alert.details.discrepancyValue}%</div>
          </div>
          ` : ''}
          
          ${alert.details.threshold ? `
          <div class="detail-item">
            <div class="detail-label">Threshold</div>
            <div class="detail-value">${alert.details.threshold}%</div>
          </div>
          ` : ''}
          
          <div class="recommendation">
            <div class="recommendation-title">💡 Recommendation</div>
            <div class="recommendation-text">${alert.details.recommendation}</div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">Timestamp</div>
            <div class="detail-value">${new Date(alert.timestamp).toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              timeZoneName: 'short'
            })}</div>
          </div>
          
          ${alert.requiresHumanReview ? `
          <div class="review-badge">
            ⚠️ This alert requires human review
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p class="footer-logo">Bitcoin Sovereign Technology</p>
          <p>Universal Crypto Intelligence Engine</p>
          <p style="margin-top: 15px;">This is an automated alert from the Veritas Protocol data validation system.</p>
          <p style="font-size: 11px; margin-top: 10px;">
            To manage alert settings, visit the admin dashboard or contact support at no-reply@arcane.group
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text version of alert email
 * 
 * @param alert Alert notification
 * @returns Plain text email content
 */
export function generateVeritasAlertPlainText(alert: AlertNotification): string {
  const severityEmoji = {
    info: '[INFO]',
    warning: '[WARNING]',
    error: '[ERROR]',
    fatal: '[FATAL]'
  };
  
  const emoji = severityEmoji[alert.severity];
  
  return `
${emoji} VERITAS PROTOCOL ALERT
Data Validation Issue Detected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SYMBOL: ${alert.symbol}
SEVERITY: ${alert.severity.toUpperCase()}
ALERT TYPE: ${alert.alertType.replace(/_/g, ' ').toUpperCase()}

MESSAGE:
${alert.message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETAILS:

Affected Sources:
${alert.details.affectedSources.map(source => `  • ${source}`).join('\n')}

${alert.details.discrepancyValue ? `Discrepancy Value: ${alert.details.discrepancyValue}%\n` : ''}
${alert.details.threshold ? `Threshold: ${alert.details.threshold}%\n` : ''}

RECOMMENDATION:
${alert.details.recommendation}

TIMESTAMP:
${new Date(alert.timestamp).toLocaleString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short'
})}

${alert.requiresHumanReview ? '\n⚠️ THIS ALERT REQUIRES HUMAN REVIEW\n' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bitcoin Sovereign Technology
Universal Crypto Intelligence Engine

This is an automated alert from the Veritas Protocol data validation system.
To manage alert settings, visit the admin dashboard or contact support.
  `.trim();
}
