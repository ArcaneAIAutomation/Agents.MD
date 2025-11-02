# UCIE Quick Reference Card

**Status**: 🟢 LIVE  
**URL**: https://news.arcane.group/ucie

---

## 🔗 API Endpoints

### Health & Monitoring
```bash
GET /api/ucie/health          # System health check
GET /api/ucie/metrics         # Usage analytics
GET /api/ucie/cache-stats     # Cache performance
```

### Watchlist (Auth Required)
```bash
GET    /api/ucie/watchlist              # Get watchlist
POST   /api/ucie/watchlist              # Add token
DELETE /api/ucie/watchlist?symbol=BTC   # Remove token
```

### Alerts (Auth Required)
```bash
GET    /api/ucie/alerts                 # Get alerts
POST   /api/ucie/alerts                 # Create alert
PATCH  /api/ucie/alerts                 # Update alert
DELETE /api/ucie/alerts?alertId=UUID    # Delete alert
```

---

## 📊 Database Tables

```
ucie_analysis_cache    - Persistent analysis caching
ucie_watchlist         - User token watchlists
ucie_alerts            - Custom price/event alerts
ucie_api_costs         - API cost tracking
ucie_analysis_history  - Analysis tracking
```

---

## 🔧 Key Functions

### Database (`lib/ucie/database.ts`)
```typescript
// Watchlist
getUserWatchlist(userId)
addToWatchlist(userId, symbol)
removeFromWatchlist(userId, symbol)
isInWatchlist(userId, symbol)

// Alerts
getUserAlerts(userId)
createAlert(userId, symbol, type, threshold)
updateAlert(alertId, userId, updates)
deleteAlert(alertId, userId)

// Analytics
recordAnalysis(symbol, type, quality, time, userId)
getAnalysisStats()
getApiCostSummary(days)
```

---

## 🚀 Quick Commands

### Test Locally
```bash
npm run dev
curl http://localhost:3000/api/ucie/health
```

### Deploy
```bash
git add .
git commit -m "feat: UCIE updates"
git push origin main
```

### Verify Production
```bash
curl https://news.arcane.group/api/ucie/health
curl https://news.arcane.group/api/ucie/metrics
```

---

## 📚 Documentation

- **User Guide**: `UCIE-USER-GUIDE.md`
- **Developer Docs**: `UCIE-DEVELOPER-DOCS.md`
- **Deployment**: `UCIE-DEPLOYMENT-SUCCESS.md`
- **Troubleshooting**: `UCIE-TROUBLESHOOTING.md`

---

## 🎯 Success Criteria

- ✅ Health check: 200 OK
- ✅ Metrics: 200 OK
- ✅ Database: 5 tables
- ✅ Cache: Redis connected
- ✅ APIs: All configured
- ✅ CI/CD: Automated

---

**Last Updated**: January 27, 2025
