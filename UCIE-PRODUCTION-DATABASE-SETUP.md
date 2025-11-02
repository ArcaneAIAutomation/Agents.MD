# UCIE Production Database Setup

## Overview

This document provides complete instructions for setting up production database tables for the Universal Crypto Intelligence Engine (UCIE) in Supabase PostgreSQL.

**Status**: 🟡 Ready for Setup  
**Priority**: High - Required for watchlist and alerts functionality  
**Database**: Supabase PostgreSQL (already configured)

---

## Database Tables Required

UCIE requires 3 additional tables in the existing Supabase database:

1. **`ucie_analysis_cache`** - Persistent cache for analysis results
2. **`ucie_watchlist`** - User watchlist for tracking tokens
3. **`ucie_alerts`** - Custom price and event alerts

---

## Step 1: Create Database Tables

### 1.1 Connect to Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Create a new query

### 1.2 Run Migration Script

Execute the following SQL to create all required tables:

```sql
-- =============================================================================
-- UCIE PRODUCTION DATABASE SCHEMA
-- =============================================================================
-- Created: January 2025
-- Purpose: Support UCIE watchlist, alerts, and persistent caching
-- =============================================================================

-- Table 1: Analysis Cache (Persistent Layer 3 Cache)
-- Stores complete analysis results for long-term caching
CREATE TABLE IF NOT EXISTS ucie_analysis_cache (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  data JSONB NOT NULL,
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT ucie_analysis_cache_symbol_key UNIQUE (symbol)
);

-- Index for fast symbol lookup
CREATE INDEX IF NOT EXISTS idx_ucie_analysis_cache_symbol 
ON ucie_analysis_cache(symbol);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_ucie_analysis_cache_expires 
ON ucie_analysis_cache(expires_at);

-- Table 2: User Watchlist
-- Stores tokens that users want to monitor
CREATE TABLE IF NOT EXISTS ucie_watchlist (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  CONSTRAINT ucie_watchlist_user_symbol_key UNIQUE (user_id, symbol)
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_ucie_watchlist_user 
ON ucie_watchlist(user_id);

-- Index for symbol lookup
CREATE INDEX IF NOT EXISTS idx_ucie_watchlist_symbol 
ON ucie_watchlist(symbol);

-- Table 3: Custom Alerts
-- Stores user-defined alerts for price thresholds and events
CREATE TABLE IF NOT EXISTS ucie_alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
    'price_above', 
    'price_below', 
    'sentiment_change', 
    'whale_transaction', 
    'news_impact',
    'technical_signal'
  )),
  threshold_value DECIMAL(20, 8),
  condition_data JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active alerts lookup
CREATE INDEX IF NOT EXISTS idx_ucie_alerts_active 
ON ucie_alerts(user_id, is_active) WHERE is_active = TRUE;

-- Index for symbol-based alert lookup
CREATE INDEX IF NOT EXISTS idx_ucie_alerts_symbol 
ON ucie_alerts(symbol, is_active) WHERE is_active = TRUE;

-- Index for alert type filtering
CREATE INDEX IF NOT EXISTS idx_ucie_alerts_type 
ON ucie_alerts(alert_type);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_ucie_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ucie_analysis_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update alert timestamp
CREATE OR REPLACE FUNCTION update_ucie_alert_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update alert timestamps
CREATE TRIGGER ucie_alerts_update_timestamp
BEFORE UPDATE ON ucie_alerts
FOR EACH ROW
EXECUTE FUNCTION update_ucie_alert_timestamp();

-- =============================================================================
-- SCHEDULED JOBS (Run via Vercel Cron)
-- =============================================================================

-- Note: Create a Vercel cron job to call this function daily
-- Endpoint: /api/cron/cleanup-ucie-cache
-- Schedule: 0 3 * * * (3 AM daily)

COMMENT ON FUNCTION cleanup_expired_ucie_cache() IS 
'Removes expired analysis cache entries. Should be called daily via cron job.';

-- =============================================================================
-- PERMISSIONS (If using Row Level Security)
-- =============================================================================

-- Enable RLS on watchlist and alerts tables
ALTER TABLE ucie_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ucie_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own watchlist
CREATE POLICY ucie_watchlist_user_policy ON ucie_watchlist
FOR ALL USING (auth.uid()::bigint = user_id);

-- Policy: Users can only see their own alerts
CREATE POLICY ucie_alerts_user_policy ON ucie_alerts
FOR ALL USING (auth.uid()::bigint = user_id);

-- Analysis cache is public (no RLS needed)
-- Anyone can read cached analysis to improve performance

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify tables were created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ucie_%'
ORDER BY table_name;

-- Verify indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'ucie_%'
ORDER BY tablename, indexname;

-- Verify functions were created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%ucie%'
ORDER BY routine_name;

-- =============================================================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================================================

-- Insert sample cache entry
INSERT INTO ucie_analysis_cache (symbol, data, data_quality_score, expires_at)
VALUES (
  'BTC',
  '{"price": 95000, "sentiment": 75, "risk": 45}'::jsonb,
  95,
  NOW() + INTERVAL '1 hour'
) ON CONFLICT (symbol) DO NOTHING;

-- Insert sample watchlist entry (replace user_id with actual user)
-- INSERT INTO ucie_watchlist (user_id, symbol, notes)
-- VALUES (1, 'BTC', 'Watching for breakout above $100k');

-- Insert sample alert (replace user_id with actual user)
-- INSERT INTO ucie_alerts (user_id, symbol, alert_type, threshold_value)
-- VALUES (1, 'BTC', 'price_above', 100000);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

SELECT 'UCIE database tables created successfully!' AS status;
```

