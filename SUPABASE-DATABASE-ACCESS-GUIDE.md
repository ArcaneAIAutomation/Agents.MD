# Supabase Database Access Guide - Viewing Caesar Research Data

**Last Updated**: January 27, 2025  
**Purpose**: Guide to accessing and viewing UCIE Caesar research data in Supabase

---

## 🔐 Step 1: Access Supabase Dashboard

### Login to Supabase

1. **Go to**: https://supabase.com/dashboard
2. **Login** with your Supabase account credentials
3. **Select your project**: Look for your project name (likely "Agents.MD" or similar)

### Find Your Project

Your project details from `.env.local`:
```
Database Host: aws-1-eu-west-2.pooler.supabase.com
Database Port: 6543
Database Name: postgres
Project Region: EU West (London)
```

---

## 📊 Step 2: Access the Table Editor

### Navigate to Table Editor

1. In the left sidebar, click **"Table Editor"**
2. You'll see a list of all your database tables
3. Look for: **`ucie_analysis_cache`**

### Alternative: SQL Editor

1. In the left sidebar, click **"SQL Editor"**
2. You can write custom SQL queries here
3. More powerful for complex queries

---

## 🔍 Step 3: View Caesar Research Data

### Option A: Table Editor (Visual Interface)

**Steps**:
1. Click on **`ucie_analysis_cache`** table
2. You'll see all cache entries in a spreadsheet-like view
3. **Filter for Caesar research**:
   - Look for the **`analysis_type`** column
   - Filter where `analysis_type = 'research'`

**Columns you'll see**:
- `id` - Unique entry ID
- `symbol` - Cryptocurrency (BTC, ETH, etc.)
- `analysis_type` - Type of analysis (look for **'research'**)
- `data` - JSONB containing the Caesar analysis (click to expand)
- `data_quality_score` - Quality score (0-100)
- `created_at` - When it was created
- `expires_at` - When it expires
- `user_id` - Your user ID
- `user_email` - Your email address

### Option B: SQL Editor (More Powerful)

**Query 1: View All Caesar Research Entries**
```sql
SELECT 
  id,
  symbol,
  user_email,
  data_quality_score,
  created_at,
  expires_at,
  data
FROM ucie_analysis_cache
WHERE analysis_type = 'research'
ORDER BY created_at DESC;
```

**Query 2: View Caesar Research for Specific Symbol**
```sql
SELECT 
  symbol,
  user_email,
  data_quality_score,
  created_at,
  data->'reasoning' as reasoning,
  data->'keyFindings' as key_findings,
  data->'marketOutlook' as market_outlook,
  data->'sources' as sources
FROM ucie_analysis_cache
WHERE analysis_type = 'research'
  AND symbol = 'BTC'
ORDER BY created_at DESC
LIMIT 1;
```

**Query 3: View Your Caesar Research Only**
```sql
SELECT 
  symbol,
  data_quality_score,
  created_at,
  data
FROM ucie_analysis_cache
WHERE analysis_type = 'research'
  AND user_email = 'morgan@arcane.group'  -- Replace with your email
ORDER BY created_at DESC;
```

**Query 4: Count Caesar Research Entries by User**
```sql
SELECT 
  user_email,
  COUNT(*) as research_count,
  MAX(created_at) as last_research
FROM ucie_analysis_cache
WHERE analysis_type = 'research'
GROUP BY user_email
ORDER BY research_count DESC;
```

---

## 📋 Step 4: Understanding the Caesar Data Structure

### What's Stored in the `data` Column

The `data` column is JSONB and contains the complete Caesar research response:

```json
{
  "reasoning": "Detailed analysis reasoning...",
  "keyFindings": [
    "Finding 1",
    "Finding 2",
    "Finding 3"
  ],
  "marketOutlook": {
    "shortTerm": "Bullish/Bearish/Neutral",
    "mediumTerm": "...",
    "longTerm": "..."
  },
  "riskFactors": [
    "Risk 1",
    "Risk 2"
  ],
  "opportunities": [
    "Opportunity 1",
    "Opportunity 2"
  ],
  "sources": [
    {
      "title": "Source title",
      "url": "https://...",
      "relevance": 0.95
    }
  ],
  "confidence": 85,
  "timestamp": "2025-01-27T..."
}
```

### Viewing Nested Data

**In Table Editor**:
- Click on the `data` cell
- A modal will open showing the formatted JSON
- You can expand/collapse sections

**In SQL Editor**:
```sql
-- Extract specific fields from JSONB
SELECT 
  symbol,
  data->>'reasoning' as reasoning,
  data->'keyFindings' as key_findings,
  data->'marketOutlook'->>'shortTerm' as short_term_outlook,
  (data->>'confidence')::integer as confidence_score
FROM ucie_analysis_cache
WHERE analysis_type = 'research'
  AND symbol = 'BTC';
```

---

## 🔎 Step 5: Advanced Queries

### Find Most Recent Caesar Research

```sql
SELECT 
  symbol,
  user_email,
  data_quality_score,
  created_at,
  EXTRACT(EPOCH FROM (expires_at - NOW())) / 60 as minutes_until_expiry,
  data->>'reasoning' as reasoning_preview
FROM ucie_analysis_cache
WHERE analysis_type = 'research'
ORDER BY created_at DESC
LIMIT 10;
```

### Find Caesar Research with High Confidence

```sql
SELECT 
  symbol,
  user_email,
  (data->>'confidence')::integer as confidence,
  data->>'reasoning' as reasoning
FROM ucie_analysis_cache
WHERE analysis_type = 'research'
  AND (data->>'confidence')::integer >= 80
ORDER BY (data->>'confidence')::integer DESC;
```

### View All Analysis Types for a Symbol

