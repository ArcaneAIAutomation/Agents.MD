# Vercel Environment Variables Checklist

**Last Updated**: January 27, 2025  
**Status**: Complete Configuration Guide

---

## 🚨 CRITICAL - MUST BE SET

These environment variables are **REQUIRED** for the application to function:

### 1. AI APIs (REQUIRED)
- [ ] `OPENAI_API_KEY` - OpenAI GPT-5.1 for trade analysis
  - **Current**: `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`
  - **Format**: `sk-proj-...` (starts with sk-proj)
  - **Get from**: https://platform.openai.com/api-keys

- [ ] `GEMINI_API_KEY` - Google Gemini 2.5 Pro for whale analysis
  - **Current**: `AIzaSyAvGqzDvYiaaDOMFDNiNlxMziO0zYIE3no`
  - **Format**: `AIzaSy...` (39 characters)
  - **Get from**: https://aistudio.google.com/app/apikey

### 2. Database (REQUIRED)
- [ ] `DATABASE_URL` - Supabase PostgreSQL connection
  - **Current**: `postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres`
  - **Format**: `postgres://user:pass@host:6543/postgres`
  - **CRITICAL**: Do NOT add `?sslmode=require` (conflicts with code)
  - **Port**: 6543 (connection pooling for serverless)

### 3. Authentication (REQUIRED)
- [ ] `JWT_SECRET` - JWT token signing secret
  - **Current**: `MB4t1ZWyxayaddBoKRSR8TrkGgkq4XEtPSJKgTnD0HI=`
  - **Format**: Base64 encoded, 32+ bytes
  - **Generate**: `openssl rand -base64 32`

- [ ] `CRON_SECRET` - Scheduled job authentication
  - **Current**: `UU+Yg64wcv3mkbqO2neEdzKiqZ49q2/uu8j/xTmYFyo=`
  - **Format**: Base64 encoded, 32+ bytes
  - **Generate**: `openssl rand -base64 32`

---

## ✅ HIGHLY RECOMMENDED

These APIs significantly improve functionality:

### 4. Market Data APIs
- [ ] `COINMARKETCAP_API_KEY` - Primary market data
  - **Current**: `25a84887-8485-4c41-8a65-2ba34b1afa37`
  - **Get from**: https://pro.coinmarketcap.com/account

- [ ] `COINGECKO_API_KEY` - Fallback market data
  - **Current**: `CG-BAMGkB8Chks4akehARJryMRU`
  - **Get from**: https://www.coingecko.com/en/api/pricing

- [ ] `KRAKEN_API_KEY` - Exchange data
  - **Current**: `39vCggkGgYp3fCCKumJCYDQv+i5vt8C1yAYr4upi1O3kYJmQb306LN2y`
  - **Get from**: https://www.kraken.com/u/security/api

- [ ] `KRAKEN_PRIVATE_KEY` - Exchange authentication
  - **Current**: `LHQooQRxQBr1kuoxtFZF2OjPS/HKbhnRvDUm2I07HjaDTLw7jFnOFJCxDTlc0FpwmyM+OY6ZAH8bqHO5ykMJ/w==`

### 5. News & Intelligence APIs
- [ ] `NEWS_API_KEY` - Real-time news
  - **Current**: `4a574a8cc6f04b5b950243b0e55d512a`
  - **Get from**: https://newsapi.org/account

- [ ] `CAESAR_API_KEY` - Advanced market intelligence
  - **Current**: `sk-75215e0cae07.14L-_YihbtansgUohejfQkvInm4mEOAb8RjjP3Co__s`
  - **Get from**: https://docs.caesar.xyz/get-started/introduction

### 6. Social Sentiment APIs
- [ ] `LUNARCRUSH_API_KEY` - Social metrics
  - **Current**: `r1pe78gm2tohk3mwp36cqj7hvmhhln82d856ck5`
  - **Get from**: https://lunarcrush.com/developers/api

- [ ] `TWITTER_BEARER_TOKEN` - Tweet analysis
  - **Current**: `AAAAAAAAAAAAAAAAAAAAABfK5AEAAAAARfdLBBxO4WpoP6xWSbcwIGL%2Flg8%3Da6P1toyhhdev46d9AzsgAVt5WvSfPK9zuqD8wjWEpFoiJQlWar`
  - **Get from**: https://developer.twitter.com/en/portal/dashboard

- [ ] `TWITTER_ACCESS_TOKEN`
  - **Current**: `3082600481-KsTyOVdM2xPNDY6cmoLkyZ5scuBagcuxt6VtSdg`