---

## Step 2: Verify Table Creation

### 2.1 Check Tables

Run this query to verify all tables were created:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name LIKE 'ucie_%'
ORDER BY table_name;
```

Expected output:
```
table_name              | column_count
------------------------+-------------
ucie_alerts            | 10
ucie_analysis_cache    | 6
ucie_watchlist         | 5
```

### 2.2 Check Indexes

```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'ucie_%'
ORDER BY tablename, indexname;
```

Expected: 8 indexes total

### 2.3 Check Functions

```sql
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%ucie%';
```

Expected: 2 functions (cleanup_expired_ucie_cache, update_ucie_alert_timestamp)

---

## Step 3: Create Database Access Functions

### 3.1 Create `lib/ucie/database.ts`

```typescript
// lib/ucie/database.ts
import { query } from '../db';

// =============================================================================
// ANALYSIS CACHE FUNCTIONS
// =============================================================================

export interface CachedAnalysis {
  id: number;
  symbol: string;
  data: any;
  data_quality_score: number;
  created_at: string;
  expires_at: string;
}

export async function getCachedAnalysis(symbol: string): Promise<CachedAnalysis | null> {
  const result = await query<CachedAnalysis>(
    `SELECT * FROM ucie_analysis_cache 
     WHERE symbol = $1 AND expires_at > NOW()`,
    [symbol.toUpperCase()]
  );
  return result.rows[0] || null;
}

export async function setCachedAnalysis(
  symbol: string,
  data: any,
  dataQualityScore: number,
  ttlSeconds: number = 3600
): Promise<void> {
  await query(
    `INSERT INTO ucie_analysis_cache (symbol, data, data_quality_score, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '${ttlSeconds} seconds')
     ON CONFLICT (symbol) 
     DO UPDATE SET 
       data = EXCLUDED.data,
       data_quality_score = EXCLUDED.data_quality_score,
       created_at = NOW(),
       expires_at = EXCLUDED.expires_at`,
    [symbol.toUpperCase(), JSON.stringify(data), dataQualityScore]
  );
}

export async function cleanupExpiredCache(): Promise<number> {
  const result = await query<{ cleanup_expired_ucie_cache: number }>(
    'SELECT cleanup_expired_ucie_cache()'
  );
  return result.rows[0]?.cleanup_expired_ucie_cache || 0;
}

// =============================================================================
// WATCHLIST FUNCTIONS
// =============================================================================

export interface WatchlistItem {
  id: number;
  user_id: number;
  symbol: string;
  added_at: string;
  notes: string | null;
}

