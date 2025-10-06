# Whale Watch Intelligence - Design Document

## User Experience Flow

### 1. Main Dashboard View
```
┌─────────────────────────────────────────────┐
│ 🐋 Whale Watch Intelligence                 │
│                                             │
│ [Live] [24h] [7d] [All]    🔔 Alerts: 3    │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 🔴 LIVE  Exchange Deposit Detected   │   │
│ │ 2,547 BTC → Binance                  │   │
│ │ $312.4M • 5 minutes ago              │   │
│ │                                       │   │
│ │ 📊 Impact: BEARISH (85% confidence)  │   │
│ │ 🔍 Caesar Analysis: Ready            │   │
│ │ [View Details] [Show Research]       │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 🟡 Accumulation Pattern               │   │
│ │ 1,234 ETH → Unknown Wallet           │   │
│ │ $5.6M • 1 hour ago                   │   │
│ │                                       │   │
│ │ 📊 Impact: BULLISH (72% confidence)  │   │
│ │ 🔍 Caesar Analysis: In Progress...   │   │
│ │ [View Details]                       │   │
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 2. Transaction Detail View
```
┌─────────────────────────────────────────────┐
│ ← Back to Feed                              │
├─────────────────────────────────────────────┤
│ 🐋 Whale Transaction Analysis               │
│                                             │
│ Transaction Hash:                           │
│ 0x7a8f...3d2e [Copy] [Etherscan]          │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Amount: 2,547.32 BTC                 │   │
│ │ Value: $312,456,789                  │   │
│ │ Time: Jan 6, 2025 14:23 UTC         │   │
│ │                                       │   │
│ │ From: bc1q...7x9k (Unknown)          │   │
│ │ To: bc1q...3m2p (Binance Hot Wallet) │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ 🤖 AI Analysis (Caesar Research)            │
│ ┌─────────────────────────────────────┐   │
│ │ Type: Exchange Deposit               │   │
│ │ Confidence: 85%                      │   │
│ │                                       │   │
│ │ Key Findings:                        │   │
│ │ • Large deposit to Binance hot wallet│   │
│ │ • Timing coincides with BTC rally    │   │
│ │ • Similar pattern seen before dumps  │   │
│ │ • Whale has history of selling peaks │   │
│ │                                       │   │
│ │ Impact Prediction: BEARISH           │   │
│ │ Reasoning: Exchange deposits typically│   │
│ │ indicate selling pressure. Historical│   │
│ │ data shows 78% of similar moves led  │   │
│ │ to 2-5% price drops within 24h.     │   │
│ │                                       │   │
│ │ [▼ Show 5 Sources]                   │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ 📈 Price Impact                             │
│ ┌─────────────────────────────────────┐   │
│ │ At Transaction: $122,750             │   │
│ │ After 1h: $122,340 (-0.33%)         │   │
│ │ After 24h: Pending...                │   │
│ │                                       │   │
│ │ [Price Chart]                        │   │
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 3. Sources Modal
```
┌─────────────────────────────────────────────┐
│ 📚 Research Sources                    [×]  │
├─────────────────────────────────────────────┤
│                                             │
│ 1. CoinDesk: "Binance Sees Large BTC..."   │
│    Relevance: 92%                           │
│    [Read Article] [Show Raw Text]          │
│                                             │
│ 2. Whale Alert: "2,547 BTC transferred..." │
│    Relevance: 88%                           │
│    [Read Tweet] [Show Raw Text]            │
│                                             │
│ 3. Glassnode: "Exchange Inflows Spike..."  │
│    Relevance: 85%                           │
│    [Read Analysis] [Show Raw Text]         │
│                                             │
│ 4. CryptoQuant: "Binance Reserve Data..."  │
│    Relevance: 79%                           │
│    [Read Report] [Show Raw Text]           │
│                                             │
│ 5. Twitter: "@WhalePanda analysis..."      │
│    Relevance: 71%                           │
│    [Read Thread] [Show Raw Text]           │
│                                             │
│ ✅ All sources verified by Caesar AI        │
└─────────────────────────────────────────────┘
```

## Visual Design System

### Color Coding

