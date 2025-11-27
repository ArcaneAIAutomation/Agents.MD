# UCIE Integration Guide - Quick Start

**Date**: November 27, 2025  
**Purpose**: Integrate enhanced components into UCIE Analysis Hub

---

## 🎯 Quick Integration Steps

### Step 1: Update UCIEAnalysisHub Component

Replace the existing panel imports with the enhanced versions:

```typescript
// In components/UCIE/UCIEAnalysisHub.tsx

// OLD imports (remove these)
import SocialSentimentPanel from './SocialSentimentPanel';
import OnChainAnalyticsPanel from './OnChainAnalyticsPanel';

// NEW imports (add these)
import EnhancedSocialSentimentPanel from './EnhancedSocialSentimentPanel';
import EnhancedOnChainPanel from './EnhancedOnChainPanel';
```

### Step 2: Update Panel Rendering

Find the tab rendering section and update:

```typescript
// In the render section where tabs are displayed

{activeTab === 'social' && (
  <EnhancedSocialSentimentPanel
    data={analysisData?.sentiment}
    loading={loading && currentPhase <= 2}
    error={error}
  />
)}

{activeTab === 'onchain' && (
  <EnhancedOnChainPanel
    data={analysisData?.onChain}
    loading={loading && currentPhase <= 3}
    error={error}
  />
)}
```

### Step 3: Update Progressive Loading Hook

The hook is already configured correctly in `hooks/useProgressiveLoading.ts`:

```typescript
{
  phase: 2,
  label: 'Important Data (News & Sentiment)',
  endpoints: [
    `/api/ucie/news/${symbol}`,
    `/api/ucie/sentiment/${symbol}` // ✅ Already correct
  ],
  ...
},
{
  phase: 3,
  label: 'Enhanced Data (Technical, On-Chain, Risk, Derivatives, DeFi)',
  endpoints: [
    `/api/ucie/technical/${symbol}`,
    `/api/ucie/on-chain/${symbol}`, // ✅ Already correct
    ...
  ],
  ...
}
```

### Step 4: Test the Integration

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `/ucie`

3. Select BTC or ETH

4. Click on the "Social" tab - should show enhanced LunarCrush data

5. Click on the "On-Chain" tab - should show whale activity with exchange flows

---

## 🔧 Alternative: Side-by-Side Comparison

If you want to keep both old and new panels for comparison:

```typescript
// Add a toggle state
const [useEnhancedPanels, setUseEnhancedPanels] = useState(true);

// In the render section
{activeTab === 'social' && (
  useEnhancedPanels ? (
    <EnhancedSocialSentimentPanel
      data={analysisData?.sentiment}
      loading={loading && currentPhase <= 2}
      error={error}
    />
  ) : (
    <SocialSentimentPanel
      symbol={symbol}
      sentiment={analysisData?.sentiment}
      loading={loading && currentPhase <= 2}
      error={error}
    />
  )
)}
```

---

## 📊 Data Flow Verification

### Sentiment Data Flow

```
User clicks "Social" tab
  ↓
useProgressiveLoading fetches /api/ucie/sentiment/BTC
  ↓
API checks database cache (5 min TTL)
  ↓
If cache miss: Fetch from LunarCrush + Reddit
  ↓
Store in database cache
  ↓
Return data to frontend
  ↓
EnhancedSocialSentimentPanel displays:
  - Galaxy Score
  - Social Dominance
  - Trending Score
  - Reddit metrics
```

### On-Chain Data Flow

```
User clicks "On-Chain" tab
  ↓
useProgressiveLoading fetches /api/ucie/on-chain/BTC
  ↓
API checks database cache (5 min TTL)
  ↓
If cache miss: Fetch from Blockchain.com
  ↓
Analyze 12-hour whale activity
  ↓
Detect exchange flows
  ↓
Calculate net flow sentiment
  ↓
Store in database cache
  ↓
Return data to frontend
  ↓
EnhancedOnChainPanel displays:
  - Network metrics
  - Whale transactions
  - Exchange flow analysis
  - Net flow sentiment
```

---

## 🎨 Visual Preview

### Enhanced Social Sentiment Panel

