# Design Document: Bitcoin Sovereign Technology Rebrand

## Overview

This design document outlines the CSS-first approach to transforming Agents.MD into a Bitcoin-focused, sovereign technology platform. All changes will be implemented through CSS modifications and minimal HTML/JSX structure adjustments, with zero JavaScript logic changes.

## Visual Reference & Aesthetic Goals

**Key Visual Elements (from reference screenshots):**

1. **Thin Orange Borders**: Clean 1-2px orange borders (#F7931A) on pure black backgrounds
2. **Minimalist Layout**: Generous whitespace, single-column mobile stacks
3. **Orange Accent Lines**: Thin horizontal/vertical orange lines as section dividers
4. **Glowing Orange Text**: Bitcoin Orange text with subtle glow effects for emphasis
5. **Pure Black Canvas**: #000000 background throughout, no gradients or dark greys
6. **Geometric Simplicity**: Rounded corners (8-12px), clean rectangles, no complex shapes
7. **Orange CTAs**: Solid orange buttons that invert to black on hover
8. **Monospaced Data**: Technical data displayed in Roboto Mono with orange highlights

**Aesthetic Principles:**
- **Less is More**: Remove clutter, focus on essential information
- **Orange as Energy**: Use orange sparingly for maximum impact
- **Black as Foundation**: Let black dominate to make orange pop
- **Clean Lines**: Thin borders, not thick or heavy
- **Subtle Patterns**: Background textures at 3-5% opacity maximum

## Architecture

### CSS Architecture Strategy

**Three-Layer Approach:**

1. **Foundation Layer** (`styles/globals.css`)
   - Core color palette CSS variables
   - Base typography styles
   - Global resets and defaults
   - Background patterns and textures

2. **Design System Layer** (`tailwind.config.js`)
   - Extended Tailwind theme with Bitcoin Sovereign colors
   - Custom utility classes for the new design system
   - Responsive breakpoint definitions
   - Animation and transition utilities

3. **Component Layer** (JSX className updates)
   - Update existing Tailwind classes to use new design tokens
   - Add wrapper divs with semantic class names where needed
   - Maintain existing component structure and logic

### File Structure

```
styles/
├── globals.css                 # Core CSS variables, base styles, patterns
├── bitcoin-patterns.css        # Background patterns (hexagonal grids, circuits)
└── animations.css              # Custom animations for sovereign tech feel

public/
├── images/
│   ├── bitcoin-logo.svg        # New Bitcoin-themed logo
│   ├── hexagon-pattern.svg     # Hexagonal grid pattern
│   ├── circuit-pattern.svg     # Circuit board texture
│   └── bitcoin-3d.png          # 3D Bitcoin coin renders
└── fonts/
    ├── inter/                  # Inter font files
    └── roboto-mono/            # Roboto Mono font files

tailwind.config.js              # Extended theme configuration
```

## Color System

### BLACK & ORANGE PHILOSOPHY

**The entire design revolves around two colors:**
- **Black (#000000)**: The void, the digital space, the foundation
- **Orange (#F7931A)**: Bitcoin's signature color, energy, action, value

**Color Usage Rules:**
1. **Background**: Always pure black (#000000)
2. **Primary Actions**: Always Bitcoin Orange (#F7931A)
3. **Text Hierarchy**:
   - Headlines: White (#FFFFFF)
   - Body: White at 80% opacity
   - Labels: White at 60% opacity
   - Emphasis: Bitcoin Orange
4. **Borders**: Orange at 20% opacity (subtle) or 100% (emphasis)
5. **Hover States**: Invert (black to orange, orange to black)
6. **Glow Effects**: Orange at 30-50% opacity for depth

**NO OTHER COLORS** - If it's not black, white, or orange, it doesn't belong.

### CSS Variables (globals.css)

```css
:root {
  /* PRIMARY COLORS - Black & Orange Only */
  --bitcoin-black: #000000;
  --bitcoin-orange: #F7931A;
  --bitcoin-white: #FFFFFF;
  
  /* ORANGE OPACITY VARIANTS - For subtle effects */
  --bitcoin-orange-5: rgba(247, 147, 26, 0.05);
  --bitcoin-orange-10: rgba(247, 147, 26, 0.1);
  --bitcoin-orange-20: rgba(247, 147, 26, 0.2);
  --bitcoin-orange-30: rgba(247, 147, 26, 0.3);
  --bitcoin-orange-50: rgba(247, 147, 26, 0.5);
  --bitcoin-orange-80: rgba(247, 147, 26, 0.8);
  
  /* WHITE OPACITY VARIANTS - For text hierarchy */
  --bitcoin-white-60: rgba(255, 255, 255, 0.6);
  --bitcoin-white-80: rgba(255, 255, 255, 0.8);
  --bitcoin-white-90: rgba(255, 255, 255, 0.9);
  
  /* GRADIENTS - Orange variations only */
  --gradient-bitcoin: linear-gradient(135deg, #F7931A 0%, #FF8C00 100%);
  --gradient-bitcoin-glow: radial-gradient(circle, rgba(247, 147, 26, 0.3) 0%, transparent 70%);
}
```

### Tailwind Theme Extension

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // PRIMARY PALETTE - Black & Orange Focus
        'bitcoin-black': '#000000',
        'bitcoin-orange': '#F7931A',
        'bitcoin-white': '#FFFFFF',
        
        // ORANGE VARIANTS
        'bitcoin-orange-light': '#FF8C00',
        'bitcoin-orange-dark': '#D97706',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['Roboto Mono', 'monospace'],
      },
      boxShadow: {
        'bitcoin-glow': '0 0 20px rgba(247, 147, 26, 0.5)',
        'bitcoin-glow-lg': '0 0 40px rgba(247, 147, 26, 0.6)',
      },
    }
  }
}
```

## Typography System

### Font Implementation (globals.css)

```css
/* Import Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;600;700&display=swap');

/* Base Typography - BLACK & ORANGE FOCUS */
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--bitcoin-black);
  color: var(--bitcoin-white-80);
  line-height: 1.6;
}

