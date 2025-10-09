# Background Patterns & Textures - Quick Reference

## CSS Classes Overview

### 🔷 Hexagonal Grid Backgrounds

```css
/* Apply to body or main container */
.bitcoin-hexagon-pattern
.bitcoin-hexagon-background::before
```

**Usage:**
```html
<body class="bitcoin-hexagon-pattern">
```

**Effect:** Subtle hexagonal grid at 3% opacity across entire page

---

### ✨ Orange Glow Accents

```css
/* Page header glow */
.page-header-glow

/* Section glow accent */
.bitcoin-glow-accent

/* Hover glow effect */
.bitcoin-glow-subtle
```

**Usage:**
```html
<!-- Header with glow -->
<header class="page-header-glow">
  <h1>Title</h1>
</header>

<!-- Section with glow -->
<section class="bitcoin-glow-accent">
  <div class="content">...</div>
</section>

<!-- Card with hover glow -->
<div class="bitcoin-glow-subtle">
  Hover me!
</div>
```

**Effects:**
- `page-header-glow`: Radial gradient at top center (200px height)
- `bitcoin-glow-accent`: Larger glow area (300px height)
- `bitcoin-glow-subtle`: Appears on hover

---

### ➖ Section Dividers

```css
/* Standard gradient divider */
.section-divider

/* Semantic HTML divider */
hr.bitcoin-divider

/* Short centered divider */
.section-divider-short

/* Solid orange divider */
.section-divider-solid

/* Thick divider */
.section-divider-thick

/* Vertical divider */
.vertical-divider
```

**Usage:**
```html
<!-- Standard divider -->
<div class="section-divider"></div>

<!-- Semantic HTML -->
<hr class="bitcoin-divider">

<!-- Short centered -->
<div class="section-divider-short"></div>

<!-- Solid orange -->
<div class="section-divider-solid"></div>

<!-- Thick emphasis -->
<div class="section-divider-thick"></div>

<!-- Vertical (desktop only) -->
<div class="vertical-divider"></div>
```

**Specifications:**
- Standard: 1px height, full width, gradient
- Short: 1px height, 60% width (80% on mobile), centered
- Solid: 1px height, full width, 30% opacity
- Thick: 2px height, full width, gradient
- Vertical: 1px width, full height, gradient (hidden on mobile)

---

## Color Variables

```css
--bitcoin-orange: #F7931A
--bitcoin-orange-5: rgba(247, 147, 26, 0.05)
--bitcoin-orange-10: rgba(247, 147, 26, 0.1)
--bitcoin-black: #000000
--bitcoin-white: #FFFFFF
```

---

## Common Patterns

### Full Page Setup
```html
<body class="bitcoin-hexagon-pattern">
  <header class="page-header-glow">
    <h1>Bitcoin Sovereign</h1>
  </header>
  
  <main>
    <section class="bitcoin-glow-accent">
      <h2>Section Title</h2>
      <p>Content...</p>
    </section>
    
    <div class="section-divider"></div>
    
    <section>
      <div class="bitcoin-glow-subtle">
        <h3>Interactive Card</h3>
        <p>Hover for glow effect</p>
      </div>
    </section>
  </main>
</body>
```

### Card with Divider
```html
<div class="bitcoin-glow-subtle">
  <h3>Card Title</h3>
  <p>First section content</p>
  
  <div class="section-divider-short"></div>
  
  <p>Second section content</p>
</div>
```

### Multiple Sections
```html
<section>
  <h2>Section 1</h2>
  <p>Content...</p>
</section>

<hr class="bitcoin-divider">

<section>
  <h2>Section 2</h2>
  <p>Content...</p>
</section>

<div class="section-divider-thick"></div>

<section>
  <h2>Section 3</h2>
  <p>Content...</p>
</section>
```

---

## Mobile Behavior

### Breakpoint: 768px

**Changes on mobile:**
- Divider margins reduced: 3rem → 2rem
- Short dividers wider: 60% → 80%
- Vertical dividers hidden
- Glow effects maintain same appearance

**No changes needed in HTML** - CSS handles responsiveness automatically

---

## Performance Notes

- ✅ GPU-accelerated (uses `transform` and `opacity`)
- ✅ No JavaScript required
- ✅ Minimal performance impact
- ✅ `pointer-events: none` prevents interaction issues
- ✅ Fixed positioning for backgrounds (no reflow)

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Requirements:**
- CSS Custom Properties (variables)
- CSS Grid
- Pseudo-elements (::before, ::after)
- Linear/Radial gradients

---

## Testing

**Test file:** `test-background-patterns.html`

Open in browser to see:
- Hexagonal grid background
- Orange glow accents
- All divider variations
- Hover effects
- Combined effects

---

## Troubleshooting

### Pattern not visible?
- Check that parent element has `position: relative` or `position: absolute`
- Verify z-index stacking (patterns should be z-index: 0 or -1)
- Ensure CSS variables are defined in `:root`

### Glow not showing?
- Check that element has `position: relative`
- Verify pseudo-element z-index is negative or zero
- Ensure parent has sufficient height

### Divider not centered?
- Use `.section-divider-short` for centered dividers
- Ensure parent has `display: block` or `display: flex`
- Check margin: auto is applied

---

**Last Updated:** January 2025
**Version:** 1.0
**Status:** ✅ Production Ready
