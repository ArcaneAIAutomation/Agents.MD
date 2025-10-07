# Container Queries Quick Start Guide

## 🚀 Quick Implementation

### 1. Import Utilities

```typescript
import { containerQueryClasses, containerContentClasses } from '@/utils/containerQueries';
```

### 2. Wrap Your Component

```tsx
<div className={containerQueryClasses.zoneCard}>
  {/* Your content here */}
</div>
```

### 3. Use Content Classes

```tsx
<div className={containerQueryClasses.zoneCard}>
  <div className={containerContentClasses.zoneCard.content}>
    <div className={containerContentClasses.zoneCard.price}>
      $95,234.50
    </div>
    <div className={containerContentClasses.zoneCard.distance}>
      2.3% below
    </div>
  </div>
</div>
```

---

## 📦 Available Container Types

### Zone Cards
```typescript
containerQueryClasses.zoneCard
containerContentClasses.zoneCard.content
containerContentClasses.zoneCard.price
containerContentClasses.zoneCard.distance
```

### Charts
```typescript
containerQueryClasses.chart
containerContentClasses.chart.content
containerContentClasses.chart.label
containerContentClasses.chart.value
```

### Badges
```typescript
containerQueryClasses.badge
containerContentClasses.badge.text
```

### Whale Watch Cards
```typescript
containerQueryClasses.whaleCard
containerContentClasses.whaleCard.amount
containerContentClasses.whaleCard.value
containerContentClasses.whaleCard.status
```

### Trade Signals
```typescript
containerQueryClasses.tradeSignal
containerContentClasses.tradeSignal.price
containerContentClasses.tradeSignal.label
```

### Market Data
```typescript
containerQueryClasses.marketData
containerContentClasses.marketData.value
containerContentClasses.marketData.label
```

---

## 🎯 Common Patterns

### Pattern 1: Simple Container

```tsx
function MyComponent() {
  return (
    <div className={containerQueryClasses.zoneCard}>
      <div className={containerContentClasses.zoneCard.content}>
        Content adapts to container size
      </div>
    </div>
  );
}
```

### Pattern 2: Grid of Containers

```tsx
function MyGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map(item => (
        <div key={item.id} className={containerQueryClasses.zoneCard}>
          <div className={containerContentClasses.zoneCard.content}>
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 3: Nested Containers

```tsx
function NestedExample() {
  return (
    <div className={containerQueryClasses.chart}>
      <div className={containerContentClasses.chart.content}>
        <div className={containerQueryClasses.badge}>
          <span className={containerContentClasses.badge.text}>
            LIVE
          </span>
        </div>
        <div className={containerContentClasses.chart.value}>
          $97,234.50
        </div>
      </div>
    </div>
  );
}
```

---

## 🔍 Testing

### Check Browser Support

```typescript
import { supportsContainerQueries } from '@/utils/containerQueries';

if (supportsContainerQueries()) {
  console.log('Container queries supported!');
}
```

### Test Breakpoints

```typescript
import { meetsContainerBreakpoint } from '@/utils/containerQueries';

const isLarge = meetsContainerBreakpoint(350, 300); // true
```

### Get Current Tier

```typescript
import { getContainerBreakpointTier, containerBreakpoints } from '@/utils/containerQueries';

const tier = getContainerBreakpointTier(275, containerBreakpoints.zoneCard);
// Returns: 'large'
```

---

## 📱 Mobile Optimization Benefits

✅ **Text Containment**: Text automatically scales to fit container  
✅ **Component Reusability**: Same component works in sidebar, main content, modal  
✅ **Responsive Scaling**: Smooth scaling from 320px to 768px+  
✅ **Better Performance**: More efficient than viewport queries  

---

## 🌐 Browser Support

- ✅ Chrome/Edge 105+
- ✅ Safari 16+
- ✅ Firefox 110+
- ⚠️ Older browsers: Automatic fallback to responsive design

---

## 🧪 Test Your Implementation

1. Open `test-container-queries.html` in your browser
2. Click column buttons to resize containers
3. Verify text scales appropriately
4. Check for overflow issues

---

## 📚 Full Documentation

For complete documentation, see:
- `utils/README-container-queries.md` - Comprehensive guide
- `CONTAINER-QUERIES-IMPLEMENTATION.md` - Implementation summary
- `utils/containerQueries.ts` - Source code with JSDoc comments

---

## ⚡ Pro Tips

1. **Always wrap in container class first**: `containerQueryClasses.xxx`
2. **Use content classes for children**: `containerContentClasses.xxx.yyy`
3. **Test at multiple sizes**: Use the test page to verify behavior
4. **Check browser support**: Use `supportsContainerQueries()` if needed
5. **Combine with Tailwind**: Container queries work alongside Tailwind classes

---

## 🐛 Troubleshooting

### Text Still Overflows?

Make sure you're using the content classes:
```tsx
// ❌ Wrong
<div className={containerQueryClasses.zoneCard}>
  <div className="text-lg">$95,234.50</div>
</div>

// ✅ Correct
<div className={containerQueryClasses.zoneCard}>
  <div className={containerContentClasses.zoneCard.price}>
    $95,234.50
  </div>
</div>
```

### Container Not Responding?

Ensure container has explicit width:
```tsx
// ❌ Wrong
<div className={containerQueryClasses.zoneCard}>

// ✅ Correct
<div className={`${containerQueryClasses.zoneCard} w-full`}>
```

### Nested Containers Conflict?

Use unique container names for each level - they're already set up correctly in the CSS!

---

## 🎉 You're Ready!

Start using container queries in your components for better mobile optimization and component-level responsiveness.

**Questions?** Check the full documentation in `utils/README-container-queries.md`
