# Data Display Components - Quick Reference

## Overview

Task 6 of the Bitcoin Sovereign rebrand introduces comprehensive data display components with glowing orange monospace text, stat cards with thin orange borders, and orange emphasis variants for key metrics.

## ✅ Implementation Status

- **Task 6.1**: Price displays styled with Roboto Mono, large size (2.5rem), orange color with glow effect
- **Task 6.2**: Stat card components with black background, thin orange borders, and hover effects
- **Task 6.3**: Orange stat value variants for emphasis on key metrics

## Price Display Classes

### Basic Price Displays
```html
<!-- Default Price Display (2.5rem / 40px) -->
<div class="price-display">$42,567.89</div>

<!-- Small Price Display (1.5rem / 24px) -->
<div class="price-display price-display-sm">$42,567.89</div>

<!-- Large Price Display (3rem / 48px) -->
<div class="price-display price-display-lg">$42,567.89</div>

<!-- Extra Large Price Display (4rem / 64px) -->
<div class="price-display price-display-xl">$42,567.89</div>
```

### Live/Animated Price Display
```html
<!-- Pulsing glow animation for live data -->
<div class="price-display price-display-live">$42,567.89</div>
```

### Features
- **Font**: Roboto Mono (monospace, ledger feel)
- **Weight**: 700 (bold)
- **Color**: Bitcoin Orange (#F7931A)
- **Glow Effect**: 30-50% opacity orange text-shadow
- **Mobile**: Scales down to 1.75rem on mobile devices

## Stat Card Components

### Basic Stat Card
```html
<div class="stat-card">
  <div class="stat-label">Market Cap</div>
  <div class="stat-value">$832.5B</div>
</div>
```

### Stat Card with Orange Value (Emphasis)
```html
<div class="stat-card">
  <div class="stat-label">24h Change</div>
  <div class="stat-value stat-value-orange">+5.67%</div>
</div>
```

### Stat Card with Orange Accent Border
```html
<div class="stat-card stat-card-accent">
  <div class="stat-label">Current Price</div>
  <div class="stat-value stat-value-orange">$42,567</div>
</div>
```

### Features
- **Background**: Pure black (#000000)
- **Border**: 2px solid orange at 20% opacity
- **Hover**: Border brightens to full orange with subtle glow
- **Label**: White at 60% opacity, uppercase, 0.75rem
- **Value**: White, Roboto Mono, 1.5rem, bold

## Stat Card Variants

### Horizontal Layout
```html
<div class="stat-card stat-card-horizontal">
  <div>
    <div class="stat-label">Bitcoin Dominance</div>
    <div class="stat-value">54.2%</div>
  </div>
  <div style="color: var(--bitcoin-orange); font-size: 2rem;">₿</div>
</div>
```

### Compact Layout
```html
<div class="stat-card stat-card-compact">
  <div class="stat-label">RSI (14)</div>
  <div class="stat-value">68.5</div>
</div>
```

## Stat Value Variants

### Size Variants
```html
<!-- Small (1.125rem / 18px) -->
<div class="stat-value stat-value-sm">$42.5K</div>

<!-- Default (1.5rem / 24px) -->
<div class="stat-value">$42.5K</div>

<!-- Large (2rem / 32px) -->
<div class="stat-value stat-value-lg">$42.5K</div>

<!-- Extra Large (2.5rem / 40px) -->
<div class="stat-value stat-value-xl">$42.5K</div>
```

### Orange Emphasis (For Key Metrics)
```html
<!-- Orange color with subtle glow -->
<div class="stat-value stat-value-orange">+5.67%</div>

<!-- Orange with live animation -->
<div class="stat-value stat-value-orange stat-value-live">72</div>
```

## Stat Grid Layouts

### Auto-Fit Grid (Responsive)
```html
<div class="stat-grid">
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
</div>
```

### Fixed Column Grids
```html
<!-- 2-Column Grid -->
<div class="stat-grid stat-grid-2">
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
</div>

<!-- 3-Column Grid -->
<div class="stat-grid stat-grid-3">
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
</div>

<!-- 4-Column Grid -->
<div class="stat-grid stat-grid-4">
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
</div>
```

## Responsive Behavior

### Mobile (≤768px)
- Price displays scale down (1.75rem default)
- Stat cards have reduced padding (0.875rem)
- Stat labels smaller (0.625rem)
- Stat values smaller (1.25rem)
- All grids collapse to single column
- Horizontal stat cards stack vertically

### Tablet (641px - 1024px)
- 3 and 4-column grids become 2-column
- Medium padding and font sizes maintained

### Desktop (≥1025px)
- Price displays larger (3rem default)
- Stat cards have more padding (1.25rem)
- Full grid layouts maintained

## CSS Variables Used

```css
/* Colors */
--bitcoin-black: #000000
--bitcoin-orange: #F7931A
--bitcoin-white: #FFFFFF
--bitcoin-orange-20: rgba(247, 147, 26, 0.2)
--bitcoin-orange-30: rgba(247, 147, 26, 0.3)
--bitcoin-orange-50: rgba(247, 147, 26, 0.5)
--bitcoin-white-60: rgba(255, 255, 255, 0.6)
--bitcoin-white-80: rgba(255, 255, 255, 0.8)

/* Shadows */
--shadow-bitcoin-glow: 0 0 20px rgba(247, 147, 26, 0.5)
--shadow-bitcoin-glow-sm: 0 0 10px rgba(247, 147, 26, 0.3)
```

## Usage Examples

### Bitcoin Price Dashboard
```html
<div class="stat-grid stat-grid-4">
  <div class="stat-card stat-card-accent">
    <div class="stat-label">Current Price</div>
    <div class="stat-value stat-value-orange stat-value-lg">$42,567</div>
  </div>
  
  <div class="stat-card">
    <div class="stat-label">24h Change</div>
    <div class="stat-value stat-value-orange">+5.67%</div>
  </div>
  
  <div class="stat-card">
    <div class="stat-label">Market Cap</div>
    <div class="stat-value">$832.5B</div>
  </div>
  
  <div class="stat-card">
    <div class="stat-label">24h Volume</div>
    <div class="stat-value">$28.3B</div>
  </div>
</div>
```

### Live Price Ticker
```html
<div style="text-align: center; padding: 2rem;">
  <div class="stat-label" style="margin-bottom: 1rem;">Bitcoin Price (Live)</div>
  <div class="price-display price-display-xl price-display-live">$42,567.89</div>
</div>
```

### Trading Metrics Panel
```html
<div class="stat-grid stat-grid-3">
  <div class="stat-card">
    <div class="stat-label">RSI (14)</div>
    <div class="stat-value">68.5</div>
  </div>
  
  <div class="stat-card">
    <div class="stat-label">MACD</div>
    <div class="stat-value stat-value-orange">Bullish</div>
  </div>
  
  <div class="stat-card">
    <div class="stat-label">Volume</div>
    <div class="stat-value">High</div>
  </div>
</div>
```

## Accessibility Features

- **Focus States**: Orange outline with glow on focus-visible
- **Color Contrast**: All text meets WCAG AA standards
  - White on black: 21:1 (AAA)
  - Orange on black: 5.8:1 (AA for large text)
- **Touch Targets**: Stat cards are easily tappable on mobile
- **Semantic HTML**: Use appropriate labels and values

## Testing

View the test file to see all components in action:
```
test-data-displays.html
```

Open in a browser and resize the window to test responsive behavior.

## Integration with Existing Components

These data display components can be integrated into:
- **Crypto Herald**: Display article metrics and engagement stats
- **Trade Generation Engine**: Show trade signals and confidence scores
- **BTC/ETH Trading Charts**: Display current prices and technical indicators
- **Whale Watch Dashboard**: Show transaction amounts and analysis metrics
- **Market Analysis**: Display market cap, volume, and other key metrics

## Best Practices

1. **Use Orange Sparingly**: Only apply `stat-value-orange` to truly important metrics
2. **Consistent Sizing**: Stick to the predefined size variants for visual hierarchy
3. **Live Animation**: Only use `price-display-live` or `stat-value-live` for real-time data
4. **Grid Layouts**: Use appropriate grid columns based on content density
5. **Mobile-First**: Always test on mobile devices to ensure readability

## Next Steps

With Task 6 complete, the next tasks in the Bitcoin Sovereign rebrand are:
- **Task 7**: Navigation System - Mobile Hamburger Menu
- **Task 8**: Navigation System - Desktop Horizontal Nav
- **Task 9**: Responsive Design Implementation

---

**Status**: ✅ Complete
**Last Updated**: January 2025
**Spec Location**: `.kiro/specs/bitcoin-sovereign-rebrand/tasks.md`
