---
title: Bitcoin Sovereign Technology - Complete Styling Specification
version: 1.0.0
last_updated: 2025-10-08
status: Active
inclusion: always
---

# Bitcoin Sovereign Technology - Complete Styling Specification

## Overview

This document defines the **complete styling system** for the Bitcoin Sovereign Technology platform. Every visual element, component, and interaction must follow these specifications exactly.

## Core Design Philosophy

**Bitcoin Sovereign Technology** is a minimalist, digital-native design system that treats the black background as the digital space in which Bitcoin exists. The visual language is confident, forward-looking, and rooted in sovereign technology principles.

### Design Principles

1. **Digital Scarcity**: Only three colors exist - Black, Orange, White
2. **Minimalism**: Remove all unnecessary visual elements
3. **Clarity**: High contrast for maximum readability
4. **Confidence**: Bold typography and decisive color choices
5. **Professionalism**: Clean, structured layouts
6. **Containment**: All content must stay within its container boundaries - no overflow

---

## Color System

### Primary Colors (ONLY THESE THREE)

```css
--bitcoin-black: #000000   /* Pure black - The digital canvas */
--bitcoin-orange: #F7931A  /* Bitcoin orange - Energy, action, value */
--bitcoin-white: #FFFFFF   /* Pure white - Headlines, critical data */
```

### Orange Opacity Variants

```css
--bitcoin-orange-5: rgba(247, 147, 26, 0.05)   /* Subtle backgrounds */
--bitcoin-orange-10: rgba(247, 147, 26, 0.1)   /* Very subtle effects */
--bitcoin-orange-20: rgba(247, 147, 26, 0.2)   /* Borders, dividers */
--bitcoin-orange-30: rgba(247, 147, 26, 0.3)   /* Glow effects */
--bitcoin-orange-50: rgba(247, 147, 26, 0.5)   /* Medium glow */
--bitcoin-orange-80: rgba(247, 147, 26, 0.8)   /* Strong emphasis */
```

### White Opacity Variants (Text Hierarchy)

```css
--bitcoin-white-60: rgba(255, 255, 255, 0.6)   /* Labels, tertiary text */
--bitcoin-white-80: rgba(255, 255, 255, 0.8)   /* Body text, secondary */
--bitcoin-white-90: rgba(255, 255, 255, 0.9)   /* Near-primary text */
--bitcoin-white: #FFFFFF                        /* Headlines, primary text */
```

### Color Usage Rules

| Element | Color | Usage |
|---------|-------|-------|
| **Backgrounds** | `#000000` | Always pure black |
| **Primary Actions** | `#F7931A` | Buttons, CTAs, emphasis |
| **Headlines** | `#FFFFFF` | H1-H6, section titles |
| **Body Text** | `rgba(255,255,255,0.8)` | Paragraphs, descriptions |
| **Labels** | `rgba(255,255,255,0.6)` | Form labels, metadata |
| **Borders** | `rgba(247,147,26,0.2)` | Subtle borders |
| **Emphasis Borders** | `#F7931A` | Strong borders, focus states |
| **Hover States** | Invert colors | Black↔Orange, Orange↔Black |
| **Glow Effects** | `rgba(247,147,26,0.3-0.5)` | Text shadows, box shadows |

### ❌ FORBIDDEN COLORS

**NEVER USE:**
- Green (any shade)
- Red (any shade)
- Blue (any shade)
- Purple (any shade)
- Yellow (any shade)
- Gray (any shade except as opacity of white/black)
- Any other color not listed above

**If you need to indicate:**
- **Positive/Bullish**: Use `text-bitcoin-orange`
- **Negative/Bearish**: Use `text-bitcoin-white-80`
- **Neutral**: Use `text-bitcoin-white-60`
- **Warning**: Use `text-bitcoin-orange` with icon
- **Success**: Use `text-bitcoin-orange` with icon
- **Info**: Use `text-bitcoin-white` with icon

---

## Typography System

### Font Families

```css
/* UI & Headlines - Inter (Geometric Sans-Serif) */
font-family: 'Inter', system-ui, -apple-system, sans-serif;

/* Data & Technical - Roboto Mono (Monospaced) */
font-family: 'Roboto Mono', 'Courier New', monospace;
```

