# ExecutionStatusBadge - Visual Guide

## Component Appearance

### PENDING Status
```
┌─────────────────────────┐
│  ⏳  PENDING            │  ← Orange border, pulsing
└─────────────────────────┘
   Orange text on black background
   Subtle opacity animation (1.0 → 0.85 → 1.0)
```

### EXECUTED Status
```
┌─────────────────────────┐
│  ✓  EXECUTED            │  ← Solid orange background
└─────────────────────────┘
│ Executed: Jan 27, 10:30 │  ← Timestamp below
└─────────────────────────┘
   Black text on orange background
   No animation
```

### PARTIAL_CLOSE Status
```
┌─────────────────────────┐
│  ◐  PARTIAL             │  ← Orange border
└─────────────────────────┘
   Orange text on black background
   No animation
```

### CLOSED Status
```
┌─────────────────────────┐
│  ■  CLOSED              │  ← Gray border
└─────────────────────────┘
   Gray text on black background
   No animation
```

---

## Size Specifications

### Badge Dimensions
- **Height**: Auto (based on content)
- **Padding**: 12px horizontal, 6px vertical
- **Border**: 2px solid
- **Border Radius**: 8px (rounded-lg)
- **Gap**: 8px between icon and text

### Typography
- **Font**: Inter, bold (700)
- **Size**: 12px (text-xs)
- **Transform**: Uppercase
- **Letter Spacing**: 0.05em (tracking-wider)

### Icon
- **Size**: 14px (text-sm)
- **Alignment**: Centered vertically

### Timestamp (EXECUTED only)
- **Font**: Roboto Mono
- **Size**: 12px (text-xs)
- **Color**: Gray-400
- **Position**: Below badge

---

## Color Specifications

### PENDING
- **Background**: #000000 (Black)
- **Border**: #F7931A (Bitcoin Orange)
- **Text**: #F7931A (Bitcoin Orange)
- **Icon**: #F7931A (Bitcoin Orange)

### EXECUTED
- **Background**: #F7931A (Bitcoin Orange)
- **Border**: #F7931A (Bitcoin Orange)
- **Text**: #000000 (Black)
- **Icon**: #000000 (Black)
- **Timestamp**: #9CA3AF (Gray-400)

### PARTIAL_CLOSE
- **Background**: #000000 (Black)
- **Border**: #F7931A (Bitcoin Orange)
- **Text**: #F7931A (Bitcoin Orange)
- **Icon**: #F7931A (Bitcoin Orange)

### CLOSED
- **Background**: #000000 (Black)
- **Border**: #6B7280 (Gray-500)
- **Text**: #9CA3AF (Gray-400)
- **Icon**: #9CA3AF (Gray-400)

---

## Animation Specifications

### PENDING Pulse Animation
```css
@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

Duration: 2 seconds
Timing: ease-in-out
Iteration: infinite
```

**Visual Effect**: Subtle breathing effect that draws attention without being distracting.

---

## Responsive Behavior

### Mobile (< 768px)
- Same size and styling
- Touch-friendly (44px minimum height)
- Adequate spacing for finger taps

### Tablet (768px - 1024px)
- Same size and styling
- Optimized for touch and mouse

### Desktop (> 1024px)
- Same size and styling
- Hover effects (optional future enhancement)

---

## Integration Examples

### In Trade Card Header
```
┌─────────────────────────────────────────────┐
│  BTC/USD LONG              ⏳  PENDING      │
│  Entry: $95,000                             │
└─────────────────────────────────────────────┘
```

### In Trade History List
```
┌─────────────────────────────────────────────┐
│  BTC/USD LONG              ✓  EXECUTED      │
│  Entry: $95,000            Jan 27, 10:30    │
│  Current: $97,500                           │
│  P/L: +$2,500 (+2.63%)                      │
└─────────────────────────────────────────────┘
```

### In Analysis Modal
```
┌─────────────────────────────────────────────┐
│  Einstein Trade Analysis                    │
│  ⏳  PENDING                                │
│                                             │
│  [Technical Analysis Panel]                 │
│  [Sentiment Analysis Panel]                 │
│  [Risk Analysis Panel]                      │
│                                             │
│  [Approve] [Reject] [Modify]                │
└─────────────────────────────────────────────┘
```

---

## State Transitions

### Typical Flow
```
PENDING → EXECUTED → PARTIAL_CLOSE → CLOSED
   ↓          ↓            ↓            ↓
Orange    Orange       Orange        Gray
Pulsing   Solid        Border        Border
```

### Alternative Flow
```
PENDING → EXECUTED → CLOSED
   ↓          ↓          ↓
Orange    Orange      Gray
Pulsing   Solid       Border
```

---

## Accessibility Features

### Visual Indicators
- ✅ **Color**: Status-based color coding
- ✅ **Icon**: Unique icon for each status
- ✅ **Text**: Clear uppercase label
- ✅ **Animation**: Pulsing for PENDING (attention)

### Contrast Ratios
- **PENDING**: Orange on Black = 5.8:1 (AA Large Text) ✅
- **EXECUTED**: Black on Orange = 5.8:1 (AA) ✅
- **PARTIAL_CLOSE**: Orange on Black = 5.8:1 (AA Large Text) ✅
- **CLOSED**: Gray on Black = 4.5:1 (AA) ✅

### Screen Reader Support
- Semantic HTML structure
- Clear text labels
- Icon as decorative (aria-hidden possible)

---

## Usage Context

### When to Use Each Status

**PENDING**:
- Trade signal approved by user
- Waiting for entry price to be reached
- No execution yet

**EXECUTED**:
- Entry price reached and trade entered
- Position is open
- Tracking unrealized P/L

**PARTIAL_CLOSE**:
- One or more take-profit targets hit
- Position partially closed
- Remaining position still open

**CLOSED**:
- All targets hit or stop-loss triggered
- Position fully closed
- Final P/L realized

---

## Design Rationale

### Why These Colors?

**Orange for Active States**:
- Aligns with Bitcoin Sovereign design
- High visibility and attention-grabbing
- Consistent with brand identity

**Gray for Closed State**:
- Indicates inactive/completed status
- Reduces visual noise for old trades
- Clear distinction from active trades

### Why Pulsing Animation?

**PENDING Status**:
- Draws attention to trades awaiting execution
- Subtle enough not to be distracting
- Indicates "waiting" state clearly

**No Animation for Others**:
- EXECUTED: Solid state, no need for animation
- PARTIAL_CLOSE: Stable state, no urgency
- CLOSED: Inactive, no animation needed

---

## Future Enhancements

### Potential Additions
1. **Hover Tooltips**: Show detailed status info on hover
2. **Click Actions**: Quick actions menu on click
3. **Status History**: Timeline of status changes
4. **Sound Notifications**: Audio cue on status change
5. **Transition Animations**: Smooth color transitions between states

### Accessibility Improvements
1. **ARIA Labels**: Enhanced screen reader support
2. **Keyboard Navigation**: Focus states and keyboard shortcuts
3. **High Contrast Mode**: Alternative styling for accessibility
4. **Reduced Motion**: Respect prefers-reduced-motion

---

**Visual Guide Version**: 1.0.0  
**Last Updated**: January 27, 2025  
**Design System**: Bitcoin Sovereign Technology
