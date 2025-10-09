# Bitcoin Sovereign Technology - Quick Start Guide

## 🚀 5-Minute Quick Start

This is your fast-track guide to implementing the Bitcoin Sovereign Technology design system.

---

## The Three Rules

### 1. ONLY THREE COLORS
```css
#000000  /* Black - Backgrounds */
#F7931A  /* Orange - Accents, CTAs, emphasis */
#FFFFFF  /* White - Text (with opacity variants) */
```

**If it's not black, orange, or white, it doesn't belong.**

### 2. TWO FONTS
```css
Inter         /* UI, headlines, body text */
Roboto Mono   /* Data, prices, technical displays */
```

### 3. THIN ORANGE BORDERS
```css
border: 1px solid #F7931A;  /* Signature visual element */
```

---

## Essential CSS Classes

### Cards & Blocks
```html
<div class="bitcoin-block">
  <!-- Pure black bg, thin orange border -->
</div>

<div class="bitcoin-block-orange">
  <!-- Solid orange bg, black text (CTA) -->
</div>
```

### Buttons
```html
<button class="btn-bitcoin-primary">
  <!-- Solid orange, inverts on hover -->
</button>

<button class="btn-bitcoin-secondary">
  <!-- Orange outline, fills on hover -->
</button>
```

### Data Displays
```html
<div class="price-display">
  <!-- Large orange monospace with glow -->
  $42,567.89
</div>

<div class="stat-card">
  <div class="stat-label">24h Change</div>
  <div class="stat-value stat-value-orange">+5.67%</div>
</div>
```

---

## Color Classes

### Backgrounds
```css
.bg-bitcoin-black    /* #000000 */
.bg-bitcoin-orange   /* #F7931A */
```

### Text
```css
.text-bitcoin-white       /* #FFFFFF - Headlines */
.text-bitcoin-white-80    /* rgba(255,255,255,0.8) - Body */
.text-bitcoin-white-60    /* rgba(255,255,255,0.6) - Labels */
.text-bitcoin-orange      /* #F7931A - Emphasis */
```

### Borders
```css
.border-bitcoin-orange    /* #F7931A */
.border-bitcoin-orange-20 /* rgba(247,147,26,0.2) - Subtle */
```

---

## Responsive Breakpoints

```css
/* Mobile First */
320px+   /* Base mobile */
640px+   /* Large mobile */
768px+   /* Tablet */
1024px+  /* Desktop */
1280px+  /* Large desktop */
```

**Always start with mobile, enhance for desktop.**

---

## Typography Scale

### Headings
```css
h1 { font-size: 2.5rem; font-weight: 800; }  /* 40px */
h2 { font-size: 2rem; font-weight: 800; }    /* 32px */
h3 { font-size: 1.5rem; font-weight: 700; }  /* 24px */
```

### Body Text
```css
body { font-size: 1rem; }      /* 16px - minimum for mobile */
.text-sm { font-size: 0.875rem; }  /* 14px */
.text-xs { font-size: 0.75rem; }   /* 12px */
```

### Data Displays
```css
.price-display { 
  font-family: 'Roboto Mono';
  font-size: 2.5rem;  /* 40px */
  color: #F7931A;
}
```

---

## Common Patterns

### Card with Data
```html
<div class="bitcoin-block">
  <h3 class="text-xl font-bold text-bitcoin-white mb-4">
    Bitcoin Price
  </h3>
  <div class="price-display">
    $42,567.89
  </div>
  <p class="text-sm text-bitcoin-white-60 mt-2">
    Last updated: 2 minutes ago
  </p>
</div>
```

### Button Group
```html
<div class="flex gap-4">
  <button class="btn-bitcoin-primary">
    Confirm
  </button>
  <button class="btn-bitcoin-secondary">
    Cancel
  </button>
</div>
```

### Stat Grid
```html
<div class="stat-grid stat-grid-4">
  <div class="stat-card">
    <div class="stat-label">Market Cap</div>
    <div class="stat-value">$832.5B</div>
  </div>
  <!-- More stat cards... -->
</div>
```

---

## Accessibility Checklist

### Color Contrast ✅
- White on Black: 21:1 (AAA)
- Orange on Black: 5.8:1 (AA for large text)
- Black on Orange: 5.8:1 (AA)

