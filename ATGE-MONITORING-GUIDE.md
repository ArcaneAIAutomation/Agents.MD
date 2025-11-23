# ATGE Production Monitoring Guide

**Last Updated**: January 27, 2025  
**Status**: ✅ Complete  
**Version**: 1.0.0

---

## Overview

This guide provides comprehensive instructions for monitoring the ATGE (AI Trade Generation Engine) system in production. The monitoring system tracks:

- ✅ Vercel cron job execution (hourly trade verification)
- ✅ Trade verification status and performance
- ✅ OpenAI API costs and usage
- ✅ CoinMarketCap/CoinGecko API usage
- ✅ System health and errors
- ✅ Automated alerts for issues

---

## Monitoring Tools

### 1. Command-Line Monitoring Script

**Location**: `scripts/monitor-atge-production.ts`

**Usage**:
```bash
# Run monitoring report
npx tsx scripts/monitor-atge-production.ts
```

**Features**:
- Generates comprehensive monitoring report
- Checks all system components
- Identifies issues and provides recommendations
- Saves report to `monitoring-reports/` directory
- Returns exit code 1 if critical issues detected

**Output Example**:
```
═══════════════════════════════════════════════════════════
  ATGE PRODUCTION MONITORING REPORT
═══════════════════════════════════════════════════════════
Generated: 1/27/2025, 10:30:00 AM

📅 CRON JOB STATUS
─────────────────────────────────────────────────────────
Last Run: 1/27/2025, 10:00:00 AM
Runs Today: 10
Failures (24h): 0
✅ Cron job running as expected

📊 TRADE VERIFICATION
─────────────────────────────────────────────────────────
Active Trades: 15
Verified (24h): 240
Failed Verifications: 2
Avg Verification Time: 12s
✅ Verification performance within target

💰 API COSTS (OpenAI)
─────────────────────────────────────────────────────────
API Calls (24h): 25
Estimated Cost (24h): $0.35
Monthly Projection: $10.50
✅ Costs within budget

📈 MARKET DATA API USAGE
─────────────────────────────────────────────────────────
CoinMarketCap Calls: 180
CoinGecko Calls: 60
Failure Rate: 0.83%
✅ API reliability good

🏥 SYSTEM HEALTH
─────────────────────────────────────────────────────────
Database: ✅ Connected
Recent Errors: 0
Performance Issues: 0

═══════════════════════════════════════════════════════════
✅ ALL SYSTEMS OPERATIONAL
═══════════════════════════════════════════════════════════
```

### 2. API Monitoring Endpoint

**Endpoint**: `GET /api/atge/monitoring`

**Usage**:
```bash
# Fetch monitoring data
curl https://news.arcane.group/api/atge/monitoring
```

**Response**:
```json
{
  "timestamp": "2025-01-27T10:30:00.000Z",
  "cronJobStatus": {
    "lastRun": "2025-01-27T10:00:00.000Z",
    "runsToday": 10,
    "failuresLast24h": 0,
    "status": "healthy"
  },
  "tradeVerification": {
    "totalActiveTrades": 15,
    "verifiedLast24h": 240,
    "failedVerifications": 2,
    "averageVerificationTime": 12,
    "status": "healthy"
  },
  "apiCosts": {
    "openaiCalls": 25,
    "estimatedCost": 0.35,
    "monthlyProjection": 10.50,
    "status": "healthy"
  },
  "marketDataAPI": {
    "coinMarketCapCalls": 180,
    "coinGeckoCalls": 60,
    "failureRate": 0.83,
    "status": "healthy"
  },
  "systemHealth": {
    "databaseConnected": true,
    "recentErrors": 0,
    "performanceIssues": 0,
    "status": "healthy"
  },
  "overallStatus": "healthy",
  "alerts": []
}
```

### 3. Monitoring Dashboard Component

**Component**: `components/ATGE/MonitoringDashboard.tsx`

**Usage**:
```tsx
import MonitoringDashboard from '../components/ATGE/MonitoringDashboard';

function AdminPage() {
  return (
    <div>
      <h1>ATGE System Monitoring</h1>
      <MonitoringDashboard />
    </div>
  );
}
```

**Features**:
- Real-time monitoring data display
- Auto-refresh every 5 minutes
- Visual status indicators (green/yellow/red)
- Alert notifications
- Manual refresh button

---

## Monitoring Metrics

### 1. Cron Job Status

**What it monitors**:
- Last execution time
- Number of runs today (should be ~24)
- Failed verifications in last 24 hours

**Thresholds**:
- ✅ **Healthy**: 12+ runs today
- ⚠️ **Warning**: 6-11 runs today
- ❌ **Error**: <6 runs today

