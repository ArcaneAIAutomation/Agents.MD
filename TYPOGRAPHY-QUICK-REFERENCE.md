# Typography & Data Display Quick Reference

## Task 12.5 Validation Summary

**Status:** ✅ COMPLETE  
**Date:** January 2025

---

## Quick Checklist

- [x] All prices use Roboto Mono font
- [x] Price displays have orange glow text-shadow
- [x] Stat cards have proper orange borders (2px, 20% opacity)
- [x] Stat labels are uppercase with proper opacity (60%)
- [x] All headings use Inter font with proper weights (800)
- [x] Body text uses Inter at 80% white opacity

---

## CSS Classes Reference

### Price Displays
```css
.price-display          /* Large: 2.5rem, Roboto Mono, Orange glow */
.price-display-sm       /* Small: 1.5rem, Roboto Mono, Orange glow */
.price-display-lg       /* Extra Large: 3rem */
```

### Stat Cards
```css
.stat-card              /* Black bg, 2px orange border (20% opacity) */
.stat-label             /* Uppercase, 60% white, 0.75rem */
.stat-value             /* Roboto Mono, 1.5rem, White */
.stat-value-orange      /* Orange with glow effect */
```

### Headings
```css
h1, h2, h3, h4, h5, h6  /* Inter, Weight 800, Pure White */
```

### Body Text
```css
body                    /* Inter, 80% white opacity, 1.6 line-height */
```

---

## Font Families

**UI & Headlines:** Inter  
**Data & Numbers:** Roboto Mono

---

## Color Palette

```css
--bitcoin-black: #000000
--bitcoin-orange: #F7931A
--bitcoin-white: #FFFFFF
--bitcoin-white-80: rgba(255, 255, 255, 0.8)
--bitcoin-white-60: rgba(255, 255, 255, 0.6)
--bitcoin-orange-20: rgba(247, 147, 26, 0.2)
```

---

## Mobile Scaling

**@media (max-width: 768px):**
- Price display: 2.5rem → 1.75rem
- Stat value: 1.5rem → 1.25rem
- Stat label: 0.75rem → 0.625rem
- H1: 2.5rem → 1.75rem
- H2: 2rem → 1.5rem

---

## Validation Files

1. **validate-typography-mobile.html** - Interactive test page
2. **TASK-12.5-TYPOGRAPHY-VALIDATION.md** - Full documentation

---

## Component Examples

### BTCMarketAnalysis.tsx
```tsx
<div className="stat-card">
  <div className="stat-label">Price</div>
  <div className="price-display price-display-sm">
    $95k
  </div>
</div>
```

### TradeGenerationEngine.tsx
```tsx
<div className="stat-card">
  <span className="stat-label">ENTRY PRICE</span>
  <div className="price-display">
    {formatPrice(tradeSignal.entryPrice)}
  </div>
</div>
```

---

## Testing Commands

```bash
# Open validation page in browser
start validate-typography-mobile.html

# Check console for font verification
# Expected: Roboto Mono for prices, Inter for UI
```

---

**Quick Access:** Open `validate-typography-mobile.html` for live examples
