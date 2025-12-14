# UCIE Step 2 Fix - Run This SQL in Supabase

## Problem
Step 1 (data collection) works ✅
Step 2 (GPT analysis) fails ❌ - "No AI analysis found in database"

## Cause
The `ucie_openai_jobs` table doesn't exist in your production Supabase database.

## Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run This SQL
Copy and paste this entire block, then click **Run**:

```sql
-- Create ucie_openai_jobs table for GPT analysis
CREATE TABLE IF NOT EXISTS ucie_openai_jobs (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  progress TEXT,
  context_data JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ucie_openai_jobs_symbol ON ucie_openai_jobs(symbol);
CREATE INDEX IF NOT EXISTS idx_ucie_openai_jobs_status ON ucie_openai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ucie_openai_jobs_created_at ON ucie_openai_jobs(created_at);
```

### Step 3: Verify
After running, you should see:
```
Success. No rows returned
```

### Step 4: Test UCIE
1. Go to https://news.arcane.group
2. Navigate to UCIE
3. Enter BTC and click "Get Preview"
4. Step 1 should collect data
5. Step 2 should now start GPT analysis (no more error)

## That's it!
The table creation is a one-time fix. UCIE will work after this.
