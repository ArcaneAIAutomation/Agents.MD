# UCIE Main Coordinator - Quick Start Guide

## Overview

The Universal Crypto Intelligence Engine (UCIE) Main Coordinator is now live! This guide will help you get started with analyzing cryptocurrencies using the most advanced analysis platform.

---

## Quick Start

### 1. Access UCIE
Navigate to: `http://localhost:3000/ucie`

### 2. Search for a Token
- Enter any cryptocurrency symbol (BTC, ETH, SOL, etc.)
- Use autocomplete suggestions
- View recent searches and popular tokens

### 3. View Analysis
- System validates token
- Automatically redirects to analysis page
- Progressive loading shows data in 4 phases

---

## Features

### Analysis Tabs

**Overview**
- Executive summary with key findings
- Consensus recommendation (STRONG_BUY to STRONG_SELL)
- Opportunities and risks
- Quick stats (price, market cap, volume, data quality)

**Market Data**
- Multi-exchange price comparison
- 24h volume and market cap
- Arbitrage opportunities
- Real-time price updates

**AI Research**
- Caesar AI deep research
- Technology overview
- Team and partnerships
- Risk factors with sources

**On-Chain**
- Top holder distribution
- Whale transactions
- Exchange flows
- Smart contract security

**Social**
- Overall sentiment score
- Sentiment trends
- Top social posts
- Key influencers

**News**
- Latest news articles
- AI impact assessment
- Breaking news highlights
- Categorized by type

**Technical**
- 15+ technical indicators
- Multi-timeframe analysis
- Support/resistance levels
- Chart patterns

**Predictions**
- 24h, 7d, 30d price forecasts
- Historical pattern matching
- Bull/base/bear scenarios
- Model accuracy metrics

**Risk**
- Overall risk score
- Volatility metrics
- Correlation analysis
- Maximum drawdown estimates

**Derivatives**
- Funding rates
- Open interest
- Liquidation levels
- Long/short ratios

**DeFi**
- Total Value Locked (TVL)
- Protocol revenue
- Token utility score
- Development activity

---

## Action Buttons

### Watchlist (Star Icon)
- Click to add/remove token from watchlist
- Access watchlist from user menu
- View all saved tokens

### Real-Time Updates (Refresh Icon)
- Toggle live price updates (every 5 seconds)
- Orange = Active, Gray = Disabled
- Automatic reconnection on errors

### Manual Refresh (Circular Arrow)
- Force refresh all data
- Useful after significant events
- Reloads all analysis sections

### Export (Download Icon)
- Export as PDF (formatted report)
- Export as JSON (raw data)
- Export as Markdown (text format)

### Share (Share Icon)
- Copy shareable link
- Share analysis with others
- Link includes token symbol

---

## Real-Time Features

### Price Updates
- Updates every 5 seconds when enabled
- Detects significant changes (>= 5%)
- Shows notification for major moves

### Event Notifications
- Price changes (>= 5%)
- Whale transactions (>= 50 BTC)
- Breaking news (< 2 hours old)
- Sentiment shifts

### Event Feed
- Last 50 events displayed
- Severity levels (low, medium, high, critical)
- Dismiss individual events
- Clear all events

---

## Watchlist

### Add to Watchlist
1. Click star icon on analysis page
2. Token added to your watchlist
3. Access from user menu

### View Watchlist
1. Click user menu
2. Select "Watchlist"
3. See all saved tokens
4. Click to analyze

### Remove from Watchlist
1. Click star icon again
2. Token removed
3. Confirmation shown

---

## Custom Alerts

### Create Alert
1. Click bell icon (coming soon)
2. Select alert type:
   - Price above threshold
   - Price below threshold
   - Sentiment change
   - Whale transaction
3. Set threshold value
4. Save alert

### Alert Types

**Price Above**
- Triggers when price exceeds threshold
- Example: Alert when BTC > $100,000

**Price Below**
- Triggers when price falls below threshold
- Example: Alert when BTC < $90,000

**Sentiment Change**
- Triggers on major sentiment shifts
- Example: Alert when sentiment drops 30 points

**Whale Transaction**
- Triggers on large transactions
- Example: Alert when whale moves > 100 BTC

