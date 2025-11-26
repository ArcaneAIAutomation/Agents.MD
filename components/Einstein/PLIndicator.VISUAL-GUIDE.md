# PLIndicator Visual Guide

## Quick Visual Reference

This guide provides a visual reference for the PLIndicator component styling and usage.

---

## Color Palette

### Profit (Orange)
```
┌─────────────────────────────────────────┐
│ Color: #F7931A (Bitcoin Orange)        │
│ Background: rgba(247, 147, 26, 0.1)    │
│ Border: rgba(247, 147, 26, 0.2)        │
│ Icon: ArrowUp (↑)                       │
└─────────────────────────────────────────┘
```

### Loss (White)
```
┌─────────────────────────────────────────┐
│ Color: rgba(255, 255, 255, 0.8)        │
│ Background: #000000 (Black)             │
│ Border: #374151 (Gray)                  │
│ Icon: ArrowDown (↓)                     │
└─────────────────────────────────────────┘
```

---

## Size Variants

### Small (sm)
```
┌──────────────────┐
│ ↑ +$1.50K       │
│   +5.25%        │
└──────────────────┘
Font: 14px / 12px
Icon: 14px
Padding: 12px
```

### Medium (md) - Default
```
┌────────────────────┐
│ ↑  +$1.50K        │
│    +5.25%         │
└────────────────────┘
Font: 18px / 14px
Icon: 18px
Padding: 12px
```

### Large (lg)
```
┌──────────────────────┐
│ ↑   +$1.50K         │
│     +5.25%          │
└──────────────────────┘
Font: 24px / 16px
Icon: 22px
Padding: 12px
```

---

## Layout Examples

### Full Display (Default)
```
┌─────────────────────────────────────┐
│  ┌─────┐  ┌──────────────────┐     │
│  │  ↑  │  │  +$1,500.00      │     │
│  │     │  │  +5.25%          │     │
│  └─────┘  └──────────────────┘     │
└─────────────────────────────────────┘
   Icon      Amount & Percentage
```

### Without Icon
```
┌─────────────────────────────────────┐
│  ┌──────────────────┐               │
│  │  +$1,500.00      │               │
│  │  +5.25%          │               │
│  └──────────────────┘               │
└─────────────────────────────────────┘
   Amount & Percentage Only
```

### Without Percentage
```
┌─────────────────────────────────────┐
│  ┌─────┐  ┌──────────────────┐     │
│  │  ↑  │  │  +$1,500.00      │     │
│  └─────┘  └──────────────────┘     │
└─────────────────────────────────────┘
   Icon      Amount Only
```

### Compact Mode
```
┌─────────────────────────────────────┐
│  ↑ +$1.50K (+5.25%)                │
└─────────────────────────────────────┘
   Single Line Display
```

---

## Number Formatting

### Standard Numbers
```
$0.00 - $999.99     →  $X.XX
Example: $750.00    →  $750.00
```

### Thousands (K)
```
$1,000 - $999,999   →  $X.XXK
Example: $15,000    →  $15.00K
```

### Millions (M)
```
$1,000,000+         →  $X.XXM
Example: $1,500,000 →  $1.50M
```

---

## State Examples

### Profit States

#### Small Profit
```
┌─────────────────────────────────────┐
│  ↑  +$127.68                        │
│     +1.28%                          │
└─────────────────────────────────────┘
Color: Orange (#F7931A)
```

#### Medium Profit
```
┌─────────────────────────────────────┐
│  ↑  +$1.50K                         │
│     +5.25%                          │
└─────────────────────────────────────┘
Color: Orange (#F7931A)
```

#### Large Profit
```
┌─────────────────────────────────────┐
│  ↑  +$1.50M                         │
│     +15.00%                         │
└─────────────────────────────────────┘
Color: Orange (#F7931A)
```

### Loss States

#### Small Loss
```
┌─────────────────────────────────────┐
│  ↓  -$85.32                         │
│     -0.85%                          │
└─────────────────────────────────────┘
Color: White 80% (rgba(255,255,255,0.8))
```

#### Medium Loss
```
┌─────────────────────────────────────┐
│  ↓  -$750.00                        │
│     -2.50%                          │
└─────────────────────────────────────┘
Color: White 80% (rgba(255,255,255,0.8))
```

