# Veritas Protocol - Alert System

## Overview

The Veritas Alert System provides human-in-the-loop functionality for critical data validation issues. It automatically queues alerts, sends email notifications, and provides an admin dashboard for review.

## Features

- ✅ **Alert Queueing**: Automatically queue validation alerts
- ✅ **Email Notifications**: Send emails for fatal errors and critical alerts
- ✅ **Database Persistence**: Store alerts for review and audit trail
- ✅ **Admin Dashboard**: Review and manage pending alerts
- ✅ **Statistics Tracking**: Monitor alert trends and patterns
- ✅ **Review Workflow**: Mark alerts as reviewed with notes

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Validation Detects Issue                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Alert System (alertSystem.ts)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Queue Alert                                       │  │
│  │  2. Send Email (if fatal or requires review)         │  │
│  │  3. Persist to Database                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Email Notification                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  To: no-reply@arcane.group                           │  │
│  │  Subject: [Veritas Alert - FATAL] BTC - ...          │  │
│  │  Body: HTML template with alert details              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Storage                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Table: veritas_alerts                               │  │
│  │  - Alert details                                      │  │
│  │  - Review status                                      │  │
│  │  - Audit trail                                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Admin Dashboard                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - View pending alerts                               │  │
│  │  - Review and acknowledge                            │  │
│  │  - Add review notes                                  │  │
│  │  - View statistics                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Usage

```typescript
import { veritasAlertSystem, notifyFatalError, notifyWarning, notifyError } from './lib/ucie/veritas/utils/alertSystem';

// Queue a fatal error (sends email immediately)
await notifyFatalError(
  'BTC',
  'social_impossibility',
  'Fatal Social Data Error: Contradictory mention count and distribution',
  {
    affectedSources: ['LunarCrush'],
    recommendation: 'Discarding social data - cannot have sentiment without mentions'
  }
);

// Queue a warning (no email unless requiresReview is true)
await notifyWarning(
  'ETH',
  'market_discrepancy',
  'Price discrepancy detected: 2.5% variance across sources',
  {
    affectedSources: ['CoinMarketCap', 'CoinGecko', 'Kraken'],
    discrepancyValue: 2.5,
    threshold: 1.5,
    recommendation: 'Using Kraken as tie-breaker for final price'
  },
  false // Does not require human review
);

// Queue an error (sends email if requiresReview is true)
await notifyError(
  'SOL',
  'onchain_inconsistency',
  'Low market-to-chain consistency: 45%',
  {
    affectedSources: ['Market Data', 'On-Chain Data'],
    discrepancyValue: 45,
    threshold: 50,
    recommendation: 'On-chain data may be incomplete'
  },
  true // Requires human review
);
```

### Advanced Usage

```typescript
// Get pending alerts for admin dashboard
const pendingAlerts = await veritasAlertSystem.getPendingAlerts();
console.log(`Found ${pendingAlerts.length} pending alerts`);

// Get all alerts (including reviewed)
const allAlerts = await veritasAlertSystem.getAllAlerts(50);

// Mark alert as reviewed
await veritasAlertSystem.markAsReviewed(
  alertId,
  'admin-user-id',
  'Reviewed and acknowledged - data source issue resolved'
);

// Get alert statistics
const stats = await veritasAlertSystem.getAlertStatistics();
console.log(`Total: ${stats.total}, Pending: ${stats.pending}, Reviewed: ${stats.reviewed}`);
```

### Integration with Validators

```typescript
// In a validator (e.g., socialSentimentValidator.ts)
import { notifyFatalError } from '../utils/alertSystem';

async function validateSocialSentiment(symbol: string, data: any) {
  // Check for impossibility
  if (data.mention_count === 0 && data.sentiment_distribution.positive > 0) {
    // Notify via alert system
    await notifyFatalError(
      symbol,
      'social_impossibility',
      'Fatal Social Data Error: Contradictory mention count and distribution',
      {
        affectedSources: ['LunarCrush'],
        recommendation: 'Discarding social data - cannot have sentiment without mentions'
      }
    );
    
    // Return validation failure
    return {
      isValid: false,
      confidence: 0,
      alerts: [/* ... */],
      // ...
    };
  }
}
```

## Alert Types

### Severity Levels

- **info**: Informational alerts (no action required)
- **warning**: Potential issues (monitor)
- **error**: Issues requiring attention
- **fatal**: Critical issues requiring immediate action

### Alert Types

- **market_discrepancy**: Price/volume discrepancies between sources
- **social_impossibility**: Logical impossibilities in social data
- **onchain_inconsistency**: Market-to-chain consistency issues
- **fatal_error**: Critical system errors

## Email Configuration

### Environment Variables

```bash
# Office 365 Email Configuration
OFFICE365_CLIENT_ID=your_client_id
OFFICE365_CLIENT_SECRET=your_client_secret
OFFICE365_TENANT_ID=your_tenant_id
OFFICE365_FROM_EMAIL=no-reply@arcane.group
```

### Email Recipients

By default, alerts are sent to:
- `no-reply@arcane.group`

To add more recipients, modify the `emailRecipients` array in `alertSystem.ts`:

```typescript
private emailRecipients = [
  'no-reply@arcane.group',
  'admin@arcane.group',
  'alerts@arcane.group'
];
```

## Database Schema

### Table: veritas_alerts

