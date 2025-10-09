# Responsive Breakpoints Quick Reference

## Test Files
- **test-responsive-breakpoints.html** - Interactive test page with automated validation
- **validate-responsive-breakpoints.js** - Validation script with test plan

## Quick Test Command
```bash
# Run validation script
node validate-responsive-breakpoints.js

# Open test page in browser
start test-responsive-breakpoints.html  # Windows
open test-responsive-breakpoints.html   # Mac
xdg-open test-responsive-breakpoints.html  # Linux
```

## Breakpoints to Test

| Breakpoint | Width | Device | Layout |
|------------|-------|--------|--------|
| 320px | 320x568 | Smallest Mobile | 1 column |
| 375px | 375x667 | iPhone SE | 1 column |
| 390px | 390x844 | iPhone 12/13/14 | 1 column |
| 428px | 428x926 | iPhone Pro Max | 1 column |
| 640px | 640x1024 | Large Mobile | 2 columns |
| 768px | 768x1024 | Tablet | 3 columns |

## Quick Validation Checklist

### Layout
- [ ] Single column on mobile (320px-639px)
- [ ] Two columns on large mobile (640px-767px)
- [ ] Three columns on tablet (768px+)
- [ ] No horizontal scroll at any size

### Components
- [ ] Collapsible sections work
- [ ] Buttons are 48px minimum height
- [ ] Touch targets properly spaced
- [ ] Text contained within boundaries

### Bitcoin Sovereign Aesthetic
- [ ] Black backgrounds (#000000)
- [ ] Orange accents (#F7931A)
- [ ] White text with opacity
- [ ] Thin orange borders (1-2px)

## Testing in DevTools

1. Press **F12** to open DevTools
2. Press **Ctrl+Shift+M** for device toolbar
3. Select "Responsive" mode
4. Set dimensions to test each breakpoint
5. Check automated test results at bottom of page

## Expected Behavior

**Mobile (320px-639px)**
- Single column layout
- Buttons stack vertically
- Collapsible sections enabled

**Large Mobile (640px-767px)**
- Two column layout
- Buttons may wrap
- More horizontal space

**Tablet (768px+)**
- Three column layout
- Desktop-like experience
- Optimal information density

## Bitcoin Sovereign Colors

```css
--bitcoin-black: #000000
--bitcoin-orange: #F7931A
--bitcoin-white: #FFFFFF
--bitcoin-white-80: rgba(255, 255, 255, 0.8)
--bitcoin-white-60: rgba(255, 255, 255, 0.6)
--bitcoin-orange-20: rgba(247, 147, 26, 0.2)
```

## Common Issues to Check

- ❌ Horizontal scroll appearing
- ❌ Text overflowing containers
- ❌ Buttons smaller than 48px
- ❌ Wrong number of columns
- ❌ Collapsible sections not working
- ❌ Non-Bitcoin Sovereign colors used

## Success Criteria

✅ All automated tests pass
✅ No horizontal scroll
✅ Proper column counts
✅ Touch targets adequate
✅ Bitcoin Sovereign aesthetic maintained
✅ Smooth transitions between breakpoints
