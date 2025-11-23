# Einstein Trade Engine - Bitcoin Sovereign Styling Validation Guide

**Version**: 1.0.0  
**Last Updated**: January 27, 2025  
**Status**: Active  
**Purpose**: Ensure all Einstein components follow Bitcoin Sovereign styling

---

## Overview

This guide provides specific styling requirements for all Einstein Trade Engine components. Every component must follow the Bitcoin Sovereign Technology design system exactly.

---

## Core Styling Requirements

### Color Palette (STRICT)

**ONLY these colors are allowed:**
- `#000000` - Pure black (backgrounds)
- `#F7931A` - Bitcoin orange (actions, emphasis)
- `#FFFFFF` - Pure white (headlines, critical data)

**Opacity variants:**
- `rgba(247, 147, 26, 0.2)` - Subtle orange borders
- `rgba(247, 147, 26, 0.3)` - Orange glow effects
- `rgba(255, 255, 255, 0.8)` - Body text
- `rgba(255, 255, 255, 0.6)` - Labels

**❌ FORBIDDEN:**
- Green (for profit/bullish) - Use orange instead
- Red (for loss/bearish) - Use white 80% instead
- Blue, purple, yellow, gray (any shade)

---

## Component-Specific Styling

### 1. Einstein Generate Button

**Location**: `components/Einstein/EinsteinGenerateButton.tsx`

**Required Styling**:
```tsx
<button className="
  bg-bitcoin-orange 
  text-bitcoin-black 
  border-2 border-bitcoin-orange 
  font-bold uppercase tracking-wider 
  px-6 py-3 rounded-lg 
  transition-all 
  hover:bg-bitcoin-black 
  hover:text-bitcoin-orange 
  hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] 
  hover:scale-105 
  active:scale-95 
  min-h-[44px]
  disabled:opacity-50 
  disabled:cursor-not-allowed
">
  Generate Trade Signal
</button>
```

**Validation Checklist**:
- [ ] Solid orange background when enabled
- [ ] Black text on orange background
- [ ] Inverts to black background with orange text on hover
- [ ] Orange glow effect on hover
- [ ] Minimum 44px height (touch target)
- [ ] Uppercase text with letter spacing
- [ ] Smooth transitions (0.3s)
- [ ] Disabled state with 50% opacity

---

### 2. Analysis Preview Modal

**Location**: `components/Einstein/EinsteinAnalysisModal.tsx`

**Required Styling**:
```tsx
{/* Modal Overlay */}
<div className="
  fixed inset-0 
  bg-bitcoin-black bg-opacity-95 
  z-50 
  flex items-center justify-center 
  p-4
">
  {/* Modal Container */}
  <div className="
    bg-bitcoin-black 
    border-2 border-bitcoin-orange 
    rounded-xl 
    max-w-6xl w-full 
    max-h-[90vh] 
    overflow-hidden 
    shadow-[0_0_40px_rgba(247,147,26,0.6)]
  ">
    {/* Modal Header */}
    <div className="
      border-b-2 border-bitcoin-orange 
      bg-bitcoin-black 
      px-6 py-4 
      flex items-center justify-between
    ">
      <h2 className="text-2xl font-bold text-bitcoin-white">
        Einstein Analysis Preview
      </h2>
      <button className="
        text-bitcoin-orange 
        hover:text-bitcoin-white 
        transition-colors
      ">
        ✕
      </button>
    </div>
    
    {/* Modal Content */}
    <div className="
      p-6 
      overflow-y-auto 
      max-h-[calc(90vh-200px)]
    ">
      {/* Content panels */}
    </div>
    
    {/* Modal Footer */}
    <div className="
      border-t-2 border-bitcoin-orange 
      bg-bitcoin-black 
      px-6 py-4 
      flex gap-4 justify-end
    ">
      {/* Action buttons */}
    </div>
  </div>
</div>
```

**Validation Checklist**:
- [ ] Black background with 95% opacity overlay
- [ ] 2px orange border on modal container
- [ ] Strong orange glow effect
- [ ] Orange borders on header and footer
- [ ] Scrollable content area
- [ ] Close button with orange hover
- [ ] Responsive max-width (6xl)
- [ ] Maximum 90vh height

---

### 3. Analysis Panels (Technical, Sentiment, On-Chain, Risk)

**Required Styling**:
```tsx
{/* Panel Container */}
<div className="
  bg-bitcoin-black 
  border border-bitcoin-orange-20 
  rounded-xl 
  p-6 
  transition-all 
  hover:border-bitcoin-orange 
  hover:shadow-[0_0_20px_rgba(247,147,26,0.2)]
">
  {/* Panel Header */}
  <h3 className="
    text-xl font-bold 
    text-bitcoin-white 
    mb-4 
    flex items-center gap-2
  ">
    <span className="text-bitcoin-orange">📊</span>
    Technical Analysis
  </h3>
  
  {/* Panel Content */}
  <div className="space-y-4">
    {/* Stat rows */}
  </div>
</div>
```

