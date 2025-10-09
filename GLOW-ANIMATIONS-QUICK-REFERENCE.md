# Glow Effects & Animations Quick Reference

## Quick Copy-Paste Guide for Bitcoin Sovereign Glow Effects

### Button Glow Effects

```css
/* Primary Button - Solid Orange with Glow */
.btn-bitcoin-primary:hover {
  box-shadow: 0 0 20px rgba(247, 147, 26, 0.5);
  transform: scale(1.02);
  transition: all 0.3s ease;
}

/* Secondary Button - Orange Outline with Glow */
.btn-bitcoin-secondary:hover {
  box-shadow: 0 0 10px rgba(247, 147, 26, 0.3);
  transform: scale(1.02);
  transition: all 0.3s ease;
}
```

### Card Glow Effects

```css
/* Bitcoin Block - Main Container */
.bitcoin-block:hover {
  box-shadow: 0 0 20px rgba(247, 147, 26, 0.3);
}

/* Stat Card - Data Display */
.stat-card:hover {
  box-shadow: 0 0 20px rgba(247, 147, 26, 0.2);
  border-color: var(--bitcoin-orange);
}
```

### Text Glow Effects

```css
/* Price Display - Large Numbers */
.price-display {
  text-shadow: 0 0 30px rgba(247, 147, 26, 0.5);
}

/* Price Display Small */
.price-display-sm {
  text-shadow: 0 0 20px rgba(247, 147, 26, 0.3);
}

/* Price Display Large */
.price-display-lg {
  text-shadow: 0 0 40px rgba(247, 147, 26, 0.5);
}

/* Stat Value Orange */
.stat-value-orange {
  text-shadow: 0 0 15px rgba(247, 147, 26, 0.3);
}
```

### Animation Classes

```css
/* Pulsing Glow - Standard */
.glow-bitcoin {
  animation: bitcoin-glow 2s ease-in-out infinite;
}

/* Pulsing Glow - Large */
.glow-bitcoin-lg {
  animation: bitcoin-glow-lg 2.5s ease-in-out infinite;
}

/* Live Data Pulse */
.price-display-live {
  animation: data-pulse 2s ease-in-out infinite;
}

/* Fade In */
.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}
```

### Tailwind Classes

```tsx
{/* Button with Glow */}
<button className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105">
  Click Me
</button>

{/* Card with Glow */}
<div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6 transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.3)]">
  Content
</div>

{/* Price with Glow */}
<div className="font-mono text-4xl font-bold text-bitcoin-orange [text-shadow:0_0_30px_rgba(247,147,26,0.5)]">
  $95,000
</div>
```

### Mobile-Specific Adjustments

```css
@media (max-width: 768px) {
  /* Enhanced Glow for Mobile */
  .bitcoin-block:hover {
    box-shadow: 0 0 25px rgba(247, 147, 26, 0.4);
  }
  
  /* Larger Touch Targets */
  .btn-bitcoin-primary {
    min-height: 48px;
    min-width: 48px;
  }
  
  /* Enhanced Focus Glow */
  button:focus-visible {
    box-shadow: 0 0 0 5px rgba(247, 147, 26, 0.5);
  }
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Glow Intensity Guide

| Element | Glow Intensity | Use Case |
|---------|---------------|----------|
| `0 0 10px rgba(247,147,26,0.3)` | Subtle | Secondary buttons, small elements |
| `0 0 15px rgba(247,147,26,0.3)` | Light | Stat values, small text |
| `0 0 20px rgba(247,147,26,0.3)` | Medium | Cards, containers, standard hover |
| `0 0 30px rgba(247,147,26,0.5)` | Strong | Primary buttons, large prices |
| `0 0 40px rgba(247,147,26,0.5)` | Intense | Extra large prices, emphasis |

## Transition Timing

| Duration | Use Case |
|----------|----------|
| `0.2s ease` | Fast interactions (micro-animations) |
| `0.3s ease` | Standard (buttons, cards, hover states) |
| `0.5s ease` | Slow (page transitions, large elements) |

## Scale Effects

| Scale | Use Case |
|-------|----------|
| `scale(1.02)` | Subtle hover (buttons, cards) |
| `scale(1.05)` | Noticeable hover (large elements) |
| `scale(0.98)` | Active/pressed state |

## Common Patterns

### Pattern 1: Glowing Button
```tsx
<button className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase px-6 py-3 rounded-lg transition-all duration-300 hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95">
  Trade Now
</button>
```

### Pattern 2: Glowing Card
```tsx
<div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(247,147,26,0.3)]">
  <h3 className="text-bitcoin-white font-bold mb-2">Bitcoin Analysis</h3>
  <p className="text-bitcoin-white-80">Market insights...</p>
</div>
```

### Pattern 3: Glowing Price
```tsx
<div className="text-center">
  <p className="font-mono text-5xl font-bold text-bitcoin-orange [text-shadow:0_0_30px_rgba(247,147,26,0.5)]">
    $95,234
  </p>
  <p className="text-bitcoin-white-60 text-sm mt-2">Current Price</p>
</div>
```

### Pattern 4: Pulsing Live Data
```tsx
<div className="price-display-live font-mono text-4xl font-bold text-bitcoin-orange">
  $95,234
</div>
```

## CSS Variables

```css
:root {
  /* Glow Shadow Variables */
  --shadow-bitcoin-glow: 0 0 20px rgba(247, 147, 26, 0.5);
  --shadow-bitcoin-glow-lg: 0 0 40px rgba(247, 147, 26, 0.6);
  --shadow-bitcoin-glow-sm: 0 0 10px rgba(247, 147, 26, 0.3);
  
  /* Orange Opacity Variants */
  --bitcoin-orange-30: rgba(247, 147, 26, 0.3);
  --bitcoin-orange-50: rgba(247, 147, 26, 0.5);
}
```

## Accessibility Checklist

- ✅ All glow effects maintain WCAG 2.1 AA contrast ratios
- ✅ Focus states have visible orange outline + glow
- ✅ Reduced motion preference respected
- ✅ Touch targets minimum 48px on mobile
- ✅ Keyboard navigation fully supported

## Performance Tips

1. **Use GPU Acceleration:**
   ```css
   .animated-element {
     will-change: transform, opacity;
     transform: translateZ(0);
     backface-visibility: hidden;
   }
   ```

2. **Limit Animated Properties:**
   - Prefer `transform` and `opacity`
   - Avoid animating `width`, `height`, `top`, `left`

3. **Use CSS Variables:**
   - Define glow values once
   - Reuse across components

4. **Respect User Preferences:**
   - Always include `prefers-reduced-motion` support
   - Test with reduced motion enabled

## Testing Checklist

- [ ] Glow effects visible on hover
- [ ] Transitions are smooth (0.3s ease)
- [ ] Scale effects work correctly
- [ ] Mobile touch targets are 48px minimum
- [ ] Focus states are clearly visible
- [ ] Reduced motion preference respected
- [ ] Works across all browsers
- [ ] Performance is smooth (60fps)

---

**Last Updated:** January 2025  
**Spec:** Bitcoin Sovereign Technology Design System  
**Task:** 12.7 Glow Effects & Animations Validation
