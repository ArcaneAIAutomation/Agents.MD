# 🚀 START HERE - Agents.MD Testing Guide

## Welcome! 👋

This guide will help you test the Agents.MD platform in **3 simple steps**.

---

## Step 1: Validate Setup (1 minute)

Run the setup validation script:

```bash
npm run validate:setup
```

This checks:
- ✅ Environment configuration
- ✅ API keys
- ✅ Dependencies
- ✅ Database connection
- ✅ File structure

**Expected Output:**
```
✨ Perfect! Setup is complete and ready for testing!
```

**If validation fails:**
- Review error messages
- Update `.env.local` with valid API keys
- Run `npm install` if needed
- Re-run validation

---

## Step 2: Quick Test (30 seconds)

Run the quick test:

```bash
npm run test:quick
```

This validates:
- ✅ Critical configuration
- ✅ Database connection
- ✅ API key formats

**Expected Output:**
```
✅ All quick tests passed! ✨
```

---

## Step 3: Full Test Suite (5 minutes)

Run the complete automated test suite:

```bash
npm run test:auto
```

This tests:
- ✅ Environment validation
- ✅ Dependencies
- ✅ Database
- ✅ Application build
- ✅ API endpoints (10+)
- ✅ Authentication flow
- ✅ Gemini AI integration

**Expected Output:**
```
Pass Rate: 92%
Status: SUCCESS ✅
```

**Test report saved to:** `test-results-YYYYMMDD-HHMMSS.txt`

---

## What's Next?

### ✅ If All Tests Pass

**You're ready to test manually!**

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3000
   ```

3. **Follow the manual testing guide:**
   - [SETUP-CHECKLIST.md](./SETUP-CHECKLIST.md) - Complete checklist
   - [TEST-GUIDE.md](./TEST-GUIDE.md) - Detailed testing instructions
   - [TESTING-README.md](./TESTING-README.md) - Testing documentation

### ❌ If Tests Fail

**Don't worry! Here's how to fix common issues:**

#### Database Connection Failed
```bash
# Check database status
npx tsx scripts/check-database-status.ts

# Verify DATABASE_URL in .env.local
# Format: postgres://user:pass@host:6543/postgres
```

#### Gemini API Key Invalid
```bash
# Validate Gemini configuration
npm run validate:gemini

# Key format: AIzaSy[33 characters]
# Get key from: https://aistudio.google.com/app/apikey
```

#### Dependencies Missing
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

#### Build Failed
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

---

## Quick Reference

### Test Commands
| Command | Description | Duration |
|---------|-------------|----------|
| `npm run validate:setup` | Full setup validation | 1min |
| `npm run test:quick` | Quick validation | 30s |
| `npm run test:auto` | Full test suite | 5min |
| `npm run test:auto:prod` | Test production | 5min |

### Development Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run linter |

### Database Commands
| Command | Description |
|---------|-------------|
| `npx tsx scripts/check-database-status.ts` | Check database |
| `npx tsx scripts/simple-migrate.ts` | Run migrations |
| `npx tsx scripts/cleanup-sessions.ts` | Clean sessions |

### Deployment Commands
| Command | Description |
|---------|-------------|
| `npm run deploy` | Deploy to production |
| `npm run quick-deploy` | Quick deploy |
| `npm run status` | Git status |

---

## Testing Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTING WORKFLOW                         │
└─────────────────────────────────────────────────────────────┘

1. npm run validate:setup
   ↓
   ✅ Setup validated
   ↓
2. npm run test:quick
   ↓
   ✅ Quick tests passed
   ↓
3. npm run test:auto
   ↓
   ✅ Full tests passed
   ↓
4. npm run dev
   ↓
   ✅ Dev server running
   ↓
5. Manual Testing
   ↓
   ✅ All features work
   ↓
6. npm run deploy
   ↓
   ✅ Deployed to production
   ↓
7. Monitor & Verify
   ↓
   ✅ Production working
```

---

## Key Features to Test

### 🔐 Authentication
- Registration with access code
- Login/Logout
- Session management
- Rate limiting

### 🐋 Whale Watch
- Transaction detection
- Standard AI analysis
- Deep Dive analysis
- AI reasoning process

### 📊 Market Analysis
- Bitcoin analysis
- Ethereum analysis
- Technical indicators
- AI trade signals

### 📰 News Feed
- Crypto Herald
- Real-time updates
- Auto-refresh

### 📱 Mobile Experience
- Responsive design
- Touch optimization
- Performance

---

## Documentation

