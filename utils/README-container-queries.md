# Container Queries Implementation Guide

## Overview

Container queries allow components to adapt their styling based on the size of their container rather than the viewport size. This enables true component-level responsiveness, which is especially important for mobile optimization where components may be rendered in different container sizes.

## Why Container Queries?

Traditional media queries respond to viewport size, but components often need to adapt based on their container's size. For example:

- A zone card in a sidebar should look different than the same card in the main content area
- Chart components should adapt to their parent container, not the screen size
- Badges and labels should scale based on available space in their container

## Browser Support

Container queries are supported in:
- Chrome/Edge 105+
- Safari 16+
- Firefox 110+

For older browsers, we provide fallback styles using traditional responsive design.

## Implementation

### 1. CSS Container Query Classes

All container query styles are defined in `styles/globals.css`. Key classes include:

#### Zone Cards
```css
.zone-card-container {
  container-type: inline-size;
  container-name: zone-card;
}
```

#### Charts
```css
.chart-container-query {
  container-type: inline-size;
  container-name: chart;
}
```

#### Badges
```css
.badge-container-query {
  container-type: inline-size;
  container-name: badge;
}
```

#### Whale Watch Cards
```css
.whale-card-container {
  container-type: inline-size;
  container-name: whale-card;
}
```

#### Trade Signals
```css
.trade-signal-container {
  container-type: inline-size;
  container-name: trade-signal;
}
```

#### Market Data
```css
.market-data-container {
  container-type: inline-size;
  container-name: market-data;
}
```

### 2. TypeScript Utilities

Import utilities from `utils/containerQueries.ts`:

```typescript
import {
  containerQueryClasses,
  containerContentClasses,
  supportsContainerQueries,
  getResponsiveFontSize,
} from '@/utils/containerQueries';
```

### 3. React Component Usage

#### Example: Zone Card with Container Queries

```tsx
import { containerQueryClasses, containerContentClasses } from '@/utils/containerQueries';

function ZoneCard({ level, strength, distance }) {
  return (
    <div className={containerQueryClasses.zoneCard}>
      <div className={containerContentClasses.zoneCard.content}>
        <div className={containerContentClasses.zoneCard.price}>
          ${level.toLocaleString()}
        </div>
        <div className="text-xs font-medium">{strength}</div>
        <div className={containerContentClasses.zoneCard.distance}>
          {distance}
        </div>
      </div>
    </div>
  );
}
```

#### Example: Chart Component with Container Queries

```tsx
import { containerQueryClasses, containerContentClasses } from '@/utils/containerQueries';

function ChartComponent({ data }) {
  return (
    <div className={containerQueryClasses.chart}>
      <div className={containerContentClasses.chart.content}>
        <div className={containerContentClasses.chart.label}>
          Current Price
        </div>
        <div className={containerContentClasses.chart.value}>
          ${data.price}
        </div>
      </div>
    </div>
  );
}
```

#### Example: Badge with Container Queries

```tsx
import { containerQueryClasses, containerContentClasses } from '@/utils/containerQueries';

function Badge({ text, variant }) {
  return (
    <div className={containerQueryClasses.badge}>
      <span className={containerContentClasses.badge.text}>
        {text}
      </span>
    </div>
  );
}
```

#### Example: Whale Watch Card with Container Queries

```tsx
import { containerQueryClasses, containerContentClasses } from '@/utils/containerQueries';

function WhaleTransactionCard({ amount, value, status }) {
  return (
    <div className={containerQueryClasses.whaleCard}>
      <div className={containerContentClasses.whaleCard.amount}>
        {amount} BTC
      </div>
      <div className={containerContentClasses.whaleCard.value}>
        ${value.toLocaleString()}
      </div>
      <div className={containerContentClasses.whaleCard.status}>
        {status}
      </div>
    </div>
  );
}
```

### 4. Container Query Breakpoints

Breakpoints are defined in `utils/containerQueries.ts`:

```typescript
export const containerBreakpoints = {
  zoneCard: {
    small: 200,   // Minimum viable size
    medium: 250,  // Comfortable size
    large: 300,   // Optimal size
  },
  chart: {
    small: 300,   // Compact chart
    medium: 500,  // Standard chart
    large: 700,   // Full-featured chart
  },
  badge: {
    small: 60,    // Minimal badge
    medium: 80,   // Standard badge
    large: 100,   // Large badge
  },
  // ... more breakpoints
};
```

### 5. Responsive Font Sizing

Container queries use `clamp()` for fluid typography:

```css
/* Scales from 0.875rem to 1rem based on container width */
font-size: clamp(0.875rem, 3vw, 1rem);
```

This ensures text always fits within its container while maintaining readability.

## Container Query Patterns