```sql
CREATE TABLE veritas_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  details JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requires_human_review BOOLEAN NOT NULL DEFAULT false,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes

- `idx_veritas_alerts_symbol` - Query by symbol
- `idx_veritas_alerts_severity` - Query by severity
- `idx_veritas_alerts_reviewed` - Query by review status
- `idx_veritas_alerts_timestamp` - Query by time
- `idx_veritas_alerts_requires_review` - Query alerts requiring review
- `idx_veritas_alerts_pending` - Optimized for pending alerts query

## Testing

### Run Migration

```bash
npx tsx scripts/run-veritas-migration.ts
```

### Test Alert System

```bash
npx tsx scripts/test-alert-system.ts
```

### Expected Output

```
🧪 Testing Veritas Alert System...

✅ Database connection successful
✅ Fatal error alert queued successfully
✅ Warning alert queued successfully
✅ Error alert queued successfully
✅ Found 3 pending alerts
✅ Alert statistics: Total: 3, Pending: 3, Reviewed: 0
✅ Alert marked as reviewed
✅ Found 3 total alerts

🎉 Alert system testing complete!
```

## Admin Dashboard (Optional)

Create an admin dashboard at `pages/admin/veritas-alerts.tsx`:

```typescript
import { veritasAlertSystem } from '../../lib/ucie/veritas/utils/alertSystem';

export default function VeritasAlertsDashboard() {
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    loadPendingAlerts();
  }, []);
  
  async function loadPendingAlerts() {
    const pending = await veritasAlertSystem.getPendingAlerts();
    setAlerts(pending);
  }
  
  async function handleReview(alertId: string, notes: string) {
    await veritasAlertSystem.markAsReviewed(alertId, 'admin', notes);
    await loadPendingAlerts();
  }
  
  return (
    <div>
      <h1>Veritas Protocol Alerts</h1>
      {/* Display alerts and review interface */}
    </div>
  );
}
```

## Monitoring

### Alert Statistics

```typescript
const stats = await veritasAlertSystem.getAlertStatistics();

console.log('Alert Statistics:');
console.log(`  Total: ${stats.total}`);
console.log(`  Pending: ${stats.pending}`);
console.log(`  Reviewed: ${stats.reviewed}`);
console.log(`  By Severity:`, stats.bySeverity);
console.log(`  By Type:`, stats.byType);
```

### Database Queries

```sql
-- Get pending alerts
SELECT * FROM veritas_alerts WHERE reviewed = false ORDER BY timestamp DESC;

-- Get fatal alerts
SELECT * FROM veritas_alerts WHERE severity = 'fatal' ORDER BY timestamp DESC;

-- Get alerts requiring review
SELECT * FROM veritas_alerts WHERE requires_human_review = true AND reviewed = false;

-- Get alert statistics
SELECT 
  severity,
  COUNT(*) as count
FROM veritas_alerts
GROUP BY severity;
```

## Best Practices

### When to Send Alerts

- **Fatal Errors**: Always send email immediately
- **Errors**: Send email if requires human review
- **Warnings**: Only send email if explicitly marked for review
- **Info**: Never send email (log only)

### Alert Message Guidelines

- Be specific about the issue
- Include affected data sources
- Provide clear recommendations
- Include relevant metrics (thresholds, values)

### Review Workflow

1. Admin receives email notification
2. Admin reviews alert in dashboard
3. Admin investigates the issue
4. Admin marks alert as reviewed with notes
5. Admin takes corrective action if needed

## Troubleshooting

### Emails Not Sending

1. Check Office 365 configuration:
   ```bash
   echo $OFFICE365_CLIENT_ID
   echo $OFFICE365_CLIENT_SECRET
   echo $OFFICE365_TENANT_ID
   ```

2. Test email sending:
   ```typescript
   import { sendEmail } from '../../../email/office365';
   
   const result = await sendEmail({
     to: 'test@example.com',
     subject: 'Test Email',
     body: 'This is a test'
   });
   
   console.log(result);
   ```

### Database Connection Issues

1. Test database connection:
   ```bash
   npx tsx scripts/test-database-access.ts
   ```

2. Verify table exists:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'veritas_alerts';
   ```

### Alert Not Persisting

1. Check database logs
2. Verify table schema matches code
3. Check for constraint violations
4. Review error logs in console

## API Reference

### veritasAlertSystem

#### Methods

- `queueAlert(alert: AlertNotification): Promise<void>`
- `getPendingAlerts(): Promise<StoredAlert[]>`
- `getAllAlerts(limit?: number): Promise<StoredAlert[]>`
- `markAsReviewed(alertId: string, reviewedBy: string, notes?: string): Promise<void>`
- `getAlertStatistics(): Promise<AlertStatistics>`

### Helper Functions

- `notifyFatalError(symbol, alertType, message, details): Promise<void>`
- `notifyWarning(symbol, alertType, message, details, requiresReview): Promise<void>`
- `notifyError(symbol, alertType, message, details, requiresReview): Promise<void>`

## Requirements Satisfied

This implementation satisfies the following requirements from the Veritas Protocol specification:

- **Requirement 10.1**: Alert logging with timestamp, data sources, and specific values
- **Requirement 10.2**: Discrepancy display in dedicated report section
- **Requirement 10.4**: Recommendations for each discrepancy
- **Requirement 14.1**: Source reliability tracking (via alert history)

## Next Steps

1. ✅ Alert system implemented
2. ✅ Database table created
3. ✅ Email integration configured
4. ✅ Testing complete
5. ⏳ Create admin dashboard UI (optional)
6. ⏳ Integrate with validators
7. ⏳ Deploy to production

## Support

For issues or questions:
- Check the test script: `scripts/test-alert-system.ts`
- Review the migration: `migrations/005_veritas_alerts.sql`
- See the main spec: `.kiro/specs/ucie-veritas-protocol/`

---

**Status**: ✅ Complete and Tested  
**Version**: 1.0.0  
**Last Updated**: November 16, 2025