### Manage Alerts
- View all alerts in user menu
- Enable/disable alerts
- Delete alerts
- Maximum 50 active alerts per user

---

## Data Quality

### Quality Score
- Displayed in header (0-100%)
- Based on successful data sources
- Higher = more reliable analysis

### Data Sources
- 10+ data sources integrated
- Graceful failure handling
- Partial data still useful

### Freshness
- Last update timestamp shown
- Real-time updates keep data fresh
- Manual refresh available

---

## Progressive Loading

### Phase 1: Critical (< 1s)
- Price
- Volume
- Market cap
- Basic info

### Phase 2: Important (1-3s)
- News articles
- Social sentiment
- Recent events

### Phase 3: Enhanced (3-7s)
- Technical indicators
- On-chain data
- Risk metrics
- Derivatives data
- DeFi metrics

### Phase 4: Deep Analysis (7-15s)
- Caesar AI research
- Price predictions
- Pattern recognition
- Comprehensive analysis

---

## Mobile Usage

### Responsive Design
- Works on all screen sizes
- Touch-optimized controls
- Horizontal scrolling tabs
- Collapsible sections

### Performance
- Progressive loading
- Efficient data fetching
- Smooth animations
- Fast navigation

---

## Tips & Tricks

### Best Practices
1. **Enable real-time updates** for active trading
2. **Add to watchlist** for quick access
3. **Set price alerts** for key levels
4. **Export reports** for record keeping
5. **Check data quality** before making decisions

### Keyboard Shortcuts
- `Ctrl/Cmd + R`: Refresh analysis
- `Ctrl/Cmd + S`: Add to watchlist
- `Ctrl/Cmd + E`: Export report
- `Esc`: Close modals

### Performance Tips
- Disable real-time updates when not needed
- Close unused tabs
- Clear browser cache periodically
- Use latest browser version

---

## Troubleshooting

### Analysis Not Loading
1. Check internet connection
2. Verify token symbol is valid
3. Try manual refresh
4. Check data quality score

### Real-Time Updates Not Working
1. Check if enabled (orange icon)
2. Verify internet connection
3. Try disabling and re-enabling
4. Check browser console for errors

### Watchlist Not Saving
1. Ensure you're logged in
2. Check authentication status
3. Try logging out and back in
4. Contact support if persists

### Alerts Not Triggering
1. Verify alert is active
2. Check threshold values
3. Ensure real-time updates enabled
4. Review alert status

---

## API Endpoints

### Analysis
```
GET /api/ucie/analyze/[symbol]
```

### Watchlist
```
GET /api/ucie/watchlist
POST /api/ucie/watchlist
DELETE /api/ucie/watchlist
```

### Alerts
```
GET /api/ucie/alerts
POST /api/ucie/alerts
PUT /api/ucie/alerts
DELETE /api/ucie/alerts
```

---

## Example Usage

### Analyze Bitcoin
1. Go to `/ucie`
2. Type "BTC" in search
3. Press Enter or click suggestion
4. View comprehensive analysis
5. Enable real-time updates
6. Add to watchlist
7. Set price alert at $100,000

### Compare Multiple Tokens
1. Analyze BTC
2. Add to watchlist
3. Go back to search
4. Analyze ETH
5. Add to watchlist
6. View watchlist to compare

### Export Report
1. Complete analysis loaded
2. Click export button
3. Select format (PDF/JSON/Markdown)
4. Download report
5. Share with team

---

## Support

### Documentation
- Full spec: `.kiro/specs/universal-crypto-intelligence/`
- Design doc: `.kiro/specs/universal-crypto-intelligence/design.md`
- Tasks: `.kiro/specs/universal-crypto-intelligence/tasks.md`

### Getting Help
- Check troubleshooting section
- Review error messages
- Check browser console
- Contact development team

---

## What's Next?

### Coming Soon
- Enhanced mobile optimization
- More alert types
- Portfolio integration
- Historical analysis comparison
- Custom dashboards
- API access for developers

### Feedback
- Report bugs via GitHub issues
- Suggest features
- Share your experience
- Help improve UCIE

---

**Status**: ✅ Live and Ready to Use  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025

**Start analyzing now**: `http://localhost:3000/ucie`