**Transaction Types:**
- 🔴 Red: Exchange Deposit (Bearish)
- 🟢 Green: Exchange Withdrawal (Bullish)
- 🟡 Yellow: Accumulation (Bullish)
- 🟠 Orange: Distribution (Bearish)
- 🔵 Blue: OTC/Unknown (Neutral)

**Confidence Levels:**
- 90-100%: Dark green badge
- 70-89%: Light green badge
- 50-69%: Yellow badge
- <50%: Gray badge

### Typography
- Transaction amounts: Bold, 2xl
- USD values: Regular, xl
- Timestamps: Small, gray
- Analysis text: Regular, base
- Sources: Small, blue links

### Icons
- 🐋 Whale emoji for branding
- 📊 Chart for impact
- 🔍 Magnifying glass for analysis
- 🔔 Bell for alerts
- 📰 News for sources
- ⚡ Lightning for real-time

## Component Architecture

```
components/
├── WhaleWatch/
│   ├── WhaleWatchDashboard.tsx      # Main container
│   ├── WhaleTransactionCard.tsx     # Individual transaction card
│   ├── WhaleDetailModal.tsx         # Full transaction details
│   ├── CaesarAnalysisPanel.tsx      # AI analysis display
│   ├── SourcesModal.tsx             # Citations and sources
│   ├── PriceImpactChart.tsx         # Price visualization
│   ├── WhaleAlertSettings.tsx       # Alert configuration
│   └── WhalePatternsView.tsx        # Historical patterns
```

## Mobile-First Design

### Card Layout (Mobile)
```
┌─────────────────────┐
│ 🔴 Exchange Deposit │
│ 2,547 BTC           │
│ $312.4M             │
│ 5 min ago           │
│                     │
│ BEARISH 85%         │
│ [Tap for Details]  │
└─────────────────────┘
```

### Swipe Actions
- Swipe Right: View Details
- Swipe Left: Dismiss/Archive
- Long Press: Quick Actions Menu

### Progressive Disclosure
1. **Card**: Basic info (amount, time, impact)
2. **Tap**: Full details + Caesar analysis
3. **Expand**: Sources and raw research
4. **Deep Dive**: Historical patterns

## Animation & Interactions

### Real-Time Updates
- New transaction: Slide in from top with pulse
- Analysis complete: Green checkmark animation
- Price update: Number counter animation

### Loading States
- Caesar analysis: Animated thinking dots
- Price data: Skeleton loader
- Sources: Progressive loading

### Micro-interactions
- Hover: Card lift with shadow
- Click: Ripple effect
- Success: Checkmark bounce
- Error: Shake animation

## Accessibility

- WCAG 2.1 AA compliant
- Screen reader friendly
- Keyboard navigation
- High contrast mode
- Focus indicators
- Alt text for all icons

## Performance Optimization

### Caching Strategy
- Transaction list: 30 seconds
- Caesar analysis: 24 hours
- Price data: 1 minute
- Historical patterns: 1 hour

### Lazy Loading
- Load 10 transactions initially
- Infinite scroll for more
- Defer Caesar analysis until viewed
- Lazy load price charts

### Real-Time Updates
- WebSocket for live transactions
- Fallback to polling (30s)
- Optimistic UI updates
- Background sync

## Error Handling

### Caesar API Failures
```
┌─────────────────────────────────────┐
│ ⚠️ Analysis Temporarily Unavailable │
│                                     │
│ Caesar AI is processing this        │
│ transaction. Check back in 2-3 min. │
│                                     │
│ [Retry Now] [Notify Me]            │
└─────────────────────────────────────┘
```

### Blockchain API Failures
```
┌─────────────────────────────────────┐
│ ⚠️ Unable to Fetch Transaction      │
│                                     │
│ Blockchain API is temporarily down. │
│ Using cached data from 5 min ago.   │
│                                     │
│ [Retry] [View Cached]              │
└─────────────────────────────────────┘
```

## Integration Points

### Existing Features
- Link to Trading Zones: "See impact on zones"
- Link to News Feed: "Related news articles"
- Link to Price Charts: "View price action"

### Future Features
- Alert system integration
- Portfolio impact calculator
- Social sharing
- Export to CSV/PDF
