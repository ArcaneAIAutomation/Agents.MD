# Device-Specific Optimization Guide

Quick reference for responsive design optimizations across different device sizes.

## Device Breakpoints Quick Reference

| Device | Width | Height | Breakpoint | Priority |
|--------|-------|--------|------------|----------|
| Extra Small Android | 320px | 568px | `@media (max-width: 320px)` | HIGH |
| iPhone SE | 375px | 667px | `@media (min-width: 375px)` | MEDIUM |
| iPhone 12/13/14 | 390px | 844px | `@media (min-width: 390px)` | LOW |
| iPhone Pro Max | 428px | 926px | `@media (min-width: 428px)` | LOW |
| Large Mobile | 640px | 1136px | `@media (min-width: 640px)` | LOW |
| iPad Mini | 768px | 1024px | `@media (min-width: 768px)` | LOW |

## 320px - Extra Small Android (HIGH PRIORITY)

### Issues Identified
- Price displays overflow containers
- Large numbers don't fit in available space
- Affects 5 out of 6 pages

### Recommended CSS

```css
@media (max-width: 320px) {
  /* Price displays - most aggressive sizing */
  .price-display {
    font-size: clamp(1.25rem, 4vw, 1.5rem) !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* Stat values */
  .stat-value {
    font-size: clamp(0.875rem, 3vw, 1rem) !important;
  }
  
  /* Stat labels */
  .stat-label {
    font-size: clamp(0.625rem, 2vw, 0.75rem) !important;
  }
  
  /* Headings */
  h1 {
    font-size: 1.5rem !important;
  }
  
  h2 {
    font-size: 1.25rem !important;
  }
  
  h3 {
    font-size: 1.125rem !important;
  }
  
  /* Container padding */
  .bitcoin-block {
    padding: 12px !important;
  }
  
  /* Ensure overflow clipping */
  .bitcoin-block,
  .stat-card,
  .price-display {
    overflow: hidden;
  }
  
  /* Button text */
  button {
    font-size: 0.75rem !important;
    padding: 8px 12px !important;
  }
}
```

### Testing Checklist
- [ ] Test all pages at exactly 320px width
- [ ] Verify no horizontal scroll
- [ ] Check price displays fit in containers
- [ ] Verify buttons are readable
- [ ] Test in portrait orientation

## 375px - iPhone SE (MEDIUM PRIORITY)

### Issues Identified
- Wallet addresses need truncation on Whale Watch page
- Long text strings may overflow

### Recommended CSS

```css
@media (min-width: 375px) and (max-width: 389px) {
  /* Wallet addresses */
  .wallet-address {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  /* Alternative: Show abbreviated format */
  .wallet-address-short {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.875rem;
  }
  
  /* Price displays - slightly less aggressive */
  .price-display {
    font-size: clamp(1.5rem, 4.5vw, 1.875rem);
  }
  
  /* Container padding */
  .bitcoin-block {
    padding: 14px;
  }
}
```

### JavaScript Helper (Optional)

```javascript
// Shorten wallet address for display
function shortenAddress(address, startChars = 6, endChars = 4) {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// Usage
const displayAddress = shortenAddress('0x1234567890abcdef1234567890abcdef12345678');
// Result: "0x1234...5678"
```

### Testing Checklist
- [ ] Test Whale Watch page specifically
- [ ] Verify wallet addresses display correctly
- [ ] Check tooltip shows full address
- [ ] Test copy-to-clipboard functionality
- [ ] Verify in portrait and landscape

## 390px - iPhone 12/13/14 (LOW PRIORITY)

### Status
✅ All tests passed - No issues detected

### Current Implementation
```css
@media (min-width: 390px) and (max-width: 427px) {
  /* Standard mobile sizing */
  .price-display {
    font-size: clamp(1.5rem, 5vw, 2rem);
  }
  
  .bitcoin-block {
    padding: 16px;
  }
  
  h1 {
    font-size: 1.875rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
}
```

### Notes
- This is the most common iPhone size
- Current implementation works perfectly
- Use as baseline for other devices

## 428px - iPhone Pro Max (LOW PRIORITY)

### Status
✅ All tests passed - No issues detected

### Current Implementation
```css
@media (min-width: 428px) and (max-width: 639px) {
  /* Enhanced mobile sizing */
  .price-display {
    font-size: clamp(1.75rem, 5vw, 2.25rem);
  }
  
  .bitcoin-block {
    padding: 18px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  h2 {
    font-size: 1.625rem;
  }
}
```

### Notes
- Larger screen allows more generous sizing
- Excellent user experience at this size
- Can use less aggressive truncation

## 640px - Large Mobile / Small Tablet (LOW PRIORITY)

