# ATGE Monitoring Tables Migration Guide

**Date**: January 27, 2025  
**Status**: 🔧 **MIGRATION REQUIRED**  
**Priority**: 🚨 **CRITICAL - BLOCKS TRADE GENERATION**

---

## 🚨 Problem

The production database is missing the `atge_performance_metrics` table, causing trade generation to fail with:

```
Database query error: relation "atge_performance_metrics" does not exist
```

---

## ✅ Solution

Run the monitoring tables migration to create the missing tables.

---

## 📋 Tables to be Created

1. **atge_error_logs** - Error tracking and logging
2. **atge_performance_metrics** ⭐ - Performance monitoring (MISSING)
3. **atge_user_feedback** - User feedback collection

Plus 3 views for easier querying:
- `atge_recent_critical_errors`
- `atge_performance_summary_24h`
- `atge_feedback_summary`

---

## 🚀 Migration Methods

### Method 1: Via API Endpoint (Recommended for Vercel)

**Step 1**: Ensure ADMIN_SECRET is set in Vercel environment variables

```bash
# In Vercel Dashboard:
# Settings → Environment Variables → Add New

Name: ADMIN_SECRET
Value: tothemoon2025
```

**Step 2**: Call the migration API endpoint

```bash
curl -X POST https://news.arcane.group/api/admin/run-monitoring-migration \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: tothemoon2025"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "ATGE monitoring tables migration completed successfully",
  "tables": {
    "created": [
      "atge_error_logs",
      "atge_performance_metrics",
      "atge_user_feedback"
    ],
    "views": [
      "atge_recent_critical_errors",
      "atge_performance_summary_24h",
      "atge_feedback_summary"
    ]
  },
  "verification": {
    "atge_error_logs": true,
    "atge_performance_metrics": true,
    "atge_user_feedback": true
  },
  "timestamp": "2025-01-27T..."
}
```

---

### Method 2: Via Local Script

**Step 1**: Run the migration script locally

```bash
npx tsx scripts/run-atge-monitoring-migration.ts
```

**Expected Output**:
```
🚀 Running ATGE Monitoring Tables Migration...

📄 Migration file loaded
📊 Creating monitoring tables...

✅ Migration completed successfully!

📋 Tables created:
   - atge_error_logs
   - atge_performance_metrics ✨ (FIXED)
   - atge_user_feedback

📊 Views created:
   - atge_recent_critical_errors
   - atge_performance_summary_24h
   - atge_feedback_summary

🔍 Verifying tables...
   ✅ atge_error_logs
   ✅ atge_performance_metrics
   ✅ atge_user_feedback

🎉 ATGE monitoring system is now fully operational!
```

---

### Method 3: Direct SQL (Supabase Dashboard)

**Step 1**: Go to Supabase SQL Editor

**Step 2**: Copy and paste the contents of `migrations/002_create_atge_monitoring_tables.sql`

**Step 3**: Execute the SQL

---

## 🔍 Verification

After running the migration, verify the tables exist:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'atge_%'
ORDER BY table_name;
```

**Expected Result**:
```
atge_error_logs
atge_performance_cache
atge_performance_metrics  ⭐ (SHOULD BE PRESENT)
atge_user_feedback
```

---

## 📊 Table Schemas

### atge_performance_metrics (The Missing Table)

```sql
CREATE TABLE atge_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Metric Details
  metric_type VARCHAR(50) NOT NULL,
  -- Values: 'api_response', 'database_query', 'generation_time', 'backtest_time', 'analysis_time'
  metric_name VARCHAR(100) NOT NULL,
  value DECIMAL(20, 4) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  -- Values: 'ms', 'seconds', 'count'
  
  -- Context
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  trade_signal_id UUID REFERENCES trade_signals(id) ON DELETE SET NULL,
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

**Indexes**:
- `idx_atge_performance_metrics_timestamp` - For time-based queries
- `idx_atge_performance_metrics_metric_type` - For filtering by type
- `idx_atge_performance_metrics_value` - For performance analysis
- `idx_atge_performance_metrics_user_id` - For user-specific metrics
- `idx_atge_performance_metrics_trade_signal_id` - For trade-specific metrics

---

## 🎯 Impact

### Before Migration
- ❌ Trade generation fails with database error
- ❌ Performance monitoring disabled
- ❌ Error tracking disabled
- ❌ User feedback disabled

### After Migration
- ✅ Trade generation works perfectly
- ✅ Performance monitoring operational
- ✅ Error tracking operational
- ✅ User feedback operational
- ✅ 100% ATGE functionality restored

---

## 🔧 Troubleshooting

### Issue: "Unauthorized" error

**Solution**: Ensure ADMIN_SECRET is set correctly in Vercel environment variables

```bash
# Check Vercel environment variables
vercel env ls

# Add if missing
vercel env add ADMIN_SECRET
```

### Issue: "Migration file not found"

**Solution**: Ensure the migration file exists in the deployment

```bash
# Check if file exists
ls migrations/002_create_atge_monitoring_tables.sql

# If missing, ensure it's not in .vercelignore
cat .vercelignore | grep migrations
```

### Issue: "Table already exists"

**Solution**: This is fine! The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### Issue: "Permission denied"

**Solution**: Ensure the database user has CREATE TABLE permissions

```sql
-- Grant permissions (run as superuser)
GRANT CREATE ON SCHEMA public TO your_database_user;
```

---

## 📋 Post-Migration Checklist

- [ ] Migration completed successfully
- [ ] All 3 tables created
- [ ] All 3 views created
- [ ] Tables verified in database
- [ ] Trade generation tested
- [ ] Performance monitoring working
- [ ] Error logs being recorded
- [ ] No database errors in Vercel logs

---

## 🚀 Next Steps

After migration is complete:

1. **Test Trade Generation**
   ```bash
   # Generate a test trade
   curl -X POST https://news.arcane.group/api/atge/generate \
     -H "Content-Type: application/json" \
     -H "Cookie: auth_token=YOUR_TOKEN" \
     -d '{"symbol":"BTC"}'
   ```

2. **Verify Performance Metrics**
   ```sql
   SELECT COUNT(*) FROM atge_performance_metrics;
   -- Should show records after trade generation
   ```

3. **Check Error Logs**
   ```sql
   SELECT COUNT(*) FROM atge_error_logs;
   -- Should be 0 or minimal
   ```

4. **Monitor Vercel Logs**
   - Should see no more "relation does not exist" errors
   - Should see successful trade generation logs

---

## 📚 Related Files

- **Migration SQL**: `migrations/002_create_atge_monitoring_tables.sql`
- **Migration Script**: `scripts/run-atge-monitoring-migration.ts`
- **API Endpoint**: `pages/api/admin/run-monitoring-migration.ts`
- **Monitoring Library**: `lib/atge/monitoring.ts`

---

## 🎉 Success Criteria

Migration is successful when:

1. ✅ All 3 tables exist in database
2. ✅ All 3 views exist in database
3. ✅ Trade generation completes without errors
4. ✅ Performance metrics are being recorded
5. ✅ No "relation does not exist" errors in logs

---

**Status**: Ready to run migration  
**Priority**: CRITICAL - Run immediately  
**Impact**: Restores 100% ATGE functionality

**Run the migration now to restore full ATGE functionality!** 🚀