```sql
SELECT 
  analysis_type,
  user_email,
  data_quality_score,
  created_at
FROM ucie_analysis_cache
WHERE symbol = 'BTC'
ORDER BY created_at DESC;
```

This shows you all cached data for BTC:
- `market-data`
- `sentiment`
- `technical`
- `news`
- `on-chain`
- `risk`
- `predictions`
- `derivatives`
- `defi`
- **`research`** ← Caesar AI analysis

---

## 🛠️ Step 6: Troubleshooting

### No Caesar Research Entries?

**Check if any research has been run**:
```sql
SELECT COUNT(*) as total_research_entries
FROM ucie_analysis_cache
WHERE analysis_type = 'research';
```

**If count is 0**:
1. Caesar research hasn't been run yet
2. Go to your app and trigger a Caesar analysis
3. Wait for it to complete (5-10 minutes)
4. Refresh the database view

### Can't See Your Entries?

**Check your user ID**:
```sql
SELECT DISTINCT user_id, user_email
FROM ucie_analysis_cache
WHERE analysis_type = 'research';
```

**If you see "anonymous"**:
- The old code was running (before our fix)
- New entries will have your proper user ID
- Old anonymous entries can be deleted

### Expired Entries?

**Check expiration**:
```sql
SELECT 
  symbol,
  created_at,
  expires_at,
  CASE 
    WHEN expires_at > NOW() THEN 'Valid'
    ELSE 'Expired'
  END as status
FROM ucie_analysis_cache
WHERE analysis_type = 'research'
ORDER BY created_at DESC;
```

**Clean up expired entries**:
```sql
DELETE FROM ucie_analysis_cache
WHERE expires_at < NOW();
```

---

## 📊 Step 7: Monitoring Dashboard Queries

### Create a Monitoring View

```sql
-- Overall cache statistics
SELECT 
  analysis_type,
  COUNT(*) as entry_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT symbol) as unique_symbols,
  AVG(data_quality_score) as avg_quality,
  MAX(created_at) as last_entry
FROM ucie_analysis_cache
GROUP BY analysis_type
ORDER BY entry_count DESC;
```

### User Activity Report

```sql
SELECT 
  user_email,
  COUNT(*) as total_analyses,
  COUNT(DISTINCT symbol) as symbols_analyzed,
  COUNT(DISTINCT analysis_type) as analysis_types_used,
  MAX(created_at) as last_activity
FROM ucie_analysis_cache
WHERE user_email IS NOT NULL
GROUP BY user_email
ORDER BY total_analyses DESC;
```

### Caesar Research Quality Report

```sql
SELECT 
  symbol,
  COUNT(*) as research_count,
  AVG(data_quality_score) as avg_quality,
  AVG((data->>'confidence')::integer) as avg_confidence,
  MAX(created_at) as last_research
FROM ucie_analysis_cache
WHERE analysis_type = 'research'
GROUP BY symbol
ORDER BY research_count DESC;
```

---

## 🎯 Quick Reference

### Most Common Queries

**1. View latest Caesar research**:
```sql
SELECT * FROM ucie_analysis_cache 
WHERE analysis_type = 'research' 
ORDER BY created_at DESC LIMIT 5;
```

**2. View your Caesar research**:
```sql
SELECT * FROM ucie_analysis_cache 
WHERE analysis_type = 'research' 
AND user_email = 'your@email.com';
```

**3. View Caesar research for BTC**:
```sql
SELECT * FROM ucie_analysis_cache 
WHERE analysis_type = 'research' 
AND symbol = 'BTC';
```

**4. Count all research entries**:
```sql
SELECT COUNT(*) FROM ucie_analysis_cache 
WHERE analysis_type = 'research';
```

---

## 📱 Mobile Access

### Supabase Mobile App

1. Download **Supabase** app from App Store or Google Play
2. Login with your credentials
3. Select your project
4. Navigate to Table Editor
5. View `ucie_analysis_cache` table

---

## 🔒 Security Notes

### What You Can See

- ✅ Your own cache entries (filtered by user_id)
- ✅ All entries if you're the database owner
- ⚠️ Other users' entries (if you have admin access)

### Best Practices

1. **Don't share database credentials**
2. **Use read-only access** for viewing data
3. **Be careful with DELETE queries**
4. **Always backup before bulk operations**

---

## 📞 Support

### If You Can't Access the Database

1. **Check Supabase project status**: https://status.supabase.com
2. **Verify credentials** in `.env.local`
3. **Check firewall/VPN** settings
4. **Contact Supabase support** if needed

### If Data Looks Wrong

1. **Check the verification script**: `npx tsx scripts/verify-ucie-database-setup.ts`
2. **Review recent deployments** on Vercel
3. **Check application logs** for errors
4. **Verify API endpoints** are working

---

## 🎉 Summary

**To view Caesar research data**:

1. **Login**: https://supabase.com/dashboard
2. **Select**: Your project
3. **Navigate**: Table Editor → `ucie_analysis_cache`
4. **Filter**: `analysis_type = 'research'`
5. **View**: Click on `data` column to see full Caesar analysis

**Or use SQL Editor**:
```sql
SELECT * FROM ucie_analysis_cache 
WHERE analysis_type = 'research' 
ORDER BY created_at DESC;
```

**That's it!** You can now view all Caesar-generated content and verify it's being stored correctly. 🚀

---

**Quick Links**:
- Supabase Dashboard: https://supabase.com/dashboard
- Table Editor: Dashboard → Table Editor → ucie_analysis_cache
- SQL Editor: Dashboard → SQL Editor
- Project Settings: Dashboard → Settings → Database

**Need Help?** Run the verification script:
```bash
npx tsx scripts/verify-ucie-database-setup.ts
```
