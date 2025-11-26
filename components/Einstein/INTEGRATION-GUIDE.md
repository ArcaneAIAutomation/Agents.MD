# Einstein Button Click Handler - Integration Guide

## Quick Start

### Option 1: Use the Complete Dashboard (Recommended)

```tsx
import EinsteinDashboard from './components/Einstein/EinsteinDashboard';

function MyPage() {
  return (
    <EinsteinDashboard 
      symbol="BTC"
      timeframe="1h"
    />
  );
}
```

This gives you:
- ✅ Button with click handler
- ✅ Loading states
- ✅ Error handling
- ✅ Modal integration
- ✅ Approval workflow

---

### Option 2: Custom Integration with Hook

```tsx
import EinsteinGenerateButton from './components/Einstein/EinsteinGenerateButton';
import EinsteinAnalysisModal from './components/Einstein/EinsteinAnalysisModal';
import { useEinsteinGeneration } from './hooks/useEinsteinGeneration';

function MyCustomComponent() {
  const {
    isGenerating,
    error,
    signal,
    analysis,
    isModalOpen,
    generateSignal,
    closeModal,
    clearError,
  } = useEinsteinGeneration();

  return (
    <div>
      {/* Button */}
      <EinsteinGenerateButton
        onClick={() => generateSignal('BTC', '1h')}
        loading={isGenerating}
      />

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}

      {/* Modal */}
      <EinsteinAnalysisModal
        isOpen={isModalOpen}
        onClose={closeModal}
        signal={signal}
        analysis={analysis}
        onApprove={() => {
          console.log('Approved!');
          closeModal();
        }}
        onReject={() => {
          console.log('Rejected!');
          closeModal();
        }}
        onModify={() => {
          console.log('Modify!');
        }}
      />
    </div>
  );
}
```

---

### Option 3: Just the Button (Minimal)

```tsx
import EinsteinGenerateButton from './components/Einstein/EinsteinGenerateButton';
import { useState } from 'react';

function MinimalExample() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // Your custom logic here
      await myCustomGenerationLogic();
    } finally {
      setLoading(false);
    }
  };

  return (
    <EinsteinGenerateButton
      onClick={handleClick}
      loading={loading}
    />
  );
}
```

---

## Hook API Reference

### `useEinsteinGeneration()`

Returns an object with:

#### State
- `isGenerating: boolean` - Is signal being generated?
- `error: string | null` - Error message if failed
- `signal: TradeSignal | null` - Generated signal data
- `analysis: ComprehensiveAnalysis | null` - Analysis data
- `isModalOpen: boolean` - Is modal open?

#### Actions
- `generateSignal(symbol: string, timeframe: string): Promise<void>` - Trigger generation
- `closeModal(): void` - Close the analysis modal
- `clearError(): void` - Clear error message

---

## Button Props

```typescript
interface EinsteinGenerateButtonProps {
  onClick: () => void;      // Click handler
  loading?: boolean;         // Show loading state
  disabled?: boolean;        // Disable button
  className?: string;        // Custom styling
}
```

---

## Modal Props

```typescript
interface EinsteinAnalysisModalProps {
  isOpen: boolean;                          // Show/hide modal
  onClose: () => void;                      // Close handler
  signal: TradeSignal | null;               // Signal data
  analysis: ComprehensiveAnalysis | null;   // Analysis data
  onApprove?: () => void;                   // Approve handler
  onReject?: () => void;                    // Reject handler
  onModify?: () => void;                    // Modify handler
}
```

---

## Error Handling

The hook automatically handles errors. You can display them like this:

```tsx
const { error, clearError } = useEinsteinGeneration();

{error && (
  <div className="bg-red-500 bg-opacity-10 border-2 border-red-500 rounded-lg p-4">
    <p className="text-red-500 font-bold">Error</p>
    <p className="text-bitcoin-white-80">{error}</p>
    <button onClick={clearError}>Dismiss</button>
  </div>
)}
```

---

## Loading States

The hook manages loading state automatically:

```tsx
const { isGenerating } = useEinsteinGeneration();

{isGenerating && (
  <div className="loading-message">
    🧠 Einstein Engine is analyzing market conditions...
  </div>
)}
```

---

## Preventing Multiple Clicks

The hook automatically prevents multiple simultaneous generations:

```typescript
// Inside useEinsteinGeneration hook:
if (isGenerating) {
  console.warn('⚠️ Signal generation already in progress');
  return;
}
```

You don't need to handle this manually!

---

## Styling

All components use Bitcoin Sovereign styling:
- Black background (`#000000`)
- Orange accents (`#F7931A`)
- White text with opacity variants

The button automatically includes:
- Hover effects (color inversion + glow)
- Loading state (spinner + disabled)
- Focus states (orange outline)
- Accessibility (ARIA labels, 48px touch target)

---

## Accessibility

All components are accessible:
- ✅ Proper ARIA labels
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Screen reader support
- ✅ Minimum 48px touch targets

---

## Common Patterns

### Pattern 1: Add to Existing Dashboard

```tsx
import EinsteinDashboard from './components/Einstein/EinsteinDashboard';

function TradingDashboard() {
  return (
    <div className="dashboard">
      {/* Existing content */}
      <div className="existing-charts">...</div>
      
      {/* Add Einstein section */}
      <EinsteinDashboard symbol="BTC" timeframe="1h" />
    </div>
  );
}
```

### Pattern 2: Multiple Symbols

```tsx
function MultiSymbolDashboard() {
  const symbols = ['BTC', 'ETH', 'SOL'];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {symbols.map(symbol => (
        <EinsteinDashboard 
          key={symbol}
          symbol={symbol}
          timeframe="1h"
        />
      ))}
    </div>
  );
}
```

### Pattern 3: Custom Symbol Selector

```tsx
function CustomDashboard() {
  const [symbol, setSymbol] = useState('BTC');
  const [timeframe, setTimeframe] = useState('1h');

  return (
    <div>
      <select value={symbol} onChange={e => setSymbol(e.target.value)}>
        <option value="BTC">Bitcoin</option>
        <option value="ETH">Ethereum</option>
      </select>
      
      <select value={timeframe} onChange={e => setTimeframe(e.target.value)}>
        <option value="15m">15 minutes</option>
        <option value="1h">1 hour</option>
        <option value="4h">4 hours</option>
        <option value="1d">1 day</option>
      </select>

      <EinsteinDashboard symbol={symbol} timeframe={timeframe} />
    </div>
  );
}
```

---

## Troubleshooting

### Button doesn't respond to clicks
- Check that `onClick` prop is provided
- Check that button is not `disabled`
- Check console for errors

### Loading state doesn't show
- Check that `loading` prop is set to `true`
- Check that `isGenerating` state is being updated

### Modal doesn't open
- Check that `isModalOpen` is `true`
- Check that `signal` and `analysis` are not `null`
- Check that modal component is rendered

### Error: "Coordinator not yet implemented"
- This is expected! Task 40 needs to be completed first
- The click handler is ready and waiting for the coordinator

---

## Next Steps

1. **Task 40**: Implement Einstein Engine Coordinator
2. **Task 26**: Implement Approval Workflow Manager
3. **Task 53**: Add button to ATGE dashboard
4. **Task 54**: Add trade history section

---

## Support

For questions or issues:
1. Check this integration guide
2. Review `EINSTEIN-TASK-38-COMPLETE.md`
3. Check component README files
4. Review task documentation in `.kiro/specs/einstein-trade-engine/`

---

**Last Updated**: January 27, 2025  
**Status**: ✅ Ready for Integration  
**Dependencies**: Task 40 (Coordinator), Task 26 (Approval Workflow)