export async function getUserWatchlist(userId: number): Promise<WatchlistItem[]> {
  const result = await query<WatchlistItem>(
    `SELECT * FROM ucie_watchlist 
     WHERE user_id = $1 
     ORDER BY added_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function addToWatchlist(
  userId: number,
  symbol: string,
  notes?: string
): Promise<WatchlistItem> {
  const result = await query<WatchlistItem>(
    `INSERT INTO ucie_watchlist (user_id, symbol, notes)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, symbol) DO NOTHING
     RETURNING *`,
    [userId, symbol.toUpperCase(), notes || null]
  );
  return result.rows[0];
}

export async function removeFromWatchlist(
  userId: number,
  symbol: string
): Promise<boolean> {
  const result = await query(
    `DELETE FROM ucie_watchlist 
     WHERE user_id = $1 AND symbol = $2`,
    [userId, symbol.toUpperCase()]
  );
  return result.rowCount > 0;
}

export async function isInWatchlist(
  userId: number,
  symbol: string
): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM ucie_watchlist 
       WHERE user_id = $1 AND symbol = $2
     )`,
    [userId, symbol.toUpperCase()]
  );
  return result.rows[0]?.exists || false;
}

// =============================================================================
// ALERTS FUNCTIONS
// =============================================================================

export type AlertType = 
  | 'price_above' 
  | 'price_below' 
  | 'sentiment_change' 
  | 'whale_transaction' 
  | 'news_impact'
  | 'technical_signal';

export interface Alert {
  id: number;
  user_id: number;
  symbol: string;
  alert_type: AlertType;
  threshold_value: number | null;
  condition_data: any;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUserAlerts(userId: number): Promise<Alert[]> {
  const result = await query<Alert>(
    `SELECT * FROM ucie_alerts 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getActiveAlerts(symbol?: string): Promise<Alert[]> {
  const sql = symbol
    ? `SELECT * FROM ucie_alerts 
       WHERE is_active = TRUE AND symbol = $1`
    : `SELECT * FROM ucie_alerts WHERE is_active = TRUE`;
  
  const params = symbol ? [symbol.toUpperCase()] : [];
  const result = await query<Alert>(sql, params);
  return result.rows;
}

export async function createAlert(
  userId: number,
  symbol: string,
  alertType: AlertType,
  thresholdValue?: number,
  conditionData?: any
): Promise<Alert> {
  const result = await query<Alert>(
    `INSERT INTO ucie_alerts (user_id, symbol, alert_type, threshold_value, condition_data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      userId,
      symbol.toUpperCase(),
      alertType,
      thresholdValue || null,
      conditionData ? JSON.stringify(conditionData) : null
    ]
  );
  return result.rows[0];
}

export async function updateAlert(
  alertId: number,
  userId: number,
  updates: Partial<Alert>
): Promise<Alert | null> {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.threshold_value !== undefined) {
    setClauses.push(`threshold_value = $${paramIndex++}`);
    values.push(updates.threshold_value);
  }
  if (updates.condition_data !== undefined) {
    setClauses.push(`condition_data = $${paramIndex++}`);
    values.push(JSON.stringify(updates.condition_data));
  }
  if (updates.is_active !== undefined) {
    setClauses.push(`is_active = $${paramIndex++}`);
    values.push(updates.is_active);
  }

  if (setClauses.length === 0) return null;

  values.push(alertId, userId);
  
