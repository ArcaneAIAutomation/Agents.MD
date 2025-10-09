# Bitcoin Sovereign Technology Design System

## Core Philosophy & Visual Identity

**FROM (Old):** An identity rooted in traditional media, conveying trust through established journalistic conventions.

**TO (New):** An identity rooted in Sovereign Technology. The visual language is that of a secure, digital-native environment. The mood is minimalist, confident, and forward-looking, treating the black background not as a color, but as the digital space in which Bitcoin exists.

## CRITICAL CONSTRAINTS (CSS/HTML ONLY)

**This is a CSS/HTML-only visual rebrand. The following constraints are MANDATORY:**

1. **NO JavaScript Changes**: Do not modify, add, or remove any JavaScript code, React components logic, or TypeScript files
2. **NO Backend Changes**: Do not interact with or modify server-side code, database queries, API endpoints, or data fetching logic
3. **NO New Features**: Do not introduce any new interactive elements, data fetches, or functional components
4. **Existing Content Only**: Style only the content that is already present in the HTML/JSX structure
5. **Prioritize CSS & HTML**: Focus changes primarily on CSS stylesheets (globals.css, Tailwind config) and minor HTML/JSX structure adjustments for layout purposes only

## The Color Palette: Digital Scarcity

**BLACK & ORANGE ONLY - No Exceptions**

### Primary Colors
- **Deep Space Black**: `#000000` - The canvas, the void, the digital space
- **Bitcoin Orange**: `#F7931A` - Energy, action, value, emphasis
- **Glow White**: `#FFFFFF` - Headlines and critical data

