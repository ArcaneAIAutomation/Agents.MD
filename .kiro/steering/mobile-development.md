# Mobile Development Guidelines

## Mobile-First Approach

All components and features must be designed with mobile as the primary target, then enhanced for larger screens.

### Design Principles
- **Touch-First**: All interactions optimized for touch input
- **Performance-First**: Fast loading and smooth animations on mobile devices
- **Accessibility-First**: WCAG 2.1 AA compliance with high contrast ratios
- **Progressive Enhancement**: Core functionality works on all devices, enhanced features for capable devices
- **Bitcoin Sovereign Aesthetic**: Pure black backgrounds with thin orange borders, minimalist and clean

### Bitcoin Sovereign Mobile Design
- **Black Canvas**: Pure #000000 background on all mobile screens
- **Orange Accents**: Bitcoin Orange (#F7931A) for CTAs and emphasis
- **Thin Borders**: 1-2px orange borders on cards and blocks
- **Single-Column Stack**: Clean vertical layout of "Block" cards
- **Collapsible Sections**: Orange headers with expandable content
- **Minimalist**: Remove clutter, show only essential information

## Mobile Component Standards

### Touch Targets
- **Minimum Size**: 48px x 48px for all interactive elements
- **Spacing**: Minimum 8px between touch targets
- **Visual Feedback**: Clear hover/active states for touch interactions
- **Gesture Support**: Swipe, pinch, and scroll gestures where appropriate

### Responsive Breakpoints
```css
/* Mobile First */
.mobile-base { /* 320px+ */ }

/* Small Mobile */
@media (min-width: 480px) { /* 480px+ */ }

/* Large Mobile / Small Tablet */
@media (min-width: 640px) { /* 640px+ */ }

/* Tablet */
@media (min-width: 768px) { /* 768px+ */ }

/* Desktop */
@media (min-width: 1024px) { /* 1024px+ */ }

/* Large Desktop */
@media (min-width: 1280px) { /* 1280px+ */ }
```

### Typography Scale
- **Mobile Base**: 16px minimum for body text (WCAG compliance)
- **Headings**: Scale from 18px (mobile) to 32px (desktop)
- **Line Height**: 1.6 for optimal mobile readability
- **Font Weight**: Bold (700-800) for important information, Regular (400) for body text
- **Font Families**: 
  - Inter for UI and headlines
  - Roboto Mono for data and technical displays
- **Colors**:
  - Headlines: White (#FFFFFF)
  - Body: White at 80% opacity
  - Labels: White at 60% opacity
  - Emphasis: Bitcoin Orange (#F7931A)

## Animation Guidelines

### Performance Considerations
- **GPU Acceleration**: Use `transform` and `opacity` for animations
- **Duration**: 200-300ms for micro-interactions, 500ms for page transitions
- **Easing**: `ease-out` for entering elements, `ease-in` for exiting
- **Reduced Motion**: Respect `prefers-reduced-motion` user preference

### Animation Classes
```css
.animate-fade-in { animation: fade-in 0.6s ease-out; }
.animate-slide-up { animation: slide-up 0.8s ease-out; }
.animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
.animate-glow { animation: glow 2s ease-in-out infinite; }
```

## Error Handling

### Mobile Error States
- **Network Errors**: Clear messaging with retry options
- **Loading States**: Skeleton screens and progress indicators
- **Empty States**: Helpful guidance and call-to-action buttons
- **Timeout Handling**: Graceful degradation with fallback content

### Error Component Structure
```typescript
interface MobileErrorProps {
  type: 'network' | 'timeout' | 'api' | 'generic';
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}
```

## Performance Standards

### Core Web Vitals (Mobile)
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s

### Optimization Techniques
- **Lazy Loading**: Images and components below the fold
- **Code Splitting**: Route-based and component-based splitting
- **Image Optimization**: WebP format with fallbacks, responsive images
- **Bundle Size**: Keep JavaScript bundles under 200KB for mobile

## Testing Requirements

### Device Testing
- **iOS Safari**: iPhone 12/13/14 series
- **Android Chrome**: Samsung Galaxy S21/22/23 series
- **Responsive Testing**: 320px to 1920px viewport widths
- **Touch Testing**: All interactive elements with finger simulation

### Accessibility Testing
- **Screen Reader**: VoiceOver (iOS) and TalkBack (Android)
- **Keyboard Navigation**: Tab order and focus management
- **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
- **Touch Target Size**: Automated validation of 48px minimum

## Mobile-Specific Features

### Viewport Detection
```typescript
const { isMobile, isTablet, screenWidth } = useMobileViewport();
```

### Device Capabilities
```typescript
const { 
  prefersReducedMotion, 
  connectionType, 
  devicePixelRatio 
} = useDeviceCapabilities();
```

### Progressive Enhancement
- **Core Functionality**: Works without JavaScript
- **Enhanced Features**: Animations, real-time updates, advanced interactions
- **Fallback Strategies**: Graceful degradation for unsupported features


## Mobile/Tablet Visual Fix Patterns

### Button State Management System

**Problem:** Buttons can turn white-on-white or have poor contrast when activated on mobile/tablet devices.

**Solution:** Use explicit state-based CSS classes that guarantee proper contrast at all times.

#### Button State Classes

```css
/* Inactive State - Orange text on black background */
.mobile-btn-inactive {
  background-color: var(--bitcoin-black) !important;
  color: var(--bitcoin-orange) !important;
  border: 2px solid var(--bitcoin-orange) !important;
  min-height: 48px;
  min-width: 48px;
}

/* Active State - Orange background with black text */
.mobile-btn-active {
  background-color: var(--bitcoin-orange) !important;
  color: var(--bitcoin-black) !important;
  border: 2px solid var(--bitcoin-orange) !important;
  box-shadow: 0 0 20px rgba(247, 147, 26, 0.5);
  min-height: 48px;
  min-width: 48px;
}
```

#### Usage Example

```html
<!-- Feature button with state management -->
<button 
  class="mobile-btn-inactive"
  onclick="this.classList.replace('mobile-btn-inactive', 'mobile-btn-active')"
>
  Crypto News Wire
</button>
```

### Text Visibility Guarantees

**Problem:** Text can become invisible due to color conflicts (white-on-white, black-on-black).

**Solution:** Use mobile-specific text visibility classes that force proper contrast.

```css
/* Force white text on transparent background */
.mobile-text-visible {
  color: var(--bitcoin-white) !important;
  background-color: transparent !important;
  font-weight: 500 !important;
}

/* Extra strong visibility with subtle glow */
.mobile-text-visible-strong {
  color: var(--bitcoin-white) !important;
  font-weight: 700 !important;
  text-shadow: 0 0 1px rgba(255, 255, 255, 0.3);
}
```

### Background Safety Classes

**Problem:** Backgrounds can conflict with text colors, causing readability issues.

**Solution:** Use safe background classes that ensure proper text visibility.

```css
/* Force black background with white text */
.mobile-bg-safe {
  background-color: var(--bitcoin-black) !important;
  color: var(--bitcoin-white-80) !important;
}

/* Black background with orange border */
.mobile-bg-safe-with-border {
  background-color: var(--bitcoin-black) !important;
  color: var(--bitcoin-white-80) !important;
  border: 1px solid var(--bitcoin-orange-20) !important;
}
```

### Border Visibility Classes

**Problem:** Borders can be too faint or invisible on mobile/tablet screens.

**Solution:** Use explicit border visibility classes with guaranteed orange color.

```css
/* Strong orange border (2px) */
.mobile-border-visible {
  border: 2px solid var(--bitcoin-orange) !important;
  border-radius: 8px;
}

/* Subtle orange border (1px, 20% opacity) */
.mobile-border-visible-subtle {
  border: 1px solid var(--bitcoin-orange-20) !important;
  border-radius: 8px;
}

/* Strong border with glow effect */
.mobile-border-visible-strong {
  border: 3px solid var(--bitcoin-orange) !important;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(247, 147, 26, 0.3);
}
```

### Icon Visibility Classes

**Problem:** Icons can be invisible or hard to see on mobile/tablet devices.

**Solution:** Use icon visibility classes that force proper colors for SVG icons.

```css
/* Force orange color for icons */
.mobile-icon-visible svg {
  color: var(--bitcoin-orange) !important;
  stroke: var(--bitcoin-orange) !important;
  fill: none !important;
  stroke-width: 2.5 !important;
}

/* Force white color for icons */
.mobile-icon-visible-white svg {
  color: var(--bitcoin-white) !important;
  stroke: var(--bitcoin-white) !important;
  fill: none !important;
  stroke-width: 2.5 !important;
}

/* Filled orange icons */
.mobile-icon-visible-filled svg {
  color: var(--bitcoin-orange) !important;
  fill: var(--bitcoin-orange) !important;
  stroke: none !important;
}
```

### Card and Container Safety

**Problem:** Cards and containers can have poor contrast or invisible borders.

**Solution:** Use safe card classes with guaranteed visibility.

```css
/* Safe card with orange border */
.mobile-card-safe {
  background-color: var(--bitcoin-black) !important;
  border: 1px solid var(--bitcoin-orange) !important;
  border-radius: 12px;
  padding: 1rem;
  color: var(--bitcoin-white-80) !important;
}

/* Subtle card with lighter border */
.mobile-card-safe-subtle {
  background-color: var(--bitcoin-black) !important;
  border: 1px solid var(--bitcoin-orange-20) !important;
  border-radius: 12px;
  padding: 1rem;
  color: var(--bitcoin-white-80) !important;
}
```

### Input and Form Safety

**Problem:** Form inputs can have poor visibility or cause iOS zoom.

**Solution:** Use safe input classes with proper sizing and contrast.

```css
/* Safe input styling */
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

### Emergency Override Classes

**Problem:** Sometimes all other methods fail and maximum contrast is needed.

**Solution:** Use emergency override classes as a last resort.

```css
/* Maximum contrast - orange background, black text */
.emergency-contrast {
  background-color: var(--bitcoin-orange) !important;
  color: var(--bitcoin-black) !important;
  border: 3px solid var(--bitcoin-orange) !important;
  font-weight: 800 !important;
  box-shadow: 0 0 30px rgba(247, 147, 26, 0.7) !important;
}

/* Inverted maximum contrast - black background, white text */
.emergency-contrast-inverted {
  background-color: var(--bitcoin-black) !important;
  color: var(--bitcoin-white) !important;
  border: 3px solid var(--bitcoin-orange) !important;
  font-weight: 800 !important;
  box-shadow: 0 0 30px rgba(247, 147, 26, 0.7) !important;
}

/* Maximum visibility with glow */
.mobile-high-visibility {
  border: 3px solid var(--bitcoin-orange) !important;
  box-shadow: 0 0 25px rgba(247, 147, 26, 0.6) !important;
  background-color: var(--bitcoin-black) !important;
  color: var(--bitcoin-white) !important;
}
```

### Media Query Strategy

**CRITICAL:** All mobile/tablet fixes MUST use media queries to avoid affecting desktop.

```css
/* Mobile/Tablet ONLY (320px-1023px) */
@media (max-width: 1023px) {
  /* All mobile/tablet specific styles here */
  .btn-feature.active {
    background: var(--bitcoin-orange);
    color: var(--bitcoin-black);
  }
}

/* Desktop (1024px+) - PRESERVE EXISTING STYLES */
@media (min-width: 1024px) {
  /* NO CHANGES to desktop behavior */
  /* Existing desktop styles remain untouched */
}
```

### Implementation Rules

1. **Always use media queries**: Target mobile/tablet with `@media (max-width: 1023px)`
2. **Never modify desktop styles**: Desktop (1024px+) must remain unchanged
3. **Test desktop after every change**: Verify no regressions on desktop
4. **Use explicit state classes**: Prevent color conflicts with explicit CSS classes
5. **Ensure minimum touch targets**: 48px × 48px for all interactive elements
6. **Verify contrast ratios**: All text must meet WCAG AA (4.5:1 minimum)
7. **Test on physical devices**: iPhone SE, iPhone 14, iPad Mini, iPad Pro

### Landing Page Redesign Guidelines

**FROM:** Cluttered landing page with feature activation buttons  
**TO:** Clean, informational homepage with menu-first navigation

#### Key Changes

1. **Remove Feature Buttons**: No clickable feature activation buttons on landing page
2. **Informational Cards**: Display feature information without activation
3. **Menu-First Navigation**: Primary access through hamburger menu
4. **Hero Section**: Clear value proposition and key statistics
5. **Live Market Data**: Display current prices without interaction

#### Example Structure

```html
<!-- Hero Section -->
<section class="mobile-bg-safe p-6">
  <h1 class="mobile-text-primary text-3xl font-bold mb-4">
    Bitcoin Sovereign Technology
  </h1>
  <p class="mobile-text-secondary text-lg mb-6">
    Real-time cryptocurrency intelligence and analysis
  </p>
  <div class="mobile-card-safe-subtle p-4">
    <span class="mobile-text-accent font-mono text-2xl">
      24/7 Live Monitoring
    </span>
  </div>
</section>

<!-- Feature Overview (Informational Only) -->
<section class="mobile-bg-safe p-6">
  <div class="mobile-card-safe mb-4">
    <h3 class="mobile-text-primary font-bold mb-2">
      Bitcoin Analysis
    </h3>
    <p class="mobile-text-secondary mb-2">
      Real-time technical analysis and market intelligence
    </p>
    <span class="mobile-text-accent text-sm">
      Access via Menu →
    </span>
  </div>
</section>
```

### Menu-First Navigation Documentation

**Design Pattern:** Full-screen overlay menu as primary navigation method

#### Menu Structure

```html
<!-- Hamburger Icon -->
<button class="hamburger-icon" onclick="toggleMenu()">
  <span class="hamburger-line"></span>
  <span class="hamburger-line"></span>
  <span class="hamburger-line"></span>
</button>

<!-- Full-Screen Menu Overlay -->
<div class="mobile-menu-overlay">
  <div class="mobile-menu-header">
    <h2 class="mobile-text-primary">Menu</h2>
    <button onclick="closeMenu()">✕</button>
  </div>
  
  <div class="mobile-menu-items">
    <!-- Menu Item Card -->
    <div class="mobile-menu-item-card">
      <div class="mobile-menu-item-icon">
        <svg><!-- Icon --></svg>
      </div>
      <div class="mobile-menu-item-content">
        <h4 class="mobile-menu-item-title">Crypto News Wire</h4>
        <p class="mobile-menu-item-description">
          Real-time cryptocurrency news
        </p>
      </div>
      <div class="mobile-menu-item-arrow">→</div>
    </div>
  </div>
</div>
```

#### Menu Styling

```css
/* Full-screen overlay */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--bitcoin-black);
  z-index: 9999;
  overflow-y: auto;
}

/* Menu item card */
.mobile-menu-item-card {
  background: var(--bitcoin-black);
  border: 1px solid var(--bitcoin-orange-20);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.mobile-menu-item-card:hover {
  border-color: var(--bitcoin-orange);
  box-shadow: 0 0 20px rgba(247, 147, 26, 0.3);
}

.mobile-menu-item-card.active {
  background: var(--bitcoin-orange);
  color: var(--bitcoin-black);
}
```

### Testing Checklist for Mobile/Tablet Fixes

Before deploying any mobile/tablet visual fixes:

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
- [ ] Tested on iPhone SE (375px)
- [ ] Tested on iPhone 14 (390px)
- [ ] Tested on iPhone 14 Pro Max (428px)
- [ ] Tested on iPad Mini (768px)
- [ ] Tested on iPad Pro (1024px)

### Common Pitfalls to Avoid

1. **Modifying desktop styles**: Always use `@media (max-width: 1023px)` for mobile fixes
2. **Forgetting touch targets**: Ensure 48px minimum for all interactive elements
3. **Using forbidden colors**: Only black, orange, and white allowed
4. **Inline style overrides**: Don't use inline styles that override mobile classes
5. **Small orange text**: Orange text must be 18px+ or bold for WCAG compliance
6. **Missing hover states**: All interactive elements need clear hover feedback
7. **Skipping device testing**: Always test on physical devices
8. **Ignoring focus states**: Accessibility requires visible focus indicators

### Quick Reference

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

**Media Query Template:**
```css
@media (max-width: 1023px) {
  /* Mobile/tablet fixes here */
}
```

For complete documentation, see: [Mobile/Tablet Styling Guide](../MOBILE-TABLET-STYLING-GUIDE.md)
