# Desktop Navigation - Quick Reference

## Overview

The desktop navigation system provides a horizontal navigation bar with orange accent styling that appears only on desktop screens (1025px+). It features smooth hover effects, accessibility compliance, and seamless integration with the Bitcoin Sovereign design system.

## Key Features

✅ **Responsive**: Automatically hidden on mobile/tablet, visible on desktop (1025px+)
✅ **Orange Accents**: Orange underline and glow on hover/active states
✅ **Accessibility**: WCAG-compliant focus states with keyboard navigation
✅ **Smooth Transitions**: 0.3s ease transitions for all interactive states
✅ **Flexible Layouts**: Left, center, right alignment options

## Basic Usage

### Simple Desktop Nav

```html
<nav className="desktop-nav">
  <a href="#" className="nav-link">Crypto News Wire</a>
  <a href="#" className="nav-link active">AI Trade Generation</a>
  <a href="#" className="nav-link">Bitcoin Market Report</a>
  <a href="#" className="nav-link">Ethereum Market Report</a>
  <a href="#" className="nav-link">Whale Watch</a>
</nav>
```

### Full Header with Logo and CTA

```html
<header style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem;">
  <a href="/" className="desktop-nav-brand">AGENTS.MD</a>
  
  <nav className="desktop-nav">
    <a href="#" className="nav-link">Dashboard</a>
    <a href="#" className="nav-link">Signals</a>
    <a href="#" className="nav-link">News</a>
  </nav>
  
  <button className="btn-bitcoin-primary">Get Started</button>
</header>
```

## CSS Classes

### Navigation Container

| Class | Description |
|-------|-------------|
| `.desktop-nav` | Base desktop navigation container (horizontal flex layout) |
| `.desktop-nav-left` | Left-aligned navigation (default) |
| `.desktop-nav-center` | Center-aligned navigation |
| `.desktop-nav-right` | Right-aligned navigation |
| `.desktop-nav-full` | Full-width navigation with space-between |
| `.desktop-nav-bg` | Navigation with black background and border |
| `.desktop-nav-accent` | Navigation with orange accent line at bottom |

### Navigation Links

| Class | Description |
|-------|-------------|
| `.nav-link` | Base navigation link style |
| `.nav-link.active` | Active/current page link (orange color + underline) |
| `.nav-link-icon` | Link with icon (flex layout with gap) |
| `.nav-link-lg` | Larger link variant |
| `.nav-link-sm` | Smaller link variant |
| `.nav-link-slide` | Link with animated underline slide effect |

### Brand/Logo

| Class | Description |
|-------|-------------|
| `.desktop-nav-brand` | Logo/brand element with hover effect |
| `.desktop-nav-divider` | Vertical divider line between nav sections |
| `.desktop-nav-cta` | Container for CTA button with left margin |

## Styling Details

### Nav Link Default State
- **Font Size**: 0.875rem (14px)
- **Font Weight**: 600
- **Text Transform**: Uppercase
- **Letter Spacing**: 0.05em
- **Color**: White at 60% opacity (`var(--bitcoin-white-60)`)
- **Padding**: 0.5rem 1rem
- **Border Bottom**: 2px solid transparent

### Nav Link Hover State
- **Color**: Bitcoin Orange (`var(--bitcoin-orange)`)
- **Border Bottom**: 2px solid orange
- **Text Shadow**: Subtle orange glow (0 0 10px rgba(247, 147, 26, 0.3))
- **Transition**: All properties 0.3s ease

### Nav Link Active State
- Same as hover state
- Use `.active` class to mark current page

### Nav Link Focus State (Accessibility)
- **Outline**: 2px solid orange
- **Outline Offset**: 2px
- **Box Shadow**: Orange glow (0 0 0 3px rgba(247, 147, 26, 0.3))

## Responsive Behavior

### Breakpoints

| Screen Size | Behavior |
|-------------|----------|
| **0-1024px** (Mobile/Tablet) | Desktop nav hidden (`display: none !important`) |
| **1025px+** (Desktop) | Desktop nav visible (`display: flex`) |

### Integration with Mobile Menu

The desktop navigation is designed to work alongside the mobile hamburger menu:

- **Mobile/Tablet**: Show hamburger menu, hide desktop nav
- **Desktop**: Show desktop nav, hide hamburger menu

```html
<!-- Mobile Hamburger (hidden on desktop) -->
<button className="hamburger-menu">
  <!-- Hamburger icon -->
</button>

<!-- Desktop Nav (hidden on mobile/tablet) -->
<nav className="desktop-nav">
  <!-- Nav links -->
</nav>
```

## Layout Variants

### Left-Aligned (Default)

```html
<nav className="desktop-nav desktop-nav-left">
  <a href="#" className="nav-link">Link 1</a>
  <a href="#" className="nav-link">Link 2</a>
</nav>
```

### Center-Aligned

```html
<nav className="desktop-nav desktop-nav-center">
  <a href="#" className="nav-link">Link 1</a>
  <a href="#" className="nav-link">Link 2</a>
</nav>
```

### Right-Aligned

```html
<nav className="desktop-nav desktop-nav-right">
  <a href="#" className="nav-link">Link 1</a>
  <a href="#" className="nav-link">Link 2</a>
</nav>
```

### Full-Width with Space Between

```html
<nav className="desktop-nav desktop-nav-full">
  <a href="#" className="nav-link">Left Link</a>
  <a href="#" className="nav-link">Right Link</a>
</nav>
```

