# UCIE Vercel Environment Variables Setup

## Overview

This document lists all environment variables that need to be configured in Vercel for the Universal Crypto Intelligence Engine (UCIE) to function properly.

**Status**: ✅ API Keys Configured (January 2025)

---

## Critical API Keys (REQUIRED)

### Blockchain Explorer APIs (On-Chain Analytics)

```bash
# Etherscan API (Ethereum + 50+ chains)
ETHERSCAN_API_KEY=6S8BPC9PYMKQXFX9P265NTMEYQAT98QQR2

# BSCScan API (Binance Smart Chain)
BSCSCAN_API_KEY=6S8BPC9PYMKQXFX9P265NTMEYQAT98QQR2

# Polygonscan API (Polygon network)
POLYGONSCAN_API_KEY=6S8BPC9PYMKQXFX9P265NTMEYQAT98QQR2
```

**Used for:**
- Top 100 holder distribution analysis
- Whale transaction detection (>$100k)
- Smart contract security analysis
- Exchange flow tracking
- Wallet behavior classification

**Rate Limits:** 5 calls/second, 100,000 calls/day (Free Tier)

---

### Social Sentiment APIs

```bash
# LunarCrush API (Social metrics)
LUNARCRUSH_API_KEY=r1pe78gm2tohk3mwp36cqj7hvmhhln82d856ck5

# Twitter/X API (Tweet analysis)
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAABfK5AEAAAAARfdLBBxO4WpoP6xWSbcwIGL%2Flg8%3Da6P1toyhhdev46d9AzsgAVt5WvSfPK9zuqD8wjWEpFoiJQlWar
TWITTER_ACCESS_TOKEN=3082600481-KsTyOVdM2xPNDY6cmoLkyZ5scuBagcuxt6VtSdg
TWITTER_ACCESS_TOKEN_SECRET=26BlLFspdcoSBAgmJlgYLhkeZDrL5qYhOrtwN56bScNZ9
```

**Used for:**
- Aggregate sentiment from multiple social platforms
- Track key influencers and their sentiment
- Identify trending topics and hashtags
- Detect sentiment shifts (>30 point changes)
- Calculate social volume and engagement metrics

**Rate Limits:**
- LunarCrush: 50 calls/day (Free), Unlimited (Pro)
- Twitter: 500,000 tweets/month (Essential), 2,000,000 (Elevated)

---

### Derivatives & DeFi APIs

```bash
# CoinGlass API (Derivatives data)
COINGLASS_API_KEY=84f2fb0a47f54d00a5108047a098dd74
```

**Used for:**
- Funding rates from 5+ exchanges
- Aggregated open interest tracking
- Liquidation level detection
- Long/short ratio analysis
- Squeeze potential indicators

**Rate Limits:** 100 calls/minute

---

## Already Configured (Existing)

These are already set up in Vercel and working:

```bash
# AI & Analysis
OPENAI_API_KEY=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
CAESAR_API_KEY=sk-572d19cd4d21.0XRZ1wLU0Vwnr6TpYkw3L2sWNgcsvzpXVuhVMN93HII
GEMINI_API_KEY=AIzaSyAvGqzDvYiaaDOMFDNiNlxMziO0zYIE3no

# Market Data
COINMARKETCAP_API_KEY=25a84887-8485-4c41-8a65-2ba34b1afa37
COINGECKO_API_KEY=CG-d46qMdV9g4Cwjcf36F9nHbzk
KRAKEN_API_KEY=39vCggkGgYp3fCCKumJCYDQv+i5vt8C1yAYr4upi1O3kYJmQb306LN2y
KRAKEN_PRIVATE_KEY=LHQooQRxQBr1kuoxtFZF2OjPS/HKbhnRvDUm2I07HjaDTLw7jFnOFJCxDTlc0FpwmyM+OY6ZAH8bqHO5ykMJ/w==

# News
NEWS_API_KEY=4a574a8cc6f04b5b950243b0e55d512a

# Authentication & Database
DATABASE_URL=postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres
JWT_SECRET=MB4t1ZWyxayaddBoKRSR8TrkGgkq4XEtPSJKgTnD0HI=
CRON_SECRET=UU+Yg64wcv3mkbqO2neEdzKiqZ49q2/uu8j/xTmYFyo=

# Rate Limiting (Redis Cloud)
KV_REST_API_URL=redis://default:P0yyIdZMnNwnIY2AR03fTmIgH31hktBs@redis-19137.c338.eu-west-2-1.ec2.redns.redis-cloud.com:19137
KV_REST_API_TOKEN=P0yyIdZMnNwnIY2AR03fTmIgH31hktBs

# Email (Office 365)
SENDER_EMAIL=no-reply@arcane.group
AZURE_TENANT_ID=c152592e-75fe-4f4f-8e8a-8acf38daf0b3
AZURE_CLIENT_ID=83bcb34c-3c73-41e9-8dc8-94d257e8755c
AZURE_CLIENT_SECRET=F6U8Q~J-GFXtxSBWf5paE3jyIsGoir6rKAgTWbTp

# Application
NEXT_PUBLIC_APP_URL=https://news.arcane.group
NEXT_PUBLIC_ACCESS_CODE=BITCOIN2025
```

---

## Optional APIs (Future Enhancement)

These can be added later for enhanced functionality:

