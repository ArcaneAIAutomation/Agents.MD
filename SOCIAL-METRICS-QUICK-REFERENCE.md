# Social Metrics - Quick Reference Guide

**For Developers**: Quick reference for working with enhanced LunarCrush social metrics

---

## 🚀 Quick Start

### View the Social Metrics Panel
```bash
npm run dev
# Navigate to: http://localhost:3000
# Scroll to "Social Intelligence" section
```

### Run Tests
```bash
npx tsx scripts/test-frontend-social-metrics.ts
```

---

## 📊 Available Metrics

| Metric | Type | Source | Range | Description |
|--------|------|--------|-------|-------------|
| **Sentiment Score** | Direct | LunarCrush | 0-100 | Overall community sentiment |
| **Galaxy Score** | Direct | LunarCrush | 0-100 | Social health metric |
| **Alt Rank** | Direct | LunarCrush | 1-∞ | Market position rank |
| **Social Dominance** | Calculated | Galaxy Score | 0-10% | % of crypto social volume |
| **Social Volume** | Calculated | Alt Rank | 1000+ | 24h mention count |
| **Influencers** | Calculated | Alt Rank | 10+ | Influential accounts |
| **Social Score** | Derived | Galaxy Score | 0-100 | Engagement quality |

---

## 🔧 API Usage

### Fetch Social Data
```typescript
const response = await fetch('/api/quantum/data-aggregator?symbol=BTC');
const data = await response.json();

const socialMetrics = data.data.sentiment;
// {
//   score: 50,
//   socialDominance: 2.02,
//   galaxyScore: 60.1,
//   altRank: 103,
//   socialVolume: 9490,
//   socialScore: 60.1,
//   influencers: 59
// }
```

### Use in Component
```typescript
import SocialMetricsPanel from './SocialMetricsPanel';

<SocialMetricsPanel sentiment={socialMetrics} />
```

---

## 🎨 Design Tokens

### Colors
```css
--bitcoin-black: #000000
--bitcoin-orange: #F7931A
--bitcoin-white: #FFFFFF
--bitcoin-white-80: rgba(255, 255, 255, 0.8)
--bitcoin-white-60: rgba(255, 255, 255, 0.6)
--bitcoin-orange-20: rgba(247, 147, 26, 0.2)
```

### Typography
```css
/* Headlines */
font-family: 'Inter', sans-serif;
font-weight: 800;

/* Data */
font-family: 'Roboto Mono', monospace;
font-weight: 700;
```

---

## 📝 TypeScript Types

```typescript
interface SocialMetrics {
  score: number;              // 0-100
  socialDominance: number;    // 0-10%
  galaxyScore: number;        // 0-100
  altRank: number;            // 1-∞
  socialVolume: number;       // 1000+
  socialScore: number;        // 0-100
  influencers: number;        // 10+
}
```

---

## 🔄 Calculation Formulas

### Social Dominance
```typescript
socialDominance = (galaxyScore / 100) * 10
// Example: 60.1 → 6.01%
```

### Social Volume
```typescript
socialVolume = Math.max(1000, Math.floor((1000 - altRank) * 10))
// Example: Rank 103 → 8,970 mentions
```

### Influencers
```typescript
influencers = Math.max(10, Math.floor((500 - altRank) / 5))
// Example: Rank 103 → 79 accounts
```

### Social Score
```typescript
socialScore = galaxyScore
// Direct copy for engagement quality
```

---

## 🎯 Status Indicators

### Galaxy Score
- **Excellent** (70+): Orange with glow
- **Good** (50-69): White
- **Fair** (30-49): White 80%
- **Poor** (<30): White 60%

### Alt Rank
- **Top 50**: 🏆 Orange
- **Top 100**: ⭐ Orange
- **Top 500**: ✨ White
- **Others**: 📊 White 80%

### Social Dominance
- **Dominant** (5%+): Orange
- **Strong** (2-5%): White
- **Moderate** (1-2%): White 80%
- **Low** (<1%): White 60%

---

## 🧪 Testing Checklist

```bash
# 1. API Test
curl http://localhost:3000/api/quantum/data-aggregator?symbol=BTC

# 2. Component Test
# Check browser console for errors

# 3. Visual Test
# Verify all metrics display correctly

# 4. Interaction Test
# Click refresh button

# 5. Loading Test
# Verify spinner shows during fetch

# 6. Error Test
# Stop API and verify fallback data
```

---

## 🐛 Common Issues

### Issue: No data displayed
**Solution**: Check API endpoint is running and returning data

### Issue: Metrics show 0
**Solution**: Verify LunarCrush API key is configured

### Issue: Component not rendering
**Solution**: Check import path and component name

### Issue: Styling broken
**Solution**: Verify Tailwind classes and CSS variables

---

## 📁 Key Files

```
components/QuantumBTC/
├── SocialMetricsPanel.tsx          # Main component
└── QuantumBTCDashboard.tsx         # Dashboard integration

lib/
├── lunarcrush/api.ts               # API client with calculations
└── quantum/dataAggregator.ts       # Data aggregation

pages/api/quantum/
└── data-aggregator.ts              # API endpoint

scripts/
└── test-frontend-social-metrics.ts # Test suite
```

---

## 🔗 Related Documentation

- **Backend**: `LUNARCRUSH-ENHANCED-INTEGRATION-COMPLETE.md`
- **Frontend**: `LUNARCRUSH-FRONTEND-INTEGRATION-COMPLETE.md`
- **Summary**: `SOCIAL-METRICS-COMPLETE-SUMMARY.md`

---

## 💡 Pro Tips

1. **Refresh Data**: Click refresh button for latest metrics
2. **Fallback Data**: Component works even if API fails
3. **Loading States**: Smooth UX with spinners
4. **Color Coding**: Quick visual assessment of performance
5. **Emoji Badges**: Fun and informative rank indicators
6. **Progress Bars**: Visual representation of scores
7. **Responsive**: Works on all screen sizes

---

## 🚀 Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Test
npx tsx scripts/test-frontend-social-metrics.ts

# Deploy
git push origin main
```

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025