/* Headlines - Pure White on Black */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  color: var(--bitcoin-white);
  letter-spacing: -0.02em;
}

/* Orange Accent Headlines */
.headline-bitcoin {
  color: var(--bitcoin-orange);
  text-shadow: 0 0 30px var(--bitcoin-orange-30);
}

/* Data & Technical Elements */
.data-display,
.technical-callout,
.price-display,
.stat-value {
  font-family: 'Roboto Mono', monospace;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* Bitcoin Symbol Styling */
.bitcoin-symbol {
  font-weight: 700;
  color: var(--color-bitcoin-orange);
}
```

## Background Patterns & Textures

### Hexagonal Grid Pattern (globals.css)

```css
/* MINIMAL Hexagonal Grid Background - Very Subtle */
.bitcoin-sovereign-theme::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/hexagon-pattern.svg');
  background-size: 150px 150px;
  background-position: center;
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
}

/* Orange Glow Accent (top of page) */
.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 200px;
  background: radial-gradient(ellipse at center, var(--bitcoin-orange-10) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* Thin Orange Lines (section dividers) */
.section-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--bitcoin-orange) 50%, transparent 100%);
  margin: 3rem 0;
}

/* Corner Accent (optional decorative element) */
.corner-accent {
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  border-top: 2px solid var(--bitcoin-orange);
  border-right: 2px solid var(--bitcoin-orange);
  opacity: 0.3;
}
```

## Component Styling Patterns

### Card/Block Components

```css
/* Bitcoin Block Card - THIN ORANGE BORDER ON BLACK */
.bitcoin-block {
  background: var(--bitcoin-black);
  border: 1px solid var(--bitcoin-orange);
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.bitcoin-block:hover {
  border-color: var(--bitcoin-orange);
  box-shadow: 0 0 20px var(--bitcoin-orange-30);
}

/* Subtle Border Variant (for nested elements) */
.bitcoin-block-subtle {
  background: var(--bitcoin-black);
  border: 1px solid var(--bitcoin-orange-30);
  border-radius: 8px;
  padding: 1rem;
}

.bitcoin-block-subtle:hover {
  border-color: var(--bitcoin-orange);
}

/* Solid Orange Block (for CTAs and emphasis) */
.bitcoin-block-orange {
  background: var(--bitcoin-orange);
  border: 1px solid var(--bitcoin-orange);
  color: var(--bitcoin-black);
  border-radius: 12px;
  padding: 1.5rem;
}

.bitcoin-block-orange:hover {
  box-shadow: 0 0 30px var(--bitcoin-orange-50);
}

/* Thin Orange Accent Line (top border only) */
.bitcoin-block-accent {
  background: var(--bitcoin-black);
  border: none;
  border-top: 2px solid var(--bitcoin-orange);
  border-radius: 0;
  padding: 1.5rem;
}
```

### Button Styles

```css
/* Primary Button - SOLID ORANGE */
.btn-bitcoin-primary {
  background: var(--bitcoin-orange);
  color: var(--bitcoin-black);
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 2px solid var(--bitcoin-orange);
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-bitcoin-primary:hover {
  background: var(--bitcoin-black);
  color: var(--bitcoin-orange);
  border-color: var(--bitcoin-orange);
  box-shadow: 0 0 30px var(--bitcoin-orange-50);
  transform: scale(1.05);
}

/* Secondary Button - ORANGE OUTLINE */
.btn-bitcoin-secondary {
  background: transparent;
  color: var(--bitcoin-orange);
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 2px solid var(--bitcoin-orange);
  transition: all 0.3s ease;
}

.btn-bitcoin-secondary:hover {
  background: var(--bitcoin-orange);
  color: var(--bitcoin-black);
  box-shadow: 0 0 20px var(--bitcoin-orange-30);
}

/* Tertiary Button - WHITE OUTLINE (minimal use) */
.btn-bitcoin-tertiary {
  background: transparent;
  color: var(--bitcoin-white);
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 2px solid var(--bitcoin-white-60);
  transition: all 0.3s ease;
}

.btn-bitcoin-tertiary:hover {
  border-color: var(--bitcoin-white);
  background: var(--bitcoin-white-10);
}
```

### Data Display Components

```css
/* Price Display - GLOWING ORANGE */
.price-display {
  font-family: 'Roboto Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--bitcoin-orange);
  text-shadow: 0 0 30px var(--bitcoin-orange-50);
  letter-spacing: -0.02em;
}

/* Stat Card - BLACK WITH ORANGE BORDER */
.stat-card {
  background: var(--bitcoin-black);
  border: 2px solid var(--bitcoin-orange-20);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: var(--bitcoin-orange);
  box-shadow: 0 0 20px var(--bitcoin-orange-20);
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--bitcoin-white-60);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--bitcoin-white);
}