  const result = await query<Alert>(
    `UPDATE ucie_alerts 
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
     RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteAlert(alertId: number, userId: number): Promise<boolean> {
  const result = await query(
    `DELETE FROM ucie_alerts 
     WHERE id = $1 AND user_id = $2`,
    [alertId, userId]
  );
  return result.rowCount > 0;
}

export async function triggerAlert(alertId: number): Promise<void> {
  await query(
    `UPDATE ucie_alerts 
     SET last_triggered_at = NOW() 
     WHERE id = $1`,
    [alertId]
  );
}
```

---

## Step 4: Create API Endpoints

### 4.1 Watchlist Endpoints

Create `pages/api/ucie/watchlist.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import {
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from '../../../lib/ucie/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.user!.id;

  try {
    switch (req.method) {
      case 'GET':
        // Get user's watchlist
        const watchlist = await getUserWatchlist(userId);
        return res.status(200).json({ success: true, watchlist });

      case 'POST':
        // Add to watchlist
        const { symbol, notes } = req.body;
        if (!symbol) {
          return res.status(400).json({ error: 'Symbol is required' });
        }
        const item = await addToWatchlist(userId, symbol, notes);
        return res.status(201).json({ success: true, item });

      case 'DELETE':
        // Remove from watchlist
        const { symbol: removeSymbol } = req.query;
        if (!removeSymbol || typeof removeSymbol !== 'string') {
          return res.status(400).json({ error: 'Symbol is required' });
        }
        const removed = await removeFromWatchlist(userId, removeSymbol);
        return res.status(200).json({ success: true, removed });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Watchlist API Error]:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(handler);
```

### 4.2 Alerts Endpoints

Create `pages/api/ucie/alerts.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import {
  getUserAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  AlertType,
} from '../../../lib/ucie/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.user!.id;

  try {
    switch (req.method) {
      case 'GET':
        // Get user's alerts
        const alerts = await getUserAlerts(userId);
        return res.status(200).json({ success: true, alerts });

      case 'POST':
        // Create new alert
        const { symbol, alertType, thresholdValue, conditionData } = req.body;
        if (!symbol || !alertType) {
          return res.status(400).json({ error: 'Symbol and alertType are required' });
        }
        const alert = await createAlert(
          userId,
          symbol,
          alertType as AlertType,
          thresholdValue,
          conditionData
        );
        return res.status(201).json({ success: true, alert });

      case 'PATCH':
        // Update alert
        const { alertId, ...updates } = req.body;
        if (!alertId) {
          return res.status(400).json({ error: 'alertId is required' });
        }
        const updated = await updateAlert(alertId, userId, updates);
        if (!updated) {
          return res.status(404).json({ error: 'Alert not found' });
        }
        return res.status(200).json({ success: true, alert: updated });

      case 'DELETE':
        // Delete alert
        const { alertId: deleteId } = req.query;
        if (!deleteId || typeof deleteId !== 'string') {
          return res.status(400).json({ error: 'alertId is required' });
        }
        const deleted = await deleteAlert(parseInt(deleteId), userId);
        return res.status(200).json({ success: true, deleted });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Alerts API Error]:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(handler);
```

### 4.3 Cache Cleanup Cron Job

Create `pages/api/cron/cleanup-ucie-cache.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { cleanupExpiredCache } from '../../../lib/ucie/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const deletedCount = await cleanupExpiredCache();
    
    console.log(`[UCIE Cache Cleanup] Deleted ${deletedCount} expired entries`);
    
    return res.status(200).json({
      success: true,
      deleted: deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[UCIE Cache Cleanup Error]:', error);
    return res.status(500).json({
      error: 'Cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

---

## Step 5: Configure Vercel Cron Job

### 5.1 Update `vercel.json`

Add cron job configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-sessions",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/cleanup-ucie-cache",
      "schedule": "0 3 * * *"
    }
  ]
}
```

This runs the UCIE cache cleanup daily at 3 AM UTC.

---

## Step 6: Test Database Functions

### 6.1 Test Locally

```bash
# Start development server
npm run dev

# Test watchlist
curl -X POST http://localhost:3000/api/ucie/watchlist \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{"symbol":"BTC","notes":"Watching for breakout"}'

# Test alerts
curl -X POST http://localhost:3000/api/ucie/alerts \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{"symbol":"BTC","alertType":"price_above","thresholdValue":100000}'
```

### 6.2 Test in Production

```bash
# Test watchlist
curl -X POST https://news.arcane.group/api/ucie/watchlist \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{"symbol":"ETH","notes":"Monitoring for ETF approval"}'

# Test alerts
curl -X POST https://news.arcane.group/api/ucie/alerts \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{"symbol":"ETH","alertType":"sentiment_change","thresholdValue":30}'
```

---

## Success Criteria

- ✅ All 3 tables created in Supabase
- ✅ Indexes created for performance
- ✅ Helper functions created
- ✅ Database access functions implemented
- ✅ API endpoints created and tested
- ✅ Cron job configured for cache cleanup
- ✅ Row Level Security policies applied
- ✅ Verification queries pass

---

## Next Steps

1. ✅ **Complete this setup** (Task 20.2)
2. ⏳ **Set up monitoring and error tracking** (Task 20.3)
3. ⏳ **Create deployment pipeline** (Task 20.4)
4. ⏳ **Create user documentation** (Task 20.5)

---

**Last Updated**: January 27, 2025  
**Status**: 🟡 Ready for Implementation  
**Estimated Time**: 1-2 hours  
**Priority**: High