### Quick Start
- **[START-HERE.md](./START-HERE.md)** ← You are here
- **[SETUP-CHECKLIST.md](./SETUP-CHECKLIST.md)** - Complete checklist

### Testing Guides
- **[TESTING-README.md](./TESTING-README.md)** - Testing overview
- **[TEST-GUIDE.md](./TEST-GUIDE.md)** - Detailed manual testing

### Technical Documentation
- **[AUTHENTICATION-SUCCESS.md](./AUTHENTICATION-SUCCESS.md)** - Auth system
- **[FINAL-SETUP-GUIDE.md](./FINAL-SETUP-GUIDE.md)** - Setup guide
- **[.kiro/steering/](./kiro/steering/)** - Development guidelines

---

## Support

### Getting Help

**If you encounter issues:**

1. **Check the documentation:**
   - [TESTING-README.md](./TESTING-README.md) - Troubleshooting section
   - [TEST-GUIDE.md](./TEST-GUIDE.md) - Common issues

2. **Review test reports:**
   - Check `test-results-*.txt` files
   - Look for specific error messages

3. **Check logs:**
   - Vercel Dashboard: https://vercel.com/dashboard
   - Supabase Dashboard: https://supabase.com/dashboard
   - Browser console (F12)

4. **Common fixes:**
   ```bash
   # Reinstall dependencies
   npm install
   
   # Clear cache
   rm -rf .next
   
   # Check environment
   npm run validate:setup
   
   # Test database
   npx tsx scripts/check-database-status.ts
   ```

---

## Environment Setup

### Required API Keys

**Critical (Must have):**
- `OPENAI_API_KEY` - OpenAI GPT-4o
- `GEMINI_API_KEY` - Google Gemini AI
- `DATABASE_URL` - Supabase PostgreSQL
- `JWT_SECRET` - Authentication
- `CRON_SECRET` - Scheduled jobs

**Recommended (Should have):**
- `KV_REST_API_URL` - Redis for rate limiting
- `KV_REST_API_TOKEN` - Redis authentication
- `SENDER_EMAIL` - Email notifications
- `AZURE_TENANT_ID` - Azure AD
- `AZURE_CLIENT_ID` - Azure AD
- `AZURE_CLIENT_SECRET` - Azure AD

**Optional (Nice to have):**
- `COINMARKETCAP_API_KEY` - Market data
- `NEWS_API_KEY` - News aggregation
- `KRAKEN_API_KEY` - Exchange data
- `COINGECKO_API_KEY` - Market data

### Getting API Keys

**OpenAI:**
- https://platform.openai.com/api-keys
- Format: `sk-proj-...`

**Gemini:**
- https://aistudio.google.com/app/apikey
- Format: `AIzaSy[33 chars]`

**Supabase:**
- https://supabase.com/dashboard
- Create Postgres database
- Copy connection string

**Redis Cloud:**
- https://redis.com/try-free/
- Create database
- Copy connection URL

---

## Success Criteria

### Automated Tests
- ✅ Pass rate >= 80%
- ✅ No critical errors
- ✅ Database connected
- ✅ API endpoints working

### Manual Tests
- ✅ Authentication works
- ✅ Whale Watch works
- ✅ Market data loads
- ✅ News feed loads
- ✅ Mobile responsive

### Performance
- ✅ Lighthouse score >= 80
- ✅ Load time < 3 seconds
- ✅ No console errors

### Security
- ✅ All headers present
- ✅ HTTPS enforced
- ✅ Rate limiting active
- ✅ Passwords hashed

---

## Ready to Start?

### Run These Commands Now:

```bash
# 1. Validate setup
npm run validate:setup

# 2. Quick test
npm run test:quick

# 3. Full test suite
npm run test:auto

# 4. Start dev server
npm run dev
```

### Then Open:
```
http://localhost:3000
```

### And Follow:
- [SETUP-CHECKLIST.md](./SETUP-CHECKLIST.md) for complete testing checklist
- [TEST-GUIDE.md](./TEST-GUIDE.md) for detailed testing instructions

---

## Questions?

**Check these resources:**
- [TESTING-README.md](./TESTING-README.md) - Complete testing guide
- [SETUP-CHECKLIST.md](./SETUP-CHECKLIST.md) - Step-by-step checklist
- [TEST-GUIDE.md](./TEST-GUIDE.md) - Detailed manual testing
- [.kiro/steering/](./kiro/steering/) - Development guidelines

---

**Last Updated**: January 26, 2025  
**Version**: 2.0.0  
**Status**: Ready for Testing ✅

---

# 🎯 Your Next Step

```bash
npm run validate:setup
```

**Let's get started! 🚀**
