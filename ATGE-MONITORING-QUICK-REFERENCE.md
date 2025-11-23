# ATGE Monitoring - Quick Reference Card

**🚀 Quick Commands**

```bash
# Run full monitoring report
npx tsx scripts/monitor-atge-production.ts

# Check Vercel logs
bash scripts/check-vercel-logs.sh

# View live logs
vercel logs --follow

# Check cron job logs
vercel logs --filter=/api/cron/atge-verify-trades
```

---

**📊 Key Metrics**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Cron Success Rate | > 90% | < 90% |
| Last Cron Run | < 2 hours | > 2 hours |
| OpenAI Costs | < $100/month | > $80/month |
| Verification Time | < 30s | > 45s |
| Dashboard Load | < 2s | > 3s |

---

**🚨 Alert Levels**

**CRITICAL** (Immediate Action):
- Deployment unhealthy
- Cron job not running (> 2 hours)
- API costs > $100/month

**WARNING** (Monitor Closely):
- Success rate < 90%
- API costs > $80/month
- Win rate < 30%

---

**🔗 Quick Links**

- [Vercel Dashboard](https://vercel.com/dashboard)
- [OpenAI Usage](https://platform.openai.com/usage)
- [CoinMarketCap Account](https://pro.coinmarketcap.com/account)
- [Full Monitoring Guide](./ATGE-MONITORING-GUIDE.md)

---

**💡 Common Issues**

1. **Cron not running**: Check `vercel.json` config
2. **High costs**: Review reasoning effort levels
3. **Verification fails**: Check API keys and fallbacks
4. **Slow performance**: Review database indexes

---

**📅 Daily Checklist**

- [ ] Morning: Run monitoring script
- [ ] Afternoon: Check Vercel dashboard
- [ ] Evening: Review day's performance
- [ ] Weekly: Review cost trends
- [ ] Monthly: Optimize based on data

---

**Status**: ✅ Monitoring Active | **Last Updated**: January 27, 2025