- [ ] `TWITTER_ACCESS_TOKEN_SECRET`
  - **Current**: `26BlLFspdcoSBAgmJlgYLhkeZDrL5qYhOrtwN56bScNZ9`

- [ ] `REDDIT_CLIENT_ID` - Reddit sentiment
  - **Current**: `fL31CJFzoH7HEkf7SvEOKQ`
  - **Get from**: https://www.reddit.com/prefs/apps

- [ ] `REDDIT_CLIENT_SECRET`
  - **Current**: `aWILB4Ypf7PHeMnrT0zJrqrSMviLbA`

- [ ] `REDDIT_USER_AGENT`
  - **Current**: `UCIE/1.0`

### 7. Blockchain APIs
- [ ] `ETHERSCAN_API_KEY` - Ethereum blockchain (V2 supports 50+ chains)
  - **Current**: `6S8BPC9PYMKQXFX9P265NTMEYQAT98QQR2`
  - **Get from**: https://etherscan.io/myapikey

- [ ] `BSCSCAN_API_KEY` - Binance Smart Chain
  - **Current**: `6S8BPC9PYMKQXFX9P265NTMEYQAT98QQR2`

- [ ] `POLYGONSCAN_API_KEY` - Polygon network
  - **Current**: `6S8BPC9PYMKQXFX9P265NTMEYQAT98QQR2`

- [ ] `BLOCKCHAIN_API_KEY` - Bitcoin blockchain
  - **Current**: `7142c948-1abe-4b46-855f-d8704f580e00`
  - **Get from**: https://www.blockchain.com/api

- [ ] `BLOCKCHAIN_API_URL`
  - **Current**: `https://blockchain.info`

### 8. Solana Blockchain (NEW - January 2025)
- [ ] `SOLANA_RPC_URL` - Solana RPC endpoint
  - **Current**: `https://mainnet.helius-rpc.com/?api-key=26b49ea2-a085-4e8f-9397-23d985796d66`
  - **Provider**: Helius (100k free requests/day)
  - **Get from**: https://www.helius.dev/

- [ ] `SOLANA_RPC_FALLBACK_URL`
  - **Current**: `https://api.mainnet-beta.solana.com`

- [ ] `SOLANA_NETWORK`
  - **Current**: `mainnet-beta`

- [ ] `SOLANA_COMMITMENT`
  - **Current**: `confirmed`

- [ ] `SOLANA_RPC_TIMEOUT_MS`
  - **Current**: `30000`

### 9. Rate Limiting (Upstash Redis)
- [ ] `UPSTASH_REDIS_REST_URL` - Redis endpoint
  - **Current**: `https://musical-cattle-22790.upstash.io`
  - **Get from**: https://upstash.com/

- [ ] `UPSTASH_REDIS_REST_TOKEN` - Redis auth token
  - **Current**: `AVkGAAIncDIyOTYyY2RhZGViNTg0ODI5OWQ1ZWVmN2ZjNjBhMTlkM3AyMjI3OTA`

- [ ] `KV_REST_API_URL` - Alternative name
  - **Current**: `https://musical-cattle-22790.upstash.io`

- [ ] `KV_REST_API_TOKEN` - Alternative name
  - **Current**: `AVkGAAIncDIyOTYyY2RhZGViNTg0ODI5OWQ1ZWVmN2ZjNjBhMTlkM3AyMjI3OTA`

---

## 📋 OPTIONAL BUT USEFUL

These enhance specific features:

### 10. Derivatives & DeFi
- [ ] `COINGLASS_API_KEY` - Derivatives data (requires paid plan)
  - **Current**: `84f2fb0a47f54d00a5108047a098dd74`
  - **Status**: Free tier exhausted, needs upgrade

### 11. Application Configuration
- [ ] `NEXT_PUBLIC_API_URL` - API base URL
  - **Current**: `https://news.arcane.group`
  - **Format**: Your production domain

- [ ] `NEXT_PUBLIC_ACCESS_CODE` - Early access code
  - **Current**: `BITCOIN2025`
  - **Format**: Any string (case-insensitive)

- [ ] `NEXT_PUBLIC_ATGE_PASSWORD` - ATGE unlock password
  - **Current**: `tothemoon`
  - **Format**: Any string (case-sensitive)

### 12. Feature Flags
- [ ] `ENABLE_LIVE_DATA`
  - **Current**: `true`

- [ ] `USE_REAL_AI_ANALYSIS`
  - **Current**: `true`

- [ ] `NODE_ENV`
  - **Current**: `production`

### 13. AI Configuration
- [ ] `OPENAI_MODEL`
  - **Current**: `gpt-4o-2024-08-06`