**Validation Checklist**:
- [ ] Black background
- [ ] Subtle orange border (20% opacity)
- [ ] Full orange border on hover
- [ ] Subtle glow on hover
- [ ] White headlines
- [ ] Orange icons/accents
- [ ] Proper spacing (space-y-4)
- [ ] Rounded corners (xl)

---

### 4. Stat Display Components

**Required Styling**:
```tsx
{/* Stat Card */}
<div className="
  bg-bitcoin-black 
  border-2 border-bitcoin-orange-20 
  rounded-lg 
  p-4 
  transition-all 
  hover:border-bitcoin-orange 
  hover:shadow-[0_0_20px_rgba(247,147,26,0.2)]
">
  {/* Label */}
  <p className="
    text-xs font-semibold uppercase tracking-widest 
    text-bitcoin-white-60 
    mb-1
  ">
    RSI (14)
  </p>
  
  {/* Value */}
  <p className="
    font-mono text-2xl font-bold 
    text-bitcoin-white 
    tracking-tight
  ">
    65.4
  </p>
  
  {/* Signal */}
  <p className="
    text-sm 
    text-bitcoin-orange 
    mt-1
  ">
    NEUTRAL
  </p>
</div>
```

**Validation Checklist**:
- [ ] Black background
- [ ] 2px subtle orange border
- [ ] Hover effects (border + glow)
- [ ] Label: uppercase, 60% white, small
- [ ] Value: Roboto Mono, bold, white
- [ ] Signal: orange text
- [ ] Proper spacing
- [ ] Rounded corners

---

### 5. Price Display

**Required Styling**:
```tsx
{/* Large Price Display */}
<div className="
  font-mono text-4xl font-bold 
  text-bitcoin-orange 
  [text-shadow:0_0_30px_rgba(247,147,26,0.5)] 
  tracking-tight leading-tight
">
  $95,432.50
</div>

{/* Small Price Display */}
<div className="
  font-mono text-xl font-bold 
  text-bitcoin-orange 
  [text-shadow:0_0_20px_rgba(247,147,26,0.3)] 
  tracking-tight
">
  $95,432.50
</div>
```

**Validation Checklist**:
- [ ] Roboto Mono font
- [ ] Bold weight (700)
- [ ] Orange color
- [ ] Orange glow effect
- [ ] Tight tracking
- [ ] Appropriate size (4xl for main, xl for secondary)

---

### 6. Action Buttons (Approve, Reject, Modify)

**Approve Button (Primary)**:
```tsx
<button className="
  bg-bitcoin-orange 
  text-bitcoin-black 
  border-2 border-bitcoin-orange 
  font-bold uppercase tracking-wider 
  px-6 py-3 rounded-lg 
  transition-all 
  hover:bg-bitcoin-black 
  hover:text-bitcoin-orange 
  hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] 
  hover:scale-105 
  active:scale-95 
  min-h-[44px]
">
  Approve Trade
</button>
```

**Reject/Modify Buttons (Secondary)**:
```tsx
<button className="
  bg-transparent 
  text-bitcoin-orange 
  border-2 border-bitcoin-orange 
  font-semibold uppercase tracking-wider 
  px-6 py-3 rounded-lg 
  transition-all 
  hover:bg-bitcoin-orange 
  hover:text-bitcoin-black 
  hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] 
  hover:scale-105 
  active:scale-95 
  min-h-[44px]
">
  Reject Trade
</button>
```

**Validation Checklist**:
- [ ] Primary: solid orange, inverts on hover
- [ ] Secondary: transparent, fills on hover
- [ ] Uppercase text
- [ ] Letter spacing
- [ ] Minimum 44px height
- [ ] Scale effects on hover/active
- [ ] Orange glow on hover
- [ ] Smooth transitions

---

### 7. Data Quality Badge

**Required Styling**:
```tsx
{/* High Quality (≥90%) */}
<div className="
  inline-flex items-center gap-2 
  bg-bitcoin-orange 
  text-bitcoin-black 
  px-3 py-1 rounded-full 
  text-sm font-semibold
">
  <span>✓</span>
  <span>100% Data Verified</span>
</div>

{/* Medium Quality (70-89%) */}
<div className="
  inline-flex items-center gap-2 
  bg-transparent 
  border-2 border-bitcoin-orange 
  text-bitcoin-orange 
  px-3 py-1 rounded-full 
  text-sm font-semibold
">
  <span>⚠</span>
  <span>85% Data Quality</span>
</div>

{/* Low Quality (<70%) */}
<div className="
  inline-flex items-center gap-2 
  bg-transparent 
  border-2 border-bitcoin-white-60 
  text-bitcoin-white-60 
  px-3 py-1 rounded-full 
  text-sm font-semibold
">
  <span>✗</span>
  <span>65% Data Quality</span>
</div>
```

