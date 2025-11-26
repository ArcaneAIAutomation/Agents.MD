# Einstein Loading States - Visual Guide

## Quick Reference

This guide provides a visual reference for all loading states in the Einstein Trade Engine.

---

## 1. Basic Spinner Sizes

### Small (sm) - 16px
```
    ⟳
```
**Use**: Inline elements, buttons, list items

### Medium (md) - 24px
```
     ⟳
```
**Use**: Cards, small sections, default size

### Large (lg) - 32px
```
      ⟳
```
**Use**: Main content areas, modals

### Extra Large (xl) - 48px
```
        ⟳
```
**Use**: Full page loading, important operations

---

## 2. Spinner with Text

```
      ⟳
  Loading data...
```

**Variants**:
- "Verifying Data..." (Requirement 15.5)
- "Generating Trade Signal..."
- "Analyzing Market Data..."
- "Loading trade history..."

---

## 3. Progress Indicator

```
      ⟳
  Fetching data...
      75%
```

**Features**:
- Circular progress ring
- Percentage display
- Real-time updates

---

## 4. Pulsing Spinner

```
      ⟳  (pulsing)
  Verifying Data...
```

**Effect**: Opacity pulses between 100% and 50%  
**Duration**: 2s ease-in-out infinite

---

## 5. Preset Loading States

### VerifyingDataSpinner
```
┌─────────────────────────────┐
│                             │
│           ⟳                 │
│    Verifying Data...        │
│                             │
└─────────────────────────────┘
```
**Size**: Large  
**Pulse**: Yes  
**Use**: Data refresh operations

### GeneratingSignalSpinner
```
┌─────────────────────────────┐
│                             │
│            ⟳                │
│  Generating Trade Signal... │
│                             │
└─────────────────────────────┘
```
**Size**: Extra Large  
**Pulse**: Yes  
**Use**: Trade signal generation

### AnalyzingMarketSpinner
```
┌─────────────────────────────┐
│                             │
│           ⟳                 │
│  Analyzing Market Data...   │
│                             │
└─────────────────────────────┘
```
**Size**: Large  
**Pulse**: No  
**Use**: Market analysis

### LoadingHistorySpinner
```
┌─────────────────────────────┐
│                             │
│          ⟳                  │
│  Loading trade history...   │
│                             │
└─────────────────────────────┘
```
**Size**: Medium  
**Pulse**: No  
**Use**: Trade history loading

---

## 6. Full Page Loading Overlay

```
┌─────────────────────────────────────────┐
│                                         │
│  ╔═══════════════════════════════════╗ │
│  ║                                   ║ │
│  ║             ⟳                     ║ │
│  ║   Generating trade signal...      ║ │
│  ║             50%                   ║ │
│  ║                                   ║ │
│  ╚═══════════════════════════════════╝ │
│                                         │
│  (Background dimmed, interactions       │
│   disabled)                             │
└─────────────────────────────────────────┘
```

**Features**:
- Full screen overlay
- Backdrop blur
- Interaction blocking
- Progress indicator
- Modal-style presentation

---

## 7. Inline Loading

### In Button
```
┌──────────────────────┐
│  ⟳  Processing...    │
└──────────────────────┘
```

### In Card
```
┌─────────────────────────────┐
│  ⟳  Loading trade data...   │
└─────────────────────────────┘
```

### In List Item
```
┌─────────────────────────────┐
│  Market Data            ⟳   │
├─────────────────────────────┤
│  Technical Indicators   ⟳   │
└─────────────────────────────┘
```

---

## 8. Refresh Button States

### Idle State
```
┌──────────────────────┐
│   ↻  Refresh Data    │
└──────────────────────┘
```

### Loading State (Requirement 16.2)
```
┌──────────────────────┐
│  ⟳  Verifying Data...│
│  (disabled, dimmed)  │
└──────────────────────┘
```

### With Timestamp
```
┌──────────────────────┐
│   ↻  Refresh Data    │
└──────────────────────┘
  Last Refreshed: 30s ago
```

---

## 9. Trade Signal Generation Flow

### Step 1: Initial
```
┌─────────────────────────────┐
│  Generate Trade Signal      │
└─────────────────────────────┘
```

### Step 2: Fetching Market Data
```
┌─────────────────────────────┐
│           ⟳                 │
│  Fetching market data...    │
│          14%                │
└─────────────────────────────┘
```

### Step 3: Analyzing Indicators
```
┌─────────────────────────────┐
│           ⟳                 │
│  Analyzing indicators...    │
│          42%                │
└─────────────────────────────┘
```

### Step 4: Generating AI Analysis
```
┌─────────────────────────────┐
│           ⟳                 │
│  Generating AI analysis...  │
│          85%                │
└─────────────────────────────┘
```

### Step 5: Complete
```
┌─────────────────────────────┐
│  ✓ Trade Signal Generated   │
└─────────────────────────────┘
```

