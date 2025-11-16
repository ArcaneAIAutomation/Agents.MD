# Bitcoin Report Page - Mobile/Tablet Quick Reference

**Quick guide for maintaining mobile/tablet visual fixes**

---

## Key CSS Classes for Mobile/Tablet

### Chart Containment
```css
/* Ensure charts fit within viewport */
.trading-chart-container {
  max-width: 100% !important;
  overflow-x: hidden !important;
}
```

### Grid Layouts
```css
/* Mobile: Single column */
@media (max-width: 767px) {
  .stat-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
  .stat-grid-3 { grid-template-columns: 1fr !important; }
}

/* Tablet: Two columns */
@media (min-width: 768px) and (max-width: 1023px) {
  .stat-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
}
```

### Responsive Font Sizing
```css
/* Use clamp() for responsive text */
.stat-value {
  font-size: clamp(1rem, 4vw, 1.5rem) !important;
}

.price-display-sm {
  font-size: clamp(1rem, 5vw, 1.5rem) !important;
}
```

### Text Truncation
```css
/* Single line truncation */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Multi-line truncation */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### Touch Targets
```css
/* Minimum touch target size */
button, a, input {
  min-height: 44px !important;
  min-width: 44px !important;
}
```

---

## Common Patterns

### Pattern 1: Responsive Card
```tsx
<div className="bitcoin-block-subtle overflow-hidden">
  <div className="flex justify-between items-center gap-2 min-w-0">
    <span className="font-bold truncate min-w-0">
      ${price.toLocaleString()}
    </span>
    <span className="flex-shrink-0 px-2 py-1 rounded">
      Strong
    </span>
  </div>
</div>
```

### Pattern 2: Responsive Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
  {items.map(item => (
    <div key={item.id} className="bitcoin-block-subtle min-w-0">
      {/* Content */}
    </div>
  ))}
</div>
```

### Pattern 3: Scrollable Table
```tsx
<div className="table-container overflow-x-auto">
  <table className="min-w-full">
    <tbody>
      {rows.map(row => (
        <tr key={row.id}>
          <td className="truncate max-w-[200px]">{row.data}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## Breakpoints

| Device | Width | Columns | Padding |
|--------|-------|---------|---------|
| Small Mobile | 320px-480px | 1 | 0.75rem |
| Mobile | 481px-767px | 1-2 | 1rem |
| Tablet | 768px-1023px | 2-4 | 1rem |
| Desktop | 1024px+ | 3-4 | 1.5rem |

---

## Testing Checklist

### Before Committing
- [ ] No horizontal scroll at 320px width
- [ ] All text is readable
- [ ] All buttons are 48px minimum
- [ ] Charts fit within viewport
- [ ] Tables scroll if needed
- [ ] Build succeeds: `npm run build`

### Device Testing
- [ ] iPhone SE (375px)
- [ ] iPhone 14 (390px)
- [ ] iPad Mini (768px)
- [ ] iPad Pro (1024px)

---

## Common Issues & Fixes

### Issue: Horizontal Scroll
**Fix**: Add `overflow-x: hidden` to parent container
```css
.bitcoin-block {
  overflow-x: hidden !important;
}
```

### Issue: Text Overflow
**Fix**: Add truncation classes
```tsx
<span className="truncate max-w-full">Long text here</span>
```

### Issue: Grid Misalignment
**Fix**: Ensure `min-width: 0` on grid items
```css
.grid > * {
  min-width: 0 !important;
}
```

### Issue: Small Touch Targets
**Fix**: Enforce minimum size
```css
button {
  min-height: 48px !important;
  min-width: 48px !important;
}
```

---

## Performance Tips

1. **Use `clamp()` for responsive sizing** - Reduces layout shifts
2. **Add `min-width: 0` to flex/grid items** - Allows proper shrinking
3. **Use `overflow-x: hidden` sparingly** - Only on containers
4. **Prefer CSS Grid over Flexbox** - Better for responsive layouts
5. **Test on real devices** - Emulators don't catch everything

---

## Accessibility

- **Touch Targets**: 48px × 48px minimum (WCAG 2.1 AA)
- **Focus Visible**: 3px orange outline with glow
- **Color Contrast**: All text meets WCAG AA standards
- **Touch Action**: `manipulation` for better response

---

## Resources

- **Full Documentation**: `BITCOIN-REPORT-MOBILE-FIXES-COMPLETE.md`
- **Design System**: `STYLING-SPEC.md`
- **Mobile Guidelines**: `mobile-development.md`
- **CSS File**: `styles/globals.css` (lines 2000+)

---

**Last Updated**: January 27, 2025  
**Status**: Production Ready ✅
