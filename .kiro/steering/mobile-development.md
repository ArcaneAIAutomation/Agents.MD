# Mobile Development Guidelines

## Mobile-First Approach

All components and features must be designed with mobile as the primary target, then enhanced for larger screens.

### Design Principles
- **Touch-First**: All interactions optimized for touch input
- **Performance-First**: Fast loading and smooth animations on mobile devices
- **Accessibility-First**: WCAG 2.1 AA compliance with high contrast ratios
- **Progressive Enhancement**: Core functionality works on all devices, enhanced features for capable devices

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
- **Font Weight**: Bold (700) for important information, Regular (400) for body text

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