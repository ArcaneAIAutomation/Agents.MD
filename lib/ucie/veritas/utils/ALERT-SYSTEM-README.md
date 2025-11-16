# Veritas Protocol - Alert System

## Overview

The Veritas Alert System provides human-in-the-loop monitoring for critical data validation issues. It sends email notifications for fatal errors and maintains a database of alerts for admin review.

## Features

- **Email Notifications**: Automatic email alerts for fatal errors and critical issues
- **Alert Queue Management**: In-memory queue for alert processing
- **Database Persistence**: All alerts stored in Supabase for review
- **Admin Dashboard Support**: API for retrieving and managing alerts
- **Severity Levels**: Info, Warning, Error, Fatal
- **Human Review Workflow**: Mark alerts as reviewed with notes

## Configuration

### Environment Variables

```bash
# Enable/disable email alerts
ENABLE_VERITAS_EMAIL_ALERTS=true

# Email recipients (comma-separated)
VERITAS_ALERT_EMAIL=no-reply@arcane.group,admin@arcane.group

# Office 365 credentials (required for email)
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
SENDER_EMAIL=no-reply@arcane.group
```

### Database Setup

Run the migration to create the `veritas_alerts` table:

```bash
psql $DATABASE_URL < migrations/005_veritas_alerts.sql
```

## Usage

### Basic Alert

```typescript
import { veritasAlertSystem } from './lib/ucie/veritas/utils/alertSystem';

await veritasAlertSystem.queueAlert({
  severity: 'warning',
  symbol: 'BTC',
  alertType: 'market_discrepancy',
  message: 'Price discrepancy detected across sources',
  details: {
    affectedSources: ['CoinGecko', 'CoinMarketCap'],
    discrepancyValue: 2.5,
    threshold: 1.5,
    recommendation: 'Using Kraken as tie-breaker'
  },
  timestamp: new Date().toISOString(),
  requiresHumanReview: false
});
```

### Fatal Error Alert

```typescript
import { notifyFatalError } from './lib/ucie/veritas/utils/alertSystem';

await notifyFatalError(
  'BTC',
  'social_impossibility',
  'Fatal Social Data Error: Contradictory mention count and distribution',
  {
    affectedSources: ['LunarCrush'],
    recommendation: 'Discarding social data - cannot have sentiment without mentions'
  }
);
```

### Helper Functions

```typescript
import {
  notifyFatalError,
  notifyCriticalWarning,
  notifyWarning,
  notifyInfo
} from './lib/ucie/veritas/utils/alertSystem';

// Fatal error (sends email, requires review)
await notifyFatalError('BTC', 'fatal_error', 'Critical issue', details);

// Critical warning (sends email, requires review)
await notifyCriticalWarning('BTC', 'market_discrepancy', 'High discrepancy', details);

// Warning (no email, no review required)
await notifyWarning('BTC', 'api_failure', 'API timeout', details);

// Info (no email, no review required)
await notifyInfo('BTC', 'validation_timeout', 'Validation took longer than expected', details);
```

## Admin Dashboard

### Get Pending Alerts

```typescript
import { veritasAlertSystem } from './lib/ucie/veritas/utils/alertSystem';

const pendingAlerts = await veritasAlertSystem.getPendingAlerts(50);
```

### Mark Alert as Reviewed

```typescript
await veritasAlertSystem.markAsReviewed(
  alertId,
  'admin@arcane.group',
  'Reviewed and acknowledged. Issue resolved.'
);
```

### Get Alert Statistics

```typescript
const stats = await veritasAlertSystem.getAlertStatistics();

console.log(`Total alerts: ${stats.total}`);
console.log(`Pending: ${stats.pending}`);
console.log(`Reviewed: ${stats.reviewed}`);
console.log(`By severity:`, stats.bySeverity);
console.log(`By type:`, stats.byType);
```

## Alert Types

- `market_discrepancy`: Price or volume discrepancies between sources
- `social_impossibility`: Logical impossibilities in social data
- `onchain_inconsistency`: Market-to-chain consistency issues
- `fatal_error`: Critical validation failures
- `validation_timeout`: Validation took too long
- `api_failure`: External API failures

## Severity Levels

- **Info**: Informational alerts, no action required
- **Warning**: Potential issues, monitor but no immediate action
- **Error**: Issues requiring attention, may need review
- **Fatal**: Critical issues requiring immediate human review

## Email Template

The alert system uses a professional HTML email template with:
- Color-coded severity indicators
- Detailed alert information
- Affected sources list
- Recommendations
- Human review badge (when required)
- Responsive design for mobile devices

## Database Schema

```sql
CREATE TABLE veritas_alerts (
  id UUID PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  details JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  requires_human_review BOOLEAN NOT NULL,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Best Practices

1. **Use Appropriate Severity**: Only use `fatal` for critical issues
2. **Provide Context**: Include detailed information in `details` object
3. **Clear Recommendations**: Always provide actionable recommendations
4. **Don't Spam**: Avoid sending too many alerts for the same issue
5. **Review Regularly**: Check pending alerts in admin dashboard
6. **Document Resolutions**: Add notes when marking alerts as reviewed

## Testing

### Test Email Delivery

```typescript
import { veritasAlertSystem } from './lib/ucie/veritas/utils/alertSystem';

await veritasAlertSystem.queueAlert({
  severity: 'info',
  symbol: 'TEST',
  alertType: 'api_failure',
  message: 'Test alert - please ignore',
  details: {
    affectedSources: ['Test Source'],
    recommendation: 'This is a test alert'
  },
  timestamp: new Date().toISOString(),
  requiresHumanReview: false
});
```

### Test Database Persistence

```bash
# Check if alert was stored
psql $DATABASE_URL -c "SELECT * FROM veritas_alerts ORDER BY timestamp DESC LIMIT 1;"
```

## Troubleshooting

### Emails Not Sending

1. Check `ENABLE_VERITAS_EMAIL_ALERTS=true`
2. Verify Office 365 credentials are set
3. Check email logs in console
4. Verify sender email is configured

### Alerts Not Persisting

1. Check database connection
2. Verify `veritas_alerts` table exists
3. Check database logs for errors
4. Verify database permissions

### High Alert Volume

1. Review alert thresholds
2. Check for repeated issues
3. Consider adjusting severity levels
4. Implement alert deduplication

## Integration with Validators

The alert system is designed to integrate seamlessly with Veritas validators:

```typescript
// In validator
if (fatalErrorDetected) {
  await notifyFatalError(
    symbol,
    'social_impossibility',
    'Fatal Social Data Error',
    {
      affectedSources: ['LunarCrush'],
      recommendation: 'Discarding social data'
    }
  );
  
  return {
    isValid: false,
    confidence: 0,
    alerts: [...],
    // ...
  };
}
```

## Future Enhancements

- [ ] Alert deduplication
- [ ] Alert aggregation (daily/weekly summaries)
- [ ] Slack/Discord integration
- [ ] SMS notifications for critical alerts
- [ ] Alert escalation rules
- [ ] Auto-resolution for transient issues
- [ ] Alert analytics dashboard
- [ ] Machine learning for alert prioritization

## Support

For issues or questions about the alert system:
- Email: no-reply@arcane.group
- Documentation: See this README
- Admin Dashboard: `/admin/veritas-alerts` (coming soon)
