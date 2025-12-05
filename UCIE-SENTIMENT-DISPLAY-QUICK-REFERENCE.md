# UCIE Sentiment Display - Quick Reference

**Component**: `components/UCIE/SocialSentimentPanel.tsx`  
**Status**: ✅ Production Ready  
**Last Updated**: December 5, 2025

---

## 📊 Data Sources Displayed (5 Total)

### 1. Fear & Greed Index (25% weight)
```typescript
fearGreedIndex: {
  value: 72,              // 0-100 scale
  classification: "Greed", // Extreme Fear, Fear, Neutral, Greed, Extreme Greed
  description: "..."
}
```

### 2. CoinMarketCap (20% weight)
```typescript
coinMarketCap: {
  sentimentScore: 68,     // 0-100 scale
  priceChange24h: 2.5,    // Percentage
  priceChange7d: 8.3,     // Percentage
  volumeChange24h: 15.2,  // Percentage
  description: "..."
}
```

### 3. CoinGecko (20% weight)
```typescript
coinGecko: {
  sentimentScore: 71,              // 0-100 scale
  communityScore: 75.2,            // 0-100 scale
  developerScore: 82.1,            // 0-100 scale
  sentimentVotesUpPercentage: 68.5, // Percentage
  twitterFollowers: 5000000,       // Count
  description: "..."
}
```

### 4. LunarCrush (20% weight)
```typescript
lunarCrush: {
  galaxyScore: 65,           // 0-100 scale
  averageSentiment: 3.07,    // 1-5 scale
  totalPosts: 220,           // Count
  totalInteractions: 575000000, // Count
  postTypes: {
    "news": 100,
    "tiktok-video": 90,
    "tweet": 10,
    "youtube-video": 10,
    "reddit-post": 10
  },
  price: 95000,              // USD
  volume24h: 45000000000,    // USD
  marketCap: 1850000000000,  // USD
  description: "..."
}
```

### 5. Reddit (15% weight)
```typescript
reddit: {
  mentions24h: 1250,         // Count
  sentiment: 62,             // 0-100 scale
  activeSubreddits: [        // Array of subreddit names
    "r/cryptocurrency",
    "r/CryptoMarkets",
    "r/Bitcoin"
  ],
  description: "..."
}
```

---

## 🎨 Visual Components

### Overall Sentiment Gauge
```typescript
<SentimentGauge 
  score={75}           // 0-100
  sentiment="bullish"  // bullish, neutral, bearish
  dataQuality={100}    // 0-100 percentage
/>
```

### Progress Bar Pattern
```typescript
<div className="w-full h-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
  <div
    className="h-full bg-bitcoin-orange transition-all duration-500"
    style={{ width: `${score}%` }}
  />
</div>
```

### Sentiment Scale (1-5)
```typescript
<div className="flex gap-1">
  {[1, 2, 3, 4, 5].map((level) => (
    <div
      key={level}
      className={`flex-1 h-3 rounded ${
        level <= Math.round(averageSentiment)
          ? 'bg-bitcoin-orange'
          : 'bg-bitcoin-black border border-bitcoin-orange-20'
      }`}
    />
  ))}
</div>
```

### Metric Card
```typescript
<MetricCard
  label="Galaxy Score"
  value="65/100"
  description="Social media popularity score"
  valueColor="text-bitcoin-orange"
/>
```

---

## 🎯 Design System Classes

### Colors
```css
/* Backgrounds */
bg-bitcoin-black           /* #000000 */
bg-bitcoin-orange          /* #F7931A */
bg-bitcoin-orange-5        /* rgba(247, 147, 26, 0.05) */

/* Text */
text-bitcoin-white         /* #FFFFFF */
text-bitcoin-white-80      /* rgba(255, 255, 255, 0.8) */
text-bitcoin-white-60      /* rgba(255, 255, 255, 0.6) */
text-bitcoin-orange        /* #F7931A */

/* Borders */
border-bitcoin-orange      /* #F7931A */
border-bitcoin-orange-20   /* rgba(247, 147, 26, 0.2) */
```

### Typography
```css
/* UI Text */
font-sans                  /* Inter */
font-bold                  /* 700 weight */
font-semibold              /* 600 weight */

/* Data Values */
font-mono                  /* Roboto Mono */
font-bold                  /* 700 weight */
```

### Spacing
```css
/* Padding */
p-3   /* 12px */
p-4   /* 16px */
p-6   /* 24px */

/* Gaps */
gap-1  /* 4px */
gap-2  /* 8px */
gap-3  /* 12px */
gap-4  /* 16px */
gap-6  /* 24px */
```

