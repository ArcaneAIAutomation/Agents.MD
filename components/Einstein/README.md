# Einstein Trade Engine Components

This directory contains components for the Einstein 100000x Trade Generation Engine.

## Components

### EinsteinGenerateButton

A Bitcoin Sovereign styled button for triggering Einstein trade signal generation.

**Features:**
- Solid orange background with black text (primary action)
- Loading state with animated spinner
- Disabled state during generation
- Hover effects with orange glow
- Minimum 48px touch target for accessibility
- Full keyboard navigation support

**Props:**

```typescript
interface EinsteinGenerateButtonProps {
  onClick: () => void;      // Handler for button click
  loading?: boolean;         // Show loading state with spinner
  disabled?: boolean;        // Disable button interaction
  className?: string;        // Additional CSS classes
}
```

**Usage Example:**

```tsx
import EinsteinGenerateButton from './components/Einstein/EinsteinGenerateButton';

function TradingDashboard() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSignal = async () => {
    setIsGenerating(true);
    try {
      // Call Einstein Engine API
      const signal = await generateTradeSignal('BTC', '1h');
      // Show analysis modal
      showAnalysisModal(signal);
    } catch (error) {
      console.error('Failed to generate signal:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <h1>Einstein Trade Engine</h1>
      <EinsteinGenerateButton 
        onClick={handleGenerateSignal}
        loading={isGenerating}
      />
    </div>
  );
}
```

**Styling:**

The button follows the Bitcoin Sovereign design system:
- **Default State**: Orange background, black text, orange border
- **Hover State**: Black background, orange text, orange glow
- **Active State**: Slight scale down (0.95)
- **Disabled State**: 50% opacity, no pointer events
- **Focus State**: Orange outline with glow for accessibility

**Accessibility:**

- Proper ARIA labels for screen readers
- `aria-busy` attribute during loading
- Keyboard navigation support
- Minimum 48px touch target
- Focus visible outline

### EinsteinAnalysisModal

A comprehensive modal for displaying Einstein trade analysis with multi-panel layout.

**Status:** ✅ Complete (Tasks 30-35)

**Features:**
- Technical analysis panel
- Sentiment analysis panel (✅ Task 32 Complete)
- On-chain analysis panel
- Risk analysis panel
- Action buttons (Approve, Reject, Modify)

### RefreshButton

A real-time data refresh button with visual feedback and change detection.

**Status:** ✅ Complete (Task 62)

**Features:**
- Re-fetch ALL data from all 13+ APIs (Requirement 16.1)
- Loading spinner during refresh (Requirement 16.2)
- Highlight changed data with orange glow (Requirement 16.3)
- Detect price targets hit (Requirement 16.4)
- Display "Last Refreshed: X seconds ago" (Requirement 16.5)
- Compact and full versions
- Data quality scoring
- API health monitoring

**Props:**

```typescript
interface RefreshButtonProps {
  symbol: string;                                    // Trading symbol (e.g., 'BTC')
  timeframe?: '15m' | '1h' | '4h' | '1d';           // Timeframe for refresh
  onRefreshComplete?: (result: RefreshResult) => void; // Success callback
  onRefreshError?: (error: Error) => void;          // Error callback
  className?: string;                                // Additional CSS classes
  compact?: boolean;                                 // Show icon only
}
```

**Usage Example:**

```tsx
import { RefreshButton } from './components/Einstein/RefreshButton';

function TradeSignalCard() {
  const [dataQuality, setDataQuality] = useState(95);
  const [changedFields, setChangedFields] = useState<string[]>([]);

  const handleRefreshComplete = (result) => {
    // Update data quality
    setDataQuality(result.dataQuality.overall);
    
    // Highlight changed fields
    if (result.changes.priceChanged) {
      setChangedFields(['price']);
      setTimeout(() => setChangedFields([]), 3000);
    }
  };

  return (
    <div>
      <RefreshButton
        symbol="BTC"
        timeframe="1h"
        onRefreshComplete={handleRefreshComplete}
        compact
      />
      
      <div className={changedFields.includes('price') 
        ? 'shadow-[0_0_20px_rgba(247,147,26,0.3)]' 
        : ''}>
        <p>Price: ${price}</p>
      </div>
    </div>
  );
}
```

**Documentation:**
- Full documentation: `RefreshButton.README.md`
- Usage examples: `RefreshButton.example.tsx`
- API endpoint: `POST /api/einstein/refresh-data`

---

## Requirements

These components implement the following requirements from the Einstein Trade Engine spec:

- **Requirement 5.1**: User Approval Workflow - Generate button triggers trade signal generation
- **Requirement 6.1**: Comprehensive Visualization - Modal displays all analysis dimensions
- **Requirement 6.2-6.5**: Analysis Panels - Technical, sentiment, on-chain, and risk displays

---

## Testing

Unit tests are located in `__tests__/components/Einstein/`

Run tests:
```bash
npm test -- __tests__/components/Einstein/
```

---

**Last Updated:** January 27, 2025  
**Status:** ✅ Task 37 Complete