### Font Usage Rules

| Element | Font | Weight | Usage |
|---------|------|--------|-------|
| **Headlines (H1-H6)** | Inter | 800 | Section titles, page headers |
| **Body Text** | Inter | 400 | Paragraphs, descriptions |
| **Buttons** | Inter | 700 | All button text |
| **Labels** | Inter | 600 | Form labels, stat labels |
| **Prices** | Roboto Mono | 700 | Price displays, large numbers |
| **Data Values** | Roboto Mono | 600 | Stats, metrics, technical data |
| **Code/Technical** | Roboto Mono | 400 | Code snippets, addresses |

### Heading Styles

```css
h1 {
  font-size: 2.5rem;      /* 40px */
  font-weight: 800;
  color: var(--bitcoin-white);
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

h2 {
  font-size: 2rem;        /* 32px */
  font-weight: 800;
  color: var(--bitcoin-white);
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 1.25rem;
}

h3 {
  font-size: 1.5rem;      /* 24px */
  font-weight: 800;
  color: var(--bitcoin-white);
  letter-spacing: -0.01em;
  line-height: 1.3;
  margin-bottom: 1rem;
}

h4 {
  font-size: 1.25rem;     /* 20px */
  font-weight: 700;
  color: var(--bitcoin-white);
  line-height: 1.4;
  margin-bottom: 0.875rem;
}

h5 {
  font-size: 1.125rem;    /* 18px */
  font-weight: 700;
  color: var(--bitcoin-white);
  line-height: 1.4;
  margin-bottom: 0.75rem;
}

h6 {
  font-size: 1rem;        /* 16px */
  font-weight: 700;
  color: var(--bitcoin-white);
  line-height: 1.5;
  margin-bottom: 0.625rem;
}
```

### Body Text Styles

```css
body {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;        /* 16px */
  font-weight: 400;
  color: var(--bitcoin-white-80);
  line-height: 1.6;
  background-color: var(--bitcoin-black);
}

p {
  margin-bottom: 1rem;
  color: var(--bitcoin-white-80);
}

.text-large {
  font-size: 1.125rem;    /* 18px */
  line-height: 1.7;
}

.text-small {
  font-size: 0.875rem;    /* 14px */
  line-height: 1.5;
}

.text-xs {
  font-size: 0.75rem;     /* 12px */
  line-height: 1.4;
}
```

### Orange Accent Headlines

```css
.headline-bitcoin {
  color: var(--bitcoin-orange);
  text-shadow: 0 0 30px var(--bitcoin-orange-30);
}
```

---

## Component Styling System

### 1. Bitcoin Block (Main Container)

**The signature component with thin orange border on black background.**

```css
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
```

**Tailwind Classes:**
```tsx
<div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6 transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.3)]">
  {/* Content */}
</div>
```

### 2. Bitcoin Block Subtle (Lighter Border)

```css
.bitcoin-block-subtle {
  background: var(--bitcoin-black);
  border: 1px solid var(--bitcoin-orange-20);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.bitcoin-block-subtle:hover {
  border-color: var(--bitcoin-orange);
  box-shadow: 0 0 20px var(--bitcoin-orange-20);
}
```

**Tailwind Classes:**
```tsx
<div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6 transition-all hover:border-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.2)]">
  {/* Content */}
</div>
```

### 3. Bitcoin Block Orange (Emphasis)

```css
.bitcoin-block-orange {
  background: var(--bitcoin-orange);
  color: var(--bitcoin-black);
  border: 1px solid var(--bitcoin-orange);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.bitcoin-block-orange:hover {
  box-shadow: 0 0 30px var(--bitcoin-orange-50);
}
```

**Tailwind Classes:**
```tsx
<div className="bg-bitcoin-orange text-bitcoin-black border border-bitcoin-orange rounded-xl p-6 transition-all hover:shadow-[0_0_30px_rgba(247,147,26,0.5)]">
  {/* Content */}
</div>
```

### 4. Buttons

#### Primary Button (Solid Orange)

