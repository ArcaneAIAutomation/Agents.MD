# Quick Database Access - Caesar Research Data

**⚡ Fast Guide**: How to view Caesar AI research in Supabase

---

## 🚀 Quick Steps

### 1. Login to Supabase
```
URL: https://supabase.com/dashboard
Login with your Supabase credentials
```

### 2. Select Your Project
```
Look for: "Agents.MD" or your project name
Region: EU West (London)
```

### 3. Open Table Editor
```
Left Sidebar → Table Editor → ucie_analysis_cache
```

### 4. Filter for Caesar Research
```
Column: analysis_type
Filter: = 'research'
```

### 5. View the Data
```
Click on any row's "data" column to see full Caesar analysis
```

---

## 📊 What You'll See

### Table Columns

| Column | Description | Example |
|--------|-------------|---------|
| `id` | Unique entry ID | 12345 |
| `symbol` | Cryptocurrency | BTC, ETH |
| `analysis_type` | Type of analysis | **research** |
| `data` | Caesar analysis (JSONB) | Click to expand |
| `data_quality_score` | Quality (0-100) | 100 |
| `created_at` | When created | 2025-01-27 21:40:19 |
| `expires_at` | When expires | 2025-01-28 21:40:19 |
| `user_id` | Your user ID | c0ab7e31-9063... |
| `user_email` | Your email | morgan@arcane.group |

### Caesar Data Structure

When you click on the `data` column, you'll see:

```json
{
  "reasoning": "Detailed analysis...",
  "keyFindings": ["Finding 1", "Finding 2", ...],
  "marketOutlook": {
    "shortTerm": "Bullish",
    "mediumTerm": "Neutral",
    "longTerm": "Bullish"
  },
  "riskFactors": ["Risk 1", "Risk 2", ...],
  "opportunities": ["Opportunity 1", ...],
  "sources": [
    {
      "title": "Source title",
      "url": "https://...",
      "relevance": 0.95
    }
  ],
  "confidence": 85
}
```

---

## 🔍 Quick SQL Queries

### View Latest Caesar Research
```sql
SELECT * FROM ucie_analysis_cache 
WHERE analysis_type = 'research' 
ORDER BY created_at DESC 
LIMIT 5;
```

### View Your Caesar Research
```sql
SELECT * FROM ucie_analysis_cache 
WHERE analysis_type = 'research' 
AND user_email = 'your@email.com'
ORDER BY created_at DESC;
```

### View Caesar Research for BTC
```sql
SELECT 
  symbol,
  user_email,
  data_quality_score,
  created_at,
  data->>'reasoning' as reasoning
FROM ucie_analysis_cache 
WHERE analysis_type = 'research' 
AND symbol = 'BTC';
```

### Count All Research Entries
```sql
SELECT 
  COUNT(*) as total_entries,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT symbol) as unique_symbols
FROM ucie_analysis_cache 
WHERE analysis_type = 'research';
```

---

## ❓ Troubleshooting

### No Research Entries?

**Check if any exist**:
```sql
SELECT COUNT(*) FROM ucie_analysis_cache 
WHERE analysis_type = 'research';
```

**If 0**: Caesar research hasn't been run yet
- Go to your app
- Trigger a Caesar analysis
- Wait 5-10 minutes
- Refresh database

### Can't See Your Entries?

**Check user IDs**:
```sql
SELECT DISTINCT user_id, user_email 
FROM ucie_analysis_cache 
WHERE analysis_type = 'research';
```

**If you see "anonymous"**: Old entries before our fix
- New entries will have your proper user ID
- Old entries can be deleted

### Entries Expired?

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
WHERE analysis_type = 'research';
```

**Clean up expired**:
```sql
DELETE FROM ucie_analysis_cache 
WHERE expires_at < NOW();
```

---

## 📱 Alternative: SQL Editor

**Faster for power users**:

1. Left Sidebar → **SQL Editor**
2. Click **"New Query"**
3. Paste any query from above
4. Click **"Run"** or press `Ctrl+Enter`
5. View results below

---

## 🎯 What to Look For

### ✅ Good Signs

- `analysis_type = 'research'` entries exist
- `user_id` has your actual ID (not "anonymous")
- `user_email` has your email
- `data_quality_score` is 80-100
- `data` column has complete Caesar analysis
- `expires_at` is in the future

### ⚠️ Warning Signs

- No entries with `analysis_type = 'research'`
- `user_id = 'anonymous'` (old entries)
- `data_quality_score` below 70
- `expires_at` in the past
- Empty or null `data` column

---

## 🔗 Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Table Editor**: Dashboard → Table Editor → ucie_analysis_cache
- **SQL Editor**: Dashboard → SQL Editor
- **Full Guide**: See `SUPABASE-DATABASE-ACCESS-GUIDE.md`

---

## 🆘 Need Help?

**Run verification script**:
```bash
npx tsx scripts/verify-ucie-database-setup.ts
```

**Check documentation**:
- Full guide: `SUPABASE-DATABASE-ACCESS-GUIDE.md`
- Database verification: `UCIE-DATABASE-VERIFICATION-COMPLETE.md`
- System guide: `.kiro/steering/ucie-system.md`

---

**That's it!** You can now quickly access and view Caesar research data in Supabase. 🚀
