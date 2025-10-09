# Bitcoin Sovereign Mobile Quick Check
## Fast Visual Validation Checklist

Use this quick reference to validate Bitcoin Sovereign compliance on mobile/tablet devices.

---

## ⚡ 30-Second Visual Check

### 1. Colors (5 seconds)
- [ ] Background is pure black (#000000)
- [ ] Text is white or orange only
- [ ] No green, red, blue, or gray colors

### 2. Borders (5 seconds)
- [ ] All borders are thin (1-2px)
- [ ] All borders are orange
- [ ] Cards have orange borders on black

### 3. Layout (5 seconds)
- [ ] No horizontal scroll
- [ ] Single-column on mobile
- [ ] All text fits in containers

### 4. Touch Targets (5 seconds)
- [ ] Buttons are large enough (48px)
- [ ] Adequate spacing between elements
- [ ] Easy to tap with finger

### 5. Typography (5 seconds)
- [ ] Headlines use Inter font
- [ ] Data/numbers use Roboto Mono
- [ ] Text is readable (16px minimum)

### 6. Effects (5 seconds)
- [ ] Buttons have orange glow on hover
- [ ] Animations are smooth
- [ ] No janky transitions

---

## 🎯 Critical Violations to Watch For

### ❌ FORBIDDEN
- Green colors (any shade)
- Red colors (any shade)
- Blue colors (any shade)
- Gray backgrounds
- Thick borders (>2px)
- Small touch targets (<44px)
- Horizontal scroll
- Text overflow/clipping

### ✅ REQUIRED
- Pure black backgrounds (#000000)
- Orange accents (#F7931A)
- White text (100%, 80%, 60%)
- Thin orange borders (1-2px)
- 48px touch targets
- Roboto Mono for data
- Inter for UI

---

## 📱 Quick Breakpoint Test

Open DevTools and test these widths:

```
320px  → Smallest mobile (must work)
375px  → iPhone SE (must work)
390px  → iPhone 12/13/14 (must work)
428px  → iPhone Pro Max (must work)
768px  → Tablet (must work)
```

At each width:
1. Check for horizontal scroll (should be none)
2. Verify text is readable
3. Confirm buttons are tappable
4. Ensure no text overflow

---

## 🎨 Color Quick Reference

```css
/* ONLY THESE COLORS ALLOWED */
--bitcoin-black: #000000
--bitcoin-orange: #F7931A
--bitcoin-white: #FFFFFF

/* OPACITY VARIANTS (OK) */
--bitcoin-orange-20: rgba(247, 147, 26, 0.2)
--bitcoin-white-80: rgba(255, 255, 255, 0.8)
--bitcoin-white-60: rgba(255, 255, 255, 0.6)
```

---

## 🔍 Component Quick Check

### Header
- [ ] Black background
- [ ] White text
- [ ] Orange hamburger menu (mobile)
- [ ] 48px touch targets

### Footer
- [ ] Black background
- [ ] White/orange text
- [ ] Orange status indicators
- [ ] Stacked on mobile

### Cards/Blocks
- [ ] Black background
- [ ] Orange border (1-2px)
- [ ] White text
- [ ] No overflow

### Buttons
- [ ] Orange background (primary)
- [ ] Orange border (secondary)
- [ ] Black text on orange
- [ ] Orange glow on hover
- [ ] 48px minimum height

### Data Displays
- [ ] Roboto Mono font
- [ ] Orange color for prices
- [ ] Orange glow effect
- [ ] Proper number formatting

---

## ⚠️ Common Issues to Fix

### Issue: Horizontal Scroll
**Fix:** Add `overflow-x: hidden` to container

### Issue: Text Overflow
**Fix:** Add `truncate` class or `overflow: hidden`

### Issue: Small Touch Targets
**Fix:** Add `min-h-[48px]` class

### Issue: Wrong Font
**Fix:** Use `font-mono` for data, `font-sans` for UI

### Issue: Wrong Colors
**Fix:** Replace with `text-bitcoin-orange` or `text-bitcoin-white`

### Issue: Thick Borders
**Fix:** Use `border` (1px) or `border-2` (2px) only

---

## 🚀 Quick Validation Commands

### Check for Forbidden Colors
```bash
# Search for green colors
grep -r "green" styles/ components/ --include="*.css" --include="*.tsx"

# Search for red colors
grep -r "red" styles/ components/ --include="*.css" --include="*.tsx"

# Search for blue colors
grep -r "blue" styles/ components/ --include="*.css" --include="*.tsx"
```

### Check for Proper Fonts
```bash
# Should find Roboto Mono for data
grep -r "Roboto Mono" components/ --include="*.tsx"

# Should find Inter for UI
grep -r "Inter" styles/ --include="*.css"
```

### Check for Touch Targets
```bash
# Should find min-h-[48px] or min-height: 48px
grep -r "min-h-\[48px\]" components/ --include="*.tsx"
grep -r "min-height: 48px" styles/ --include="*.css"
```

---

## ✅ Pass Criteria

A component passes Bitcoin Sovereign mobile validation if:

1. ✅ Background is pure black
2. ✅ Text is white or orange only
3. ✅ Borders are thin orange (1-2px)
4. ✅ No horizontal scroll at any breakpoint
5. ✅ All text is readable and contrasted
6. ✅ Buttons have orange glow
7. ✅ Containers clip overflow
8. ✅ Touch targets are 48px minimum
9. ✅ Data uses Roboto Mono
10. ✅ UI uses Inter
11. ✅ Animations are smooth
12. ✅ No forbidden colors

---

## 📊 Quick Test Checklist

```
[ ] Open page on mobile device or DevTools
[ ] Set width to 320px
[ ] Scroll through entire page
[ ] Check for horizontal scroll (should be none)
[ ] Verify all text is readable
[ ] Tap all buttons (should be easy)
[ ] Check colors (black, orange, white only)
[ ] Verify fonts (Inter for UI, Roboto Mono for data)
[ ] Test at 375px, 390px, 428px, 768px
[ ] Confirm no issues at any breakpoint
```

---

## 🎯 One-Minute Validation

1. **Open DevTools** (F12)
2. **Toggle Device Toolbar** (Ctrl+Shift+M)
3. **Set to iPhone 12 Pro** (390px)
4. **Scroll through page**
5. **Check:**
   - Black background? ✅
   - Orange borders? ✅
   - White text? ✅
   - No scroll? ✅
   - Buttons work? ✅

If all ✅, component passes!

---

## 📝 Quick Fix Template

When you find an issue:

```tsx
// ❌ WRONG
<div className="bg-gray-900 border-4 border-blue-500">
  <p className="text-green-500 text-sm">Price: $95,000</p>
</div>

// ✅ CORRECT
<div className="bg-bitcoin-black border border-bitcoin-orange">
  <p className="text-bitcoin-orange text-base font-mono">
    Price: $95,000
  </p>
</div>
```

---

**Use this checklist before every commit to ensure Bitcoin Sovereign compliance!**

