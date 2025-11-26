# DataChangeIndicator Visual Guide

## Visual Examples

This guide shows what the DataChangeIndicator looks like in action.

---

## 1. Before Change (Normal State)

```
┌─────────────────────────────────────┐
│  Bitcoin Price                      │
│  $95,000                            │
└─────────────────────────────────────┘
```

**Appearance:**
- Black background (`#000000`)
- Thin orange border (`rgba(247, 147, 26, 0.2)`)
- White text for label
- Orange text for value
- No glow effect

---

## 2. During Change (Active State - First 0.5s)

```
┌─────────────────────────────────────┐
│  Bitcoin Price            [Updated] │
│  $95,500                   ↗        │
└─────────────────────────────────────┘
     ╰─── Orange Glow ───╯
```

**Appearance:**
- Orange glow effect (`box-shadow: 0 0 20px rgba(247, 147, 26, 0.5)`)
- "Updated" badge in top-right corner
  - Orange background (`#F7931A`)
  - Black text (`#000000`)
  - Slides in from right
- Value pulses slightly (scale: 1.02)
- Border becomes brighter orange

**Animation:**
- Duration: 0.5s
- Easing: ease-out
- Transform: scale(1) → scale(1.02) → scale(1)

---

## 3. After Change (Fading State - 0.5s to 3s)

```
┌─────────────────────────────────────┐
│  Bitcoin Price            [Updated] │
│  $95,500                            │
└─────────────────────────────────────┘
     ╰─── Fading Glow ───╯
```

**Appearance:**
- Orange glow remains visible
- "Updated" badge still visible
- No pulsing animation
- Steady state with glow

**Duration:** 2.5 seconds (from 0.5s to 3s)

---

## 4. Fade Out (Final 0.5s - 3s to 3.5s)

```
┌─────────────────────────────────────┐
│  Bitcoin Price                      │
│  $95,500                            │
└─────────────────────────────────────┘
```

**Appearance:**
- Glow fades out
- "Updated" badge fades out and scales down
- Returns to normal state
- Border returns to subtle orange

**Animation:**
- Duration: 0.5s
- Easing: ease-in
- Opacity: 1 → 0
- Transform: scale(1) → scale(0.95)

---

## 5. Multiple Values Changing

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Price        │  │ Volume       │  │ Market Cap   │
│ $95,500      │  │ $1.25B       │  │ $1.85T       │
│   [Updated]  │  │              │  │   [Updated]  │
└──────────────┘  └──────────────┘  └──────────────┘
  ╰─── Glow ───╯                      ╰─── Glow ───╯
```

**Behavior:**
- Each value changes independently
- Only changed values show glow and badge
- Unchanged values remain in normal state
- All animations are synchronized

---

## Color Specifications

### Normal State
```css
background: #000000;                    /* Pure black */
border: 1px solid rgba(247, 147, 26, 0.2);  /* Subtle orange */
color: #FFFFFF;                         /* White text */
```

### Changed State (Glow)
```css
box-shadow: 0 0 20px rgba(247, 147, 26, 0.5);  /* Orange glow */
border: 1px solid #F7931A;              /* Bright orange */
```

### Updated Badge
```css
background: #F7931A;                    /* Bitcoin orange */
color: #000000;                         /* Black text */
border: 1px solid #F7931A;              /* Orange border */
box-shadow: 0 0 15px rgba(247, 147, 26, 0.6);  /* Strong glow */
```

---

## Animation Timeline

```
Time:  0s    0.5s   1s    1.5s   2s    2.5s   3s    3.5s
       │     │      │     │      │     │      │     │
State: │─────│──────│─────│──────│─────│──────│─────│
       │     │      │     │      │     │      │     │
Glow:  ▁▁▁▁▁█████████████████████████████████▁▁▁▁▁▁▁
Badge: ▁▁▁▁▁█████████████████████████████████▁▁▁▁▁▁▁
Pulse: ▁▁▁▁▁█▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

Legend:
█ = Active/Visible
▁ = Inactive/Hidden
```

**Phases:**
1. **0s - 0.5s**: Initial pulse animation with glow
2. **0.5s - 3s**: Steady glow and badge display
3. **3s - 3.5s**: Fade out animation
4. **3.5s+**: Return to normal state

---

## Mobile Appearance

### Mobile (< 768px)

```
┌─────────────────────┐
│ Bitcoin Price       │
│ $95,500    [Updated]│
└─────────────────────┘
   ╰─── Smaller Glow ───╯
```

**Differences:**
- Smaller badge (0.5625rem font size)
- Reduced glow intensity (0.4 opacity)
- Faster animation (0.4s vs 0.5s)
- Smaller badge padding

---

## Accessibility States

### Reduced Motion

```
┌─────────────────────────────────────┐
│  Bitcoin Price            [Updated] │
│  $95,500                            │
└─────────────────────────────────────┘
     ╰─── Static Glow ───╯