---

## 10. Data Source Health Panel

### Loading State
```
┌─────────────────────────────┐
│  📊 Data Source Health      │
├─────────────────────────────┤
│                             │
│           ⟳                 │
│  Checking data sources...   │
│                             │
└─────────────────────────────┘
```

### Loaded State
```
┌─────────────────────────────┐
│  📊 Data Source Health      │
├─────────────────────────────┤
│  Overall Health: 95%        │
│  ████████████████████░░     │
│                             │
│  ✓ CoinGecko        82ms    │
│  ✓ CoinMarketCap   320ms    │
│  ✓ Kraken           89ms    │
│  ⚠ LunarCrush      726ms    │
│  ✗ CoinGlass       FAILED   │
└─────────────────────────────┘
```

---

## Color Scheme (Bitcoin Sovereign)

### Spinner
- **Color**: Bitcoin Orange (#F7931A)
- **Background**: Transparent
- **Border**: 2px solid

### Text
- **Primary**: White (#FFFFFF)
- **Secondary**: White 80% opacity
- **Tertiary**: White 60% opacity

### Progress Ring
- **Background**: Orange 20% opacity
- **Foreground**: Bitcoin Orange (#F7931A)
- **Width**: 8px

### Overlay
- **Background**: Black 90% opacity
- **Border**: 2px solid orange

---

## Animation Specifications

### Spin Animation
```css
animation: spin 1s linear infinite;

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Pulse Animation
```css
animation: pulse 2s ease-in-out infinite;

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Progress Animation
```css
transition: stroke-dasharray 300ms ease;
```

---

## Accessibility Indicators

### Screen Reader Text
```
[Spinner] aria-hidden="true"
[Container] aria-live="polite"
[Container] aria-busy="true"
[Text] "Verifying Data..."
```

### Keyboard Navigation
```
[Button] disabled={true}
[Overlay] pointer-events: none
[Focus] No focus trap
```

---

## Usage Decision Tree

```
Need loading state?
│
├─ In button?
│  └─ Use InlineLoading (sm)
│
├─ In card/section?
│  └─ Use LoadingSpinner (md/lg)
│
├─ Full page operation?
│  └─ Use LoadingOverlay (xl)
│
├─ Data refresh?
│  └─ Use VerifyingDataSpinner
│
├─ Signal generation?
│  └─ Use GeneratingSignalSpinner
│
├─ Market analysis?
│  └─ Use AnalyzingMarketSpinner
│
└─ Trade history?
   └─ Use LoadingHistorySpinner
```

---

## Component Selection Guide

| Scenario | Component | Size | Text |
|----------|-----------|------|------|
| Button loading | InlineLoading | sm | Custom |
| Card loading | LoadingSpinner | md | Custom |
| Section loading | LoadingSpinner | lg | Custom |
| Modal loading | LoadingSpinner | xl | Custom |
| Data refresh | VerifyingDataSpinner | lg | "Verifying Data..." |
| Signal generation | GeneratingSignalSpinner | xl | "Generating..." |
| Market analysis | AnalyzingMarketSpinner | lg | "Analyzing..." |
| History loading | LoadingHistorySpinner | md | "Loading..." |
| Full page | LoadingOverlay | xl | Custom |

---

## Common Patterns

### Pattern 1: Simple Loading
```tsx
{loading && <LoadingSpinner size="md" />}
```

### Pattern 2: Loading with Text
```tsx
{loading && (
  <LoadingSpinner
    size="lg"
    text="Loading data..."
  />
)}
```

### Pattern 3: Loading with Progress
```tsx
{loading && (
  <LoadingSpinner
    size="xl"
    text="Processing..."
    progress={progress}
  />
)}
```

### Pattern 4: Conditional Rendering
```tsx
{loading ? (
  <VerifyingDataSpinner />
) : (
  <DataDisplay />
)}
```

### Pattern 5: Button State
```tsx
<button disabled={loading}>
  {loading ? (
    <InlineLoading text="Processing..." />
  ) : (
    'Submit'
  )}
</button>
```

---

## Performance Tips

### DO ✅
- Use CSS animations (GPU accelerated)
- Minimize DOM elements
- Use appropriate sizes
- Show progress when possible
- Provide descriptive text

### DON'T ❌
- Use JavaScript animations
- Nest multiple spinners
- Use large spinners in small spaces
- Forget to disable interactions
- Use for instant operations

---

## Testing Checklist

- [ ] Spinner rotates smoothly (60fps)
- [ ] Text is readable on black background
- [ ] Progress updates correctly
- [ ] Pulse animation works
- [ ] Interactions are disabled
- [ ] Overlay blocks input
- [ ] Inline loading fits in buttons
- [ ] All sizes render correctly
- [ ] Preset states show proper text
- [ ] Accessibility attributes present

---

**Status**: ✅ Complete  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025  
**Requirements**: 15.5, 16.2
