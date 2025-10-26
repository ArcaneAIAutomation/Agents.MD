# Session Cleanup System

## Overview

The session cleanup system automatically deletes expired sessions from the database to maintain optimal performance and security. This system runs daily via Vercel Cron Jobs.

## Components

### 1. Cleanup Script (`scripts/cleanup-sessions.ts`)

The core cleanup logic that:
- Queries for expired sessions (where `expires_at < NOW()`)
- Deletes expired sessions from the database
- Logs cleanup statistics to `auth_logs` table
- Provides detailed console output for monitoring

**Usage:**
```bash
# Run manually (for testing)
npx tsx scripts/cleanup-sessions.ts

# Or with npm script
npm run cleanup-sessions
```

### 2. API Endpoint (`pages/api/cron/cleanup-sessions.ts`)

A secure API endpoint that:
- Accepts requests from Vercel Cron Jobs
- Verifies authorization using `CRON_SECRET`
- Executes the cleanup script
- Returns detailed statistics

**Endpoint:** `POST /api/cron/cleanup-sessions`

**Authorization:**
- Header: `Authorization: Bearer <CRON_SECRET>`
- Or Vercel Cron user agent detection

### 3. Vercel Cron Configuration (`vercel.json`)

Automated scheduling configuration:
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-sessions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule:** Daily at 2:00 AM UTC

## Setup Instructions

### 1. Environment Variables

Add to Vercel environment variables:

```bash
# Generate a secure random secret
CRON_SECRET=$(openssl rand -base64 32)

# Add to Vercel Dashboard:
# Settings > Environment Variables > Add New
# Name: CRON_SECRET
# Value: <generated secret>
# Environment: Production, Preview, Development
```

### 2. Deploy Configuration

The cron job is automatically configured when you deploy to Vercel. No additional setup required.

### 3. Verify Deployment

After deployment:

1. Check Vercel Dashboard > Cron Jobs
2. Verify the job appears with schedule "0 2 * * *"
3. Wait for first execution or trigger manually

### 4. Manual Testing

Test the cleanup locally:

```bash
# Set environment variables
export DATABASE_URL="your_postgres_connection_string"

# Run cleanup script
npx tsx scripts/cleanup-sessions.ts
```

Test the API endpoint:

```bash
# Set CRON_SECRET in .env.local
CRON_SECRET=your_secret_here

# Start dev server
npm run dev

# Call endpoint
curl -X POST http://localhost:3000/api/cron/cleanup-sessions \
  -H "Authorization: Bearer your_secret_here"
```

## Monitoring

### View Cleanup Logs

Query the `auth_logs` table:

```sql
SELECT 
  timestamp,
  error_message
FROM auth_logs
WHERE event_type = 'security_alert'
  AND user_agent = 'session-cleanup-cron'
ORDER BY timestamp DESC
LIMIT 10;
```

### Parse Cleanup Statistics

The `error_message` field contains JSON with cleanup stats:

```json
{
  "action": "session_cleanup",
  "deleted_count": 42,
  "oldest_expired": "2025-01-15T10:30:00.000Z",
  "newest_expired": "2025-01-26T08:45:00.000Z",
  "duration_ms": 156
}
```

### Vercel Logs

View execution logs in Vercel Dashboard:
1. Go to your project
2. Click "Logs" tab
3. Filter by "/api/cron/cleanup-sessions"

## Cleanup Statistics

The cleanup job provides detailed statistics:

### Before Cleanup
- Total sessions in database
- Active sessions (not expired)
- Expired sessions (ready for deletion)

### Cleanup Results
- Number of sessions deleted
- Oldest expired session timestamp
- Newest expired session timestamp
- Execution duration (milliseconds)

### After Cleanup
- Updated total sessions
- Updated active sessions
- Updated expired sessions (should be 0)

## Security

### Authorization Methods

1. **CRON_SECRET (Recommended)**
   - Set `CRON_SECRET` environment variable
   - Endpoint verifies `Authorization: Bearer <secret>` header
   - Most secure method

