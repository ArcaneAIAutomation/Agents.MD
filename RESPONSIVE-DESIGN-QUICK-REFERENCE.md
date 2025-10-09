# Responsive Design Quick Reference

## 🎯 Breakpoints

```css
Mobile:  320px - 640px   (Single column, hamburger menu)
Tablet:  641px - 1024px  (Two columns, hamburger menu)
Desktop: 1025px+         (Multi-column, horizontal nav)
```

---

## 📱 Common Patterns

### Show/Hide by Device

```html
<!-- Show only on mobile -->
<div class="mobile-only">Mobile content</div>

<!-- Show only on tablet -->
<div class="tablet-only">Tablet content</div>

<!-- Show only on desktop -->
<div class="desktop-only">Desktop content</div>

<!-- Hide on mobile -->
<div class="hide-mobile">Not on mobile</div>
```

### Responsive Navigation

```html
<!-- Hamburger (Mobile/Tablet) -->
<div class="hamburger-menu">
  <div class="hamburger-line"></div>
  <div class="hamburger-line"></div>
  <div class="hamburger-line"></div>
</div>

<!-- Desktop Nav -->
<nav class="desktop-nav">
  <a href="#" class="nav-link">Link 1</a>
  <a href="#" class="nav-link">Link 2</a>
</nav>
```

### Responsive Button Groups

```html
<!-- Automatically stacks on mobile, horizontal on desktop -->
<div class="btn-bitcoin-group">
  <button class="btn-bitcoin-primary">Primary</button>
  <button class="btn-bitcoin-secondary">Secondary</button>
</div>
```

### Responsive Grids

```html
<!-- 1 col (mobile) → 2 cols (tablet) → 4 cols (desktop) -->
<div class="stat-grid-4">
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
</div>
```

---

## 🎨 Component Sizing

### Price Displays

| Device | Size | Class |
|--------|------|-------|
| Mobile | 28px | `.price-display` |
| Tablet | 36px | `.price-display` |
| Desktop | 48px | `.price-display` |

### Headings

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| h1 | 30px | 36px | 40px |
| h2 | 24px | 30px | 32px |
| h3 | 20px | 24px | 24px |
| h4 | 18px | 20px | 20px |

### Card Padding

| Device | Padding |
|--------|---------|
| Mobile | 1rem |
| Tablet | 1.25rem |
| Desktop | 1.5rem |

---

## 🔧 Utility Classes

### Fluid Typography

```html
<h1 class="responsive-text-3xl">Scales smoothly</h1>
<p class="responsive-text-base">Fluid body text</p>
```

### Fluid Spacing

```html
<div class="responsive-padding">Adaptive padding</div>
<div class="responsive-margin">Adaptive margin</div>
<div class="responsive-gap">Adaptive gap</div>
```

---

## 📐 Layout Patterns

### Single Column (Mobile)

```html
<div class="content-section">
  <!-- Automatically stacks vertically on mobile -->
  <div class="bitcoin-block">Block 1</div>
  <div class="bitcoin-block">Block 2</div>
</div>
```

### Two Column (Tablet)

```html
<div class="content-section-tablet">
  <!-- 2 columns on tablet, 1 on mobile -->
  <div class="bitcoin-block">Block 1</div>
  <div class="bitcoin-block">Block 2</div>
</div>
```

### Multi-Column (Desktop)

```html
<div class="content-section-desktop">
  <!-- 3 columns on desktop, 2 on tablet, 1 on mobile -->
  <div class="bitcoin-block">Block 1</div>
  <div class="bitcoin-block">Block 2</div>
  <div class="bitcoin-block">Block 3</div>
</div>
```

---

## 🎯 Touch Targets

All interactive elements automatically meet WCAG standards:

- **Minimum:** 48px × 48px on mobile
- **Buttons:** Full width on mobile, auto on desktop
- **Links:** Adequate spacing between targets

---

## 🔄 Smooth Transitions

All layout changes transition smoothly (0.3s ease):

- Grid column changes
- Flex direction changes
- Font size changes
- Padding/margin changes
- Navigation visibility

---

## 📊 Grid Behavior

| Class | Mobile | Tablet | Desktop |
|-------|--------|--------|---------|
| `.stat-grid` | 1 col | 1 col | Auto-fit |
| `.stat-grid-2` | 1 col | 2 cols | 2 cols |
| `.stat-grid-3` | 1 col | 2 cols | 3 cols |
| `.stat-grid-4` | 1 col | 2 cols | 4 cols |

---

## 🎨 Bitcoin Sovereign Consistency

All responsive styles maintain:

- ✅ Pure black backgrounds (#000000)
- ✅ Bitcoin orange accents (#F7931A)
- ✅ Thin orange borders (1-2px)
- ✅ White text hierarchy
- ✅ Roboto Mono for data
- ✅ Inter for UI

---

## 🧪 Testing

Open `test-responsive-design.html` and resize your browser to see all breakpoints in action.

**Viewport Indicator:** Shows current breakpoint in top-right corner.

---

## 💡 Best Practices

1. **Mobile-First:** Design for mobile, enhance for desktop
2. **Touch-Friendly:** Minimum 48px touch targets
3. **Readable Text:** Minimum 16px body text
4. **Smooth Transitions:** All layout changes animate
5. **Consistent Spacing:** Use responsive utilities
6. **Test All Breakpoints:** Verify 320px to 1920px+

---

## 🚀 Quick Start

```html
<!-- Basic responsive page structure -->
<body class="bitcoin-sovereign-theme">
  <header>
    <!-- Hamburger for mobile/tablet -->
    <div class="hamburger-menu">...</div>
    
    <!-- Desktop nav -->
    <nav class="desktop-nav">...</nav>
  </header>
  
  <main class="container">
    <!-- Price display (auto-scales) -->
    <div class="price-display">$42,850</div>
    
    <!-- Responsive grid (1→2→4 columns) -->
    <div class="stat-grid-4">
      <div class="stat-card">...</div>
      <div class="stat-card">...</div>
      <div class="stat-card">...</div>
      <div class="stat-card">...</div>
    </div>
    
    <!-- Responsive buttons (stack→horizontal) -->
    <div class="btn-bitcoin-group">
      <button class="btn-bitcoin-primary">Action</button>
      <button class="btn-bitcoin-secondary">Cancel</button>
    </div>
  </main>
</body>
```

---

**Last Updated:** January 2025  
**Status:** ✅ Production Ready
