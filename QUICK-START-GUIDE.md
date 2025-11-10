# UCIE Quick Start Guide

**Time to Setup**: 5 minutes  
**Difficulty**: Easy  
**Result**: Complete UCIE database ready for API/AI data

---

## 🚀 Quick Start (3 Steps)

### Step 1: Check Environment Variables

```bash
npm run check:env
```

**This will:**
- ✅ Check if `.env.local` exists
- ✅ Check if `DATABASE_URL` is set
- ✅ Check if API keys are set
- ✅ Show what's missing

**If DATABASE_URL is missing:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings → Database**
4. Copy **"Connection string"** (Transaction mode)
5. Create `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```
6. Add to `.env.local`:
   ```
   DATABASE_URL=postgres://user:pass@host:6543/postgres
   ```
7. Run `npm run check:env` again

### Step 2: Setup Database

```bash
npm run setup:ucie:complete
```

**This will:**
- ✅ Create all 6 UCIE tables
- ✅ Create all indexes (8+)
- ✅ Create unique constraints (UPSERT)
- ✅ Test UPSERT functionality
- ✅ Verify everything works

**Expected Output:**
```
🎉 UCIE DATABASE SETUP COMPLETE!
✅ All 6 tables created successfully
✅ 8+ indexes created
✅ UPSERT functionality verified
✅ Database ready for API/AI data storage
```

### Step 3: Test Database

```bash
npm run test:ucie
```

**This will:**
- ✅ Run 10 comprehensive tests
- ✅ Test UPSERT operations
- ✅ Test data replacement
- ✅ Verify no duplicates

**Expected Output:**
```
✅ Passed: 10/10
🎉 ALL TESTS PASSED!
```

---

## 🗄️ What Gets Created

### 6 Database Tables

1. **`ucie_analysis_cache`** - Stores ALL API data
   - Market data, sentiment, news, technical, on-chain, risk, predictions, derivatives, DeFi

2. **`ucie_openai_analysis`** - Stores AI summaries
   - OpenAI GPT-4o and Gemini Pro summaries

3. **`ucie_caesar_research`** - Stores Caesar AI research
   - Complete analysis, findings, recommendations, sources

4. **`ucie_phase_data`** - Session data (1-hour TTL)

5. **`ucie_watchlist`** - User watchlists

6. **`ucie_alerts`** - User alerts

---

## 🔧 Troubleshooting

### Issue 1: DATABASE_URL not set

**Error**: `DATABASE_URL environment variable is not set`

**Solution**:
```bash
# 1. Check environment
npm run check:env

# 2. Create .env.local
cp .env.example .env.local

# 3. Add DATABASE_URL from Supabase
# Edit .env.local and add:
DATABASE_URL=postgres://user:pass@host:6543/postgres

# 4. Verify
npm run check:env
```

### Issue 2: Connection timeout

**Error**: `Connection timeout` or `ECONNREFUSED`

**Solution**:
1. Check DATABASE_URL format (should use port 6543, not 5432)
2. Verify Supabase database is running
3. Check firewall settings
4. Test connection:
   ```bash
   psql $DATABASE_URL -c "SELECT NOW()"
   ```

### Issue 3: Permission denied

**Error**: `permission denied for table`

**Solution**:
```bash
# Grant permissions
psql $DATABASE_URL -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;"
psql $DATABASE_URL -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_user;"
```

### Issue 4: Tables already exist

**Error**: `relation "ucie_openai_analysis" already exists`

**Solution**: This is OK! The migration uses `CREATE TABLE IF NOT EXISTS`, so it won't fail if tables exist.

---

## 📋 Required Environment Variables

### Minimum (for database setup):
```bash
DATABASE_URL=postgres://user:pass@host:6543/postgres
```

### Recommended (for UCIE to work):
```bash
DATABASE_URL=postgres://user:pass@host:6543/postgres
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
CAESAR_API_KEY=...
COINMARKETCAP_API_KEY=...
NEWS_API_KEY=...
```

### Complete list:
See `.env.example` for all available environment variables.

---

## 🎯 Next Steps

### After Successful Setup

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Test UCIE Endpoints**:
   ```bash
   # Test market data
   curl http://localhost:3000/api/ucie/market-data/BTC

   # Test OpenAI summary
   curl http://localhost:3000/api/ucie/openai-summary/BTC

   # Test Gemini summary
   curl http://localhost:3000/api/ucie/gemini-summary/BTC
   ```

3. **Deploy to Production**:
   ```bash
   git push origin main
   ```

---

## 📊 Verification

### Check Tables Exist

```bash
psql $DATABASE_URL -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'ucie_%'
ORDER BY table_name;
"
```

**Expected**: 6 tables (ucie_alerts, ucie_analysis_cache, ucie_caesar_research, ucie_openai_analysis, ucie_phase_data, ucie_watchlist)

### Check Data Storage

```bash
# Check API data cache
psql $DATABASE_URL -c "SELECT COUNT(*) FROM ucie_analysis_cache;"

# Check OpenAI summaries
psql $DATABASE_URL -c "SELECT COUNT(*) FROM ucie_openai_analysis;"

# Check Caesar research
psql $DATABASE_URL -c "SELECT COUNT(*) FROM ucie_caesar_research;"
```

---

## 🎉 Success Criteria

### ✅ Setup is successful when:

- [ ] `npm run check:env` shows DATABASE_URL is set
- [ ] `npm run setup:ucie:complete` completes without errors
- [ ] All 6 tables created
- [ ] All indexes created
- [ ] UPSERT functionality verified
- [ ] `npm run test:ucie` shows 10/10 tests passed

### ✅ System is ready when:

- [ ] Database connection works
- [ ] All tables exist
- [ ] UPSERT replaces old data
- [ ] No duplicate entries
- [ ] Tests pass

---

## 📚 Documentation

- **Complete Setup**: `UCIE-DATABASE-COMPLETE.md`
- **Automated Setup**: `UCIE-AUTOMATED-SETUP.md`
- **System Guide**: `.kiro/steering/ucie-system.md`
- **Environment Variables**: `.env.example`

---

## 💡 Tips

### Tip 1: Use Transaction Mode (Port 6543)

Always use port **6543** (Transaction mode), not 5432:
```
✅ CORRECT: postgres://user:pass@host:6543/postgres
❌ WRONG:   postgres://user:pass@host:5432/postgres
```

### Tip 2: Check Environment First

Always run `npm run check:env` before database setup:
```bash
npm run check:env
npm run setup:ucie:complete
```

### Tip 3: Test After Setup

Always run tests after setup to verify:
```bash
npm run setup:ucie:complete
npm run test:ucie
```

### Tip 4: Keep .env.local Secret

Never commit `.env.local` to git:
- It's in `.gitignore`
- Contains sensitive API keys
- Use Vercel environment variables for production

---

**Status**: ✅ **READY TO USE**  
**Time**: 5 minutes  
**Difficulty**: Easy  
**Result**: Complete UCIE database

**Three commands. Five minutes. Complete database.** 🚀
