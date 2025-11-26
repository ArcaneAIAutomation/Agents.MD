# Quantum BTC Migration - Complete Guide

**Version**: 1.0.0  
**Status**: Production Ready  
**Requirements**: 15.1-15.10  
**Date**: November 25, 2025

---

## Overview

This guide provides complete instructions for migrating from the ATGE (AI Trade Generation Engine) to the Quantum BTC SUPER SPEC system. The migration is designed to be safe, gradual, and reversible.

---

## Migration Timeline

### Week 1: Preparation
- ✅ Create migration scripts
- ✅ Test on development database
- ✅ Deploy Quantum BTC tables
- ✅ Deploy Quantum BTC API endpoints
- ✅ Create feature flag system

### Week 2: Initial Rollout (10%)
- Deploy to 10% of users
- Monitor performance closely
- Collect user feedback
- Fix any issues

### Week 3: Gradual Expansion (25% → 60%)
- Increase to 25% if stable
- Monitor for 48 hours
- Increase to 60% if stable
- Monitor for 48 hours

### Week 4: Full Rollout (100%)
- Migrate remaining 40% of users
- Monitor for 7 days
- Verify all systems stable

### Week 5: Deprecation
- Disable ATGE endpoints
- Archive ATGE data
- Remove old code

---

## Pre-Migration Checklist

Before starting migration:

- [ ] Quantum BTC tables created and tested
- [ ] Quantum BTC API endpoints deployed
- [ ] Feature flag system implemented
- [ ] Migration scripts tested on development database
- [ ] Full backup of production database created
- [ ] Rollback plan documented and tested
- [ ] Monitoring dashboard configured
- [ ] Team trained on new system
- [ ] User communication prepared

---

## Step-by-Step Migration Process

### Step 1: Deploy Quantum BTC Infrastructure

#### 1.1 Create Quantum BTC Tables

```bash
# Run table creation migrations
npx tsx scripts/run-migration.ts migrations/quantum-btc/001_create_btc_trades.sql
npx tsx scripts/run-migration.ts migrations/quantum-btc/002_create_btc_hourly_snapshots.sql
npx tsx scripts/run-migration.ts migrations/quantum-btc/003_create_quantum_anomaly_logs.sql
npx tsx scripts/run-migration.ts migrations/quantum-btc/004_create_prediction_accuracy_database.sql
npx tsx scripts/run-migration.ts migrations/quantum-btc/005_create_api_latency_logs.sql
```

#### 1.2 Verify Tables Created

```bash
npx tsx scripts/test-quantum-migration.ts
```

Expected output: All tests pass (11/11)

#### 1.3 Deploy API Endpoints

```bash
# Commit and push to trigger Vercel deployment
git add pages/api/quantum/
git commit -m "feat(quantum): Deploy Quantum BTC API endpoints"
git push origin main
```

#### 1.4 Verify Endpoints Working

```bash
# Test Quantum BTC endpoint
curl -X POST https://news.arcane.group/api/quantum/generate-btc-trade \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN"

# Should return: Trade signal or error (not 404)
```

---

### Step 2: Migrate Historical Data

#### 2.1 Run Data Migration

```bash
# Run migration script
npx tsx scripts/run-migration.ts migrations/quantum-btc/011_atge_to_quantum_migration.sql
```

#### 2.2 Verify Migration Success

```sql
-- Check migration results
SELECT 
  'ATGE BTC Trades' as source,
  COUNT(*) as count
FROM trade_signals
WHERE symbol = 'BTC'

UNION ALL

SELECT 
  'Quantum BTC Trades' as source,
  COUNT(*) as count
FROM btc_trades;

-- Expected: Counts should match (or Quantum >= ATGE)
```

#### 2.3 Verify Data Integrity

```sql
-- Check for NULL required fields
SELECT COUNT(*) as null_fields
FROM btc_trades
WHERE entry_optimal IS NULL
   OR tp1_price IS NULL
   OR stop_loss_price IS NULL
   OR quantum_reasoning IS NULL;

-- Expected: 0 null fields
```

---

### Step 3: Enable Feature Flags

#### 3.1 Create Feature Flag Tables

```sql
-- Run feature flag migration
CREATE TABLE IF NOT EXISTS global_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quantum_btc_rollout_percentage INTEGER NOT NULL DEFAULT 0,
  quantum_btc_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO global_feature_flags (quantum_btc_rollout_percentage, quantum_btc_enabled)
VALUES (0, FALSE)
ON CONFLICT DO NOTHING;
```

#### 3.2 Verify Feature Flags

```bash
npx tsx scripts/quantum-user-migration.ts --status
```

Expected: Rollout at 0%, ready to begin

---

### Step 4: Gradual User Rollout

#### 4.1 Phase 1: 10% Rollout

```bash
# Enable for 10% of users
npx tsx scripts/quantum-user-migration.ts --percentage 10
```

**Monitor for 48 hours:**
- Check error rates
- Monitor API performance
- Review user feedback
- Check anomaly logs

#### 4.2 Phase 2: 25% Rollout

```bash
# Increase to 25%
npx tsx scripts/quantum-user-migration.ts --percentage 25
```

**Monitor for 48 hours:**
- Compare performance vs ATGE
- Check database load
- Review trade accuracy
- Monitor API costs

#### 4.3 Phase 3: 60% Rollout

```bash
# Increase to 60%
npx tsx scripts/quantum-user-migration.ts --percentage 60
```

**Monitor for 48 hours:**
- Verify system stability
- Check for performance degradation
- Review error logs
- Monitor user satisfaction

#### 4.4 Phase 4: 100% Rollout

```bash
# Full migration
npx tsx scripts/quantum-user-migration.ts --percentage 100
```

**Monitor for 7 days:**
- Verify all users migrated
- Check for any ATGE usage
- Monitor system health
- Prepare for ATGE deprecation

---

### Step 5: Monitor Performance

#### 5.1 Daily Monitoring

```bash
# Check migration status
npx tsx scripts/quantum-user-migration.ts --status

# Monitor performance
npx tsx scripts/quantum-user-migration.ts --monitor
```

#### 5.2 Performance Comparison

```sql
-- Compare 7-day performance
SELECT 
  'Quantum BTC' as system,
  COUNT(*) as total_trades,
  AVG(confidence_score) as avg_confidence,
  SUM(CASE WHEN status = 'HIT' THEN 1 ELSE 0 END) as successful_trades,
  ROUND(SUM(CASE WHEN status = 'HIT' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100, 2) 