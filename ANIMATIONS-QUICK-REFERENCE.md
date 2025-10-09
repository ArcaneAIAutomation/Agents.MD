# Bitcoin Sovereign Animations - Quick Reference

## 🎨 Glow Animations

### Orange Glow Pulse
```html
<!-- Standard glow (2s) -->
<div class="glow-bitcoin">Content</div>

<!-- Large intense glow (2.5s) -->
<div class="glow-bitcoin-lg">Content</div>

<!-- Fast glow (1s) -->
<div class="glow-bitcoin-fast">Content</div>
```

**Use Cases:**
- Price displays
- Call-to-action buttons
- Featured metrics
- Live data indicators

---

## 💫 Pulse Animations

### Opacity Pulse
```html
<!-- Subtle pulse (3s) -->
<div class="pulse-subtle">Content</div>

<!-- Fast pulse (1.5s) -->
<div class="pulse-subtle-fast">Content</div>

<!-- Live data pulse -->
<div class="price-display-live">$45,000</div>
<div class="stat-value-live">1,234 BTC</div>
```

**Use Cases:**
- Live price updates
- Real-time indicators
- Status badges
- Active elements

---

## 🎬 Fade-In Animations

### Basic Fade-In
```html
<!-- Fade in with slide up (0.6s) -->
<div class="animate-fade-in">Content</div>

<!-- Fade in from bottom (0.8s) -->
<div class="animate-fade-in-up">Content</div>

<!-- Fade in from top (0.6s) -->
<div class="animate-fade-in-down">Content</div>
```

### Staggered Fade-In
```html
<!-- Sequential reveals with delays -->
<div class="animate-fade-in">First (no delay)</div>
<div class="animate-fade-in-delay-1">Second (0.2s)</div>
<div class="animate-fade-in-delay-2">Third (0.4s)</div>
<div class="animate-fade-in-delay-3">Fourth (0.6s)</div>
<div class="animate-fade-in-delay-4">Fifth (0.8s)</div>
<div class="animate-fade-in-delay-5">Sixth (1.0s)</div>
```

**Use Cases:**
- Page sections on load
- Card grids
- List items
- Modal/overlay appearances

---

## ⚡ Smooth Transitions

### Automatic Transitions
These elements have built-in 0.3s ease transitions:
- All `<button>` elements
- All `<a>` links
- `.bitcoin-block` cards
- `.stat-card` components
- `.btn-bitcoin-primary/secondary/tertiary`
- `.nav-link` navigation items
- `.menu-item` menu items

### Manual Transition Classes
```html
<!-- Colors only -->
<div class="transition-colors">Content</div>

<!-- Shadow only -->
<div class="transition-shadow">Content</div>

<!-- Transform only -->
<div class="transition-transform">Content</div>

<!-- Opacity only -->
<div class="transition-opacity">Content</div>

<!-- All properties -->
<div class="transition-all-smooth">Content</div>
```

---

## 🎯 Common Patterns

### Glowing Price Display
```html
<div class="price-display glow-bitcoin">
  $45,000
</div>
```

### Live Stat Card
```html
<div class="stat-card">
  <div class="stat-label">Bitcoin Price</div>
  <div class="stat-value-live">$45,000</div>
</div>
```

### Staggered Card Grid
```html
<div class="stat-grid">
  <div class="stat-card animate-fade-in">Card 1</div>
  <div class="stat-card animate-fade-in-delay-1">Card 2</div>
  <div class="stat-card animate-fade-in-delay-2">Card 3</div>
  <div class="stat-card animate-fade-in-delay-3">Card 4</div>
</div>
```

### Glowing CTA Button
```html
<button class="btn-bitcoin-primary glow-bitcoin">
  Trade Now
</button>
```

### Pulsing Live Indicator
```html
<div class="pulse-subtle" style="display: inline-flex; align-items: center; gap: 0.5rem;">
  <span style="width: 8px; height: 8px; background: var(--bitcoin-orange); border-radius: 50%;"></span>
  <span>LIVE</span>
</div>
```

---

## 📱 Mobile Optimization

All animations are:
- ✅ GPU-accelerated (60fps)
- ✅ Mobile-optimized timing
- ✅ Battery-efficient
- ✅ No layout thrashing

---

## ♿ Accessibility

### Reduced Motion Support
Animations automatically respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  /* All animations reduced to 0.01ms */
}
```

Users with motion sensitivity will see instant transitions instead of animations.

---

## 🎨 Customization

### Adjust Animation Speed
```html
<!-- Slower glow -->
<div class="glow-bitcoin" style="animation-duration: 3s;">Content</div>

<!-- Faster fade-in -->
<div class="animate-fade-in" style="animation-duration: 0.3s;">Content</div>
```

### Adjust Transition Speed
```html
<!-- Slower transition -->
<button class="btn-bitcoin-primary" style="transition-duration: 0.5s;">
  Button
</button>
```

### Pause Animation on Hover
```html
<style>
  .pause-on-hover:hover {
    animation-play-state: paused;
  }
</style>

<div class="glow-bitcoin pause-on-hover">Content</div>
```

---

## 🚫 What NOT to Do

❌ Don't stack multiple glow animations
```html
<!-- BAD: Too much animation -->
<div class="glow-bitcoin pulse-subtle">Content</div>
```

❌ Don't use glow on every element
```html
<!-- BAD: Overuse -->
<div class="glow-bitcoin">
  <div class="glow-bitcoin">
    <div class="glow-bitcoin">Content</div>
  </div>
</div>
```

❌ Don't use fade-in on interactive elements
```html
<!-- BAD: Delays user interaction -->
<button class="btn-bitcoin-primary animate-fade-in-delay-5">
  Click Me
</button>
```

✅ Use animations sparingly for emphasis
✅ Apply glow to key metrics only
✅ Use fade-in for content, not controls

---

## 🎬 Animation Timing Reference

| Animation | Duration | Timing Function | Iterations |
|-----------|----------|-----------------|------------|
| `bitcoin-glow` | 2s | ease-in-out | infinite |
| `bitcoin-glow-lg` | 2.5s | ease-in-out | infinite |
| `pulse-subtle` | 3s | ease-in-out | infinite |
| `fade-in` | 0.6s | ease-out | 1 |
| `fade-in-up` | 0.8s | ease-out | 1 |
| `data-pulse` | 2s | ease-in-out | infinite |
| All transitions | 0.3s | ease | - |

---

## 🔧 Troubleshooting

### Animation Not Working?
1. Check if element has the correct class
2. Verify CSS file is loaded
3. Check browser console for errors
4. Test in different browser

### Animation Too Fast/Slow?
1. Adjust `animation-duration` inline
2. Or create custom class with different timing

### Animation Causing Performance Issues?
1. Reduce number of animated elements
2. Use `will-change` sparingly
3. Check for layout thrashing
4. Test on lower-end devices

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Production Ready ✅