**Validation Checklist**:
- [ ] High: solid orange background, black text
- [ ] Medium: orange border, orange text
- [ ] Low: white 60% border and text
- [ ] Rounded pill shape
- [ ] Icon + text
- [ ] Inline-flex layout
- [ ] Appropriate sizing

---

### 8. Confidence Score Display

**Required Styling**:
```tsx
<div className="space-y-2">
  {/* Overall Confidence */}
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-sm text-bitcoin-white-60">Overall Confidence</span>
      <span className="text-sm font-bold text-bitcoin-orange">85%</span>
    </div>
    <div className="w-full h-2 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
      <div 
        className="h-full bg-bitcoin-orange transition-all duration-500"
        style={{ width: '85%' }}
      />
    </div>
  </div>
  
  {/* Component Confidences */}
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-sm text-bitcoin-white-60">Technical</span>
      <span className="text-sm font-bold text-bitcoin-white">90%</span>
    </div>
    <div className="w-full h-2 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
      <div 
        className="h-full bg-bitcoin-orange transition-all duration-500"
        style={{ width: '90%' }}
      />
    </div>
  </div>
</div>
```

**Validation Checklist**:
- [ ] Label: white 60%, small
- [ ] Percentage: orange (overall) or white (components)
- [ ] Progress bar: black background, orange border
- [ ] Fill: solid orange
- [ ] Smooth transitions (500ms)
- [ ] Rounded pill shape
- [ ] Proper spacing

---

### 9. Dividers

**Required Styling**:
```tsx
{/* Subtle Divider */}
<div className="w-full h-px bg-bitcoin-orange opacity-20 my-4" />

{/* Strong Divider */}
<div className="w-full h-px bg-bitcoin-orange my-4" />

{/* Section Divider with Text */}
<div className="flex items-center gap-4 my-6">
  <div className="flex-1 h-px bg-bitcoin-orange opacity-20" />
  <span className="text-sm font-semibold text-bitcoin-white-60 uppercase tracking-wider">
    Risk Analysis
  </span>
  <div className="flex-1 h-px bg-bitcoin-orange opacity-20" />
</div>
```

**Validation Checklist**:
- [ ] 1px height
- [ ] Orange color
- [ ] Subtle: 20% opacity
- [ ] Strong: 100% opacity
- [ ] Proper spacing (my-4 or my-6)
- [ ] Section dividers with centered text

---

### 10. Loading States

**Required Styling**:
```tsx
{/* Spinner */}
<div className="
  inline-block 
  w-8 h-8 
  border-4 border-bitcoin-orange-20 
  border-t-bitcoin-orange 
  rounded-full 
  animate-spin
" />

{/* Loading Text */}
<p className="text-bitcoin-white-80 animate-pulse">
  Generating trade signal...
</p>

{/* Skeleton Card */}
<div className="
  bg-bitcoin-black 
  border border-bitcoin-orange-20 
  rounded-xl 
  p-6 
  animate-pulse
">
  <div className="h-4 bg-bitcoin-orange-20 rounded w-3/4 mb-4" />
  <div className="h-8 bg-bitcoin-orange-20 rounded w-1/2" />
</div>
```

**Validation Checklist**:
- [ ] Spinner: orange with subtle border
- [ ] Pulse animation
- [ ] Skeleton: subtle orange shapes
- [ ] Appropriate sizing
- [ ] Smooth animations

---

## Mobile Responsiveness

### Touch Targets
- **Minimum**: 44px × 44px
- **Recommended**: 48px × 48px
- **Spacing**: 8px minimum between targets

### Responsive Breakpoints
```tsx
{/* Mobile-first approach */}
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-4 
  gap-4
">
  {/* Stat cards */}
</div>
```

### Mobile Optimizations
```tsx
{/* Reduce padding on mobile */}
<div className="
  p-4 
  md:p-6 
  lg:p-8
">
  {/* Content */}
</div>

{/* Smaller text on mobile */}
<h1 className="
  text-2xl 
  md:text-3xl 
  lg:text-4xl 
  font-bold
">
  Title
</h1>
```

---

## Accessibility

### Focus States
```tsx
<button className="
  focus:outline-none 
  focus-visible:outline-2 
  focus-visible:outline-bitcoin-orange 
  focus-visible:outline-offset-2 
  focus-visible:shadow-[0_0_0_4px_rgba(247,147,26,0.4)]
">
  Button
</button>
```

### Color Contrast
- White on Black: 21:1 (AAA) ✓
- White 80% on Black: 16.8:1 (AAA) ✓
- Orange on Black: 5.8:1 (AA for large text) ✓