```css
.btn-bitcoin-primary {
  background: var(--bitcoin-orange);
  color: var(--bitcoin-black);
  border: 2px solid var(--bitcoin-orange);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 44px;
}

.btn-bitcoin-primary:hover {
  background: var(--bitcoin-black);
  color: var(--bitcoin-orange);
  box-shadow: 0 0 30px var(--bitcoin-orange-50);
  transform: scale(1.02);
}

.btn-bitcoin-primary:active {
  transform: scale(0.98);
}
```

**Tailwind Classes:**
```tsx
<button className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[44px]">
  Button Text
</button>
```

#### Secondary Button (Orange Outline)

```css
.btn-bitcoin-secondary {
  background: transparent;
  color: var(--bitcoin-orange);
  border: 2px solid var(--bitcoin-orange);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 44px;
}

.btn-bitcoin-secondary:hover {
  background: var(--bitcoin-orange);
  color: var(--bitcoin-black);
  box-shadow: 0 0 20px var(--bitcoin-orange-30);
  transform: scale(1.02);
}
```

**Tailwind Classes:**
```tsx
<button className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:scale-105 active:scale-95 min-h-[44px]">
  Button Text
</button>
```

### 5. Price Display (Glowing Orange Monospace)

```css
.price-display {
  font-family: 'Roboto Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--bitcoin-orange);
  text-shadow: 0 0 30px var(--bitcoin-orange-50);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.price-display-sm {
  font-size: 1.5rem;
  text-shadow: 0 0 20px var(--bitcoin-orange-30);
}

.price-display-lg {
  font-size: 3rem;
  text-shadow: 0 0 40px var(--bitcoin-orange-50);
}
```

**Tailwind Classes:**
```tsx
<div className="font-mono text-4xl font-bold text-bitcoin-orange [text-shadow:0_0_30px_rgba(247,147,26,0.5)] tracking-tight leading-tight">
  $95,000
</div>
```

### 6. Stat Card

```css
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
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--bitcoin-white-60);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--bitcoin-white);
  letter-spacing: -0.01em;
}

.stat-value-orange {
  color: var(--bitcoin-orange);
  text-shadow: 0 0 15px var(--bitcoin-orange-30);
}
```

**Tailwind Classes:**
```tsx
<div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 transition-all hover:border-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.2)]">
  <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
    Label
  </p>
  <p className="font-mono text-2xl font-bold text-bitcoin-white tracking-tight">
    Value
  </p>
</div>
```

### 7. Divider Lines

```css
/* Thin Orange Divider */
.divider-bitcoin {
  width: 100%;
  height: 1px;
  background: var(--bitcoin-orange);
  opacity: 0.2;
}

/* Full Opacity Orange Divider */
.divider-bitcoin-strong {
  width: 100%;
  height: 1px;
  background: var(--bitcoin-orange);
}
```

**Tailwind Classes:**
```tsx
{/* Subtle divider */}
<div className="w-full h-px bg-bitcoin-orange opacity-20"></div>

{/* Strong divider */}
<div className="w-full h-px bg-bitcoin-orange"></div>
```

### 8. Glow Effects

```css
.glow-bitcoin {
  box-shadow: 0 0 20px rgba(247, 147, 26, 0.5);
}

.glow-bitcoin-sm {
  box-shadow: 0 0 10px rgba(247, 147, 26, 0.3);
}

.glow-bitcoin-lg {
  box-shadow: 0 0 40px rgba(247, 147, 26, 0.6);
}

.text-glow-orange {
  text-shadow: 0 0 30px rgba(247, 147, 26, 0.3);
}
```

**Tailwind Classes:**
```tsx
<div className="shadow-[0_0_20px_rgba(247,147,26,0.5)]">
  {/* Glowing element */}
</div>

<h1 className="[text-shadow:0_0_30px_rgba(247,147,26,0.3)]">
  Glowing Text
</h1>
```

---

## Layout System

### Container Widths

```css
.container-narrow {
  max-width: 768px;
  margin: 0 auto;
  padding: 0 1rem;
}

.container-standard {
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 1rem;
}

.container-wide {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.container-full {
  max-width: 1536px;
  margin: 0 auto;
  padding: 0 1rem;
}
```

### Spacing Scale

