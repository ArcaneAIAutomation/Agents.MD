# DataQualityBadge Visual Guide

## Component Overview

The `DataQualityBadge` component provides visual feedback about data quality using the Bitcoin Sovereign Technology design system (black, orange, white only).

---

## Visual States

### 1. Excellent Quality (≥90%)

```
┌─────────────────────────────────┐
│  ✓  100% DATA VERIFIED          │  ← Orange background (#F7931A)
└─────────────────────────────────┘     Black text
     Orange glow effect
```

**Characteristics:**
- Background: Bitcoin Orange (#F7931A)
- Text: Black (#000000)
- Border: Orange (2px)
- Icon: ✓ (checkmark)
- Effect: Orange glow shadow
- Label: "100% Data Verified" (if 100%) or "X% Quality"

**When to use:**
- Data quality ≥90%
- All critical APIs responding
- Trade signals ready for generation

---

### 2. Acceptable Quality (70-89%)

```
┌─────────────────────────────────┐
│  ⚠  85% QUALITY                 │  ← Black background
└─────────────────────────────────┘     Orange border & text
  Acceptable data quality              Status message
```

**Characteristics:**
- Background: Black (#000000)
- Text: Bitcoin Orange (#F7931A)
- Border: Orange (2px)
- Icon: ⚠ (warning)
- Label: "X% Quality"
- Status: "Acceptable data quality"

**When to use:**
- Data quality 70-89%
- Most APIs responding
- Trade signals can be generated with caution

---

### 3. Poor Quality (<70%)

```
┌─────────────────────────────────┐
│  ✗  65% QUALITY                 │  ← Black background
└─────────────────────────────────┘     Gray border & text
  Insufficient data quality            Status message
```

**Characteristics:**
- Background: Black (#000000)
- Text: Gray (#9CA3AF)
- Border: Gray (2px)
- Icon: ✗ (cross)
- Label: "X% Quality"
- Status: "Insufficient data quality"

**When to use:**
- Data quality <70%
- Too many APIs failing
- Trade signals should NOT be generated

---

## Size Variations

### Full Text Mode (Default)

```
┌─────────────────────────────────┐
│  ✓  100% DATA VERIFIED          │
└─────────────────────────────────┘
```

### Compact Mode (showText={false})

```
┌──────────┐
│  ✓  100% │
└──────────┘
```

---

## Layout Examples

### In Trade Signal Card

```
┌─────────────────────────────────────────────────┐
│  BTC/USD Trade Signal      ┌──────────────────┐ │
│                            │ ✓ 100% VERIFIED  │ │
│  Entry: $95,000            └──────────────────┘ │
│  Stop Loss: $93,000                             │
│  Take Profit: $98,000                           │
└─────────────────────────────────────────────────┘
```

### In Data Source Panel

```
┌─────────────────────────────────────────────────┐
│  Data Sources: 12/13                  ┌───────┐ │
│                                       │ ✓ 92% │ │
│  ✓ CoinGecko      82ms                └───────┘ │
│  ✓ CoinMarketCap  320ms                         │
│  ✓ Kraken         89ms                          │
│  ✗ CoinGlass      Failed                        │
└─────────────────────────────────────────────────┘
```

### In Analysis Modal Header

```
┌─────────────────────────────────────────────────┐
│  Einstein Analysis         ┌──────────────────┐ │
│                            │ ✓ 100% VERIFIED  │ │
│                            └──────────────────┘ │
├─────────────────────────────────────────────────┤
│  Technical Analysis                             │
│  • RSI: 65 (Neutral)                           │
│  • MACD: Bullish crossover                     │
└─────────────────────────────────────────────────┘
```

---

## Color Palette Reference

### Excellent Quality (≥90%)

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| Background | Orange | #F7931A | Fill |
| Text | Black | #000000 | Label |
| Border | Orange | #F7931A | 2px solid |
| Glow | Orange 50% | rgba(247,147,26,0.5) | Box shadow |

### Acceptable Quality (70-89%)

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| Background | Black | #000000 | Fill |
| Text | Orange | #F7931A | Label |
| Border | Orange | #F7931A | 2px solid |
| Icon | Orange | #F7931A | Warning symbol |

### Poor Quality (<70%)

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| Background | Black | #000000 | Fill |
| Text | Gray | #9CA3AF | Label |
| Border | Gray | #6B7280 | 2px solid |
| Icon | Gray | #9CA3AF | Error symbol |

---

## Responsive Behavior

### Desktop (≥1024px)
- Full text labels
- Standard padding (px-3 py-1.5)
- All status messages visible

### Tablet (768px - 1023px)
- Full text labels
- Standard padding
- All status messages visible

### Mobile (<768px)
- Consider using `showText={false}` for compact display
- Reduced padding if needed
- Status messages may wrap

---

## Accessibility

### Color Contrast Ratios

| Combination | Ratio | WCAG Level |
|-------------|-------|------------|
| Black on Orange | 5.8:1 | AA ✓ |
| Orange on Black | 5.8:1 | AA ✓ |
| Gray on Black | 4.5:1 | AA ✓ |

### Screen Reader Support

- Icon symbols are visible to screen readers
- Status messages provide context
- Quality percentage is announced

### Keyboard Navigation

- Component is not interactive (display only)
- No focus states required
- Can be wrapped in interactive elements if needed

---

## Animation & Transitions

### Glow Effect (Excellent Quality)

```css
box-shadow: 0 0 20px rgba(247, 147, 26, 0.5);
transition: all 0.3s ease;
```

### Hover State (if interactive)

```css
/* Increase glow intensity */
box-shadow: 0 0 30px rgba(247, 147, 26, 0.6);
transform: scale(1.02);
```

---

## Integration Examples

### With Refresh Button

```tsx
<div className="flex items-center gap-3">
  <RefreshButton 
    onRefresh={handleRefresh}
    isRefreshing={isRefreshing}
  />
  <DataQualityBadge quality={dataQuality} />
</div>
```

### With Data Source Health Panel

```tsx
<div className="bitcoin-block p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-bitcoin-white font-bold">Data Sources</h3>
    <DataQualityBadge quality={healthScore} />
  </div>
  <DataSourceHealthPanel sources={sources} />
</div>
```

### With Trade Signal

```tsx
<div className="bitcoin-block p-6">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <ExecutionStatusBadge status="PENDING" />
      <DataQualityBadge quality={signal.dataQuality} />
    </div>
  </div>
  {/* Trade signal details */}
</div>
```

---

## Best Practices

### ✅ DO

- Use for displaying data quality scores (0-100)
- Show "100% Data Verified" for perfect quality
- Display status messages for non-excellent quality
- Use compact mode in space-constrained layouts
- Combine with other status indicators

### ❌ DON'T

- Use for non-quality metrics (use other badge components)
- Hide quality information when it's critical
- Use colors outside the Bitcoin Sovereign palette
- Make the badge interactive (it's display-only)
- Show without context (always label what quality means)

---

## Testing Checklist

- [ ] Displays correctly at 100% quality
- [ ] Displays correctly at 90% quality (boundary)
- [ ] Displays correctly at 70% quality (boundary)
- [ ] Displays correctly below 70% quality
- [ ] Shows appropriate icons for each level
- [ ] Status messages appear for non-excellent quality
- [ ] Compact mode works correctly
- [ ] Orange glow appears for excellent quality
- [ ] Colors match Bitcoin Sovereign palette
- [ ] Responsive on all screen sizes
- [ ] Accessible to screen readers
- [ ] Integrates well with other components

---

## Version History

- **v1.0.0** - Initial visual guide
  - Three quality levels defined
  - Bitcoin Sovereign color palette
  - Responsive behavior documented
  - Accessibility guidelines included