```bash
# Reddit API (Higher rate limits)
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
REDDIT_USER_AGENT=UCIE/1.0

# Bybit API (Additional derivatives data)
BYBIT_API_KEY=your_bybit_api_key_here
BYBIT_SECRET_KEY=your_bybit_secret_key_here

# Deribit API (Options data)
DERIBIT_API_KEY=your_deribit_api_key_here
DERIBIT_SECRET_KEY=your_deribit_secret_key_here

# Messari API (Fundamental data)
MESSARI_API_KEY=your_messari_api_key_here

# Santiment API (Advanced social metrics)
SANTIMENT_API_KEY=your_santiment_api_key_here

# Glassnode API (Advanced on-chain metrics)
GLASSNODE_API_KEY=your_glassnode_api_key_here

# Nansen API (Smart money tracking)
NANSEN_API_KEY=your_nansen_api_key_here
```

---

## Configuration Settings

```bash
# Feature Flags
ENABLE_LIVE_DATA=true
ENABLE_AI_NEWS_ANALYSIS=true
ENABLE_ADVANCED_TA=true
ENABLE_CAESAR_NEWS_BRIEFS=true
ENABLE_CAESAR_MARKET_RESEARCH=true

# API Configuration
OPENAI_MODEL=gpt-4o-2024-08-06
GEMINI_MODEL=gemini-2.5-flash
GEMINI_ENABLE_THINKING=true
GEMINI_PRO_THRESHOLD_BTC=100
GEMINI_MAX_RETRIES=2
GEMINI_TIMEOUT_MS=28000

# Caesar Configuration
CAESAR_API_BASE_URL=https://api.caesar.xyz
CAESAR_COMPUTE_UNITS_DEFAULT=2

# JWT Configuration
JWT_EXPIRATION=7d
JWT_REMEMBER_ME_EXPIRATION=30d

# Rate Limiting
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000
API_CACHE_DURATION=300000
MAX_API_REQUESTS_PER_MINUTE=60

# Email Configuration
ENABLE_WELCOME_EMAIL=true
ENABLE_PASSWORD_RESET_EMAIL=true
ENABLE_SECURITY_ALERT_EMAIL=true
```

---

## Vercel Setup Instructions

### 1. Navigate to Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **Agents.MD**
3. Go to **Settings** → **Environment Variables**

### 2. Add New Variables

For each variable above:

1. Click **Add New**
2. Enter **Key** (e.g., `ETHERSCAN_API_KEY`)
3. Enter **Value** (e.g., `6S8BPC9PYMKQXFX9P265NTMEYQAT98QQR2`)
4. Select environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**

### 3. Redeploy

After adding all variables:

1. Go to **Deployments** tab
2. Click **...** on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

---

## Verification

After deployment, verify API keys are working:

```bash
# Test UCIE health endpoint
curl https://news.arcane.group/api/ucie/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-27T...",
  "apis": {
    "etherscan": "configured",
    "lunarcrush": "configured",
    "twitter": "configured",
    "coinglass": "configured",
    "caesar": "configured"
  }
}
```

---

## Security Notes

1. **Never commit API keys to Git** - Always use environment variables
2. **Rotate keys regularly** - Every 6-12 months or if compromised
3. **Use different keys per environment** - Separate dev/staging/production
4. **Monitor API usage** - Set up alerts for unusual activity
5. **Keep secrets secure** - Store in password manager

---

## Cost Estimates (Monthly)

Based on expected usage for 1,000 analyses/month:

| API | Free Tier | Paid Tier | Estimated Cost |
|-----|-----------|-----------|----------------|
| Etherscan | 100k calls/day | Unlimited | $0 (Free tier sufficient) |
| LunarCrush | 50 calls/day | Unlimited | $49/month (Pro tier) |
| Twitter | 500k tweets/month | 2M tweets/month | $100/month (Elevated) |
| CoinGlass | 100 calls/min | Unlimited | $0 (Free tier sufficient) |
| Caesar AI | Pay per use | Pay per use | ~$50/month (2 CU avg) |
| OpenAI GPT-4o | Pay per use | Pay per use | ~$100/month |
| Gemini | Free tier | Pay per use | ~$20/month |
| **Total** | | | **~$319/month** |

**Optimization Tips:**
- Use caching aggressively (30s-5min TTL)
- Implement request batching where possible
- Use free tiers for development/testing
- Monitor and optimize high-cost endpoints

---

## Troubleshooting

### API Key Not Working

1. Verify key is correctly copied (no extra spaces)
2. Check key is active in provider dashboard
3. Verify rate limits haven't been exceeded
4. Check API endpoint is correct
5. Review Vercel function logs for errors

### Rate Limit Errors

1. Implement exponential backoff
2. Add request queuing
3. Increase cache TTL
4. Upgrade to paid tier if needed

### Missing Data

1. Check API key is configured
2. Verify endpoint is accessible
3. Check fallback mechanisms are working
4. Review error logs for specific failures

---

## Next Steps

1. ✅ **Add all critical API keys to Vercel** (Completed)
2. ⏳ **Test each API endpoint individually**
3. ⏳ **Verify data flows through entire system**
4. ⏳ **Set up monitoring and alerts**
5. ⏳ **Create cost tracking dashboard**

---

**Last Updated**: January 27, 2025  
**Status**: ✅ API Keys Configured, Ready for Testing  
**Next**: Integration testing and verification