### Focus States ✅
```css
*:focus-visible {
  outline: 2px solid #F7931A;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(247, 147, 26, 0.3);
}
```

### Touch Targets ✅
- Minimum 48px x 48px for all interactive elements
- 8px spacing between touch targets

---

## Glow Effects

### Orange Glow
```css
.glow-bitcoin {
  box-shadow: 0 0 20px rgba(247, 147, 26, 0.5);
}

.text-glow-orange {
  text-shadow: 0 0 30px rgba(247, 147, 26, 0.3);
}
```

### Usage
- Hover states on cards
- Focus indicators
- Price displays
- Emphasis elements

---

## Mobile Optimization

### Touch-Friendly
```css
/* Minimum touch target */
.btn-bitcoin-primary {
  min-height: 48px;
  min-width: 48px;
  padding: 0.75rem 1.5rem;
}
```

### Responsive Typography
```css
/* Mobile first, scale up */
.price-display {
  font-size: 1.75rem;  /* Mobile */
}

@media (min-width: 768px) {
  .price-display {
    font-size: 2.5rem;  /* Desktop */
  }
}
```

### Single Column Stack
```html
<!-- Mobile: Stack vertically -->
<div class="flex flex-col gap-4 md:flex-row">
  <div class="bitcoin-block">Card 1</div>
  <div class="bitcoin-block">Card 2</div>
</div>
```

---

## Don'ts ❌

### Colors
- ❌ Don't use any colors except Black, Orange, White
- ❌ Don't use gradients (except subtle orange glow)
- ❌ Don't use colored icons (orange or white only)

### Borders
- ❌ Don't use thick borders (max 2px)
- ❌ Don't use rounded corners > 12px
- ❌ Don't use border colors other than orange

### Typography
- ❌ Don't use fonts other than Inter and Roboto Mono
- ❌ Don't use font sizes < 16px for body text
- ❌ Don't use orange text < 18px (contrast issue)

### JavaScript
- ❌ Don't modify JavaScript for visual changes
- ❌ Don't add new React hooks for styling
- ❌ Don't change API calls for design updates

---

## Testing Checklist

Before committing:
- [ ] Only Black, Orange, White colors used
- [ ] Thin orange borders (1-2px) on cards
- [ ] Inter for UI, Roboto Mono for data
- [ ] Responsive (320px - 1920px+)
- [ ] Focus states visible (orange outline)
- [ ] Touch targets ≥ 48px
- [ ] Color contrast meets WCAG AA
- [ ] No JavaScript changes for styling

---

## Resources

### Full Documentation
- `.kiro/steering/bitcoin-sovereign-design.md` - Complete design system
- `BITCOIN-SOVEREIGN-DOCUMENTATION-UPDATE.md` - Documentation summary

### Quick References
- `BUTTON-SYSTEM-QUICK-REFERENCE.md` - Button styles
- `DATA-DISPLAY-QUICK-REFERENCE.md` - Data components
- `ACCESSIBILITY-QUICK-REFERENCE.md` - Accessibility guide

### Implementation
- `.kiro/specs/bitcoin-sovereign-rebrand/tasks.md` - Task list
- `.kiro/specs/bitcoin-sovereign-rebrand/design.md` - Design doc

---

## Need Help?

### Common Issues
1. **Colors not working?** - Check you're using CSS variables or Tailwind classes
2. **Borders too thick?** - Use `border` or `border-2` (max 2px)
3. **Text too small?** - Minimum 16px for body, 18px for orange text
4. **Not responsive?** - Start with mobile classes, add `md:` and `lg:` prefixes

### Get Support
- Check `TROUBLESHOOTING.md` for common issues
- Review `CONTRIBUTING.md` for development guidelines
- See `DOCUMENTATION-UPDATE-COMPLETE.md` for all updated files

---

## Remember

**Bitcoin Sovereign Technology is about:**
- **Minimalism** - Remove clutter, show only what matters
- **Confidence** - Bold, decisive design choices
- **Digital Native** - Treating black as the space where Bitcoin exists
- **Accessibility** - High contrast, clear focus states, touch-friendly

**If you're writing JavaScript, you're doing it wrong. This is CSS/HTML only!**

---

**Last Updated**: January 2025  
**Design System**: Bitcoin Sovereign Technology  
**Status**: ✅ Ready to Use

