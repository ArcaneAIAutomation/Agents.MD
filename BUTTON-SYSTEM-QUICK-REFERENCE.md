# Bitcoin Sovereign Button System - Quick Reference

## Overview

The Bitcoin Sovereign button system provides three button styles that follow the black and orange aesthetic with hover state inversions and accessibility compliance.

---

## Button Classes

### 1. Primary Button (Solid Orange)
**Use for:** Main actions, CTAs, confirmations

```html
<button class="btn-bitcoin-primary">Buy Bitcoin</button>
```

**Styling:**
- Background: Solid Bitcoin Orange (#F7931A)
- Text: Black
- Hover: Inverts to black background with orange text + orange glow
- Active: Slight scale down
- Disabled: 50% opacity, grayed out

---

### 2. Secondary Button (Orange Outline)
**Use for:** Secondary actions, view details, learn more

```html
<button class="btn-bitcoin-secondary">View Details</button>
```

**Styling:**
- Background: Transparent
- Border: 2px solid Bitcoin Orange
- Text: Bitcoin Orange
- Hover: Fills with orange, text becomes black
- Active: Slight scale down
- Disabled: 50% opacity, grayed out

---

### 3. Tertiary Button (White Outline - Minimal Use)
**Use for:** Cancel actions, skip, minimal emphasis

```html
<button class="btn-bitcoin-tertiary">Cancel</button>
```

**Styling:**
- Background: Transparent
- Border: 2px solid White (60% opacity)
- Text: White
- Hover: Brighter border + subtle white background (10% opacity)
- Active: Slight scale down
- Disabled: 50% opacity, grayed out

---

## Size Variants

### Small
```html
<button class="btn-bitcoin-primary btn-bitcoin-sm">Small</button>
```
- Padding: 0.5rem 1rem
- Font Size: 0.75rem
- Mobile Min Height: 44px

### Default (No modifier needed)
```html
<button class="btn-bitcoin-primary">Default</button>
```
- Padding: 0.75rem 1.5rem
- Font Size: 0.875rem
- Mobile Min Height: 48px

### Large
```html
<button class="btn-bitcoin-primary btn-bitcoin-lg">Large</button>
```
- Padding: 1rem 2rem
- Font Size: 1rem
- Mobile Min Height: 52px

### Extra Large
```html
<button class="btn-bitcoin-primary btn-bitcoin-xl">Extra Large</button>
```
- Padding: 1.25rem 2.5rem
- Font Size: 1.125rem
- Mobile Min Height: 56px

---

## Layout Modifiers

### Full Width
```html
<button class="btn-bitcoin-primary btn-bitcoin-full">Full Width</button>
```
- Width: 100%
- Display: flex

### Icon Only (Square)
```html
<button class="btn-bitcoin-primary btn-bitcoin-icon">
  <svg>...</svg>
</button>
```
- Aspect Ratio: 1:1
- Min Size: 44px x 44px

---

## Button Groups

### Horizontal Group (Desktop)
```html
<div class="btn-bitcoin-group">
  <button class="btn-bitcoin-primary">Confirm</button>
  <button class="btn-bitcoin-secondary">Review</button>
  <button class="btn-bitcoin-tertiary">Cancel</button>
</div>
```
- Display: flex
- Gap: 1rem
- Wraps on small screens

### Mobile Stack
```html
<div class="btn-bitcoin-group-mobile">
  <button class="btn-bitcoin-primary">Confirm</button>
  <button class="btn-bitcoin-secondary">Review</button>
  <button class="btn-bitcoin-tertiary">Cancel</button>
</div>
```
- Display: flex column
- Gap: 0.75rem
- Full width buttons
- Only applies on mobile (<768px)

---

## Accessibility Features

### Focus States
All buttons have accessible focus indicators:
- 2px solid orange outline
- 2px outline offset
- Orange glow box-shadow (30% opacity)

### Touch Targets (Mobile)
All buttons meet WCAG 2.1 AA standards:
- Minimum 48px height on mobile
- Minimum 44px for small buttons
- Adequate spacing between buttons

### Keyboard Navigation
- Tab through buttons
- Enter/Space to activate
- Clear focus indicators

---

## Usage Examples

### Trading Interface
```html
<div class="btn-bitcoin-group">
  <button class="btn-bitcoin-primary btn-bitcoin-lg">Execute Trade</button>
  <button class="btn-bitcoin-secondary">View Analysis</button>
  <button class="btn-bitcoin-tertiary">Cancel Order</button>
</div>
```

### Mobile Form
```html
<div class="btn-bitcoin-group-mobile">
  <button class="btn-bitcoin-primary btn-bitcoin-full">Submit</button>
  <button class="btn-bitcoin-secondary btn-bitcoin-full">Save Draft</button>
  <button class="btn-bitcoin-tertiary btn-bitcoin-full">Cancel</button>
</div>
```

### CTA Section
```html
<button class="btn-bitcoin-primary btn-bitcoin-xl btn-bitcoin-full">
  Start Trading Now
</button>
```

---

## Design Principles

### Color Usage
- **Primary (Orange):** Main actions, high emphasis
- **Secondary (Orange Outline):** Supporting actions, medium emphasis
- **Tertiary (White Outline):** Cancel/skip actions, low emphasis

### Hover Inversions
- Primary: Orange → Black (with orange text + glow)
- Secondary: Transparent → Orange (with black text)
- Tertiary: Transparent → Subtle white background

### Typography
- Uppercase text with letter-spacing (0.05em)
- Font weight: 700 (primary), 600 (secondary/tertiary)
- Font size: 0.875rem default

### Transitions
- Duration: 0.3s
- Easing: ease
- Properties: all (background, color, border, box-shadow, transform)

---

## Mobile Optimizations

### Touch Targets
- Minimum 48px height (WCAG 2.1 AA)
- Larger padding for easier tapping
- Adequate spacing between buttons

### Responsive Behavior
- Buttons stack vertically on mobile with `.btn-bitcoin-group-mobile`
- Full width buttons recommended for mobile forms
- Larger font sizes for better readability

### Performance
- GPU-accelerated transforms
- Smooth transitions
- No layout shifts

---

## Testing Checklist

- [ ] Hover states work correctly (color inversion + glow)
- [ ] Active states provide visual feedback (scale down)
- [ ] Disabled states are clearly indicated (grayed out, no interaction)
- [ ] Focus states are visible for keyboard navigation
- [ ] Touch targets meet 48px minimum on mobile
- [ ] Buttons work across all breakpoints (320px - 1920px+)
- [ ] Color contrast meets WCAG AA standards
- [ ] Transitions are smooth (no jank)

---

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile Safari: ✅ Full support
- Android Chrome: ✅ Full support

---

## Related Files

- **CSS:** `styles/globals.css` (Button Styling System section)
- **Test File:** `test-bitcoin-buttons.html`
- **Design Doc:** `.kiro/specs/bitcoin-sovereign-rebrand/design.md`
- **Requirements:** `.kiro/specs/bitcoin-sovereign-rebrand/requirements.md`

---

**Last Updated:** January 2025  
**Status:** ✅ Complete - Task 5 Implemented
