# Mobile Breakpoints Guide - iPhone Precision Scaling

## Overview

This guide documents the precise mobile breakpoints implemented for optimal text containment and layout scaling across different iPhone models and mobile devices.

## Breakpoint Structure

### Tailwind CSS Breakpoints

```javascript
screens: {
  'xs': '320px',     // Extra small mobile devices (iPhone SE 1st gen, small Android)
  'se': '375px',     // iPhone SE 2nd/3rd gen, iPhone 6/7/8
  'ip': '390px',     // iPhone 12/13/14 standard models
  'ip-max': '428px', // iPhone 12/13/14 Pro Max, Plus models
  'sm': '480px',     // Small mobile devices
  'md': '768px',     // Tablets
  'lg': '1024px',    // Desktop
  'xl': '1280px',    // Large desktop
  '2xl': '1536px',   // Extra large desktop
}
```

### CSS Media Query Breakpoints

The implementation uses precise media query ranges to ensure smooth scaling between breakpoints:

1. **Base Mobile (320px+)**: Universal mobile optimizations
2. **iPhone SE (375px-389px)**: Optimized for iPhone SE 2nd/3rd gen, iPhone 6/7/8
3. **iPhone 12/13/14 (390px-427px)**: Optimized for standard iPhone models
4. **iPhone Pro Max (428px-479px)**: Optimized for Pro Max and Plus models
5. **Tablet (768px+)**: iPad and larger devices

## Device-Specific Optimizations

### iPhone SE (375px - 389px)

**Target Devices:**
- iPhone SE 2nd generation (2020)
- iPhone SE 3rd generation (2022)
- iPhone 6/7/8 (legacy support)

**Optimizations:**
- Container padding: 16px
- Card padding: 14px
- Heading sizes: h1 (28px), h2 (24px), h3 (20px)
- Zone card text: `clamp(0.8rem, 3vw, 0.95rem)`
- Touch targets: 44px minimum

**Usage Example:**
```jsx
<div className="se:px-4 se:text-base">
  Content optimized for iPhone SE
</div>
```

### iPhone 12/13/14 Standard (390px - 427px)

**Target Devices:**
- iPhone 12 (2020)
- iPhone 13 (2021)
- iPhone 14 (2022)
- iPhone 15 (2023)

**Optimizations:**
- Container padding: 18px
- Card padding: 16px
- Heading sizes: h1 (30px), h2 (24px), h3 (20px)
- Zone card text: `clamp(0.85rem, 3.2vw, 1rem)`
- Touch targets: 44px minimum
- Enhanced button padding: 0.75rem 1rem

**Usage Example:**
```jsx
<div className="ip:px-[18px] ip:text-lg">
  Content optimized for iPhone 12/13/14
</div>
```

### iPhone Pro Max (428px - 479px)

**Target Devices:**
- iPhone 12 Pro Max (2020)
- iPhone 13 Pro Max (2021)
- iPhone 14 Pro Max (2022)
- iPhone 14 Plus (2022)
- iPhone 15 Pro Max (2023)
- iPhone 15 Plus (2023)

**Optimizations:**
- Container padding: 20px
- Card padding: 18px
- Heading sizes: h1 (32px), h2 (26px), h3 (22px), h4 (18px)
- Zone card text: `clamp(0.9rem, 3.5vw, 1.05rem)`
- Touch targets: 48px minimum (larger for bigger screen)
- Enhanced button padding: 0.875rem 1.25rem
- Grid layouts: `repeat(auto-fit, minmax(180px, 1fr))`

**Usage Example:**
```jsx
<div className="ip-max:px-5 ip-max:text-xl">
  Content optimized for iPhone Pro Max
</div>
```

## Responsive Text Scaling

### Fluid Typography with clamp()

All text elements use CSS `clamp()` for smooth scaling between breakpoints:

```css
/* Zone card prices */
.zone-card-price {
  font-size: clamp(0.875rem, 3.5vw, 1.125rem);
}

/* Badge text */
.badge {
  font-size: clamp(0.75rem, 2.5vw, 0.875rem);
}

/* Button text */
button {
  font-size: clamp(0.875rem, 3.5vw, 1rem);
}
```

### Breakpoint-Specific Scaling

Each breakpoint has optimized clamp values:

| Element | 375px (SE) | 390px (12/13/14) | 428px (Pro Max) |
|---------|------------|------------------|-----------------|
| Zone Price | `clamp(0.8rem, 3vw, 0.95rem)` | `clamp(0.85rem, 3.2vw, 1rem)` | `clamp(0.9rem, 3.5vw, 1.05rem)` |
| Distance | Same as price | Same as price | Same as price |
| Whale Amount | N/A | `clamp(0.9rem, 3.5vw, 1.1rem)` | `clamp(0.95rem, 3.8vw, 1.15rem)` |
| Badges | `clamp(0.75rem, 2.5vw, 0.875rem)` | Same | Same |

## Container Overflow Prevention

### Universal Mobile Optimizations (320px - 767px)

All mobile breakpoints include overflow prevention:

