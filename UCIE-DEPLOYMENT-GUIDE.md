# UCIE 2.0 Deployment Guide

**Version**: 2.0.0  
**Status**: Production Ready  
**Date**: January 27, 2025

---

## 🚀 Quick Deployment

### Prerequisites

1. **Node.js 18+** installed
2. **Supabase PostgreSQL** database configured
3. **API Keys** for all data sources
4. **Vercel Account** (for deployment)

### Environment Variables

Create `.env.local` with the following:

```bash
# Database
DATABASE_URL=postgres://user:pass@host:6543/postgres

# Authentication
JWT_SECRET=your-32-byte-random-string
CRON_SECRET=your-32-byte-random-string

# Market Data APIs
COINMARKETCAP_API_KEY=your-cmc-api-key
COINGECKO_API_KEY=your-coingecko-api-key
KRAKEN_API_KEY=your-kraken-api-key
KRAKEN_PRIVATE_KEY=your-kraken-private-key

# News & Research
NEWS_API_KEY=your-newsapi-key
CAESAR_API_KEY=your-caesar-api-key

# Social Sentiment
LUNARCRUSH_API_KEY=your-lunarcrush-api-key
TWITTER_BEARER_TOKEN=your-twitter-bearer-token
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret

# Blockchain
ETHERSCAN_API_KEY=your-etherscan-api-key
BLOCKCHAIN_API_KEY=your-blockchain-api-key
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# AI
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key

# Optional
COINGLASS_API_KEY=your-coinglass-api-key
```

---

## 📦 Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Database Migrations

```bash
npx tsx scripts/run-migrations.ts
```

### 3. Verify Database

```bash
npx tsx scripts/verify-database-storage.ts
```

Expected output:
```
✅ All tables exist
✅ Data is cached
✅ Database operational
```

### 4. Test Locally

```bash
npm run dev
```

Visit: http://localhost:3000/ucie

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run E2E Tests Only

```bash
npm test -- ucie-complete-flow.test.ts
```

### Run Specific Test Suite

```bash
npm test -- --testNamePattern="Multi-Asset Support"
```

---

## 🌐 Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy to Production

```bash
vercel --prod
```

### 4. Set Environment Variables

In Vercel Dashboard:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add all variables from `.env.local`
4. Redeploy

---

## 🔧 Configuration

### Database Configuration

**Supabase Connection**:
- Host: `db.your-project.supabase.co`
- Port: `6543` (connection pooling)
- Database: `postgres`
- SSL: Required

**Tables Required**:
1. `users` - User accounts
2. `access_codes` - Authentication codes
3. `sessions` - User sessions
4. `auth_logs` - Authentication logs
5. `ucie_analysis_cache` - Cached analysis
6. `ucie_phase_data` - Phase data storage
7. `ucie_watchlist` - User watchlists
8. `ucie_alerts` - User alerts

### API Configuration

**Rate Limits**:
- CoinMarketCap: Varies by plan
- CoinGecko: 50 calls/minute (free), unlimited (pro)
- NewsAPI: Varies by plan
- Caesar API: Varies by plan
- LunarCrush: Varies by plan

**Cache TTLs**:
- Market Data: 15 minutes
- Sentiment: 15 minutes
- News: 15 minutes
- Technical: 15 minutes
- On-Chain: 15 minutes
- Risk: 15 minutes
- Predictions: 15 minutes
- Derivatives: 15 minutes
- DeFi: 15 minutes
- Research: 15 minutes

---

## 📊 Monitoring

### Health Check Endpoint

```bash
curl https://news.arcane.group/api/ucie/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 123456,
  "database": "connected",
  "apis": {
    "coinmarketcap": "operational",
    "coingecko": "operational",
    "newsapi": "operational",
    ...
  }
}
```

### Cache Statistics

```bash
curl https://news.arcane.group/api/ucie/cache-stats
```

### Cost Tracking

```bash
curl https://news.arcane.group/api/ucie/costs
```

---

## 🐛 Troubleshooting

### Issue: Database Connection Failed

**Solution**:
1. Check `DATABASE_URL` format (no `?sslmode=require`)
2. Verify Supabase database is running
3. Check firewall settings
4. Test connection: `npx tsx scripts/test-database-access.ts`

### Issue: API Rate Limit Exceeded

**Solution**:
1. Check cache is working: `curl /api/ucie/cache-stats`
2. Increase cache TTL in endpoint files
3. Upgrade API plan if needed
4. Implement request queuing

### Issue: WebSocket Connection Failed

**Solution**:
1. Check browser console for errors
2. Verify exchange WebSocket URLs
3. Check firewall/proxy settings
4. Test with different exchange

### Issue: TradingView Chart Not Loading

**Solution**:
1. Check TradingView library loaded: `window.TradingView`
2. Verify container ID is unique
3. Check browser console for errors
4. Try different symbol or interval

---

## 🔄 Updates & Maintenance

### Update Dependencies

```bash
npm update
```

### Database Migrations

```bash
npx tsx scripts/run-migrations.ts
```

### Clear Cache

```bash
curl -X POST https://news.arcane.group/api/ucie/invalidate-cache \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTC","type":"all"}'
```

### Restart Services

```bash
vercel --prod
```

---

## 📈 Performance Optimization

### 1. Enable Caching

Ensure all endpoints use database cache:
```typescript
const cached = await getCachedAnalysis(symbol, type);
if (cached) return res.json(cached);
```

### 2. Optimize Database Queries

Use connection pooling:
```typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});
```

### 3. Enable Compression

In `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Content-Encoding", "value": "gzip" }
      ]
    }
  ]
}
```

### 4. Use CDN for Static Assets

Configure Vercel CDN for optimal performance.

---

## 🔐 Security Checklist

- [ ] All API keys in environment variables
- [ ] Database SSL enabled
- [ ] JWT tokens with httpOnly cookies
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled
- [ ] Input validation with Zod
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (security headers)
- [ ] Audit logging enabled
- [ ] HTTPS enforced

---

## 📞 Support

### Documentation
- UCIE System Guide: `.kiro/steering/ucie-system.md`
- API Integration: `.kiro/steering/api-integration.md`
- Authentication: `.kiro/steering/authentication.md`

### Testing
- Run tests: `npm test`
- Check database: `npx tsx scripts/verify-database-storage.ts`
- Test APIs: `npx tsx scripts/test-all-apis.ts`

### Monitoring
- Health check: `/api/ucie/health`
- Cache stats: `/api/ucie/cache-stats`
- Cost tracking: `/api/ucie/costs`

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] All tests passing (322/322)
- [ ] API keys valid
- [ ] Cache working
- [ ] WebSocket connections tested
- [ ] TradingView chart loading
- [ ] Health check passing
- [ ] Performance benchmarks met
- [ ] Security audit complete

---

**Status**: 🟢 **READY FOR PRODUCTION**  
**Version**: 2.0.0  
**Last Updated**: January 27, 2025

**Deploy with confidence. UCIE 2.0 is production-ready.** 🚀