### Status
✅ All tests passed - No issues detected

### Current Implementation
```css
@media (min-width: 640px) and (max-width: 767px) {
  /* Transition to tablet sizing */
  .price-display {
    font-size: clamp(2rem, 5vw, 2.5rem);
  }
  
  .bitcoin-block {
    padding: 20px;
  }
  
  /* Consider two-column layouts */
  .grid-bitcoin {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### Notes
- Can start using multi-column layouts
- More space for data displays
- Consider showing more information

## 768px - iPad Mini / Tablets (LOW PRIORITY)

### Status
✅ All tests passed - No issues detected

### Current Implementation
```css
@media (min-width: 768px) {
  /* Full tablet experience */
  .price-display {
    font-size: clamp(2rem, 4vw, 2.5rem);
  }
  
  .bitcoin-block {
    padding: 24px;
  }
  
  /* Multi-column layouts */
  .grid-bitcoin {
    grid-template-columns: repeat(3, 1fr);
  }
  
  /* Larger touch targets still important */
  button {
    min-height: 48px;
  }
}
```

### Notes
- Desktop-like experience with touch optimization
- Can show more complex data visualizations
- Maintain touch-friendly interactions

## Orientation-Specific Optimizations

### Portrait Mode
```css
@media (orientation: portrait) {
  /* Stack elements vertically */
  .flex-row-desktop {
    flex-direction: column;
  }
  
  /* Full-width containers */
  .container {
    width: 100%;
  }
  
  /* Larger vertical spacing */
  .section {
    margin-bottom: 24px;
  }
}
```

### Landscape Mode
```css
@media (orientation: landscape) {
  /* Utilize horizontal space */
  .flex-column-mobile {
    flex-direction: row;
  }
  
  /* Reduce vertical spacing */
  .section {
    margin-bottom: 16px;
  }
  
  /* Consider side-by-side layouts */
  .grid-mobile {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

## Common Patterns

### Responsive Font Sizing
```css
/* Use clamp() for fluid typography */
.responsive-text {
  font-size: clamp(
    1rem,      /* Minimum size */
    3.5vw,     /* Preferred size (viewport-based) */
    1.25rem    /* Maximum size */
  );
}
```

### Container Overflow Prevention
```css
/* Ensure content stays within bounds */
.safe-container {
  overflow: hidden;
  min-width: 0;
  max-width: 100%;
}

/* For flex children */
.flex-child {
  min-width: 0;
  flex-shrink: 1;
}

/* For text truncation */
.truncate-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Touch-Friendly Interactions
```css
/* Minimum touch target size */
.interactive-element {
  min-height: 48px;
  min-width: 48px;
  padding: 12px;
}

/* Adequate spacing between targets */
.button-group button {
  margin: 8px;
}
```

## Testing Commands

### Run Comprehensive Tests
```bash
node validate-text-containment-all-devices.js
```

### Test Specific Device Width
```bash
# Open browser DevTools
# Set device width to specific size
# Check for:
# - Horizontal scroll (should be none)
# - Text overflow
# - Element overlap
```

### Browser DevTools Testing
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device or enter custom dimensions
4. Test both portrait and landscape
5. Check all pages

## Quick Fixes Reference

### Issue: Text Overflows Container
```css
.container {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Issue: Price Too Large
```css
.price-display {
  font-size: clamp(1.25rem, 4vw, 2rem);
  max-width: 100%;
}
```

### Issue: Button Text Wraps
```css
button {
  white-space: nowrap;
  padding: 8px 16px;
  font-size: 0.875rem;
}
```

### Issue: Horizontal Scroll
```css
body {
  overflow-x: hidden;
  max-width: 100vw;
}

* {
  max-width: 100%;
  box-sizing: border-box;
}
```

## Priority Matrix

| Device Width | Priority | Action Required | Estimated Effort |
|--------------|----------|-----------------|------------------|
| 320px | HIGH | Fix price overflow | 2-3 hours |
| 375px | MEDIUM | Add address truncation | 1-2 hours |
| 390px+ | LOW | Monitor only | None |

## Next Steps

1. **Immediate (Today)**
   - Implement 320px fixes
   - Test on real device or DevTools

2. **Short-term (This Week)**
   - Add wallet address truncation
   - Re-run comprehensive tests
   - Verify 100% pass rate

3. **Long-term (This Month)**
   - Add automated visual regression testing
   - Document all responsive patterns
   - Create component library with responsive examples

---

**Last Updated:** January 24, 2025  
**Related Documents:**
- TEXT-CONTAINMENT-TEST-RESULTS.md
- .kiro/specs/mobile-optimization/tasks.md
- STYLING-SPEC.md