/* Orange Stat Value (for emphasis) */
.stat-value-orange {
  color: var(--bitcoin-orange);
  text-shadow: 0 0 15px var(--bitcoin-orange-30);
}
```

## Navigation System

### Mobile Hamburger Menu

```css
/* Hamburger Icon */
.hamburger-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  padding: 0.5rem;
}

.hamburger-line {
  width: 28px;
  height: 3px;
  background: var(--color-bitcoin-orange);
  border-radius: 2px;
  transition: all 0.3s ease;
}

/* Full-Screen Overlay Menu */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: var(--color-deep-space-black);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}

.menu-overlay.active {
  opacity: 1;
  pointer-events: all;
}

.menu-item {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--bitcoin-orange);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem 2rem;
  margin: 0.5rem 0;
  border: 2px solid transparent;
  border-radius: 8px;
  transition: all 0.3s ease;
  text-shadow: 0 0 20px var(--bitcoin-orange-30);
}

.menu-item:hover {
  border-color: var(--bitcoin-orange);
  background: var(--bitcoin-orange);
  color: var(--bitcoin-black);
  text-shadow: none;
  transform: translateX(10px);
  box-shadow: 0 0 30px var(--bitcoin-orange-50);
}
```

### Desktop Navigation

```css
/* Desktop Horizontal Nav */
.desktop-nav {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--bitcoin-white-60);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.5rem 1rem;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.nav-link:hover,
.nav-link.active {
  color: var(--bitcoin-orange);
  border-bottom-color: var(--bitcoin-orange);
  text-shadow: 0 0 10px var(--bitcoin-orange-30);
}
```

## Responsive Design

### Mobile-First Breakpoints

```css
/* Mobile (320px - 640px) */
@media (max-width: 640px) {
  .bitcoin-block {
    padding: 1rem;
  }
  
  .price-display {
    font-size: 1.75rem;
  }
  
  .desktop-nav {
    display: none;
  }
  
  .hamburger-menu {
    display: flex;
  }
}