2. **Vercel Cron User Agent**
   - Endpoint checks for `vercel-cron` user agent
   - Automatic in production
   - Fallback method

3. **Development Mode**
   - No authorization required in development
   - Only for local testing

### Best Practices

- Use a strong random secret (256-bit minimum)
- Rotate `CRON_SECRET` periodically
- Monitor logs for unauthorized access attempts
- Keep secrets in Vercel environment variables only

## Troubleshooting

### Cron Job Not Running

**Check:**
1. Vercel Dashboard > Cron Jobs - Is it listed?
2. Vercel Dashboard > Logs - Any error messages?
3. Environment variables - Is `CRON_SECRET` set?
4. Database connection - Is `DATABASE_URL` valid?

**Solutions:**
- Redeploy to refresh cron configuration
- Verify `vercel.json` cron configuration
- Check Vercel plan supports cron jobs

### Cleanup Failing

**Check:**
1. Database connectivity
2. `sessions` table exists
3. Sufficient database permissions
4. No database locks or conflicts

**Solutions:**
- Test database connection: `npm run test-db`
- Run cleanup manually: `npx tsx scripts/cleanup-sessions.ts`
- Check database logs for errors

### No Sessions Being Deleted

**Possible Causes:**
1. No expired sessions exist (good!)
2. Session expiration times are in the future
3. Clock skew between server and database

**Verify:**
```sql
-- Check for expired sessions
SELECT COUNT(*) 
FROM sessions 
WHERE expires_at < NOW();

-- Check session expiration times
SELECT 
  id,
  expires_at,
  NOW() as current_time,
  expires_at < NOW() as is_expired
FROM sessions
ORDER BY expires_at DESC
LIMIT 10;
```

## Performance

### Expected Performance

- **Small databases (<1000 sessions):** <100ms
- **Medium databases (1000-10000 sessions):** 100-500ms
- **Large databases (>10000 sessions):** 500-2000ms

### Optimization

The cleanup query is optimized with:
- Index on `expires_at` column
- Efficient `DELETE` with `WHERE` clause
- No full table scans

### Scaling

For very large databases:
- Consider batch deletion (delete in chunks)
- Add pagination to cleanup script
- Increase function timeout if needed

## Maintenance

### Regular Tasks

1. **Weekly:** Review cleanup logs
2. **Monthly:** Verify cron job execution
3. **Quarterly:** Analyze session patterns
4. **Annually:** Review and rotate `CRON_SECRET`

### Database Maintenance

```sql
-- Analyze sessions table for query optimization
ANALYZE sessions;

-- Rebuild indexes if needed
REINDEX TABLE sessions;

-- Check table size
SELECT 
  pg_size_pretty(pg_total_relation_size('sessions')) as total_size,
  pg_size_pretty(pg_relation_size('sessions')) as table_size,
  pg_size_pretty(pg_indexes_size('sessions')) as indexes_size;
```

## FAQ

### Q: How often does the cleanup run?

**A:** Daily at 2:00 AM UTC. You can modify the schedule in `vercel.json`.

### Q: Can I run cleanup more frequently?

**A:** Yes, modify the cron schedule:
- Every 6 hours: `0 */6 * * *`
- Every hour: `0 * * * *`
- Every 30 minutes: `*/30 * * * *`

### Q: What happens if cleanup fails?

**A:** The failure is logged to `auth_logs` and Vercel logs. Expired sessions remain in the database until the next successful cleanup.

### Q: Can I disable the cleanup?

**A:** Yes, remove the `crons` section from `vercel.json` and redeploy.

### Q: Does cleanup affect active sessions?

**A:** No, only sessions where `expires_at < NOW()` are deleted. Active sessions are never touched.

### Q: How do I test cleanup locally?

**A:** Run `npx tsx scripts/cleanup-sessions.ts` with `DATABASE_URL` set in your environment.

## Related Documentation

- [Database Setup Guide](./DATABASE-SETUP-GUIDE.md)
- [Authentication System](./AUTHENTICATION-SYSTEM.md)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Session Management](./SESSION-MANAGEMENT.md)

---

**Last Updated:** January 26, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