```css
.zone-card,
.whale-card,
.trade-signal-card,
.market-data-card {
  overflow: hidden;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.price-display,
.amount-display,
.percentage-display {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

## Touch Target Sizing

### Minimum Sizes by Breakpoint

- **320px - 427px**: 44px × 44px (WCAG AA standard)
- **428px+**: 48px × 48px (enhanced for larger screens)

### Implementation

```css
/* Base mobile */
@media (min-width: 320px) and (max-width: 427px) {
  button,
  a[role="button"],
  .mobile-touch-target {
    min-height: 44px;
    min-width: 44px;
  }
}

/* Pro Max and larger */
@media (min-width: 428px) {
  button,
  a[role="button"],
  .mobile-touch-target {
    min-height: 48px;
    min-width: 48px;
  }
}
```

## Testing the Breakpoints

### Browser DevTools Testing

1. Open Chrome/Edge DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Test at these specific widths:
   - 320px (smallest mobile)
   - 375px (iPhone SE)
   - 390px (iPhone 12/13/14)
   - 428px (iPhone Pro Max)
   - 768px (iPad Mini)

### Test File

Use the included `test-mobile-breakpoints.html` file:

```bash
# Open in browser
open test-mobile-breakpoints.html
```

The test file shows:
- Active breakpoint indicators
- Zone card text scaling
- Touch target sizing
- Badge scaling
- Container padding adjustments
- Real-time viewport width display

### Physical Device Testing

**Recommended Test Devices:**
- iPhone SE (2nd/3rd gen) - 375px
- iPhone 12/13/14 - 390px
- iPhone 14 Pro Max - 428px
- iPad Mini - 768px

## Common Patterns

### Responsive Container

```jsx
<div className="
  px-4           /* Base: 16px */
  se:px-4        /* iPhone SE: 16px */
  ip:px-[18px]   /* iPhone 12/13/14: 18px */
  ip-max:px-5    /* iPhone Pro Max: 20px */
  md:px-6        /* Tablet: 24px */
">
  Content
</div>
```

### Responsive Text

```jsx
<p className="
  text-base      /* Base: 16px */
  se:text-base   /* iPhone SE: 16px */
  ip:text-lg     /* iPhone 12/13/14: 18px */
  ip-max:text-xl /* iPhone Pro Max: 20px */
  md:text-2xl    /* Tablet: 24px */
">
  Responsive text
</p>
```

### Responsive Grid

```jsx
<div className="
  grid
  grid-cols-1           /* Base: single column */
  ip-max:grid-cols-2    /* Pro Max: 2 columns */
  md:grid-cols-3        /* Tablet: 3 columns */
  gap-3                 /* Base: 12px gap */
  ip:gap-4              /* iPhone 12/13/14: 16px gap */
  ip-max:gap-[14px]     /* Pro Max: 14px gap */
">
  Grid items
</div>
```

## Best Practices

### 1. Mobile-First Approach
Always start with base mobile styles and enhance for larger screens:

```jsx
<div className="text-base ip:text-lg ip-max:text-xl md:text-2xl">
  Mobile-first text
</div>
```

### 2. Use clamp() for Fluid Scaling
Prefer CSS clamp() over fixed breakpoint sizes for smoother scaling:

```css
font-size: clamp(0.875rem, 3.5vw, 1.125rem);
```

### 3. Test at All Breakpoints
Always test at 320px, 375px, 390px, 428px, and 768px to ensure proper scaling.

### 4. Prevent Text Overflow
Always include overflow prevention for text containers:

```css
overflow: hidden;
word-wrap: break-word;
text-overflow: ellipsis;
```

### 5. Maintain Touch Targets
Never reduce touch targets below 44px on mobile devices.

## Troubleshooting

### Text Overflowing Container

**Solution:** Add overflow prevention and use clamp():

```css
.container {
  overflow: hidden;
  word-wrap: break-word;
}

.text {
  font-size: clamp(0.875rem, 3.5vw, 1.125rem);
}
```

### Buttons Too Small on Pro Max

**Solution:** Use breakpoint-specific sizing:

```jsx
<button className="
  min-h-[44px] min-w-[44px]
  ip-max:min-h-[48px] ip-max:min-w-[48px]
">
  Button
</button>
```

### Layout Breaking Between Breakpoints

**Solution:** Use smooth scaling with clamp() and test at intermediate sizes (e.g., 380px, 410px).

## Performance Considerations

### CSS Optimization

- Breakpoint-specific styles are only applied when needed
- Uses hardware-accelerated properties (transform, opacity)
- Minimizes reflows with efficient selectors

### Testing Performance

```bash
# Run Lighthouse mobile audit
npm run lighthouse:mobile

# Check bundle size
npm run analyze
```

## Future Enhancements

Potential additions for future versions:

1. **Container Queries**: Component-level responsiveness
2. **Dynamic Breakpoints**: JavaScript-based breakpoint detection
3. **Orientation Support**: Portrait vs landscape optimizations
4. **Fold Support**: Optimizations for foldable devices

## References

- [WCAG 2.1 Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [iOS Device Specifications](https://www.ios-resolution.com/)
- [CSS clamp() Documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [Tailwind CSS Breakpoints](https://tailwindcss.com/docs/responsive-design)

---

**Last Updated:** Task 10.4 Implementation
**Version:** 1.0
**Status:** ✅ Complete
