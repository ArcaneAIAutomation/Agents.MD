# CoinGecko API Key Update Guide

**Date**: January 27, 2025  
**Status**: ✅ **LOCAL UPDATED** | ⏳ **VERCEL PENDING**  
**New Key**: `CG-BAMGkB8Chks4akehARJryMRU`

---

## What Was Updated

### ✅ Local Environment (.env.local)
**File**: `.env.local`  
**Variable**: `COINGECKO_API_KEY`  
**Old Value**: `CG-d46qMdV9g4Cwjcf36F9nHbzk`  
**New Value**: `CG-BAMGkB8Chks4akehARJryMRU`  
**Status**: ✅ **UPDATED**

---

## What Needs Manual Update

### ⏳ Vercel Environment Variables

You need to manually update the CoinGecko API key in Vercel:

#### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Select your project: **Agents.MD**
3. Click: **Settings** tab
4. Click: **Environment Variables** in left sidebar

#### Step 2: Find COINGECKO_API_KEY
1. Search for: `COINGECKO_API_KEY`
2. Click the **Edit** button (pencil icon)

#### Step 3: Update the Value
1. **Old Value**: `CG-d46qMdV9g4Cwjcf36F9nHbzk`
2. **New Value**: `CG-BAMGkB8Chks4akehARJryMRU`
3. Click **Save**

#### Step 4: Redeploy (Optional)
The new key will be used on the next deployment. To use it immediately:
1. Go to **Deployments** tab
2. Click **...** menu on latest deployment
3. Click **Redeploy**
4. Confirm redeploy

---

## Where CoinGecko API is Used

### UCIE Endpoints:
1. **Market Data** (`/api/ucie/market-data/[symbol]`)
   - Primary source for price, volume, market cap
   - Fallback to CoinMarketCap if CoinGecko fails

2. **Token Search** (`/api/ucie/search`)
   - Token list from CoinGecko
   - 24-hour cache

3. **Token Validation** (`/api/ucie/validate`)
   - Verify token exists
   - Get token metadata

### Rate Limits:
- **Free Tier**: 50 calls/minute
- **Pro Tier**: 500 calls/minute (if upgraded)
- **Demo Tier**: 30 calls/minute

### Current Usage:
- Market data: 30-second cache (reduces API calls)
- Token search: 24-hour cache (minimal API calls)
- Token validation: No cache (but infrequent)

---

## Testing the New Key

### Test Locally:
```bash
# Start development server
npm run dev

# Test market data endpoint
curl http://localhost:3000/api/ucie/market-data/BTC

# Expected: Real-time Bitcoin price data
```

### Test on Production (After Vercel Update):
```bash
# Test market data endpoint
curl https://news.arcane.group/api/ucie/market-data/BTC

# Expected: Real-time Bitcoin price data
```

### Verify in UCIE:
1. Go to: https://news.arcane.group/ucie
2. Search for: BTC
3. Check Market Data tab
4. **Expected**: Current price, volume, market cap

---

## Troubleshooting

### Issue: "Invalid API Key" Error
**Solution**: 
1. Verify key is correct: `CG-BAMGkB8Chks4akehARJryMRU`
2. Check Vercel environment variable is saved
3. Redeploy to apply changes

### Issue: "Rate Limit Exceeded"
**Solution**:
1. Check CoinGecko dashboard for usage
2. Increase cache TTL if needed
3. Consider upgrading to Pro tier

### Issue: Data Still Using Old Key
**Solution**:
1. Clear cache: `curl https://news.arcane.group/api/ucie/invalidate-cache`
2. Redeploy Vercel
3. Wait 30 seconds for cache to expire

---

## API Key Management

### Security Best Practices:
- ✅ Never commit API keys to git
- ✅ Use environment variables
- ✅ Rotate keys periodically
- ✅ Monitor usage for anomalies

### Key Rotation Schedule:
- **CoinGecko**: Every 6 months
- **OpenAI**: Every 3 months
- **Caesar**: Every 6 months
- **Database**: Every 12 months

---

## Verification Checklist

- [x] Updated `.env.local` with new key
- [ ] Updated Vercel environment variable
- [ ] Redeployed Vercel (optional, for immediate use)
- [ ] Tested market data endpoint locally
- [ ] Tested market data endpoint on production
- [ ] Verified UCIE shows real-time data
- [ ] Checked CoinGecko dashboard for usage

---

## Quick Commands

### Update Vercel Environment Variable (CLI):
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Update environment variable
vercel env rm COINGECKO_API_KEY production
vercel env add COINGECKO_API_KEY production
# Paste: CG-BAMGkB8Chks4akehARJryMRU

# Redeploy
vercel --prod
```

### Test API Key:
```bash
# Test CoinGecko API directly
curl -H "x-cg-pro-api-key: CG-BAMGkB8Chks4akehARJryMRU" \
  "https://pro-api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"

# Expected: {"bitcoin":{"usd":95000}}
```

---

## Status

**Local Environment**: ✅ **UPDATED**  
**Vercel Environment**: ⏳ **PENDING MANUAL UPDATE**  
**Production Impact**: None until Vercel is updated  
**Urgency**: Low (old key still works, update at convenience)

---

**Next Step**: Update Vercel environment variable using dashboard or CLI