```

**Behavior:**
- No animations
- Static glow effect
- Badge appears instantly
- No pulsing or fading
- Visual indicators remain

### High Contrast Mode

```
┌═════════════════════════════════════┐
║  Bitcoin Price            [Updated] ║
║  $95,500                            ║
╚═════════════════════════════════════╝
     ╰─── Stronger Glow ───╯
```

**Enhancements:**
- Thicker borders (2px)
- Stronger glow (0.8 opacity)
- Bolder text (font-weight: 700)
- Higher contrast

---

## Usage Patterns

### Pattern 1: Single Value Update

```tsx
<DataChangeIndicator value={price} previousValue={prevPrice}>
  <div className="stat-card">
    <div className="stat-label">Price</div>
    <div className="stat-value">${price}</div>
  </div>
</DataChangeIndicator>
```

**Visual Result:**
```
Before:  ┌──────────┐
         │ Price    │
         │ $95,000  │
         └──────────┘

After:   ┌──────────┐
         │ Price    │ [Updated]
         │ $95,500  │
         └──────────┘
            ╰─ Glow ─╯
```

### Pattern 2: Multiple Independent Values

```tsx
<div className="grid grid-cols-3 gap-4">
  <DataChangeIndicator value={price} previousValue={prevPrice}>
    <StatCard label="Price" value={price} />
  </DataChangeIndicator>
  
  <DataChangeIndicator value={volume} previousValue={prevVolume}>
    <StatCard label="Volume" value={volume} />
  </DataChangeIndicator>
  
  <DataChangeIndicator value={marketCap} previousValue={prevMarketCap}>
    <StatCard label="Market Cap" value={marketCap} />
  </DataChangeIndicator>
</div>
```

**Visual Result:**
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Price    │  │ Volume   │  │ Market   │
│ $95,500  │  │ $1.25B   │  │ Cap      │
│ [Updated]│  │          │  │ $1.85T   │
└──────────┘  └──────────┘  └──────────┘
  ╰─ Glow ─╯                              
```

### Pattern 3: Glow Only (No Badge)

```tsx
<DataChangeIndicator 
  value={price} 
  previousValue={prevPrice}
  showBadge={false}
>
  <StatCard label="Price" value={price} />
</DataChangeIndicator>
```

**Visual Result:**
```
┌──────────┐
│ Price    │
│ $95,500  │
└──────────┘
  ╰─ Glow ─╯
  (No badge)
```

---

## Integration Examples

### With Refresh Button

```
┌─────────────────────────────────────────────┐
│  Trade Signal                    [Refresh]  │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Entry    │  │ Stop     │  │ TP1      │ │
│  │ $94,500  │  │ Loss     │  │ $96,000  │ │
│  │[Updated] │  │ $93,000  │  │[Updated] │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│    ╰─ Glow ─╯                  ╰─ Glow ─╯  │
└─────────────────────────────────────────────┘
```

### With Data Quality Badge

```
┌─────────────────────────────────────────────┐
│  Market Data          [100% Data Verified]  │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Price    │  │ Volume   │  │ Change   │ │
│  │ $95,500  │  │ $1.25B   │  │ +2.5%    │ │
│  │[Updated] │  │[Updated] │  │          │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│    ╰─ Glow ─╯    ╰─ Glow ─╯                │
└─────────────────────────────────────────────┘
```

---

## Performance Considerations

### GPU Acceleration

All animations use GPU-accelerated properties:
- ✅ `transform` (scale, translate)
- ✅ `opacity`
- ⚠️ `box-shadow` (use sparingly)

### Mobile Performance

- Reduced animation duration (0.4s vs 0.5s)
- Smaller glow radius (15px vs 20px)
- Lower opacity (0.4 vs 0.5)
- Fewer simultaneous animations

---

## Browser Rendering

### Chrome/Edge
```
┌─────────────────────────────────────┐
│  Bitcoin Price            [Updated] │
│  $95,500                            │
└─────────────────────────────────────┘
     ╰─── Smooth Glow ───╯
```
- Smooth animations
- Hardware acceleration
- Optimal performance

### Firefox
```
┌─────────────────────────────────────┐
│  Bitcoin Price            [Updated] │
│  $95,500                            │
└─────────────────────────────────────┘
     ╰─── Smooth Glow ───╯
```
- Smooth animations
- Good performance
- Slightly different glow rendering

### Safari
```
┌─────────────────────────────────────┐
│  Bitcoin Price            [Updated] │
│  $95,500                            │
└─────────────────────────────────────┘
     ╰─── Smooth Glow ───╯
```
- Smooth animations
- Hardware acceleration
- Webkit-specific optimizations

---

**Status**: ✅ Complete Visual Guide  
**Requirements**: 13.3  
**Last Updated**: January 27, 2025