```css
/* Use consistent spacing multiples of 4px */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Grid System

```css
.grid-bitcoin {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.grid-bitcoin-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-bitcoin-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-bitcoin-4 {
  grid-template-columns: repeat(4, 1fr);
}
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
@media (min-width: 320px)  { /* Extra small mobile */ }
@media (min-width: 480px)  { /* Small mobile */ }
@media (min-width: 640px)  { /* Large mobile / Small tablet */ }
@media (min-width: 768px)  { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large desktop */ }
@media (min-width: 1536px) { /* Extra large desktop */ }
```

### Mobile Optimizations

```css
@media (max-width: 768px) {
  /* Larger touch targets */
  button, a, input {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Larger font sizes */
  body {
    font-size: 1rem;
  }
  
  h1 {
    font-size: 1.75rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
  
  /* Reduced padding */
  .bitcoin-block {
    padding: 1rem;
  }
  
  /* Single column grids */
  .grid-bitcoin,
  .grid-bitcoin-2,
  .grid-bitcoin-3,
  .grid-bitcoin-4 {
    grid-template-columns: 1fr;
  }
}
```

---

## Accessibility

### Focus States

```css
*:focus-visible {
  outline: 2px solid var(--bitcoin-orange);
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(247, 147, 26, 0.3);
}

button:focus-visible {
  outline: 2px solid var(--bitcoin-orange);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(247, 147, 26, 0.4);
}
```

### Color Contrast (WCAG AA)

| Combination | Ratio | Compliance |
|-------------|-------|------------|
| White on Black | 21:1 | AAA ✓ |
| White 80% on Black | 16.8:1 | AAA ✓ |
| White 60% on Black | 12.6:1 | AAA ✓ |
| Orange on Black | 5.8:1 | AA (large text) ✓ |
| Black on Orange | 5.8:1 | AA ✓ |

### Touch Targets

- **Minimum size**: 44px × 44px
- **Recommended size**: 48px × 48px
- **Spacing**: 8px minimum between targets

---

## Animation Guidelines

### Transition Timing

```css
/* Standard transitions */
transition: all 0.3s ease;

/* Fast transitions (hover states) */
transition: all 0.2s ease;

/* Slow transitions (page loads) */
transition: all 0.5s ease;
```

### Easing Functions

```css
/* Entering elements */
ease-out

/* Exiting elements */
ease-in

/* Both entering and exiting */
ease-in-out
```

### Performance

- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Common Patterns

### Card with Header

```tsx
<div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl overflow-hidden">
  <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-3">
    <h2 className="text-2xl font-bold text-bitcoin-white">
      Card Title
    </h2>
    <p className="text-sm text-bitcoin-white-60 italic mt-1">
      Subtitle or description
    </p>
  </div>
  <div className="p-6">
    {/* Card content */}
  </div>
</div>
```

### Data Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
    <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
      Label
    </p>
    <p className="font-mono text-2xl font-bold text-bitcoin-orange">
      $95,000
    </p>
  </div>
  {/* More stat cards */}
</div>
```

### Section Divider

```tsx
<div className="my-8">
  <div className="w-full h-px bg-bitcoin-orange opacity-20 mb-4"></div>
  <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
    Section Title
  </h2>
</div>
```

---

## Quick Reference

### Most Common Classes

```tsx
// Containers
className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6"
className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6"

// Text
className="text-bitcoin-white"
className="text-bitcoin-white-80"
className="text-bitcoin-white-60"
className="text-bitcoin-orange"

// Buttons
className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase px-6 py-3 rounded-lg"
className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase px-6 py-3 rounded-lg"

// Data
className="font-mono text-4xl font-bold text-bitcoin-orange"
className="font-mono text-2xl font-bold text-bitcoin-white"

// Dividers
className="w-full h-px bg-bitcoin-orange opacity-20"
className="w-full h-px bg-bitcoin-orange"
```

---

## Content Containment Rules

### CRITICAL: All Content Must Stay Within Containers

**Every element must be properly contained within its parent container. No overflow, no breaking boundaries.**

#### Container Overflow Rules

```css
/* All bitcoin-block containers must prevent overflow */
.bitcoin-block,
.bitcoin-block-subtle,
.bitcoin-block-orange {
  overflow: hidden;           /* Clip content that exceeds boundaries */
  position: relative;         /* Establish positioning context */
}

/* For scrollable content within containers */
.bitcoin-block-scrollable {
  overflow-x: hidden;         /* Never allow horizontal scroll */
  overflow-y: auto;           /* Allow vertical scroll if needed */
  max-height: 100%;           /* Respect parent height */
}
```

#### Text Overflow Rules

```css
/* Prevent text from breaking container boundaries */
.text-contained {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* For multi-line text that needs containment */
.text-contained-multiline {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;      /* Limit to 3 lines */
  -webkit-box-orient: vertical;
  word-break: break-word;     /* Break long words */
}
```

#### Flex Container Rules

```css
/* Flex containers must not allow children to overflow */
.flex-contained {
  display: flex;
  min-width: 0;               /* Allow flex items to shrink below content size */
  overflow: hidden;
}

.flex-item-contained {
  min-width: 0;               /* Critical for text truncation in flex items */
  overflow: hidden;
  flex-shrink: 1;             /* Allow shrinking */
}
```

#### Grid Container Rules

```css
/* Grid containers must not allow children to overflow */
.grid-contained {
  display: grid;
  overflow: hidden;
}

.grid-item-contained {
  min-width: 0;               /* Allow grid items to shrink */
  overflow: hidden;
}
```

#### Image Containment Rules

```css
/* Images must never exceed container boundaries */
img {
  max-width: 100%;
  height: auto;
  display: block;
}

.image-contained {
  width: 100%;
  height: 100%;
  object-fit: contain;        /* Fit within container */
  object-position: center;
}

.image-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;          /* Fill container, may crop */
  object-position: center;
}
```

#### Responsive Width Rules

```css
/* Ensure responsive elements never exceed viewport */
* {
  box-sizing: border-box;     /* Include padding/border in width calculations */
}

.responsive-container {
  max-width: 100%;            /* Never exceed parent width */
  width: 100%;
  overflow: hidden;
}

/* Prevent horizontal scroll on body */
body {
  overflow-x: hidden;
  max-width: 100vw;
}
```

#### Word Breaking Rules

```css
/* Long words/URLs must break to prevent overflow */
.break-words {
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

/* For code or technical content */
.break-all {
  word-break: break-all;
}

/* Preserve spaces but allow wrapping */
.preserve-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}
```

#### Table Containment Rules

```css
/* Tables must be contained and scrollable */
.table-container {
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
}

table {
  width: 100%;
  table-layout: fixed;        /* Prevent table from expanding */
}

td, th {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

#### Tailwind Utility Classes for Containment

```tsx
/* Container with overflow prevention */
<div className="overflow-hidden">

/* Text truncation */
<div className="truncate">                    /* Single line with ellipsis */
<div className="line-clamp-2">                /* 2 lines with ellipsis */
<div className="line-clamp-3">                /* 3 lines with ellipsis */

/* Word breaking */
<div className="break-words">                 /* Break long words */
<div className="break-all">                   /* Break anywhere */

/* Flex containment */
<div className="flex min-w-0">                /* Flex with shrinkable items */
<div className="flex-shrink min-w-0">         /* Shrinkable flex item */

/* Grid containment */
<div className="grid min-w-0">                /* Grid with shrinkable items */

/* Responsive width */
<div className="max-w-full">                  /* Never exceed parent */
<div className="w-full">                      /* Full width of parent */

/* Scrollable content */
<div className="overflow-x-hidden overflow-y-auto">  /* Vertical scroll only */
```

#### Common Containment Patterns

**Pattern 1: Card with Long Text**
```tsx
<div className="bitcoin-block overflow-hidden">
  <h3 className="text-bitcoin-white font-bold truncate">
    Very Long Title That Might Overflow
  </h3>
  <p className="text-bitcoin-white-80 line-clamp-3">
    Long description text that will be limited to 3 lines
    with an ellipsis at the end if it exceeds that limit.
  </p>
</div>
```

**Pattern 2: Flex Container with Data**
```tsx
<div className="bitcoin-block">
  <div className="flex items-center justify-between gap-2 min-w-0">
    <span className="font-mono text-bitcoin-orange truncate min-w-0">
      $95,000.00
    </span>
    <span className="text-bitcoin-white-60 flex-shrink-0">
      BTC
    </span>
  </div>
</div>
```

**Pattern 3: Grid with Stat Cards**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden">
  <div className="bitcoin-block-subtle min-w-0">
    <p className="stat-label truncate">Label</p>
    <p className="stat-value truncate">$95,000</p>
  </div>
</div>
```

**Pattern 4: Scrollable List**
```tsx
<div className="bitcoin-block">
  <h3 className="text-bitcoin-white font-bold mb-4">List Title</h3>
  <div className="overflow-x-hidden overflow-y-auto max-h-96">
    {items.map(item => (
      <div key={item.id} className="border-b border-bitcoin-orange-20 py-2">
        <p className="truncate">{item.name}</p>
      </div>
    ))}
  </div>
</div>
```

#### Mobile-Specific Containment

```css
@media (max-width: 768px) {
  /* Ensure mobile viewport containment */
  body {
    overflow-x: hidden;
    max-width: 100vw;
  }
  
  /* Prevent horizontal scroll from any element */
  * {
    max-width: 100%;
  }
  
  /* Smaller font sizes to prevent overflow */
  .bitcoin-block {
    font-size: 0.875rem;      /* 14px */
  }
  
  /* Tighter padding on mobile */
  .bitcoin-block {
    padding: 1rem;
  }
  
  /* More aggressive text truncation on mobile */
  .mobile-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
}
```

#### Debugging Overflow Issues

```css
/* Temporarily add red borders to find overflow sources */
* {
  outline: 1px solid red !important;
}

/* Check for elements exceeding viewport */
body > * {
  max-width: 100vw;
  overflow-x: hidden;
}
```

### Containment Checklist

Before committing any component:

- [ ] All containers have `overflow: hidden` or explicit overflow handling
- [ ] Long text uses `truncate` or `line-clamp-*`
- [ ] Flex items have `min-w-0` for proper shrinking
- [ ] Grid items have `min-w-0` for proper shrinking
- [ ] Images have `max-width: 100%`
- [ ] No horizontal scroll on any screen size
- [ ] Tables are wrapped in scrollable containers
- [ ] Long URLs/words use `break-words`
- [ ] All bitcoin-block containers clip overflow
- [ ] Mobile viewport tested (320px width)

---

## Validation Checklist

Before committing any styling changes, verify:

- [ ] Only black, orange, and white colors used
- [ ] Thin orange borders (1-2px) on black backgrounds
- [ ] Inter font for UI, Roboto Mono for data
- [ ] Proper text hierarchy (white 100%, 80%, 60%)
- [ ] Touch targets minimum 44px × 44px
- [ ] Focus states visible (orange outline)
- [ ] Responsive on mobile (320px+)
- [ ] Hover states defined
- [ ] Transitions smooth (0.3s ease)
- [ ] Glow effects on emphasis elements
- [ ] **All content contained within boundaries (no overflow)**
- [ ] **Text truncates properly with ellipsis**
- [ ] **No horizontal scroll on any screen size**
- [ ] **Flex/grid items have min-w-0 for shrinking**
- [ ] **Images never exceed container width**

---

## CSS Class Definitions Required

Add these to `styles/globals.css`:

```css
/* Bitcoin Block - Main Container */
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

/* Bitcoin Block Subtle - Lighter Border */
.bitcoin-block-subtle {
  background: var(--bitcoin-black);
  border: 1px solid var(--bitcoin-orange-20);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.bitcoin-block-subtle:hover {
  border-color: var(--bitcoin-orange);
  box-shadow: 0 0 20px var(--bitcoin-orange-20);
}

/* Bitcoin Block Orange - Emphasis */
.bitcoin-block-orange {
  background: var(--bitcoin-orange);
  color: var(--bitcoin-black);
  border: 1px solid var(--bitcoin-orange);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.bitcoin-block-orange:hover {
  box-shadow: 0 0 30px var(--bitcoin-orange-50);
}
```

---

**Status**: ✅ Complete Styling Specification
**Version**: 1.0.0
**Last Updated**: October 8, 2025
**Compliance**: Bitcoin Sovereign Technology Design System
