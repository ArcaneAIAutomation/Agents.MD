# Bitcoin & Ethereum Analysis Pages - Quick Reference

## 🎨 Bitcoin Sovereign Styling Applied

### Main Container
```tsx
// Before
<div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">

// After
<div className="bitcoin-block">
```

### Price Display Cards
```tsx
// Before
<div className="bg-gray-50 p-3 rounded-lg">
  <p className="text-xs text-gray-500">Price</p>
  <p className="text-2xl font-bold">$42,567</p>
</div>

// After
<div className="stat-card">
  <div className="stat-label">Price</div>
  <div className="price-display price-display-sm">$42k</div>
</div>
```

### Technical Indicator Cards
```tsx
// Before
<div className="bg-gray-50 p-3 rounded-lg">
  <span className="text-xs text-gray-500">RSI (14)</span>
  <span className="text-lg font-bold text-red-600">72.5</span>
</div>

// After
<div className="bitcoin-block-subtle">
  <span className="stat-label">RSI (14)</span>
  <span className="text-lg font-bold font-mono text-bitcoin-orange">72.5</span>
</div>
```

### Buttons
```tsx
// Before
<button className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
  Refresh
</button>

// After
<button className="btn-bitcoin-primary">
  Refresh
</button>
```

### Icons
```tsx
// Before
<BarChart3 className="h-4 w-4 text-blue-600" />

// After
<BarChart3 className="h-4 w-4 text-bitcoin-orange" />
```

### Text Colors
```tsx
// Headlines
className="text-bitcoin-white"

// Body text
className="text-bitcoin-white-80"

// Labels
className="stat-label"  // or "text-bitcoin-white-60"

// Emphasis
className="text-bitcoin-orange"

// Data values
className="stat-value font-mono"
```

---

## 📊 Component Classes Used

### Layout
- `.bitcoin-block` - Main container with thin orange border
- `.bitcoin-block-subtle` - Nested container with subtle orange border
- `.stat-grid` - Responsive grid for stat cards
- `.stat-grid-4` - 4-column grid (responsive)

### Data Displays
- `.price-display` - Large orange monospace price (2.5rem)
- `.price-display-sm` - Small orange monospace price (1.5rem)
- `.stat-card` - Data card with thin orange border
- `.stat-label` - Uppercase label (white 60%)
- `.stat-value` - Monospace data value (white)
- `.stat-value-orange` - Orange emphasis value with glow

### Buttons
- `.btn-bitcoin-primary` - Solid orange button
- `.btn-bitcoin-secondary` - Orange outline button
- `.btn-bitcoin-lg` - Large button variant

### Effects
- `.glow-bitcoin` - Orange glow box-shadow
- `.text-glow-orange` - Orange text glow

---

## 🎯 Key Features

### Fear & Greed Slider
- Black background with orange border
- Orange gradient (30% opacity)
- Orange indicator with glow
- Monospaced numbers
- Orange label text

### RSI Indicator
- Black card with subtle border
- Orange progress bar
- Monospaced value
- Orange emphasis for overbought/oversold

### Price Cards
- Stat card layout
- Orange monospaced prices
- White labels (60% opacity)
- Responsive sizing

### Support/Resistance
- Black card with subtle border
- Orange emphasis for strong levels
- White for normal levels
- Monospaced font for all values

---

## 📱 Responsive Behavior

### Mobile (≤640px)
- Single column layout
- Smaller font sizes
- Reduced padding
- Touch-friendly buttons (48px min)

### Tablet (641px-1024px)
- 2-column grid for stats
- Medium font sizes
- Balanced padding

### Desktop (≥1025px)
- 4-column grid for stats
- Full font sizes
- Optimal spacing

---

## ✅ Checklist

When updating analysis pages:
- [ ] Replace white backgrounds with `.bitcoin-block`
- [ ] Replace gray cards with `.bitcoin-block-subtle`
- [ ] Use `.stat-card` for data displays
- [ ] Apply `.price-display` to prices
- [ ] Use `.stat-label` for labels
- [ ] Apply Roboto Mono to all data (`font-mono`)
- [ ] Change all icons to `text-bitcoin-orange`
- [ ] Update buttons to `.btn-bitcoin-primary`
- [ ] Use white text variants for hierarchy
- [ ] Apply orange emphasis to key values
- [ ] Test responsive behavior
- [ ] Verify accessibility

---

**Quick Start**: Replace old classes with Bitcoin Sovereign classes, apply monospaced fonts to data, and use orange for all emphasis!

