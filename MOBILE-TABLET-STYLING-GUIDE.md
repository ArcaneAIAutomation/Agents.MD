# Mobile/Tablet Styling Guide
## Bitcoin Sovereign Technology Platform

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Target Devices:** Mobile (320px-768px) and Tablet (768px-1024px)

---

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Mobile-Specific CSS Classes](#mobile-specific-css-classes)
4. [Button State Management](#button-state-management)
5. [Text Visibility Classes](#text-visibility-classes)
6. [Background and Border Classes](#background-and-border-classes)
7. [Icon Visibility Classes](#icon-visibility-classes)
8. [Card and Container Classes](#card-and-container-classes)
9. [Input and Form Classes](#input-and-form-classes)
10. [Emergency Override Classes](#emergency-override-classes)
11. [Usage Examples](#usage-examples)
12. [Do's and Don'ts](#dos-and-donts)
13. [Testing Checklist](#testing-checklist)
14. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides comprehensive documentation for mobile and tablet styling on the Bitcoin Sovereign Technology platform. All mobile/tablet fixes use media queries targeting devices with screen widths from 320px to 1023px, ensuring desktop (1024px+) remains unchanged.

### Key Features

- **Guaranteed Contrast**: All elements meet WCAG AA standards (minimum 4.5:1 ratio)
- **Bitcoin Sovereign Colors Only**: Black (#000000), Orange (#F7931A), White (#FFFFFF)
- **Touch-Optimized**: Minimum 48px touch targets for all interactive elements
- **Foolproof System**: Automatic fallbacks prevent color conflicts
- **Desktop Preservation**: All fixes use `@media (max-width: 1023px)` to avoid affecting desktop

---

## Core Principles

### 1. Color System

**ONLY THREE COLORS ALLOWED:**
- **Black**: `#000000` or `var(--bitcoin-black)` - Backgrounds
- **Orange**: `#F7931A` or `var(--bitcoin-orange)` - Accents, CTAs, emphasis
- **White**: `#FFFFFF` or `var(--bitcoin-white)` - Text (with opacity variants)

**Opacity Variants:**
- White 80%: `var(--bitcoin-white-80)` - Body text
- White 60%: `var(--bitcoin-white-60)` - Labels, secondary text
- Orange 20%: `var(--bitcoin-orange-20)` - Subtle borders
- Orange 30%: `var(--bitcoin-orange-30)` - Glow effects

### 2. Contrast Requirements

**WCAG AA Compliance:**
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

**Bitcoin Sovereign Ratios:**
- White on Black: 21:1 (AAA) ✓
- White 80% on Black: 16.8:1 (AAA) ✓
- White 60% on Black: 12.6:1 (AAA) ✓
- Orange on Black: 5.8:1 (AA for large text) ✓
- Black on Orange: 5.8:1 (AA) ✓

### 3. Touch Targets

**Minimum Sizes:**
- All interactive elements: 48px × 48px minimum
- Recommended: 52px × 52px for tablets
- Spacing between targets: 8px minimum

### 4. Typography

**Fonts:**
- UI & Headlines: Inter (geometric sans-serif)
- Data & Technical: Roboto Mono (monospaced)

**Minimum Sizes:**
- Body text: 16px (prevents iOS zoom)
- Headings: Scale from 18px to 30px on mobile
- Orange text: 18px minimum (for WCAG compliance)

---

## Mobile-Specific CSS Classes

### Button State Classes

#### `.mobile-btn-active`
**Purpose:** Active button state with guaranteed contrast  
**Colors:** Orange background, black text  
**Use Case:** When a feature button is clicked/activated

```css
.mobile-btn-active {
  background-color: var(--bitcoin-orange) !important;
  color: var(--bitcoin-black) !important;
  border: 2px solid var(--bitcoin-orange) !important;
  box-shadow: 0 0 20px rgba(247, 147, 26, 0.5);
  min-height: 48px;
  min-width: 48px;
}
```

**Example:**
```html
<button class="mobile-btn-active">
  Crypto News Wire
</button>
```

#### `.mobile-btn-inactive`
**Purpose:** Inactive button state with guaranteed contrast  
**Colors:** Black background, orange text  
**Use Case:** Default button state before activation

```css
.mobile-btn-inactive {
  background-color: var(--bitcoin-black) !important;
  color: var(--bitcoin-orange) !important;
  border: 2px solid var(--bitcoin-orange) !important;
  min-height: 48px;
  min-width: 48px;
}
```

**Example:**
```html
<button class="mobile-btn-inactive">
  Bitcoin Report
</button>
```

#### `.mobile-feature-btn`
**Purpose:** Feature-specific button with state management  
**Colors:** Adapts based on active state  
**Use Case:** Main feature navigation buttons

```html
<button class="mobile-feature-btn" data-active="false">
  Ethereum Report
</button>

<button class="mobile-feature-btn active">
  Whale Watch
</button>
```

---

## Text Visibility Classes

### `.mobile-text-visible`
**Purpose:** Force white text on transparent background  
**Use Case:** Emergency override for invisible text

```css
.mobile-text-visible {
  color: var(--bitcoin-white) !important;
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

### `.mobile-text-visible-strong`
**Purpose:** Extra strong text visibility with subtle glow  
**Use Case:** Critical text that must be seen

```css
.mobile-text-visible-strong {
  color: var(--bitcoin-white) !important;
  font-weight: 700 !important;
  text-shadow: 0 0 1px rgba(255, 255, 255, 0.3);
}
```

### Text Hierarchy Classes

```html
<!-- Primary text (pure white) -->
<p class="mobile-text-primary">Primary content</p>

<!-- Secondary text (80% white) -->
<p class="mobile-text-secondary">Secondary content</p>

<!-- Accent text (orange) -->
<p class="mobile-text-accent">Important highlight</p>

<!-- Muted text (60% white) -->
<p class="mobile-text-muted">Labels and captions</p>
```

---

## Background and Border Classes

### `.mobile-bg-safe`
**Purpose:** Force black background with white text  
**Use Case:** Prevent color conflicts

```css
.mobile-bg-safe {
  background-color: var(--bitcoin-black) !important;
  color: var(--bitcoin-white-80) !important;
}
```

### `.mobile-bg-safe-with-border`
**Purpose:** Black background with orange border  
**Use Case:** Cards and containers

```css
.mobile-bg-safe-with-border {
  background-color: var(--bitcoin-black) !important;
  color: var(--bitcoin-white-80) !important;
  border: 1px solid var(--bitcoin-orange-20) !important;
}
```

### Border Visibility Classes

```html
<!-- Strong orange border -->
<div class="mobile-border-visible">
  Content with 2px orange border
</div>

<!-- Subtle orange border -->
<div class="mobile-border-visible-subtle">
  Content with 1px subtle border
</div>

<!-- Strong border with glow -->
<div class="mobile-border-visible-strong">
  Content with 3px border and glow
</div>
```

---

## Icon Visibility Classes

### `.mobile-icon-visible`
**Purpose:** Force orange color for SVG icons  
**Use Case:** Ensure icons are always visible

```html
<div class="mobile-icon-visible">
  <svg><!-- Icon content --></svg>
</div>
```

### `.mobile-icon-visible-white`
**Purpose:** Force white color for SVG icons  
**Use Case:** Icons on orange backgrounds

```html
<div class="mobile-icon-visible-white">
  <svg><!-- Icon content --></svg>
</div>
```

### `.mobile-icon-visible-filled`
**Purpose:** Filled orange icons (not outlined)  
**Use Case:** Solid icon fills

```html
<div class="mobile-icon-visible-filled">
  <svg><!-- Filled icon --></svg>
</div>
```

---

## Card and Container Classes

### `.mobile-card-safe`
**Purpose:** Safe card styling with proper contrast  
**Colors:** Black background, orange border, white text

```css
.mobile-card-safe {
  background-color: var(--bitcoin-black) !important;
  border: 1px solid var(--bitcoin-orange) !important;
  border-radius: 12px;
  padding: 1rem;
  color: var(--bitcoin-white-80) !important;
}
```

**Example:**
```html
<div class="mobile-card-safe">
  <h3>Card Title</h3>
  <p>Card content with guaranteed visibility</p>
</div>
```

### `.mobile-card-safe-subtle`
**Purpose:** Card with subtle border (20% opacity)  
**Use Case:** Less prominent cards

```html
<div class="mobile-card-safe-subtle">
  <h3>Subtle Card</h3>
  <p>Content with subtle orange border</p>
</div>
```

---

## Input and Form Classes

### `.mobile-input-safe`
**Purpose:** Safe input styling with proper borders and contrast  
**Features:** Prevents iOS zoom, visible focus states

```css
.mobile-input-safe {
  background-color: var(--bitcoin-black) !important;
  color: var(--bitcoin-white) !important;
  border: 2px solid var(--bitcoin-orange-20) !important;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 1rem; /* Prevents iOS zoom */
}

.mobile-input-safe:focus {
  border-color: var(--bitcoin-orange) !important;
  outline: 2px solid var(--bitcoin-orange) !important;
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

<textarea 
  class="mobile-input-safe" 
  placeholder="Enter message..."
></textarea>
```

---

## Emergency Override Classes

### `.emergency-contrast`
**Purpose:** Maximum contrast override (last resort)  
**Colors:** Orange background, black text, strong glow

```css
.emergency-contrast {
  background-color: var(--bitcoin-orange) !important;
  color: var(--bitcoin-black) !important;
  border: 3px solid var(--bitcoin-orange) !important;
  font-weight: 800 !important;
  box-shadow: 0 0 30px rgba(247, 147, 26, 0.7) !important;
}
```

**Use Case:** Only when all other methods fail

### `.emergency-contrast-inverted`
**Purpose:** Inverted maximum contrast  
**Colors:** Black background, white text, orange border

```css
.emergency-contrast-inverted {
  background-color: var(--bitcoin-black) !important;
  color: var(--bitcoin-white) !important;
  border: 3px solid var(--bitcoin-orange) !important;
  font-weight: 800 !important;
  box-shadow: 0 0 30px rgba(247, 147, 26, 0.7) !important;
}
```

### `.mobile-high-visibility`
**Purpose:** Maximum visibility with glow effects  
**Use Case:** Critical elements that must be seen

```html
<div class="mobile-high-visibility">
  CRITICAL ALERT
</div>
```

---

## Usage Examples

### Example 1: Feature Button with State Management

```html
<!-- Inactive state -->
<button 
  class="mobile-btn-inactive"
  onclick="activateFeature(this)"
>
  <span class="mobile-icon-visible">
    <svg><!-- Icon --></svg>
  </span>
  <span class="mobile-text-visible">Bitcoin Report</span>
</button>

<!-- Active state (after click) -->
<button 
  class="mobile-btn-active"
  onclick="deactivateFeature(this)"
>
  <span class="mobile-icon-visible-white">
    <svg><!-- Icon --></svg>
  </span>
  <span>Bitcoin Report</span>
</button>
```

### Example 2: Information Card

```html
<div class="mobile-card-safe">
  <div class="mobile-border-visible-subtle p-4">
    <h3 class="mobile-text-primary text-xl font-bold mb-2">
      Live Market Data
    </h3>
    <p class="mobile-text-secondary mb-4">
      Real-time cryptocurrency prices and analysis
    </p>
    <div class="mobile-bg-accent p-3 rounded-lg">
      <span class="mobile-text-visible font-mono text-2xl">
        $95,000
      </span>
    </div>
  </div>
</div>
```

### Example 3: Navigation Menu Item

```html
<div class="mobile-menu-item-card">
  <div class="mobile-menu-item-icon">
    <div class="mobile-icon-visible">
      <svg><!-- Icon --></svg>
    </div>
  </div>
  <div class="mobile-menu-item-content">
    <h4 class="mobile-menu-item-title">
      Crypto News Wire
    </h4>
    <p class="mobile-menu-item-description">
      Real-time cryptocurrency news and analysis
    </p>
  </div>
  <div class="mobile-menu-item-arrow mobile-icon-visible">
    <svg><!-- Arrow icon --></svg>
  </div>
</div>
```

### Example 4: Form with Safe Inputs

```html
<form class="mobile-bg-safe-with-border p-6 rounded-xl">
  <label class="mobile-text-muted text-sm uppercase mb-2 block">
    Email Address
  </label>
  <input 
    type="email" 
    class="mobile-input-safe w-full mb-4"
    placeholder="your@email.com"
  />
  
  <label class="mobile-text-muted text-sm uppercase mb-2 block">
    Message
  </label>
  <textarea 
    class="mobile-input-safe w-full mb-4"
    rows="4"
    placeholder="Enter your message..."
  ></textarea>
  
  <button class="mobile-btn-active w-full">
    Submit
  </button>
</form>
```

---

## Do's and Don'ts

### ✅ DO's

1. **DO use mobile-specific classes** for all mobile/tablet styling
   ```html
   <button class="mobile-btn-active">Click Me</button>
   ```

2. **DO ensure minimum touch targets** (48px × 48px)
   ```css
   .my-button {
     min-height: 48px;
     min-width: 48px;
   }
   ```

3. **DO use media queries** to target mobile/tablet only
   ```css
   @media (max-width: 1023px) {
     /* Mobile/tablet styles */
   }
   ```

4. **DO test on physical devices** (iPhone SE, iPhone 14, iPad)

5. **DO use Bitcoin Sovereign colors only** (black, orange, white)

6. **DO ensure text is 16px minimum** to prevent iOS zoom

7. **DO use explicit color states** for buttons (active, inactive, hover)

8. **DO add proper focus states** for accessibility

9. **DO use Roboto Mono** for data displays and prices

10. **DO verify contrast ratios** meet WCAG AA standards

### ❌ DON'Ts

1. **DON'T use forbidden colors** (red, green, blue, yellow, purple)
   ```html
   <!-- ❌ WRONG -->
   <p class="text-red-500">Error</p>
   
   <!-- ✅ CORRECT -->
   <p class="mobile-text-visible">Error</p>
   ```

2. **DON'T create white-on-white** or black-on-black combinations
   ```html
   <!-- ❌ WRONG -->
   <div class="bg-white text-white">Invisible</div>
   
   <!-- ✅ CORRECT -->
   <div class="mobile-bg-safe mobile-text-visible">Visible</div>
   ```

3. **DON'T use inline styles** that override mobile classes
   ```html
   <!-- ❌ WRONG -->
   <button class="mobile-btn-active" style="background: blue;">
   
   <!-- ✅ CORRECT -->
   <button class="mobile-btn-active">
   ```

4. **DON'T modify desktop styles** when fixing mobile issues
   ```css
   /* ❌ WRONG - Affects desktop */
   .btn-feature {
     background: orange;
   }
   
   /* ✅ CORRECT - Mobile only */
   @media (max-width: 1023px) {
     .btn-feature {
       background: orange;
     }
   }
   ```

5. **DON'T use orange text below 18px** (fails WCAG AA)
   ```html
   <!-- ❌ WRONG -->
   <p class="text-bitcoin-orange text-sm">Small orange text</p>
   
   <!-- ✅ CORRECT -->
   <p class="text-bitcoin-orange text-lg font-semibold">Large orange text</p>
   ```

6. **DON'T forget hover states** for interactive elements

7. **DON'T use touch targets smaller than 48px**

8. **DON'T skip physical device testing**

9. **DON'T use complex animations** that affect performance

10. **DON'T ignore accessibility** (focus states, contrast, screen readers)

---

## Testing Checklist

### Visual Testing

- [ ] All text is visible (no white-on-white or black-on-black)
- [ ] All buttons have proper active/inactive states
- [ ] All icons are visible (orange or white on black)
- [ ] All borders are visible (orange at appropriate opacity)
- [ ] All hover states provide clear visual feedback
- [ ] All focus states are visible (orange outline + glow)
- [ ] All animations are smooth (0.3s ease)
- [ ] All glow effects are properly applied

### Device Testing

- [ ] iPhone SE (375px) - All pages and features
- [ ] iPhone 14 (390px) - All pages and features
- [ ] iPhone 14 Pro Max (428px) - All pages and features
- [ ] iPad Mini (768px) - All pages and features
- [ ] iPad Pro (1024px) - All pages and features

### Interaction Testing

- [ ] All buttons are clickable (48px minimum)
- [ ] All touch targets have proper spacing (8px minimum)
- [ ] All forms are usable (16px text prevents zoom)
- [ ] All navigation works correctly
- [ ] All state changes are visible

### Accessibility Testing

- [ ] All contrast ratios meet WCAG AA (4.5:1 minimum)
- [ ] All focus states are visible
- [ ] All interactive elements are keyboard accessible
- [ ] All text is readable (16px minimum)
- [ ] All orange text is 18px+ or bold

### Desktop Preservation Testing

- [ ] Desktop (1024px) looks identical to before
- [ ] Desktop (1280px) looks identical to before
- [ ] Desktop (1920px) looks identical to before
- [ ] All desktop functionality works as before
- [ ] No visual changes on desktop

---

## Troubleshooting

### Problem: Text is invisible on mobile

**Solution:**
```html
<!-- Add mobile-text-visible class -->
<p class="mobile-text-visible">Now visible</p>
```

### Problem: Button turns white-on-white when clicked

**Solution:**
```html
<!-- Use explicit state classes -->
<button class="mobile-btn-inactive" onclick="this.classList.replace('mobile-btn-inactive', 'mobile-btn-active')">
  Click Me
</button>
```

### Problem: Icons are not visible

**Solution:**
```html
<!-- Wrap icon in mobile-icon-visible -->
<div class="mobile-icon-visible">
  <svg><!-- Icon --></svg>
</div>
```

### Problem: Border is too faint to see

**Solution:**
```html
<!-- Use mobile-border-visible for stronger border -->
<div class="mobile-border-visible">
  Content with visible border
</div>
```

### Problem: Touch target is too small

**Solution:**
```css
/* Ensure minimum 48px × 48px */
.my-element {
  min-height: 48px;
  min-width: 48px;
  padding: 0.75rem 1.25rem;
}
```

### Problem: Orange text is hard to read

**Solution:**
```html
<!-- Ensure 18px+ or bold for orange text -->
<p class="text-bitcoin-orange text-lg font-semibold">
  Readable orange text
</p>
```

### Problem: Desktop is affected by mobile fixes

**Solution:**
```css
/* Always use media query for mobile fixes */
@media (max-width: 1023px) {
  /* Mobile-only styles here */
}
```

### Problem: Form input causes iOS zoom

**Solution:**
```html
<!-- Use 16px minimum font size -->
<input class="mobile-input-safe" type="text" />
```

---

## Quick Reference

### Most Common Classes

```css
/* Buttons */
.mobile-btn-active          /* Orange bg, black text */
.mobile-btn-inactive        /* Black bg, orange text */

/* Text */
.mobile-text-visible        /* Force white text */
.mobile-text-primary        /* Pure white */
.mobile-text-secondary      /* 80% white */
.mobile-text-accent         /* Orange */

/* Backgrounds */
.mobile-bg-safe             /* Black bg, white text */
.mobile-bg-accent           /* Orange bg, black text */

/* Borders */
.mobile-border-visible      /* 2px orange border */
.mobile-border-visible-subtle /* 1px subtle border */

/* Icons */
.mobile-icon-visible        /* Orange icons */
.mobile-icon-visible-white  /* White icons */

/* Cards */
.mobile-card-safe           /* Safe card styling */
.mobile-card-safe-subtle    /* Subtle card styling */

/* Inputs */
.mobile-input-safe          /* Safe input styling */

/* Emergency */
.emergency-contrast         /* Maximum contrast */
.mobile-high-visibility     /* Maximum visibility */
```

### Color Variables

```css
/* Primary Colors */
--bitcoin-black: #000000
--bitcoin-orange: #F7931A
--bitcoin-white: #FFFFFF

/* Opacity Variants */
--bitcoin-white-80: rgba(255, 255, 255, 0.8)
--bitcoin-white-60: rgba(255, 255, 255, 0.6)
--bitcoin-orange-20: rgba(247, 147, 26, 0.2)
--bitcoin-orange-30: rgba(247, 147, 26, 0.3)
--bitcoin-orange-50: rgba(247, 147, 26, 0.5)
```

### Media Queries

```css
/* Mobile/Tablet Only */
@media (max-width: 1023px) { }

/* Extra Small Mobile */
@media (max-width: 479px) { }

/* Small Mobile */
@media (min-width: 480px) and (max-width: 639px) { }

/* Large Mobile */
@media (min-width: 640px) and (max-width: 767px) { }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Desktop (Preserve) */
@media (min-width: 1024px) { }
```

---

## Support

For questions or issues with mobile/tablet styling:

1. Check this documentation first
2. Review the [Bitcoin Sovereign Design System](./STYLING-SPEC.md)
3. Test on physical devices
4. Verify media queries are correct
5. Check browser console for errors

---

**Remember:** All mobile/tablet styling must use Bitcoin Sovereign colors only (black, orange, white) and must not affect desktop (1024px+) styling or functionality.

**Status:** ✅ Complete Mobile/Tablet Styling Guide  
**Version:** 1.0.0  
**Compliance:** Bitcoin Sovereign Technology Design System