### Color Usage Rules
1. **Background**: Always pure black (#000000)
2. **Primary Actions**: Always Bitcoin Orange (#F7931A)
3. **Text Hierarchy**:
   - Headlines: White (#FFFFFF)
   - Body: White at 80% opacity (`rgba(255, 255, 255, 0.8)`)
   - Labels: White at 60% opacity (`rgba(255, 255, 255, 0.6)`)
   - Emphasis: Bitcoin Orange
4. **Borders**: Orange at 20% opacity (subtle) or 100% (emphasis)
5. **Hover States**: Invert (black to orange, orange to black)
6. **Glow Effects**: Orange at 30-50% opacity for depth

**If it's not black, white, or orange, it doesn't belong.**

### CSS Variables

```css
:root {
  /* PRIMARY COLORS */
  --bitcoin-black: #000000;
  --bitcoin-orange: #F7931A;
  --bitcoin-white: #FFFFFF;
  
  /* ORANGE OPACITY VARIANTS */
  --bitcoin-orange-5: rgba(247, 147, 26, 0.05);
  --bitcoin-orange-10: rgba(247, 147, 26, 0.1);
  --bitcoin-orange-20: rgba(247, 147, 26, 0.2);
  --bitcoin-orange-30: rgba(247, 147, 26, 0.3);
  --bitcoin-orange-50: rgba(247, 147, 26, 0.5);
  
  /* WHITE OPACITY VARIANTS */
  --bitcoin-white-60: rgba(255, 255, 255, 0.6);
  --bitcoin-white-80: rgba(255, 255, 255, 0.8);
}
```

## Typography: Code & Clarity

### Font Stack
- **Headlines & UI**: Inter (clean, geometric sans-serif)
- **Data & Technical Callouts**: Roboto Mono (crisp monospaced font for "ledger" feel)

### Typography Rules
```css
/* Base */
body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: var(--bitcoin-black);
  color: var(--bitcoin-white-80);
}

/* Headlines */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  color: var(--bitcoin-white);
}

/* Data & Technical */
.price-display,
.stat-value,
.technical-data {
  font-family: 'Roboto Mono', monospace;
  font-weight: 600;
}
```

## Visual Elements: The Bitcoin Aesthetic

### Thin Orange Borders (Key Visual Element)
- Use **1-2px solid orange borders** on pure black backgrounds
- This is the signature look from the reference designs
- Clean, minimalist, high-contrast

```css
.bitcoin-block {
  background: var(--bitcoin-black);
  border: 1px solid var(--bitcoin-orange);
  border-radius: 12px;
  padding: 1.5rem;
}
```

### Background Textures (Subtle)
- **Hexagonal grids**: Very subtle (3% opacity max)
- **Network node connections**: Minimal, barely visible
- **Circuit board traces**: Optional, extremely subtle

### Iconography
- Use the Bitcoin '₿' symbol as a design element (e.g., for bullet points)
- All functional icons must be minimalist orange or white outlines
- No complex or colorful icons

### Glow Effects
```css
/* Orange Glow */
.glow-bitcoin {
  box-shadow: 0 0 20px rgba(247, 147, 26, 0.5);
}

/* Text Glow */
.text-glow-orange {
  text-shadow: 0 0 30px rgba(247, 147, 26, 0.3);
}
```

## Component Patterns

### Cards & Blocks
```css
/* Standard Block */
.bitcoin-block {
  background: var(--bitcoin-black);
  border: 1px solid var(--bitcoin-orange);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.bitcoin-block:hover {
  box-shadow: 0 0 20px var(--bitcoin-orange-30);
}

/* Emphasis Block (Solid Orange) */
.bitcoin-block-orange {
  background: var(--bitcoin-orange);
  color: var(--bitcoin-black);
  border: 1px solid var(--bitcoin-orange);
}
```

### Buttons
```css
/* Primary (Solid Orange) */
.btn-bitcoin-primary {
  background: var(--bitcoin-orange);
  color: var(--bitcoin-black);
  border: 2px solid var(--bitcoin-orange);
  font-weight: 700;
  text-transform: uppercase;
}

.btn-bitcoin-primary:hover {
  background: var(--bitcoin-black);
  color: var(--bitcoin-orange);
  box-shadow: 0 0 30px var(--bitcoin-orange-50);
}

/* Secondary (Orange Outline) */
.btn-bitcoin-secondary {
  background: transparent;
  color: var(--bitcoin-orange);
  border: 2px solid var(--bitcoin-orange);
}

.btn-bitcoin-secondary:hover {
  background: var(--bitcoin-orange);
  color: var(--bitcoin-black);
}
```

### Data Displays
```css
/* Price Display */
.price-display {
  font-family: 'Roboto Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--bitcoin-orange);
  text-shadow: 0 0 30px var(--bitcoin-orange-50);
}

/* Stat Card */
.stat-card {
  background: var(--bitcoin-black);
  border: 2px solid var(--bitcoin-orange-20);
  border-radius: 8px;
  padding: 1rem;
}

.stat-label {
  color: var(--bitcoin-white-60);
  text-transform: uppercase;
  font-size: 0.75rem;
}

.stat-value {
  font-family: 'Roboto Mono', monospace;
  color: var(--bitcoin-white);
  font-size: 1.5rem;
  font-weight: 700;
}
```

## Mobile-First Experience: Cutting the Fat 📱

**FROM (Old):** A cluttered, desktop-first design that is scaled down, resulting in information overload.

**TO (New):** A headline-first, minimalist approach. The mobile experience is paramount and must be clean and focused.

### Mobile Principles
1. **Prioritize Key Data**: Logo, Menu Icon, Current Bitcoin Price at the top
2. **Collapsible Sections**: Use accordions with orange headers
3. **Single-Column Stack**: All content as clean "Block" cards
4. **Simplify Data**: Hide full tables by default, show key metrics with "View Details" buttons

### Responsive Breakpoints
```css
/* Mobile (320px - 640px) */
@media (max-width: 640px) {
  /* Single column, reduced padding */
}

/* Tablet (641px - 1024px) */
@media (min-width: 641px) and (max-width: 1024px) {
  /* Two columns where appropriate */
}

/* Desktop (1025px+) */
@media (min-width: 1025px) {
  /* Multi-column layouts */
}
```

## Navigation & Information Architecture

**FROM (Old):** A crowded header with numerous visible links.

**TO (New):** A streamlined "Gateway" menu system.

### Mobile/Tablet Navigation
- **Hamburger Icon**: Three orange horizontal lines
- **Full-Screen Overlay**: Black background with bold orange menu items

### Menu Items (in order)
1. CRYPTO NEWS WIRE
2. AI TRADE GENERATION ENGINE
3. BITCOIN MARKET REPORT
4. ETHEREUM MARKET REPORT
5. BITCOIN WHALE WATCH
6. NEXO.COM UK REGULATORY UPDATES

### Desktop Navigation
- Clean, minimalist horizontal list in header
- Orange underline on hover/active
- White text at 60% opacity, orange on hover

## Accessibility Requirements

### Color Contrast (WCAG AA Minimum)
- White on Black: 21:1 (AAA) ✓
- White 80% on Black: 16.8:1 (AAA) ✓
- Orange on Black: 5.8:1 (AA for large text) ✓
- Black on Orange: 5.8:1 (AA) ✓

### Focus States
```css
*:focus-visible {
  outline: 2px solid var(--bitcoin-orange);
  outline-offset: 2px;
}

button:focus-visible,
a:focus-visible {
  box-shadow: 0 0 0 3px rgba(247, 147, 26, 0.3);
}
```

### Touch Targets
- Minimum 48px x 48px for all interactive elements
- Adequate spacing between touch targets (8px minimum)

## Implementation Guidelines

### File Modifications
- **Primary**: `styles/globals.css` - All base styles and CSS variables
- **Secondary**: `tailwind.config.js` - Extended theme configuration
- **Tertiary**: JSX files - Update className attributes only

### What to Change
✅ CSS classes and styles
✅ Tailwind className attributes
✅ Color values
✅ Font families
✅ Border styles
✅ Background colors
✅ Text colors
✅ Padding/margin for layout
✅ Wrapper divs for styling hooks

### What NOT to Change
❌ JavaScript logic
❌ React hooks (useState, useEffect, etc.)
❌ API calls or data fetching
❌ Event handlers
❌ Component functionality
❌ Backend code
❌ Database queries

## Testing Checklist

Before considering any task complete:
- [ ] Visual matches Bitcoin Sovereign aesthetic (black, orange, white only)
- [ ] Thin orange borders on black backgrounds
- [ ] Responsive design works (320px - 1920px+)
- [ ] All existing functionality still works
- [ ] No JavaScript errors in console
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus states are visible
- [ ] Touch targets are 48px minimum
- [ ] Animations are smooth (60fps)

## Quick Reference

**Colors:**
- Black: `#000000` or `bg-bitcoin-black`
- Orange: `#F7931A` or `bg-bitcoin-orange`
- White: `#FFFFFF` or `text-bitcoin-white`

**Fonts:**
- UI: `font-sans` (Inter)
- Data: `font-mono` (Roboto Mono)

**Common Classes:**
- `.bitcoin-block` - Card with orange border
- `.btn-bitcoin-primary` - Solid orange button
- `.price-display` - Large orange monospace price
- `.stat-card` - Data stat with border
- `.glow-bitcoin` - Orange glow effect

**Remember:** If you're writing JavaScript, you're doing it wrong. This is CSS/HTML only!
