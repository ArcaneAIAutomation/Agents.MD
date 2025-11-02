# UCIE Troubleshooting Guide

## Quick Reference for Common Issues

This guide helps you diagnose and fix common issues with the Universal Crypto Intelligence Engine (UCIE).

**Last Updated**: January 2025

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [API Issues](#api-issues)
3. [Performance Issues](#performance-issues)
4. [Data Issues](#data-issues)
5. [Caching Issues](#caching-issues)
6. [Deployment Issues](#deployment-issues)
7. [Mobile Issues](#mobile-issues)
8. [Error Messages](#error-messages)

---

## Quick Diagnostics

### Health Check

Run the health check endpoint to verify system status:

```bash
curl https://news.arcane.group/api/ucie/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T...",
  "apis": {
    "etherscan": "configured",
    "lunarcrush": "configured",
    "twitter": "configured",
    "coinglass": "configured",
    "caesar": "configured"
  },
  "cache": {
    "redis": true,
    "database": true
  }
}
```

### Verify API Keys

```bash
npm run validate:ucie-keys
```

**Expected Output:**
```
✅ All critical UCIE API keys configured
✅ Redis connection successful
✅ Database connection successful
✅ Caesar API key valid
```

---

## API Issues

### Issue: API Key Not Working

**Symptoms:**
- 401 Unauthorized errors
- Missing data sections
- "API key invalid" messages

**Diagnosis:**
```bash
# Check if key is set
echo $ETHERSCAN_API_KEY

# Test key directly
curl "https://api.etherscan.io/api?module=stats&action=ethprice&apikey=$ETHERSCAN_API_KEY"
```

**Solutions:**

1. **Verify key is configured:**
   - Check `.env.local` file
   - Verify Vercel environment variables
   - Ensure no extra spaces or quotes

2. **Check key is active:**
   - Log into API provider dashboard
   - Verify key hasn't expired
   - Check usage limits

3. **Regenerate key:**
   - Create new key in provider dashboard
   - Update `.env.local` and Vercel
   - Redeploy application

### Issue: Rate Limit Exceeded

**Symptoms:**
- 429 Too Many Requests errors
- Slow or failed requests
- "Rate limit exceeded" messages

**Diagnosis:**
```bash
# Check API usage
curl https://news.arcane.group/api/ucie/costs?timeframe=24h
```

**Solutions:**

1. **Implement caching:**
   - Verify Redis is working
   - Check cache hit rates
   - Increase TTL values

2. **Upgrade API tier:**
   - Check current tier limits
   - Upgrade to paid tier if needed
   - Use multiple API keys

3. **Add request queuing:**
   - Implement exponential backoff
   - Queue requests during high load
   - Spread requests over time

### Issue: API Timeout

**Symptoms:**
- Requests taking > 30 seconds
- Timeout errors
- Incomplete data

**Diagnosis:**
```bash
# Test API response time
time curl https://news.arcane.group/api/ucie/analyze/BTC
```

**Solutions:**

1. **Increase timeout:**
   - Update `vercel.json` maxDuration
   - Increase API client timeouts
   - Use streaming responses

2. **Optimize requests:**
   - Fetch data in parallel
   - Use batch endpoints
   - Reduce data payload

3. **Use fallback sources:**
   - Implement multi-source fallback
   - Cache partial results
   - Return progressive data

---

## Performance Issues

### Issue: Slow Analysis (> 15 seconds)

**Symptoms:**
- Analysis takes longer than expected
- Users complaining about speed
- High server load

**Diagnosis:**
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://news.arcane.group/api/ucie/analyze/BTC

# Check cache hit rate
curl https://news.arcane.group/api/ucie/costs?timeframe=1h
```

**Solutions:**

1. **Optimize caching:**
   ```typescript
   // Increase cache TTL
   export const CACHE_TTL = {
     MARKET_DATA: 60,  // Increase from 30s
     TECHNICAL: 120,   // Increase from 60s
   };
   ```

2. **Parallel fetching:**
   ```typescript
   // Fetch data in parallel
   const [market, technical, sentiment] = await Promise.all([
     fetchMarketData(symbol),
     fetchTechnicalData(symbol),
     fetchSentimentData(symbol),
   ]);
   ```

3. **Progressive loading:**
   ```typescript
   // Return partial data immediately
   res.status(200).json({ phase: 1, data: criticalData });
   // Continue fetching in background
   ```

### Issue: High Memory Usage

**Symptoms:**
- Vercel function out of memory
- Slow performance
- Crashes under load

**Diagnosis:**
```bash
# Check Vercel function logs
vercel logs --project=agents-md

# Monitor memory usage
# Vercel Dashboard → Functions → Memory Usage
```

**Solutions:**

1. **Increase memory limit:**
   ```json
   // vercel.json
   {
     "functions": {
       "pages/api/ucie/**/*.ts": {
         "memory": 1024  // Increase from 512
       }
     }
   }
   ```

2. **Optimize data structures:**
   ```typescript
   // Don't store large arrays in memory
   // Stream data instead
   // Use generators for large datasets
   ```

3. **Clear unused data:**
   ```typescript
   // Clear references after use
   data = null;
   // Force garbage collection (Node.js)
   if (global.gc) global.gc();
   ```

---

## Data Issues

### Issue: Missing Data Sections

**Symptoms:**
- Some analysis sections empty
- "Data not available" messages
- Low data quality score

**Diagnosis:**
```bash
# Check which APIs are failing
curl https://news.arcane.group/api/ucie/health

# Check specific token
curl https://news.arcane.group/api/ucie/analyze/OBSCURE_TOKEN
```

**Solutions:**

1. **Token not supported:**
   - Some tokens don't have all data types
   - Check if token is on supported chains
   - Verify token is listed on exchanges

2. **API temporarily down:**
   - Check API provider status pages
   - Wait and retry
   - Use fallback sources

3. **Implement graceful degradation:**
   ```typescript
   // Return partial data with quality score
   return {
     data: availableData,
     dataQualityScore: 60,  // Indicate partial data
     missingData: ['defi', 'derivatives'],
   };
   ```

### Issue: Incorrect Data

**Symptoms:**
- Wrong prices displayed
- Incorrect calculations
- Data doesn't match other sources

**Diagnosis:**
```bash
# Compare with multiple sources
curl https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd
curl https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC
```

**Solutions:**

1. **Verify data sources:**
   - Check API responses
   - Compare multiple sources
   - Validate calculations

2. **Fix calculation errors:**
   ```typescript
   // Ensure correct formulas
   const rsi = calculateRSI(prices, 14);  // Correct period
   const macd = calculateMACD(prices);    // Correct implementation
   ```

3. **Add data validation:**
   ```typescript
   function validatePrice(price: number): boolean {
     return price > 0 && price < 1000000000;  // Reasonable range
   }
   ```

---

## Caching Issues

### Issue: Stale Data

**Symptoms:**
- Old prices displayed
- Outdated news
- Cache not refreshing

**Diagnosis:**
```bash
# Check cache TTL
redis-cli TTL ucie:analysis:BTC

# Force refresh
curl https://news.arcane.group/api/ucie/analyze/BTC?refresh=true
```

**Solutions:**

1. **Reduce TTL:**
   ```typescript
   export const CACHE_TTL = {
     MARKET_DATA: 15,  // Reduce from 30s
   };
   ```

2. **Implement cache invalidation:**
   ```typescript
   // Invalidate on significant events
   if (priceChange > 5) {
     await invalidateCache(symbol);
   }
   ```

3. **Add manual refresh:**
   ```typescript
   // Allow users to force refresh
   <button onClick={() => refetch({ refresh: true })}>
     Refresh Data
   </button>
   ```

### Issue: Cache Not Working

**Symptoms:**
- Every request hits APIs
- Slow performance
- High API costs

**Diagnosis:**
```bash
# Test Redis connection
npm run test:redis-connection

# Check cache hit rate
curl https://news.arcane.group/api/ucie/costs?timeframe=1h
```

**Solutions:**

1. **Verify Redis connection:**
   ```bash
   # Check environment variables
   echo $KV_REST_API_URL
   echo $KV_REST_API_TOKEN
   
   # Test connection
   npm run test:redis-connection
   ```

2. **Check cache implementation:**
   ```typescript
   // Ensure cache is being used
   const cached = await getCachedAnalysis(symbol);
   if (cached) return cached;
   
   // Fetch and cache
   const data = await fetchAnalysis(symbol);
   await setCachedAnalysis(symbol, data, CACHE_TTL.ANALYSIS);
   ```

3. **Monitor cache metrics:**
   ```typescript
   // Track cache hits/misses
   const cacheHitRate = hits / (hits + misses);
   console.log(`Cache hit rate: ${cacheHitRate * 100}%`);
   ```

---

## Deployment Issues

### Issue: Build Fails

**Symptoms:**
- Vercel deployment fails
- TypeScript errors
- Missing dependencies

**Diagnosis:**
```bash
# Build locally
npm run build

# Check for errors
npm run lint
npx tsc --noEmit
```

**Solutions:**

1. **Fix TypeScript errors:**
   ```bash
   # Check for type errors
   npx tsc --noEmit
   
   # Fix errors in code
   # Ensure all types are correct
   ```

2. **Install missing dependencies:**
   ```bash
   npm install
   npm audit fix
   ```

3. **Clear build cache:**
   ```bash
   rm -rf .next
   npm run build
   ```

### Issue: Environment Variables Not Set

**Symptoms:**
- API calls failing in production
- "API key not configured" errors
- Features not working

**Diagnosis:**
```bash
# Check Vercel environment variables
vercel env ls

# Test in production
curl https://news.arcane.group/api/ucie/health
```

**Solutions:**

1. **Add missing variables:**
   - Go to Vercel Dashboard
   - Settings → Environment Variables
   - Add all required variables
   - Redeploy

2. **Verify variable names:**
   - Check exact spelling
   - Ensure no typos
   - Match `.env.example`

3. **Check variable scope:**
   - Ensure set for Production
   - Also set for Preview if needed
   - Redeploy after changes

---

## Mobile Issues

### Issue: Slow on Mobile

**Symptoms:**
- Long load times on mobile
- Laggy interactions
- High data usage

**Diagnosis:**
```bash
# Test mobile performance
npx lighthouse https://news.arcane.group/ucie --view

# Check bundle size
npm run build
# Check .next/static/chunks/
```

**Solutions:**

1. **Optimize bundle size:**
   ```typescript
   // Use dynamic imports
   const HeavyComponent = dynamic(() => import('./HeavyComponent'));
   
   // Code splitting
   // Lazy load below-fold content
   ```

2. **Reduce data payload:**
   ```typescript
   // Send minimal data to mobile
   if (isMobile) {
     return simplifiedData;
   }
   ```

3. **Optimize images:**
   ```typescript
   // Use Next.js Image component
   <Image
     src="/chart.png"
     width={800}
     height={400}
     loading="lazy"
   />
   ```

### Issue: Touch Targets Too Small

**Symptoms:**
- Hard to tap buttons
- Accidental clicks
- Poor mobile UX

**Diagnosis:**
```bash
# Run accessibility audit
npx lighthouse https://news.arcane.group/ucie --only-categories=accessibility
```

**Solutions:**

1. **Increase touch target size:**
   ```css
   .mobile-button {
     min-width: 48px;
     min-height: 48px;
     padding: 12px;
   }
   ```

2. **Add spacing:**
   ```css
   .mobile-buttons {
     gap: 8px;  /* Minimum spacing */
   }
   ```

3. **Test on real devices:**
   - Test on iPhone SE (smallest)
   - Test on iPad
   - Test on Android phones

---

## Error Messages

### "Token not found"

**Cause**: Token symbol not recognized or not supported

**Solution**:
- Check spelling
- Use autocomplete
- Try full token name
- Verify token is listed on major exchanges

### "Rate limit exceeded"

**Cause**: Too many API requests

**Solution**:
- Wait 60 seconds
- Use cached data
- Upgrade API tier
- Contact support if persistent

### "Analysis timeout"

**Cause**: Analysis taking too long

**Solution**:
- Retry request
- Check internet connection
- Try different token
- Report if persistent

### "Data quality low"

**Cause**: Some data sources unavailable

**Solution**:
- Accept partial data
- Retry later
- Check which sources failed
- Use alternative tokens

### "Cache error"

**Cause**: Redis connection issue

**Solution**:
- Check Redis status
- Verify connection string
- Restart Redis
- Use database fallback

### "Database error"

**Cause**: Database connection issue

**Solution**:
- Check database status
- Verify connection string
- Check connection pool
- Contact support

---

## Getting Help

### Before Contacting Support

1. Check this troubleshooting guide
2. Run health check endpoint
3. Check Vercel function logs
4. Try different token/browser
5. Clear cache and retry

### Support Channels

**Email**: support@arcane.group
**GitHub**: github.com/ArcaneAIAutomation/Agents.MD/issues
**Discord**: [Join our community]

### Information to Provide

When reporting issues, include:

1. **Error message** (exact text)
2. **Token symbol** being analyzed
3. **Browser** and version
4. **Device** (desktop/mobile)
5. **Steps to reproduce**
6. **Screenshots** if applicable
7. **Timestamp** of issue

### Emergency Contacts

**Critical Production Issues:**
- Email: emergency@arcane.group
- Response time: < 1 hour

**Security Issues:**
- Email: security@arcane.group
- Response time: < 30 minutes

---

## Monitoring & Logs

### View Logs

```bash
# Vercel function logs
vercel logs --project=agents-md

# Filter by function
vercel logs --project=agents-md --function=api/ucie/analyze

# Real-time logs
vercel logs --project=agents-md --follow
```

### Check Sentry

1. Go to sentry.io
2. Select UCIE project
3. View recent errors
4. Check error frequency
5. Review stack traces

### Monitor Performance

1. Vercel Dashboard → Analytics
2. Check response times
3. Monitor error rates
4. Review cache hit rates
5. Track API costs

---

## Preventive Maintenance

### Daily Checks

- [ ] Check error rate in Sentry
- [ ] Review API costs
- [ ] Monitor cache hit rates
- [ ] Check response times

### Weekly Checks

- [ ] Review performance trends
- [ ] Check for API rate limit issues
- [ ] Analyze user feedback
- [ ] Update documentation

### Monthly Checks

- [ ] Generate performance report
- [ ] Review and optimize costs
- [ ] Update API keys if needed
- [ ] Plan optimizations

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Bitcoin Sovereign Technology Team