```
┌─────────────────────────────────────────────┐
│ Social Sentiment Analysis                   │
│ Powered by LunarCrush, Reddit, and social   │
├─────────────────────────────────────────────┤
│                                             │
│  Overall Sentiment                          │
│  75 /100  [↗] BULLISH                      │
│  ████████████████░░░░░░░░                  │
│                                             │
│  🌙 LunarCrush Intelligence                │
│  ┌──────────┬──────────┬──────────┐       │
│  │ Galaxy   │ Social   │ Trending │       │
│  │ Score    │ Score    │ Score    │       │
│  │   78     │   82     │   88     │       │
│  └──────────┴──────────┴──────────┘       │
│                                             │
│  Social Dominance: 45.2%                   │
│  AltRank: #1                               │
│  Mentions: 45K | Interactions: 2.5M        │
│                                             │
│  💬 Reddit Community                       │
│  Mentions: 1,250 | Sentiment: 70/100       │
│  Active: r/cryptocurrency, r/Bitcoin       │
└─────────────────────────────────────────────┘
```

### Enhanced On-Chain Panel

```
┌─────────────────────────────────────────────┐
│ On-Chain Analytics                          │
│ BTC blockchain metrics and whale activity   │
├─────────────────────────────────────────────┤
│                                             │
│  Network Metrics                            │
│  ┌──────────┬──────────┬──────────┐       │
│  │ Hash Rate│ Block    │ Mempool  │       │
│  │ 500 EH/s │ 825,000  │ 50,000   │       │
│  └──────────┴──────────┴──────────┘       │
│                                             │
│  🐋 Whale Activity (12 hours)              │
│  ┌─────────────────────────────────────┐  │
│  │ Net Flow Sentiment: BULLISH [↗]    │  │
│  │ Net Flow: +7                        │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ┌──────────┬──────────┬──────────┐       │
│  │ Exchange │ Exchange │ Cold     │       │
│  │ Deposits │Withdrawals│ Wallet   │       │
│  │    8     │    15    │    5     │       │
│  │ Selling  │Accumulation│Transfers│       │
│  └──────────┴──────────┴──────────┘       │
│                                             │
│  Recent Whale Transactions                  │
│  • $145M (1,500 BTC) - 2 hours ago         │
│  • $98M (1,020 BTC) - 5 hours ago          │
│  • $87M (900 BTC) - 8 hours ago            │
└─────────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

After integration, verify:

- [ ] Social tab loads without errors
- [ ] LunarCrush Galaxy Score is displayed
- [ ] Social Dominance percentage is shown
- [ ] Trending Score is visible
- [ ] Reddit metrics are displayed
- [ ] On-Chain tab loads without errors
- [ ] Network metrics (hash rate, etc.) are shown
- [ ] Whale activity summary is displayed
- [ ] Exchange flow analysis is visible
- [ ] Net flow sentiment is calculated
- [ ] Recent whale transactions are listed
- [ ] Data quality indicators are shown
- [ ] Loading states work correctly
- [ ] Error states display properly
- [ ] Mobile responsive design works
- [ ] Bitcoin Sovereign styling is applied

---

## 🐛 Troubleshooting

### Issue: "No sentiment data available"

**Solution**: Check that LunarCrush API key is set in Vercel environment variables:
```bash
LUNARCRUSH_API_KEY=your_key_here
```

### Issue: "No on-chain data available"

**Solution**: Verify symbol is BTC or ETH (other tokens not yet supported):
```typescript
if (symbolUpper === 'BTC' || symbolUpper === 'BITCOIN') {
  // Supported
} else {
  // Not yet supported
}
```

### Issue: Data not updating

**Solution**: Clear database cache:
```typescript
import { invalidateCache } from '../lib/ucie/cacheUtils';
await invalidateCache('BTC', 'sentiment');
await invalidateCache('BTC', 'on-chain');
```

### Issue: Styling looks wrong

**Solution**: Verify Tailwind config includes Bitcoin Sovereign colors:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'bitcoin-black': '#000000',
        'bitcoin-orange': '#F7931A',
        'bitcoin-white': '#FFFFFF',
        'bitcoin-orange-10': 'rgba(247, 147, 26, 0.1)',
        'bitcoin-orange-20': 'rgba(247, 147, 26, 0.2)',
        'bitcoin-white-60': 'rgba(255, 255, 255, 0.6)',
        'bitcoin-white-80': 'rgba(255, 255, 255, 0.8)',
      }
    }
  }
}
```

---

## 📚 Additional Resources

- **UCIE System Rules**: `.kiro/steering/ucie-system.md`
- **API Status**: `.kiro/steering/api-status.md`
- **GPT-5.1 Migration**: `GPT-5.1-MIGRATION-GUIDE.md`
- **Bitcoin Sovereign Design**: `.kiro/steering/bitcoin-sovereign-design.md`
- **Enhancement Summary**: `UCIE-ENHANCEMENT-COMPLETE.md`

---

**Status**: 🟢 **READY FOR INTEGRATION**  
**Estimated Time**: 15-30 minutes  
**Difficulty**: Easy (drop-in replacement)

**Happy integrating!** 🚀