**Common Issues**:
- Cron job not configured in Vercel
- CRON_SECRET mismatch
- Function timeout

### 2. Trade Verification

**What it monitors**:
- Total active trades
- Trades verified in last 24 hours
- Failed verifications
- Average verification time

**Thresholds**:
- ✅ **Healthy**: Avg time ≤30s
- ⚠️ **Warning**: Avg time >30s

**Common Issues**:
- API rate limits
- Network timeouts
- Invalid trade data

### 3. API Costs (OpenAI)

**What it monitors**:
- API calls in last 24 hours
- Estimated cost for 24 hours
- Monthly cost projection

**Thresholds**:
- ✅ **Healthy**: Monthly projection ≤$100
- ⚠️ **Warning**: Monthly projection $100-$150
- ❌ **Error**: Monthly projection >$150

**Cost Breakdown**:
- Trade signal generation: ~$0.01 per call
- Trade analysis: ~$0.02 per call
- Target: <$100/month total

### 4. Market Data API

**What it monitors**:
- CoinMarketCap API calls
- CoinGecko API calls
- API failure rate

**Thresholds**:
- ✅ **Healthy**: Failure rate ≤5%
- ⚠️ **Warning**: Failure rate 5-10%
- ❌ **Error**: Failure rate >10%

**Common Issues**:
- API key expired
- Rate limit exceeded
- Network connectivity

### 5. System Health

**What it monitors**:
- Database connectivity
- Recent errors
- Performance issues

**Thresholds**:
- ✅ **Healthy**: Database connected, no errors
- ❌ **Error**: Database disconnected or errors present

---

## Alert System

### Alert Severities

1. **CRITICAL**: System is down or non-functional
   - Database disconnected
   - All API calls failing

2. **HIGH**: Major functionality impaired
   - Cron job not running
   - API costs exceeding budget
   - High API failure rate

3. **MEDIUM**: Degraded performance
   - Slow verification times
   - Approaching cost limits

4. **LOW**: Minor issues
   - Occasional API failures
   - Non-critical warnings

### Alert Actions

Each alert includes:
- **Message**: Description of the issue
- **Action**: Recommended fix

**Example Alert**:
```
[HIGH] Monthly cost projection ($125.50) exceeds $100 budget
Action: Review API usage and optimize calls
```

---

## Vercel Monitoring

### 1. Check Cron Job Logs

**Steps**:
1. Go to https://vercel.com/dashboard
2. Select project → Deployments
3. Click latest deployment → Functions
4. Find `/api/cron/atge-verify-trades`
5. View execution logs

**What to look for**:
- Execution frequency (should be hourly)
- Execution duration (should be <30s)
- Error messages
- Success/failure status

### 2. Check Function Logs

**Steps**:
1. Go to Vercel dashboard
2. Select project → Logs
3. Filter by function: `/api/atge/verify-trades`
4. Check for errors or warnings

**Common Log Messages**:
```
✅ "Verified 15 trades successfully"
⚠️ "CoinMarketCap API rate limit exceeded, using CoinGecko"
❌ "Failed to verify trade: Network timeout"
```

### 3. Monitor Function Duration

**Target**: <30 seconds for verification
**Max**: 60 seconds (function timeout)

**If exceeding target**:
- Optimize database queries
- Reduce API calls
- Implement parallel processing

---

## Database Monitoring

### Check Trade Verification Status

```sql
-- Active trades
SELECT COUNT(*) 
FROM trade_signals 
WHERE status = 'active' AND expires_at > NOW();

-- Verified trades (last 24h)
SELECT COUNT(*) 
FROM trade_results 
WHERE last_verified_at >= NOW() - INTERVAL '24 hours';

-- Failed verifications (last 24h)
SELECT COUNT(*) 
FROM trade_results 
WHERE verification_data_source = 'failed' 
  AND last_verified_at >= NOW() - INTERVAL '24 hours';
```

### Check Cron Job Execution