### Pattern 1: Inline-Size Container

Most common pattern - responds to container width:

```css
.my-container {
  container-type: inline-size;
  container-name: my-component;
}

@container my-component (min-width: 300px) {
  .my-content {
    font-size: 1rem;
  }
}
```

### Pattern 2: Size Container

Responds to both width and height:

```css
.my-container {
  container-type: size;
  container-name: my-component;
}

@container my-component (min-width: 300px) and (min-height: 200px) {
  .my-content {
    padding: 2rem;
  }
}
```

### Pattern 3: Nested Containers

Containers can be nested for complex layouts:

```tsx
<div className="chart-container-query">
  <div className="badge-container-query">
    <span className="badge-text">Live</span>
  </div>
  <div className="chart-content">
    {/* Chart content */}
  </div>
</div>
```

## Mobile Optimization Benefits

Container queries provide several mobile optimization benefits:

1. **Text Containment**: Text automatically scales to fit its container, preventing overflow
2. **Component Reusability**: Same component works in different contexts (sidebar, main content, modal)
3. **Responsive Grids**: Grid items adapt based on available space, not screen size
4. **Better Performance**: Fewer layout recalculations compared to viewport-based queries
5. **Predictable Behavior**: Components behave consistently regardless of where they're placed

## Fallback Strategy

For browsers without container query support, we provide fallback styles:

```css
@supports not (container-type: inline-size) {
  /* Fallback to traditional responsive design */
  @media (max-width: 768px) {
    .zone-card-content {
      font-size: clamp(0.875rem, 3.5vw, 1rem);
    }
  }
}
```

## Testing Container Queries

### Manual Testing

1. Resize browser window to different widths
2. Test components in different container contexts (sidebar, main, modal)
3. Verify text doesn't overflow at any container size
4. Check that font sizes scale appropriately

### Automated Testing

Use the container query utilities to test breakpoint behavior:

```typescript
import { meetsContainerBreakpoint, getContainerBreakpointTier } from '@/utils/containerQueries';

// Test if container meets breakpoint
const isLarge = meetsContainerBreakpoint(350, 300); // true

// Get current tier
const tier = getContainerBreakpointTier(275, {
  small: 200,
  medium: 250,
  large: 300,
}); // 'large'
```

## Best Practices

1. **Use Semantic Container Names**: Name containers based on their purpose (e.g., `zone-card`, `chart`)
2. **Define Clear Breakpoints**: Use consistent breakpoint values across similar components
3. **Test Edge Cases**: Test at minimum and maximum container sizes
4. **Provide Fallbacks**: Always include fallback styles for older browsers
5. **Use clamp() for Fluid Typography**: Ensures text scales smoothly between breakpoints
6. **Avoid Deep Nesting**: Keep container query nesting to 2-3 levels maximum
7. **Document Container Requirements**: Specify minimum container sizes in component docs

## Common Issues and Solutions

### Issue: Text Overflow

**Solution**: Use `overflow: hidden` with `text-overflow: ellipsis` or responsive font sizing:

```css
.zone-card-price {
  font-size: clamp(0.875rem, 3vw, 1rem);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Issue: Container Not Responding

**Solution**: Ensure container has explicit width or is in a flex/grid context:

```css
.zone-card-container {
  container-type: inline-size;
  width: 100%; /* Explicit width */
}
```

### Issue: Nested Containers Conflict

**Solution**: Use unique container names for each level:

```css
.outer-container {
  container-name: outer;
}

.inner-container {
  container-name: inner;
}
```

## Performance Considerations

Container queries are generally more performant than viewport queries because:

1. They only affect descendants of the container
2. They don't trigger global layout recalculations
3. They're optimized by modern browsers

However, avoid:
- Too many container queries on a single page (>50)
- Complex nested container structures (>3 levels)
- Container queries on frequently animated elements

## Resources

- [MDN: CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries)
- [Can I Use: Container Queries](https://caniuse.com/css-container-queries)
- [CSS Tricks: Container Queries Guide](https://css-tricks.com/a-primer-on-css-container-queries/)

## Migration Guide

To migrate existing components to use container queries:

1. Identify components that need container-based responsiveness
2. Wrap component in appropriate container class
3. Replace viewport-based media queries with container queries
4. Test at various container sizes
5. Add fallback styles for older browsers
6. Update component documentation

Example migration:

**Before (viewport-based):**
```tsx
<div className="zone-card">
  <div className="text-sm md:text-base lg:text-lg">
    ${price}
  </div>
</div>
```

**After (container-based):**
```tsx
<div className="zone-card-container">
  <div className="zone-card-price">
    ${price}
  </div>
</div>
```

The container query CSS handles the responsive sizing automatically based on the container's width, not the viewport.