## Accessibility Features

### Keyboard Navigation

1. **Tab**: Navigate through links
2. **Enter/Space**: Activate link
3. **Shift+Tab**: Navigate backwards

### Focus Indicators

- Orange outline (2px solid)
- Orange glow box-shadow
- High contrast for visibility
- WCAG 2.1 AA compliant

### Skip to Content Link

```html
<a href="#main-content" className="skip-to-content">
  Skip to content
</a>
```

Hidden by default, appears on keyboard focus for screen reader users.

## Advanced Features

### Navigation with Icons

```html
<nav className="desktop-nav">
  <a href="#" className="nav-link nav-link-icon">
    <svg><!-- Icon --></svg>
    <span>Dashboard</span>
  </a>
</nav>
```

### Navigation with Dividers

```html
<nav className="desktop-nav">
  <a href="#" className="nav-link">Section 1</a>
  <div className="desktop-nav-divider"></div>
  <a href="#" className="nav-link">Section 2</a>
</nav>
```

### Animated Underline Slide Effect

```html
<nav className="desktop-nav">
  <a href="#" className="nav-link nav-link-slide">Link</a>
</nav>
```

The underline slides from center outward on hover (optional enhancement).

## Color Palette

All colors use Bitcoin Sovereign CSS variables:

- **Background**: `var(--bitcoin-black)` - #000000
- **Text Default**: `var(--bitcoin-white-60)` - rgba(255, 255, 255, 0.6)
- **Text Hover/Active**: `var(--bitcoin-orange)` - #F7931A
- **Border**: `var(--bitcoin-orange)` - #F7931A
- **Glow**: `var(--bitcoin-orange-30)` - rgba(247, 147, 26, 0.3)

## Testing

### Visual Testing

Open `test-desktop-nav.html` in your browser to see all navigation variants and features.

### Responsive Testing

1. Open browser DevTools
2. Toggle device toolbar
3. Resize viewport to test breakpoints:
   - **1024px**: Nav should be hidden
   - **1025px**: Nav should appear
   - **1920px**: Nav should be fully visible

### Accessibility Testing

1. **Keyboard**: Tab through all links, verify focus states
2. **Screen Reader**: Test with VoiceOver (Mac) or NVDA (Windows)
3. **Contrast**: Verify all text meets WCAG AA standards

## Integration with Existing Components

### Header Component

```tsx
// components/Header.tsx
export default function Header() {
  return (
    <header className="flex justify-between items-center p-6">
      <a href="/" className="desktop-nav-brand">
        AGENTS.MD
      </a>
      
      {/* Desktop Navigation */}
      <nav className="desktop-nav">
        <a href="/news" className="nav-link">News</a>
        <a href="/trading" className="nav-link">Trading</a>
        <a href="/markets" className="nav-link active">Markets</a>
        <a href="/analysis" className="nav-link">Analysis</a>
      </nav>
      
      {/* Mobile Hamburger (hidden on desktop) */}
      <button className="hamburger-menu">
        {/* Hamburger icon */}
      </button>
    </header>
  );
}
```

### Layout Component

```tsx
// components/Layout.tsx
export default function Layout({ children }) {
  return (
    <div className="bitcoin-sovereign-theme">
      <header className="desktop-nav-bg">
        <nav className="desktop-nav desktop-nav-center">
          <a href="/" className="nav-link">Home</a>
          <a href="/about" className="nav-link">About</a>
          <a href="/contact" className="nav-link">Contact</a>
        </nav>
      </header>
      
      <main>{children}</main>
    </div>
  );
}
```

## Performance Optimization

The desktop navigation is optimized for performance:

- **CSS-only**: No JavaScript required for basic functionality
- **GPU-accelerated**: Uses `transform` and `opacity` for smooth animations
- **Will-change**: Applied to animated properties for better performance
- **Minimal repaints**: Efficient CSS transitions

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

## Common Issues & Solutions

### Issue: Navigation not visible on desktop

**Solution**: Ensure viewport width is 1025px or greater. Check that no parent element has `display: none` or `overflow: hidden`.

### Issue: Hover effects not working

**Solution**: Verify that `.nav-link` class is applied. Check for conflicting CSS that might override hover styles.

### Issue: Focus states not visible

**Solution**: Ensure `:focus-visible` pseudo-class is supported. Use polyfill for older browsers if needed.

### Issue: Links not aligned properly

**Solution**: Check parent container has correct alignment class (`.desktop-nav-left`, `.desktop-nav-center`, etc.).

## Next Steps

1. ✅ **Task 8.1**: Desktop nav layout - COMPLETE
2. ✅ **Task 8.2**: Nav link styling - COMPLETE
3. ⏭️ **Task 9**: Responsive design implementation
4. ⏭️ **Task 10**: Animations & transitions
5. ⏭️ **Task 11**: Accessibility implementation

## Related Documentation

- [Bitcoin Sovereign Design System](./bitcoin-sovereign-design.md)
- [Mobile Hamburger Menu](./TASK-7-HAMBURGER-MENU-SUMMARY.md)
- [Button System](./BUTTON-SYSTEM-QUICK-REFERENCE.md)
- [Responsive Breakpoints](./MOBILE-BREAKPOINTS-GUIDE.md)

---

**Last Updated**: January 2025  
**Status**: ✅ Complete  
**Task**: 8. Navigation System - Desktop Horizontal Nav