```sql
-- Last verification time
SELECT MAX(last_verified_at) 
FROM trade_results;

-- Verifications per hour (last 24h)
SELECT 
  DATE_TRUNC('hour', last_verified_at) as hour,
  COUNT(*) as verifications
FROM trade_results
WHERE last_verified_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

---

## Cost Monitoring

### OpenAI API Costs

**Tracking**:
1. Go to https://platform.openai.com/usage
2. View usage for current month
3. Compare with projections

**Cost Breakdown**:
- GPT-5.1 with medium reasoning: ~$0.01 per trade signal
- GPT-5.1 with high reasoning: ~$0.02 per analysis
- Target: <$100/month total

**Optimization Tips**:
- Use medium reasoning for trade signals (not high)
- Cache analysis results
- Limit analysis to completed trades only
- Batch API calls when possible

### CoinMarketCap API Usage

**Tracking**:
1. Go to https://pro.coinmarketcap.com/account
2. View API usage dashboard
3. Check remaining credits

**Rate Limits**:
- Free tier: 333 calls/day
- Paid tier: Varies by plan

**Optimization Tips**:
- Cache price data (5-10 minutes)
- Use CoinGecko as fallback
- Batch requests when possible

---

## Troubleshooting

### Issue: Cron Job Not Running

**Symptoms**:
- `runsToday` < 12
- `lastRun` is old or null

**Solutions**:
1. Check Vercel cron configuration in `vercel.json`
2. Verify CRON_SECRET environment variable
3. Check function logs for errors
4. Redeploy if needed

### Issue: High API Costs

**Symptoms**:
- `monthlyProjection` > $100
- High `openaiCalls` count

**Solutions**:
1. Review reasoning effort levels (use medium, not high)
2. Reduce analysis frequency
3. Cache results longer
4. Limit analysis to important trades only

### Issue: High API Failure Rate

**Symptoms**:
- `failureRate` > 5%
- Many failed verifications

**Solutions**:
1. Check API keys are valid
2. Verify rate limits not exceeded
3. Check network connectivity
4. Implement better retry logic

### Issue: Slow Verification

**Symptoms**:
- `averageVerificationTime` > 30s
- Function timeouts

**Solutions**:
1. Optimize database queries
2. Reduce API calls
3. Implement parallel processing
4. Increase function timeout (if needed)

---

## Automated Monitoring

### Set Up Automated Checks

**Option 1: Cron Job**
```bash
# Add to crontab (runs every hour)
0 * * * * cd /path/to/project && npx tsx scripts/monitor-atge-production.ts >> /var/log/atge-monitoring.log 2>&1
```

**Option 2: GitHub Actions**
```yaml
# .github/workflows/monitor.yml
name: ATGE Monitoring
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run monitoring
        run: npx tsx scripts/monitor-atge-production.ts
```

**Option 3: Vercel Cron**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/atge/monitoring-check",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Set Up Alerts

**Option 1: Email Alerts**
- Use SendGrid or similar service
- Send email when alerts detected
- Include alert details and actions

**Option 2: Slack Alerts**
- Use Slack webhook
- Post to monitoring channel
- Tag relevant team members

**Option 3: PagerDuty**
- Integrate with PagerDuty
- Create incidents for critical alerts
- On-call rotation

---

## Best Practices

### Daily Monitoring

1. **Check monitoring dashboard** (5 minutes)
   - Review overall status
   - Check for alerts
   - Verify cron job running

2. **Review cost projections** (2 minutes)
   - Check monthly projection
   - Verify within budget
   - Adjust if needed

3. **Check API health** (2 minutes)
   - Verify low failure rate
   - Check rate limits
   - Review error logs

### Weekly Monitoring

1. **Review trends** (15 minutes)
   - Compare week-over-week metrics
   - Identify patterns
   - Plan optimizations

2. **Check database performance** (10 minutes)
   - Review query performance
   - Check table sizes
   - Optimize if needed

3. **Review API costs** (10 minutes)
   - Analyze cost breakdown
   - Identify optimization opportunities
   - Implement improvements

### Monthly Monitoring

1. **Generate monthly report** (30 minutes)
   - Compile all metrics
   - Calculate totals
   - Document issues and fixes

2. **Review and optimize** (1 hour)
   - Analyze performance trends
   - Implement optimizations
   - Update monitoring thresholds

3. **Plan improvements** (1 hour)
   - Identify areas for improvement
   - Plan feature enhancements
   - Schedule maintenance

---

## Monitoring Checklist

### Daily
- [ ] Check monitoring dashboard
- [ ] Review alerts
- [ ] Verify cron job running
- [ ] Check API costs

### Weekly
- [ ] Review trends
- [ ] Check database performance
- [ ] Analyze API usage
- [ ] Review error logs

### Monthly
- [ ] Generate monthly report
- [ ] Review and optimize
- [ ] Plan improvements
- [ ] Update documentation

---

## Support

### Getting Help

1. **Check logs**: Vercel function logs
2. **Review documentation**: This guide
3. **Check database**: Run diagnostic queries
4. **Contact support**: If issues persist

### Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- OpenAI Usage: https://platform.openai.com/usage
- CoinMarketCap API: https://pro.coinmarketcap.com/account
- Supabase Dashboard: https://supabase.com/dashboard

---

**Status**: ✅ Monitoring System Complete  
**Last Updated**: January 27, 2025  
**Version**: 1.0.0

**The ATGE monitoring system is fully operational and ready for production use!** 🚀