#### Large Loss
```
┌─────────────────────────────────────┐
│  ↓  -$5.25K                         │
│     -10.50%                         │
└─────────────────────────────────────┘
Color: White 80% (rgba(255,255,255,0.8))
```

---

## Integration Examples

### Trade Card
```
┌─────────────────────────────────────────────┐
│  BTC LONG                    [EXECUTED]     │
│  ─────────────────────────────────────────  │
│  Entry: $50,000                             │
│  Current: $51,500                           │
│  ─────────────────────────────────────────  │
│  ┌─────────────────────────────────────┐   │
│  │  ↑  +$1.50K                         │   │
│  │     +3.00%                          │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Trade History Table
```
┌──────────────────────────────────────────────────────────┐
│ Trade      │ Entry    │ Current  │ P/L                   │
├────────────┼──────────┼──────────┼───────────────────────┤
│ BTC LONG   │ $50,000  │ $51,500  │ ↑ +$1.50K (+3.00%)   │
│ ETH SHORT  │ $3,000   │ $3,150   │ ↓ -$150.00 (-5.00%)  │
│ SOL LONG   │ $100     │ $105     │ ↑ +$5.00 (+5.00%)    │
└──────────────────────────────────────────────────────────┘
```

### Performance Dashboard
```
┌─────────────────────────────────────────────┐
│  Total Portfolio P/L                        │
│  ─────────────────────────────────────────  │
│  ┌─────────────────────────────────────┐   │
│  │  ↑  +$15.75K                        │   │
│  │     +8.33%                          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Win Rate: 65%                              │
│  Total Trades: 47                           │
└─────────────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop (1024px+)
```
┌─────────────────────────────────────┐
│  ↑  +$1,500.00                      │
│     +5.25%                          │
└─────────────────────────────────────┘
Size: Medium (default)
```

### Tablet (768px - 1023px)
```
┌───────────────────────────────┐
│  ↑  +$1.50K                   │
│     +5.25%                    │
└───────────────────────────────┘
Size: Medium (default)
```

### Mobile (320px - 767px)
```
┌─────────────────────────┐
│  ↑  +$1.50K            │
│     +5.25%             │
└─────────────────────────┘
Size: Small (recommended)
```

---

## Accessibility

### Color Contrast Ratios

#### Profit (Orange on Black)
```
Foreground: #F7931A
Background: #000000
Ratio: 5.8:1
WCAG: AA (Large Text) ✓
```

#### Loss (White 80% on Black)
```
Foreground: rgba(255,255,255,0.8)
Background: #000000
Ratio: 16.8:1
WCAG: AAA ✓
```

### Icon Support
- Visual indicators for profit/loss
- Arrow direction reinforces meaning
- Works without color for color-blind users

---

## Animation States

### Static (Default)
```
No animation
Instant display
```

### Loading
```
Skeleton placeholder
Pulsing animation
Gray background
```

### Updating
```
Fade transition (300ms)
Smooth number change
Highlight on change
```

### Error
```
Red border (exception to design)
Error icon
Error message below
```

---

## CSS Classes Reference

### Container Classes
```css
.inline-flex          /* Inline flex container */
.items-center         /* Vertical center alignment */
.gap-2                /* 8px gap between elements */
.px-3                 /* 12px horizontal padding */
.py-2                 /* 8px vertical padding */
.rounded-lg           /* 8px border radius */
.border               /* 1px border */
.transition-all       /* Smooth transitions */
.duration-300         /* 300ms transition */
```

### Color Classes (Profit)
```css
.text-bitcoin-orange           /* #F7931A */
.bg-bitcoin-orange-10          /* rgba(247,147,26,0.1) */
.border-bitcoin-orange-20      /* rgba(247,147,26,0.2) */
```

### Color Classes (Loss)
```css
.text-bitcoin-white-80         /* rgba(255,255,255,0.8) */
.bg-bitcoin-black              /* #000000 */
.border-gray-700               /* #374151 */
```

### Typography Classes
```css
.font-mono            /* Roboto Mono */
.font-semibold        /* 600 weight */
.font-bold            /* 700 weight */
.text-sm              /* 14px */
.text-base            /* 16px */
.text-lg              /* 18px */
.text-2xl             /* 24px */
```

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

---

## Print Styles

When printing, the component:
- Removes background colors
- Increases contrast
- Maintains icon visibility
- Preserves number formatting

---

**Status**: ✅ Complete  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025
