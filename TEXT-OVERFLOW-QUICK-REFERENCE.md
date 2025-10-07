# Text Overflow Prevention - Quick Reference

## 🚀 Quick Start

### CSS Classes (Fastest)
```tsx
// Single-line with ellipsis
<div className="text-overflow-ellipsis">Long text...</div>

// Multi-line with word breaking
<div className="text-overflow-break">Long text...</div>

// Safe container (recommended default)
<div className="safe-container">Content</div>
```

### React Components (Recommended)
```tsx
import { SafeContainer, SafePrice, TruncatedText } from '../components/SafeContainer';

<SafeContainer>
  <SafePrice>${price}</SafePrice>
  <TruncatedText lines={2}>{text}</TruncatedText>
</SafeContainer>
```

## 📋 Common Use Cases

### Price Displays
```tsx
<SafePrice className="font-bold">${123456.78}</SafePrice>
```

### Crypto Addresses
```tsx
<code className="text-overflow-anywhere">
  0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
</code>
```

### Badges
```tsx
<SafeBadge className="bg-blue-100">Label</SafeBadge>
```

### Flex Layouts
```tsx
<SafeFlexContainer>
  <SafeFlexChild>Item 1</SafeFlexChild>
  <SafeFlexChild>Item 2</SafeFlexChild>
</SafeFlexContainer>
```

### Truncated Text
```tsx
<TruncatedText lines={2}>
  Long description that will be truncated to 2 lines...
</TruncatedText>
```

## 🔍 Development Detection

### Enable in App
```tsx
import { useOverflowDetection } from '../hooks/useOverflowDetection';

function App() {
  useOverflowDetection({
    enabled: process.env.NODE_ENV === 'development',
    autoScan: true,
    highlightElements: true,
  });
  
  return <YourApp />;
}
```

### Manual Scan
```tsx
const { scan, overflowElements } = useOverflowDetection();

<button onClick={scan}>Check for Overflow</button>
{overflowElements.length > 0 && (
  <p>⚠️ Found {overflowElements.length} issues</p>
)}
```

## 📱 Mobile-Specific

### Mobile-Only Container
```tsx
<div className="mobile-safe-container">
  Only applies overflow prevention on mobile
</div>
```

### Automatic Mobile Prevention
These elements automatically get overflow prevention on mobile (< 768px):
- `.zone-card`, `.zone-card-price`, `.zone-distance`
- `.whale-card`, `.whale-amount`, `.whale-value`
- `.badge`, `.crypto-badge`, `.tag`, `.label`
- `.price-display`, `.amount-display`, `.percentage-display`
- All flex and grid containers

## 🎨 CSS Classes Cheat Sheet

| Class | Use Case |
|-------|----------|
| `text-overflow-ellipsis` | Single-line titles, labels |
| `text-overflow-break` | Multi-line paragraphs |
| `text-overflow-anywhere` | URLs, crypto addresses |
| `text-overflow-scroll` | Tables, wide content |
| `text-overflow-safe` | General containers |
| `safe-container` | Any container |
| `safe-flex-child` | Flex children |
| `safe-grid-child` | Grid children |
| `truncate-1-line` | Truncate to 1 line |
| `truncate-2-lines` | Truncate to 2 lines |
| `truncate-3-lines` | Truncate to 3 lines |

## 🛠️ React Components Cheat Sheet

| Component | Use Case |
|-----------|----------|
| `<SafeContainer>` | General purpose |
| `<SafeFlexContainer>` | Flex layouts |
| `<SafeFlexChild>` | Flex children |
| `<SafeGridContainer>` | Grid layouts |
| `<SafeGridChild>` | Grid children |
| `<TruncatedText>` | Line clamping |
| `<SafePrice>` | Price displays |
| `<SafeAmount>` | Amount displays |
| `<SafePercentage>` | Percentage displays |
| `<SafeBadge>` | Badges/labels |
| `<SafeStatusMessage>` | Status messages |
| `<ScrollableContainer>` | Horizontal scroll |

## ⚡ Best Practices

### ✅ DO
- Use `safe-container` for general containers
- Use `SafeFlexChild` in flex layouts
- Use `text-overflow-ellipsis` for single-line text
- Enable overflow detection in development
- Test at all mobile breakpoints

### ❌ DON'T
- Don't use `overflow: visible` on mobile
- Don't forget `min-width: 0` on flex children
- Don't use fixed widths without overflow handling
- Don't disable overflow detection in development

## 🐛 Troubleshooting

### Text Overflowing in Flex?
```tsx
// Add min-width: 0
<div className="safe-flex-child">Content</div>
```

### Long URL Breaking Layout?
```tsx
// Use anywhere breaking
<a className="text-overflow-anywhere" href={url}>{url}</a>
```

### Price Numbers Overflowing?
```tsx
// Use SafePrice component
<SafePrice>${price}</SafePrice>
```

### Badge Text Too Long?
```tsx
// Use ellipsis
<span className="badge text-overflow-ellipsis">{label}</span>
```

## 📚 Full Documentation

See `utils/README-text-overflow-prevention.md` for complete documentation.

## 🎯 Testing Checklist

- [ ] Enable overflow detection in development
- [ ] Check console for warnings
- [ ] Look for red outlines on elements
- [ ] Test at 320px (smallest mobile)
- [ ] Test at 375px (iPhone SE)
- [ ] Test at 390px (iPhone 12/13/14)
- [ ] Test at 428px (iPhone Pro Max)
- [ ] Test at 768px (iPad Mini)
- [ ] Test portrait and landscape
- [ ] Verify zero overflow instances

## 💡 Quick Tips

1. **Start with CSS classes** - Fastest implementation
2. **Use React components** - For complex layouts
3. **Enable detection** - Catch issues early
4. **Test on real devices** - Emulators aren't enough
5. **Check console** - Development warnings are helpful

## 🔗 Related Files

- `utils/textOverflowPrevention.ts` - Core utilities
- `components/SafeContainer.tsx` - React components
- `hooks/useOverflowDetection.ts` - React hooks
- `styles/globals.css` - CSS utilities
- `components/TextOverflowExample.tsx` - Examples
