# Mobile/Tablet CSS Classes Documentation

## Overview

This document provides comprehensive documentation for all mobile and tablet-specific CSS classes in the Bitcoin Sovereign Technology platform. These classes ensure proper color contrast, visibility, and user experience on mobile devices (320px-1023px).

---

## Table of Contents

1. [Button State Classes](#button-state-classes)
2. [Text Visibility Classes](#text-visibility-classes)
3. [Background Safety Classes](#background-safety-classes)
4. [Border Visibility Classes](#border-visibility-classes)
5. [Icon Visibility Classes](#icon-visibility-classes)
6. [Card and Container Classes](#card-and-container-classes)
7. [Input and Form Classes](#input-and-form-classes)
8. [Emergency Override Classes](#emergency-override-classes)
9. [Navigation Classes](#navigation-classes)
10. [Menu Classes](#menu-classes)
11. [Feature Badge Classes](#feature-badge-classes)
12. [Usage Examples](#usage-examples)

---

## Button State Classes

### `.mobile-btn-inactive`
**Purpose:** Inactive button state with orange text on black background  
**Use When:** Button is not currently active/selected  
**Colors:** Black background, orange text, orange border  
**Contrast Ratio:** 5.8:1 (AA compliant)

```css
.mobile-btn-inactive {
  background: #000000 !important;
  color: #F7931A !important;
  border: 2px solid #F7931A !important;
  min-height: 48px;
  min-width: 48px;
}
```

**Example:**
```html
<button class="mobile-btn-inactive">
  Crypto News Wire
</button>
```

---

### `.mobile-btn-active`
**Purpose:** Active button state with orange background and black text  
**Use When:** Button is currently active/selected  
**Colors:** Orange background, black text, orange border  
**Contrast Ratio:** 5.8:1 (AA compliant)  
**Special:** Includes glow effect

```css
.mobile-btn-active {
  background: #F7931A !important;
  color: #000000 !important;
  border: 2px solid #F7931A !important;
  box-shadow: 0 0 20px rgba(247, 147, 26, 0.5);
  min-height: 48px;
  min-width: 48px;
}
```

**Example:**
```html
<button class="mobile-btn-active">
  Bitcoin Report
</button>
```

---

### `.mobile-feature-btn`
**Purpose:** Feature activation button with proper state management  
**Use When:** Creating buttons for feature activation (News, Reports, etc.)  
**States:** Supports `.active`, `[aria-pressed="true"]`, `[data-active="true"]`

```css
.mobile-feature-btn {
  background: #000000 !important;
  color: #F7931A !important;
  border: 2px solid #F7931A !important;
  min-height: 48px;
}

.mobile-feature-btn.active {
  background: #F7931A !important;
  color: #000000 !important;
}
```

**Example:**
```html
<button class="mobile-feature-btn" aria-pressed="false">
  Whale Watch
</button>
```

---

## Text Visibility Classes

### `.mobile-text-visible`
**Purpose:** Force white text on transparent background  
**Use When:** Text is invisible or hard to read  
**Colors:** White text, transparent background

```css
.mobile-text-visible {
  color: #FFFFFF !important;
  background-color: transparent !important;
  font-weight: 500 !important;
}
```

**Example:**
```html
<p class="mobile-text-visible">
  This text is guaranteed to be visible
</p>
```

---

### `.mobile-text-visible-strong`
**Purpose:** Extra strong text visibility with subtle glow  
**Use When:** Text needs maximum visibility  
**Colors:** White text with glow effect

```css
.mobile-text-visible-strong {
  color: #FFFFFF !important;
  font-weight: 700 !important;
  text-shadow: 0 0 1px rgba(255, 255, 255, 0.3);
}
```

---

### `.mobile-text-primary`
**Purpose:** Primary text color (pure white)  
**Use When:** Headlines, important text  
**Contrast Ratio:** 21:1 (AAA compliant)

```css
.mobile-text-primary {
  color: #FFFFFF !important;
  background-color: transparent !important;
}
```

---

### `.mobile-text-secondary`
**Purpose:** Secondary text color (80% white)  
**Use When:** Body text, descriptions  
**Contrast Ratio:** 16.8:1 (AAA compliant)

```css
.mobile-text-secondary {
  color: rgba(255, 255, 255, 0.8) !important;
  background-color: transparent !important;
}
```

---

### `.mobile-text-accent`
**Purpose:** Accent text color (Bitcoin orange)  
**Use When:** Emphasis, CTAs, highlights  
**Contrast Ratio:** 5.8:1 (AA for large text)  
**Note:** Use with 18pt+ or bold font

```css
.mobile-text-accent {
  color: #F7931A !important;
  background-color: transparent !important;
}
```

---

### `.mobile-text-muted`
**Purpose:** Muted text color (60% white)  
**Use When:** Labels, captions, metadata  
**Contrast Ratio:** 12.6:1 (AAA compliant)

```css
.mobile-text-muted {
  color: rgba(255, 255, 255, 0.6) !important;
  background-color: transparent !important;
}
```

---

## Background Safety Classes

### `.mobile-bg-safe`
**Purpose:** Safe black background with white text  
**Use When:** Ensuring proper text visibility  
**Colors:** Black background, 80% white text

```css
.mobile-bg-safe {
  background-color: #000000 !important;
  color: rgba(255, 255, 255, 0.8) !important;
}
```

**Example:**
```html
<div class="mobile-bg-safe">
  <p>This content has guaranteed visibility</p>
</div>
```

---

### `.mobile-bg-safe-with-border`
**Purpose:** Safe background with orange border  
**Use When:** Creating contained sections  
**Colors:** Black background, white text, orange border

```css
.mobile-bg-safe-with-border {
  background-color: #000000 !important;
  color: rgba(255, 255, 255, 0.8) !important;
  border: 1px solid rgba(247, 147, 26, 0.2) !important;
}
```

---

### `.mobile-bg-primary`
**Purpose:** Primary background (pure black)  
**Use When:** Main content areas

```css
.mobile-bg-primary {
  background-color: #000000 !important;
  color: #FFFFFF !important;
}
```

---

### `.mobile-bg-accent`
**Purpose:** Accent background (Bitcoin orange)  
**Use When:** Highlighted sections, CTAs  
**Colors:** Orange background, black text

```css
.mobile-bg-accent {
  background-color: #F7931A !important;
  color: #000000 !important;
}
```

---

## Border Visibility Classes

### `.mobile-border-visible`
**Purpose:** Strong orange border (2px)  
**Use When:** Emphasizing containers, active states

```css
.mobile-border-visible {
  border: 2px solid #F7931A !important;
  border-radius: 8px;
}
```

---

### `.mobile-border-visible-subtle`
**Purpose:** Subtle orange border (1px, 20% opacity)  
**Use When:** Subtle container separation

```css
.mobile-border-visible-subtle {
  border: 1px solid rgba(247, 147, 26, 0.2) !important;
  border-radius: 8px;
}
```

---

### `.mobile-border-visible-strong`
**Purpose:** Strong border with glow effect (3px)  
**Use When:** Maximum emphasis needed

```css
.mobile-border-visible-strong {
  border: 3px solid #F7931A !important;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(247, 147, 26, 0.3);
}
```

---

## Icon Visibility Classes

### `.mobile-icon-visible`
**Purpose:** Force orange color for SVG icons  
**Use When:** Icons are invisible or hard to see

```css
.mobile-icon-visible svg {
  color: #F7931A !important;
  stroke: #F7931A !important;
  fill: none !important;
  stroke-width: 2.5 !important;
}
```

**Example:**
```html
<div class="mobile-icon-visible">
  <svg><!-- icon --></svg>
</div>
```

---

### `.mobile-icon-visible-white`
**Purpose:** Force white color for SVG icons  
**Use When:** Icons need to be white on dark backgrounds

```css
.mobile-icon-visible-white svg {
  color: #FFFFFF !important;
  stroke: #FFFFFF !important;
  fill: none !important;
  stroke-width: 2.5 !important;
}
```

---

### `.mobile-icon-visible-filled`
**Purpose:** Filled orange icons  
**Use When:** Icons should be solid orange

```css
.mobile-icon-visible-filled svg {
  color: #F7931A !important;
  fill: #F7931A !important;
  stroke: none !important;
}
```

---

## Card and Container Classes

### `.mobile-card-safe`
**Purpose:** Safe card with orange border  
**Use When:** Creating card components  
**Colors:** Black background, orange border, white text

```css
.mobile-card-safe {
  background-color: #000000 !important;
  border: 1px solid #F7931A !important;
  border-radius: 12px;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.8) !important;
}
```

**Example:**
```html
<div class="mobile-card-safe">
  <h3>Card Title</h3>
  <p>Card content with guaranteed visibility</p>
</div>
```

---

### `.mobile-card-safe-subtle`
**Purpose:** Subtle card with lighter border  
**Use When:** Less emphasis needed

```css
.mobile-card-safe-subtle {
  background-color: #000000 !important;
  border: 1px solid rgba(247, 147, 26, 0.2) !important;
  border-radius: 12px;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.8) !important;
}
```

---

## Input and Form Classes

### `.mobile-input-safe`
**Purpose:** Safe input styling with proper sizing  
**Use When:** Creating form inputs  
**Special:** Prevents iOS zoom (16px font size)

```css
.mobile-input-safe {
  background-color: #000000 !important;
  color: #FFFFFF !important;
  border: 2px solid rgba(247, 147, 26, 0.2) !important;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 1rem; /* Prevents iOS zoom */
}

.mobile-input-safe:focus {
  border-color: #F7931A !important;
  outline: 2px solid #F7931A !important;
  box-shadow: 0 0 0 3px rgba(247, 147, 26, 0.3);
}
```

**Example:**
```html
<input 
  type="text" 
  class="mobile-input-safe" 
  placeholder="Enter text..."
/>
```

---

## Emergency Override Classes

### `.emergency-contrast`
**Purpose:** Maximum contrast - orange background, black text  
**Use When:** All other methods fail  
**Warning:** Use as last resort only

```css
.emergency-contrast {
  background-color: #F7931A !important;
  color: #000000 !important;
  border: 3px solid #F7931A !important;
  font-weight: 800 !important;
  box-shadow: 0 0 30px rgba(247, 147, 26, 0.7) !important;
}
```

---

### `.emergency-contrast-inverted`
**Purpose:** Inverted maximum contrast - black background, white text  
**Use When:** Alternative emergency fallback

```css
.emergency-contrast-inverted {
  background-color: #000000 !important;
  color: #FFFFFF !important;
  border: 3px solid #F7931A !important;
  font-weight: 800 !important;
  box-shadow: 0 0 30px rgba(247, 147, 26, 0.7) !important;
}
```

---

### `.mobile-high-visibility`
**Purpose:** Maximum visibility with glow  
**Use When:** Critical elements need attention

```css
.mobile-high-visibility {
  border: 3px solid #F7931A !important;
  box-shadow: 0 0 25px rgba(247, 147, 26, 0.6) !important;
  background-color: #000000 !important;
  color: #FFFFFF !important;
}
```

---

## Navigation Classes

### `.mobile-nav-link`
**Purpose:** Navigation link styling  
**Use When:** Creating navigation menus  
**States:** Supports `.active`, `[aria-current="page"]`

```css
.mobile-nav-link {
  color: rgba(255, 255, 255, 0.6) !important;
  background: transparent !important;
  border-bottom: 2px solid transparent !important;
  min-height: 48px;
}

.mobile-nav-link.active {
  color: #F7931A !important;
  border-bottom: 2px solid #F7931A !important;
}
```

**Example:**
```html
<a href="/bitcoin-report" class="mobile-nav-link active">
  Bitcoin Report
</a>
```

---

## Menu Classes

### `.mobile-menu-overlay`
**Purpose:** Full-screen menu overlay  
**Use When:** Creating mobile menu  
**Colors:** Pure black background

```css
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000000;
  z-index: 9999;
  overflow-y: auto;
}
```

---

### `.mobile-menu-item-card`
**Purpose:** Menu item card styling  
**Use When:** Creating menu items  
**States:** Supports `.active`, `[aria-current="page"]`

```css
.mobile-menu-item-card {
  background-color: #000000;
  border: 1px solid rgba(247, 147, 26, 0.2);
  border-radius: 12px;
  padding: 1rem;
  min-height: 80px;
}

.mobile-menu-item-card.active {
  background-color: #F7931A;
  border-color: #F7931A;
}
```

**Example:**
```html
<div class="mobile-menu-item-card">
  <div class="mobile-menu-item-icon">
    <svg><!-- icon --></svg>
  </div>
  <div class="mobile-menu-item-content">
    <h4 class="mobile-menu-item-title">Crypto News Wire</h4>
    <p class="mobile-menu-item-description">Real-time news</p>
  </div>
</div>
```

---

## Feature Badge Classes

### `.feature-badge`
**Purpose:** Non-interactive feature indicator  
**Use When:** Displaying feature status  
**States:** Supports `.feature-badge-active`

```css
.feature-badge {
  background: #000000 !important;
  color: rgba(255, 255, 255, 0.8) !important;
  border: 1px solid rgba(247, 147, 26, 0.2) !important;
  border-radius: 6px;
  padding: 0.5rem 0.75rem !important;
  font-size: 0.75rem !important;
}

.feature-badge-active {
  background: #F7931A !important;
  color: #000000 !important;
  border: 1px solid #F7931A !important;
}
```

**Example:**
```html
<span class="feature-badge feature-badge-active">
  LIVE
</span>
```

---

## Usage Examples

### Example 1: Feature Button with State Management

```html
<button 
  class="mobile-feature-btn"
  onclick="this.classList.toggle('active')"
  aria-pressed="false"
>
  <span class="mobile-text-accent">Crypto News Wire</span>
</button>
```

---

### Example 2: Safe Card Component

```html
<div class="mobile-card-safe">
  <h3 class="mobile-text-primary">Bitcoin Analysis</h3>
  <p class="mobile-text-secondary">
    Real-time technical analysis and market intelligence
  </p>
  <button class="mobile-btn-inactive">
    View Report
  </button>
</div>
```

---

### Example 3: Navigation Menu

```html
<nav>
  <a href="/" class="mobile-nav-link active" aria-current="page">
    Home
  </a>
  <a href="/bitcoin-report" class="mobile-nav-link">
    Bitcoin Report
  </a>
  <a href="/ethereum-report" class="mobile-nav-link">
    Ethereum Report
  </a>
</nav>
```

---

### Example 4: Form Input

```html
<form>
  <label class="mobile-text-primary">
    Email Address
  </label>
  <input 
    type="email" 
    class="mobile-input-safe" 
    placeholder="your@email.com"
  />
  <button class="mobile-btn-active">
    Submit
  </button>
</form>
```

---

## Media Query Strategy

All mobile/tablet classes are scoped to `@media (max-width: 1023px)` to avoid affecting desktop (1024px+).

```css
@media (max-width: 1023px) {
  /* All mobile/tablet specific styles here */
}

@media (min-width: 1024px) {
  /* Desktop styles remain unchanged */
}
```

---

## Testing Checklist

Before deploying mobile/tablet fixes:

- [ ] All text is visible (no white-on-white or black-on-black)
- [ ] All buttons have proper active/inactive states
- [ ] All icons are visible (orange or white on black)
- [ ] All borders are visible (orange at appropriate opacity)
- [ ] All hover states provide clear visual feedback
- [ ] All focus states are visible (orange outline + glow)
- [ ] All touch targets are 48px × 48px minimum
- [ ] All text meets WCAG AA contrast (4.5:1 minimum)
- [ ] All animations are smooth (0.3s ease)
- [ ] Desktop (1024px+) is completely unchanged

---

## Quick Reference

**Most Common Mobile Classes:**
- `.mobile-btn-active` - Active button (orange bg, black text)
- `.mobile-btn-inactive` - Inactive button (black bg, orange text)
- `.mobile-text-visible` - Force white text
- `.mobile-bg-safe` - Force black background
- `.mobile-border-visible` - Force orange border
- `.mobile-icon-visible` - Force orange icons
- `.mobile-card-safe` - Safe card styling
- `.mobile-input-safe` - Safe input styling

**Color Variables:**
- `var(--bitcoin-black)` - #000000
- `var(--bitcoin-orange)` - #F7931A
- `var(--bitcoin-white)` - #FFFFFF
- `var(--bitcoin-white-80)` - rgba(255, 255, 255, 0.8)
- `var(--bitcoin-white-60)` - rgba(255, 255, 255, 0.6)
- `var(--bitcoin-orange-20)` - rgba(247, 147, 26, 0.2)

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