---

## 📱 Responsive Grid Patterns

### 2-Column Grid (Mobile → Desktop)
```typescript
<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  {/* Metric cards */}
</div>
```

### 4-Column Grid (Mobile → Desktop)
```typescript
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  {/* Post type breakdown */}
</div>
```

### Breakpoints
```
Mobile:  320px - 640px  (grid-cols-1 or grid-cols-2)
Tablet:  641px - 1024px (grid-cols-2 or grid-cols-3)
Desktop: 1025px+        (grid-cols-3 or grid-cols-4)
```

---

## 🔧 Common Patterns

### Section Card
```typescript
<div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-bold text-bitcoin-white">
      Section Title
    </h3>
    <span className="text-xs text-bitcoin-white-60 uppercase">
      Weight: 20%
    </span>
  </div>
  {/* Section content */}
</div>
```

### Metric with Progress Bar
```typescript
<div className="mb-6">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm text-bitcoin-white-80">Metric Name</span>
    <span className="text-2xl font-mono font-bold text-bitcoin-orange">
      {value}/100
    </span>
  </div>
  <div className="w-full h-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
    <div
      className="h-full bg-bitcoin-orange transition-all duration-500"
      style={{ width: `${value}%` }}
    />
  </div>
  <p className="text-xs text-bitcoin-white-60 mt-2">
    {description}
  </p>
</div>
```

### Grid of Metrics
```typescript
<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  <MetricCard label="Label 1" value="Value 1" />
  <MetricCard label="Label 2" value="Value 2" />
  <MetricCard label="Label 3" value="Value 3" />
</div>
```

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] All sections render correctly
- [ ] Progress bars show correct percentages
- [ ] Colors match Bitcoin Sovereign palette
- [ ] Typography is consistent (Inter + Roboto Mono)
- [ ] Spacing is consistent throughout

### Responsive Testing
- [ ] Mobile (320px): Single column, readable
- [ ] Tablet (768px): 2-3 columns, balanced
- [ ] Desktop (1024px+): 3-4 columns, spacious
- [ ] Touch targets: 48px minimum

### Data Testing
- [ ] Handles missing data gracefully (null checks)
- [ ] Shows loading state properly
- [ ] Shows error state properly
- [ ] Data quality indicator accurate
- [ ] All 5 sources display when available

### Accessibility Testing
- [ ] Color contrast: 4.5:1 minimum (WCAG AA)
- [ ] Focus states visible (orange outline)
- [ ] Screen reader friendly (semantic HTML)
- [ ] Keyboard navigation works

---

## 🚨 Common Issues & Solutions

### Issue: Data Not Displaying
```typescript
// Check if data prop is passed correctly
console.log('Sentiment data:', data);

// Verify data structure
console.log('Fear & Greed:', data?.fearGreedIndex);
console.log('LunarCrush:', data?.lunarCrush);
```

### Issue: Progress Bar Not Showing
```typescript
// Ensure value is a number between 0-100
const safeValue = Math.max(0, Math.min(100, value || 0));

// Use inline style for width
style={{ width: `${safeValue}%` }}
```

### Issue: Colors Not Matching Design
```typescript
// Verify Tailwind classes are correct
className="bg-bitcoin-black"  // Not bg-black
className="text-bitcoin-orange"  // Not text-orange-500
className="border-bitcoin-orange-20"  // Not border-orange-200
```

---

## 📚 Related Files

### Component Files
- `components/UCIE/SocialSentimentPanel.tsx` - Main component
- `components/UCIE/UCIEAnalysisHub.tsx` - Parent component

### API Files
- `pages/api/ucie/sentiment/[symbol].ts` - Sentiment API endpoint

### Documentation
- `LUNARCRUSH-INTEGRATION-COMPLETE.md` - Complete integration guide
- `TASK-5-COMPLETE-SUMMARY.md` - Task completion summary
- `.kiro/steering/ucie-system.md` - UCIE system architecture
- `.kiro/steering/bitcoin-sovereign-design.md` - Design system

---

## 🎯 Quick Commands

### Test Component Compilation
```bash
npx tsc --noEmit components/UCIE/SocialSentimentPanel.tsx
```

### Test API Response
```bash
curl http://localhost:3000/api/ucie/sentiment/BTC
```

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

---

**Last Updated**: December 5, 2025  
**Status**: ✅ Production Ready  
**Confidence**: HIGH
