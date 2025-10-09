# Bitcoin Sovereign Accessibility - Quick Reference

## Focus Indicators

### Automatic Focus Styles
All interactive elements automatically receive orange focus indicators when navigated with keyboard:

```css
/* Automatically applied to all :focus-visible elements */
- 2px solid orange outline
- 2px outline offset
- Orange glow: 0 0 0 3px rgba(247, 147, 26, 0.3)
```

### Elements with Focus Styles
- ✅ Buttons (all variants)
- ✅ Links
- ✅ Form inputs (text, textarea, select)
- ✅ Checkboxes and radio buttons
- ✅ Cards and blocks (with tabindex)
- ✅ Navigation items
- ✅ Custom interactive elements (ARIA roles)

### No Additional Code Required
Focus styles are automatically applied. Just ensure elements are keyboard accessible:

```html
<!-- Buttons - automatic focus -->
<button class="btn-bitcoin-primary">Click Me</button>

<!-- Links - automatic focus -->
<a href="#" class="link-text-orange">Link</a>

<!-- Cards - add tabindex for keyboard access -->
<div class="bitcoin-block" tabindex="0">Card content</div>
```

---

## Color Contrast - Safe Combinations

### Always Safe (AAA Compliance)

#### White on Black - 21:1
```html
<h1 class="text-white-on-black">Headline</h1>
<p class="body-text-primary">Body text</p>
```

#### White 80% on Black - 16.8:1
```html
<p class="body-text-primary">Regular body text</p>
```

#### White 60% on Black - 12.6:1
```html
<span class="body-text-secondary">Labels and captions</span>
```

### Orange Text - Use Large Sizes (AA Compliance)

#### Safe Orange Text (20px+, bold)
```html
<h2 class="text-orange-safe">Large Orange Heading</h2>
<div class="price-display">$45,234.56</div>
```

#### Orange on Black - Minimum 18px
```html
<!-- ✅ CORRECT: 18px or larger, bold -->
<span class="text-orange-large">Orange Text</span>

<!-- ❌ WRONG: Too small -->
<span style="color: var(--bitcoin-orange); font-size: 14px;">
  Orange Text
</span>
```

### Button Text - Always Safe

#### Black on Orange - 5.8:1 (AA)
```html
<button class="btn-bitcoin-primary">
  Black text on orange background
</button>
```

#### Orange on Black - Bold, 14px+ (AA)
```html
<button class="btn-bitcoin-secondary">
  Orange text on black background
</button>
```

---

## Quick Validation Checklist

### Before Committing Code

- [ ] All interactive elements are keyboard accessible
- [ ] Orange text is 18px+ or bold
- [ ] Buttons use `.btn-bitcoin-*` classes
- [ ] Links have proper contrast
- [ ] Form inputs have labels
- [ ] Cards with click handlers have `tabindex="0"`
- [ ] No custom focus styles that override orange indicators

### Testing

```bash
# 1. Open test file
open test-accessibility.html

# 2. Test keyboard navigation
# Press Tab to navigate through elements
# Verify orange focus indicators appear

# 3. Test on mobile
# Resize browser to 320px width
# Verify focus indicators are visible
```

---

## Common Patterns

### Interactive Card
```html
<div class="bitcoin-block" tabindex="0" role="button">
  <h3>Card Title</h3>
  <p class="body-text-secondary">Card content</p>
</div>
```

### Form with Labels
```html
<label class="stat-label">Email Address</label>
<input 
  type="email" 
  placeholder="your@email.com"
  style="
    width: 100%; 
    padding: 0.75rem; 
    background: var(--bitcoin-black); 
    border: 1px solid var(--bitcoin-orange-30); 
    color: var(--bitcoin-white); 
    border-radius: 8px;
  "
>
```

### Link with Orange Underline
```html
<a href="#" class="link-text-orange">
  Read more
</a>
```

### Price Display (Large Orange Text)
```html
<div class="price-display">
  $45,234.56
</div>
```

### Stat Card
```html
<div class="stat-card" tabindex="0">
  <div class="stat-label">BTC Price</div>
  <div class="stat-value-orange">$45,234.56</div>
</div>
```

---

## CSS Classes Reference

### Focus Indicators (Automatic)
```css
*:focus-visible                    /* All elements */
button:focus-visible               /* Buttons */
a:focus-visible                    /* Links */
input:focus-visible                /* Inputs */
.bitcoin-block:focus-visible       /* Cards */
```

### Color Contrast Classes
```css
.text-white-on-black              /* 21:1 (AAA) */
.text-white-80-on-black           /* 16.8:1 (AAA) */
.text-white-60-on-black           /* 12.6:1 (AAA) */
.text-orange-on-black             /* 5.8:1 (AA large) */
.text-black-on-orange             /* 5.8:1 (AA) */
.text-orange-large                /* 18px min, 600 weight */
.text-orange-xlarge               /* 24px, 700 weight */
.text-orange-safe                 /* 20px, 700 weight */
```

### Typography Classes
```css
.headline-white                   /* White headline */
.headline-orange                  /* Orange headline (24px min) */
.body-text-primary                /* White 80% body */
.body-text-secondary              /* White 60% secondary */
.link-text-white                  /* White link */
.link-text-orange                 /* Orange link (bold) */
```

---

## Don't Do This ❌

### Small Orange Text
```html
<!-- ❌ WRONG: Orange text too small -->
<span style="color: var(--bitcoin-orange); font-size: 12px;">
  Small orange text
</span>

<!-- ✅ CORRECT: Use white for small text -->
<span class="body-text-secondary" style="font-size: 12px;">
  Small white text
</span>
```

### Custom Focus Styles
```css
/* ❌ WRONG: Overriding focus styles */
button:focus {
  outline: none;
  box-shadow: none;
}

/* ✅ CORRECT: Let automatic styles work */
/* No custom focus styles needed */
```

### Non-Keyboard Accessible Cards
```html
<!-- ❌ WRONG: Click handler without keyboard access -->
<div class="bitcoin-block" onclick="handleClick()">
  Card content
</div>

<!-- ✅ CORRECT: Add tabindex and keyboard handler -->
<div 
  class="bitcoin-block" 
  tabindex="0" 
  role="button"
  onclick="handleClick()"
  onkeypress="handleKeyPress(event)"
>
  Card content
</div>
```

---

## Mobile Considerations

### Touch Targets
- Minimum 48px x 48px for all interactive elements
- Automatically handled by `.btn-bitcoin-*` classes
- Add `min-height: 48px` for custom buttons

### Focus Indicators on Mobile
- Automatically larger (3px outline, 4px glow)
- More visible for touch devices
- No additional code required

---

## Resources

### Test Files
- `test-accessibility.html` - Interactive testing page
- `TASK-11-ACCESSIBILITY-SUMMARY.md` - Complete documentation

### WCAG Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Browser Testing
- Chrome DevTools: Lighthouse accessibility audit
- Firefox: Accessibility Inspector
- Safari: Accessibility Inspector

---

**Last Updated**: January 2025
**Version**: 1.0
**Status**: Complete ✅