### ARIA Labels
```tsx
<button aria-label="Generate trade signal">
  Generate
</button>

<div role="status" aria-live="polite">
  {loadingMessage}
</div>
```

---

## Content Containment

### Overflow Prevention
```tsx
{/* Container with overflow hidden */}
<div className="overflow-hidden">
  {/* Content */}
</div>

{/* Text truncation */}
<p className="truncate">
  Long text that will be truncated with ellipsis
</p>

{/* Multi-line truncation */}
<p className="line-clamp-3">
  Long text that will be limited to 3 lines
</p>

{/* Flex containment */}
<div className="flex min-w-0">
  <span className="truncate min-w-0">
    Long text in flex item
  </span>
</div>
```

---

## Validation Checklist

Before committing any Einstein component:

### Colors
- [ ] Only black (#000000), orange (#F7931A), white (#FFFFFF) used
- [ ] No green, red, blue, purple, yellow, or gray
- [ ] Opacity variants used correctly
- [ ] Orange used for positive/emphasis
- [ ] White 80% used for neutral/negative

### Typography
- [ ] Inter font for UI elements
- [ ] Roboto Mono for prices and data
- [ ] Headlines: white, bold (800)
- [ ] Body text: white 80%
- [ ] Labels: white 60%, uppercase
- [ ] Proper font sizes and weights

### Components
- [ ] Bitcoin blocks with orange borders
- [ ] Buttons follow primary/secondary patterns
- [ ] Stat cards with proper styling
- [ ] Price displays with glow effects
- [ ] Dividers with correct opacity
- [ ] Loading states with animations

### Layout
- [ ] Responsive grid layouts
- [ ] Proper spacing (multiples of 4px)
- [ ] Mobile-first approach
- [ ] Touch targets ≥44px
- [ ] No horizontal scroll

### Interactions
- [ ] Hover states defined
- [ ] Focus states visible
- [ ] Transitions smooth (0.3s)
- [ ] Scale effects on buttons
- [ ] Glow effects on emphasis

### Accessibility
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

### Containment
- [ ] No overflow issues
- [ ] Text truncates properly
- [ ] Images contained
- [ ] Flex/grid items shrink correctly
- [ ] Mobile viewport tested (320px)

---

## Testing Procedure

### Visual Testing
1. **Desktop (1920px)**:
   - Open component in browser
   - Verify all colors match specification
   - Check hover states
   - Test focus states
   - Verify glow effects

2. **Tablet (768px)**:
   - Test responsive layout
   - Verify touch targets
   - Check text sizing
   - Test interactions

3. **Mobile (375px)**:
   - Test single-column layout
   - Verify touch targets ≥44px
   - Check text readability
   - Test scrolling
   - Verify no horizontal scroll

### Automated Testing
```bash
# Run accessibility tests
npm run test:a11y

# Run visual regression tests
npm run test:visual

# Run mobile tests
npm run test:mobile
```

### Manual Checklist
- [ ] Component renders correctly
- [ ] All colors are correct
- [ ] Typography is correct
- [ ] Spacing is correct
- [ ] Hover states work
- [ ] Focus states work
- [ ] Mobile responsive
- [ ] No console errors
- [ ] No accessibility violations

---

## Common Mistakes to Avoid

### ❌ DON'T:
- Use green for profit or red for loss
- Use gray shades
- Use thin borders (<1px)
- Use non-Inter/Roboto Mono fonts
- Skip hover states
- Skip focus states
- Ignore mobile responsiveness
- Allow horizontal scroll
- Use inline styles
- Hardcode colors

### ✅ DO:
- Use orange for all emphasis
- Use white opacity for hierarchy
- Use 1-2px orange borders
- Use Inter for UI, Roboto Mono for data
- Define all hover states
- Define all focus states
- Test on mobile devices
- Prevent overflow
- Use Tailwind classes
- Use CSS variables

---

## Quick Reference

### Most Common Classes
```tsx
// Containers
"bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6"
"bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6"

// Text
"text-bitcoin-white"
"text-bitcoin-white-80"
"text-bitcoin-white-60"
"text-bitcoin-orange"

// Buttons
"bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase px-6 py-3 rounded-lg"
"bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase px-6 py-3 rounded-lg"

// Data
"font-mono text-4xl font-bold text-bitcoin-orange"
"font-mono text-2xl font-bold text-bitcoin-white"

// Dividers
"w-full h-px bg-bitcoin-orange opacity-20"
"w-full h-px bg-bitcoin-orange"
```

---

**Status**: ✅ Complete Styling Validation Guide  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025  
**Compliance**: Bitcoin Sovereign Technology Design System

**Use this guide to validate every Einstein component before committing!**