- [ ] `GEMINI_MODEL`
  - **Current**: `gemini-2.5-flash`

- [ ] `GEMINI_ENABLE_THINKING`
  - **Current**: `true`

- [ ] `GEMINI_PRO_THRESHOLD_BTC`
  - **Current**: `100`

- [ ] `GEMINI_MAX_RETRIES`
  - **Current**: `2`

- [ ] `GEMINI_TIMEOUT_MS`
  - **Current**: `28000`

### 14. Rate Limiting Configuration
- [ ] `AUTH_RATE_LIMIT_MAX_ATTEMPTS`
  - **Current**: `5`

- [ ] `AUTH_RATE_LIMIT_WINDOW_MS`
  - **Current**: `900000` (15 minutes)

- [ ] `JWT_EXPIRATION`
  - **Current**: `7d`

- [ ] `JWT_REMEMBER_ME_EXPIRATION`
  - **Current**: `30d`

### 15. Caesar API Configuration
- [ ] `CAESAR_API_BASE_URL`
  - **Current**: `https://api.caesar.xyz`

- [ ] `CAESAR_COMPUTE_UNITS_DEFAULT`
  - **Current**: `2`

- [ ] `USE_CAESAR_RESEARCH`
  - **Current**: `true`

---

## 🔍 HOW TO SET IN VERCEL

### Method 1: Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: Variable name (e.g., `OPENAI_API_KEY`)
   - **Value**: Variable value (e.g., `sk-proj-...`)
   - **Environment**: Select **Production**, **Preview**, and **Development**
5. Click **Save**

### Method 2: Vercel CLI
```bash
# Set a single variable
vercel env add OPENAI_API_KEY production

# Import from .env.local
vercel env pull .env.local
```

### Method 3: Bulk Import
1. Create a file with all variables (one per line):
   ```
   OPENAI_API_KEY=sk-proj-...
   GEMINI_API_KEY=AIzaSy...
   DATABASE_URL=postgres://...
   ```
2. In Vercel Dashboard → Settings → Environment Variables
3. Click **Add** → **Bulk Add**
4. Paste all variables
5. Select environments
6. Click **Save**

---

## ✅ VERIFICATION CHECKLIST

After setting all variables in Vercel:

- [ ] **Redeploy** the application (Settings → Deployments → Redeploy)
- [ ] **Test Authentication** - Try logging in
- [ ] **Test ATGE** - Generate a trade signal
- [ ] **Test Whale Watch** - Analyze a whale transaction
- [ ] **Check Logs** - Verify no "undefined" or "missing API key" errors
- [ ] **Test All Features** - Ensure all 13 APIs are working

---

## 🚨 COMMON ISSUES

### Issue 1: "API key not configured"
**Solution**: Variable not set in Vercel. Add it in Settings → Environment Variables.

### Issue 2: "Database connection failed"
**Solution**: Check `DATABASE_URL` format. Must NOT include `?sslmode=require`.

### Issue 3: "Timeout after 40 seconds"
**Solution**: Check `vercel.json` has correct `maxDuration` settings.

### Issue 4: "Rate limit exceeded"
**Solution**: Check Upstash Redis variables are set correctly.

---

## 📊 PRIORITY ORDER

**Set these first** (in order of importance):

1. ✅ `OPENAI_API_KEY` - Required for AI analysis
2. ✅ `GEMINI_API_KEY` - Required for whale analysis
3. ✅ `DATABASE_URL` - Required for authentication
4. ✅ `JWT_SECRET` - Required for authentication
5. ✅ `CRON_SECRET` - Required for scheduled jobs
6. ✅ `COINMARKETCAP_API_KEY` - Primary market data
7. ✅ `NEWS_API_KEY` - News aggregation
8. ✅ `LUNARCRUSH_API_KEY` - Social sentiment
9. ✅ `ETHERSCAN_API_KEY` - Blockchain data
10. ✅ `BLOCKCHAIN_API_KEY` - Bitcoin blockchain

**Then set these** (for full functionality):

11. ✅ All other API keys from the checklist above

---

## 🎯 QUICK VERIFICATION SCRIPT

Run this in your browser console on the deployed site:

```javascript
// Check if environment variables are accessible
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Access Code:', process.env.NEXT_PUBLIC_ACCESS_CODE);
console.log('ATGE Password:', process.env.NEXT_PUBLIC_ATGE_PASSWORD);

// Note: Server-side variables won't be visible here (that's correct!)
```

---

**Status**: ✅ Complete Configuration Guide  
**Last Updated**: January 27, 2025  
**Total Variables**: 50+ environment variables

**Next Steps**: Set all CRITICAL variables in Vercel, then redeploy!