/* Tablet (641px - 1024px) */
@media (min-width: 641px) and (max-width: 1024px) {
  .bitcoin-block {
    padding: 1.25rem;
  }
  
  .price-display {
    font-size: 2rem;
  }
}

/* Desktop (1025px+) */
@media (min-width: 1025px) {
  .hamburger-menu {
    display: none;
  }
  
  .desktop-nav {
    display: flex;
  }
  
  .menu-overlay {
    display: none;
  }
}
```

## Animations & Transitions

### Glow Effects

```css
/* Bitcoin Orange Glow */
@keyframes bitcoin-glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(247, 147, 26, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(247, 147, 26, 0.6);
  }
}

.glow-bitcoin {
  animation: bitcoin-glow 2s ease-in-out infinite;
}

/* Pulse Animation */
@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.pulse-subtle {
  animation: pulse-subtle 3s ease-in-out infinite;
}
```

### Fade In Animations

```css
/* Fade In on Load */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.animate-fade-in-delay-1 {
  animation: fade-in 0.6s ease-out 0.2s both;
}

.animate-fade-in-delay-2 {
  animation: fade-in 0.6s ease-out 0.4s both;
}
```

## Accessibility Considerations

### Focus States

```css
/* Keyboard Focus Indicators */
*:focus-visible {
  outline: 2px solid var(--color-bitcoin-orange);
  outline-offset: 2px;
  border-radius: 4px;
}

button:focus-visible,
a:focus-visible {
  box-shadow: 0 0 0 3px rgba(247, 147, 26, 0.3);
}
```

### Color Contrast

```css
/* Ensure WCAG AA Compliance */
/* White on Black: 21:1 (AAA) ✓ */
/* Hash Grey (#CCCCCC) on Black: 12.6:1 (AAA) ✓ */
/* Bitcoin Orange (#F7931A) on Black: 5.8:1 (AA for large text) ✓ */

/* For small text on Bitcoin Orange background */
.text-on-orange {
  color: var(--color-deep-space-black);
  /* Black on Orange: 5.8:1 (AA) ✓ */
}
```

## Implementation Strategy

### Phase 1: Foundation (globals.css)
1. Add CSS variables for color palette
2. Import and configure fonts
3. Set base body styles (black background, typography)
4. Add background pattern styles

### Phase 2: Design System (tailwind.config.js)
1. Extend Tailwind theme with Bitcoin Sovereign colors
2. Add custom font families
3. Configure custom utilities for animations
4. Set up responsive breakpoints

### Phase 3: Component Updates (JSX className changes)
1. Update existing Tailwind classes to use new color tokens
2. Replace `bg-white` with `bg-deep-space-black`
3. Replace `text-black` with `text-glow-white`
4. Replace accent colors with `bitcoin-orange`
5. Add wrapper divs with `.bitcoin-sovereign-theme` class where needed

### Phase 4: Navigation System
1. Add hamburger menu HTML structure (mobile)
2. Style full-screen overlay menu
3. Update desktop navigation styles
4. Ensure responsive behavior

### Phase 5: Polish & Refinement
1. Add animations and transitions
2. Implement glow effects
3. Test accessibility (focus states, contrast)
4. Validate responsive design across devices

## Testing Checklist

- [ ] All colors meet WCAG AA contrast requirements
- [ ] Fonts load correctly (Inter and Roboto Mono)
- [ ] Background patterns display at correct opacity
- [ ] Mobile hamburger menu functions (CSS-only toggle if possible)
- [ ] Desktop navigation displays correctly
- [ ] All components maintain existing functionality
- [ ] Responsive design works across breakpoints (320px - 1920px+)
- [ ] Animations are smooth and performant
- [ ] Focus states are visible for keyboard navigation
- [ ] No JavaScript errors introduced
- [ ] No broken layouts or overlapping elements

## Rollback Plan

If issues arise:
1. Revert `styles/globals.css` to previous version
2. Revert `tailwind.config.js` to previous version
3. Revert JSX className changes in affected components
4. Remove new image assets if causing issues

All changes are CSS/HTML only, so rollback is straightforward without affecting application logic.
