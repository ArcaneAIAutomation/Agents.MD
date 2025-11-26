# Einstein RefreshButton Component

## Overview

The `RefreshButton` component provides real-time data refresh functionality for the Einstein Trade Engine. It implements all requirements from Requirement 16 (Refresh Button Functionality) and integrates with the Data Accuracy Verifier module.

## Features

✅ **Requirement 16.1**: Re-fetch ALL data from all 13+ APIs  
✅ **Requirement 16.2**: Disable button and show loading spinner during refresh  
✅ **Requirement 16.3**: Update all displayed values and highlight changes  
✅ **Requirement 16.4**: Detect price targets hit and display notifications  
✅ **Requirement 16.5**: Display "Last Refreshed: X seconds ago" timestamp  

## Installation

The component is already integrated into the Einstein module structure:

```
components/Einstein/
├── RefreshButton.tsx           # Main component
├── RefreshButton.example.tsx   # Usage examples
└── RefreshButton.README.md     # This file
```

## Basic Usage

### Compact Version (Icon Only)

```tsx
import { RefreshButton } from '@/components/Einstein/RefreshButton';

<RefreshButton
  symbol="BTC"
  timeframe="1h"
  compact
/>
```

### Full Version (Button with Text)

```tsx
import { RefreshButton } from '@/components/Einstein/RefreshButton';

<RefreshButton
  symbol="BTC"
  timeframe="4h"
  onRefreshComplete={(result) => {
    console.log('Refresh complete:', result);
  }}
  onRefreshError={(error) => {
    console.error('Refresh failed:', error);
  }}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `symbol` | `string` | Yes | - | Trading symbol (e.g., 'BTC', 'ETH') |
| `timeframe` | `'15m' \| '1h' \| '4h' \| '1d'` | No | `'1h'` | Timeframe for data refresh |
| `onRefreshComplete` | `(result: RefreshResult) => void` | No | - | Callback when refresh succeeds |
| `onRefreshError` | `(error: Error) => void` | No | - | Callback when refresh fails |
| `className` | `string` | No | `''` | Additional CSS classes |
| `compact` | `boolean` | No | `false` | Show compact version (icon only) |

## RefreshResult Interface

```typescript
interface RefreshResult {
  success: boolean;
  dataQuality: {
    overall: number;        // 0-100
    market: number;         // 0-100
    sentiment: number;      // 0-100
    onChain: number;        // 0-100
    technical: number;      // 0-100
    sources: {
      successful: string[]; // List of successful APIs
      failed: string[];     // List of failed APIs
    };
  };
  changes: {
    priceChanged: boolean;
    priceDelta: number;
    indicatorsChanged: string[];
    sentimentChanged: boolean;
    onChainChanged: boolean;
    significantChanges: boolean;
  };
  timestamp: string;        // ISO 8601 timestamp
  duration: number;         // Milliseconds
}
```

## Advanced Usage

### 1. Highlight Changed Data (Requirement 16.3)

```tsx
const [changedFields, setChangedFields] = useState<string[]>([]);

const handleRefreshComplete = (result: RefreshResult) => {
  if (result.changes.priceChanged) {
    setChangedFields(['price']);
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      setChangedFields([]);
    }, 3000);
  }
};

return (
  <div>
    <RefreshButton
      symbol="BTC"
      onRefreshComplete={handleRefreshComplete}
    />
    
    <div className={
      changedFields.includes('price')
        ? 'shadow-[0_0_20px_rgba(247,147,26,0.3)]' // Orange glow
        : ''
    }>
      <p>Price: ${price}</p>
    </div>
  </div>
);
```

### 2. Target Hit Detection (Requirement 16.4)

```tsx
const handleRefreshComplete = (result: RefreshResult) => {
  const currentPrice = getCurrentPrice(); // Your price logic
  const tp1 = trade.takeProfits.tp1.price;
  
  if (currentPrice >= tp1) {
    alert('🎯 TP1 target hit! Consider updating trade status.');
  }
};

<RefreshButton
  symbol="BTC"
  onRefreshComplete={handleRefreshComplete}
/>
```

### 3. Display Data Quality

```tsx
const [dataQuality, setDataQuality] = useState(0);

const handleRefreshComplete = (result: RefreshResult) => {
  setDataQuality(result.dataQuality.overall);
};

return (
  <div>
    <RefreshButton
      symbol="BTC"
      onRefreshComplete={handleRefreshComplete}
    />
    
    <span className={`
      ${dataQuality >= 90 ? 'text-green-500' : 
        dataQuality >= 70 ? 'text-orange-500' : 
        'text-red-500'}
    `}>
      {dataQuality}% Data Quality
    </span>
  </div>
);
```

### 4. Show Successful/Failed Sources

```tsx
const [sources, setSources] = useState({ successful: [], failed: [] });

const handleRefreshComplete = (result: RefreshResult) => {
  setSources(result.dataQuality.sources);
};

return (
  <div>
    <RefreshButton
      symbol="BTC"
      onRefreshComplete={handleRefreshComplete}
    />
    
    <div>
      <h4>Successful Sources:</h4>
      {sources.successful.map(source => (
        <span key={source} className="text-green-500">
          ✓ {source}
        </span>
      ))}
      
      <h4>Failed Sources:</h4>
      {sources.failed.map(source => (
        <span key={source} className="text-red-500">
          ✗ {source}
        </span>
      ))}
    </div>
  </div>
);
```

## API Endpoint

The RefreshButton calls the following API endpoint:

```
POST /api/einstein/refresh-data
```

**Request Body:**
```json
{
  "symbol": "BTC",
  "timeframe": "1h"
}
```

**Response:**
```json
{
  "success": true,
  "dataQuality": {
    "overall": 95,
    "market": 100,
    "sentiment": 90,
    "onChain": 95,
    "technical": 95,
    "sources": {
      "successful": ["CoinGecko", "CoinMarketCap", "Kraken", ...],
      "failed": []
    }
  },
  "changes": {
    "priceChanged": true,
    "priceDelta": 150.50,
    "indicatorsChanged": ["RSI", "MACD"],
    "sentimentChanged": false,
    "onChainChanged": true,
    "significantChanges": true
  },
  "timestamp": "2025-01-27T12:00:00.000Z",
  "duration": 8500
}
```

## Styling

The component uses Bitcoin Sovereign Technology design system:

- **Colors**: Black (#000000), Orange (#F7931A), White (#FFFFFF)
- **Border**: 2px solid orange
- **Hover**: Orange background with black text
- **Loading**: Pulsing orange spinner
- **Disabled**: 50% opacity, no pointer events

### Custom Styling

```tsx
<RefreshButton
  symbol="BTC"
  className="my-custom-class"
/>
```

## Accessibility

- ✅ Minimum 48px touch target
- ✅ Disabled state with `disabled` attribute
- ✅ ARIA labels (`aria-label="Refresh data"`)
- ✅ Keyboard accessible
- ✅ Screen reader friendly

## Performance

- **Refresh Duration**: Typically 5-10 seconds
- **API Timeout**: 30 seconds maximum
- **Debouncing**: Prevents multiple simultaneous refreshes
- **Optimized**: Uses Promise.race for timeout handling

## Error Handling

The component handles errors gracefully:

1. **Network Errors**: Displays error message below button
2. **API Failures**: Calls `onRefreshError` callback
3. **Timeout**: Returns partial results after 30 seconds
4. **Invalid Input**: Validates symbol and timeframe

## Testing

### Manual Testing

1. Click refresh button
2. Verify loading spinner appears
3. Verify button is disabled during refresh
4. Verify timestamp updates after refresh
5. Verify changes are highlighted with orange glow

### Integration Testing

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react';
import { RefreshButton } from './RefreshButton';

test('refreshes data on click', async () => {
  const onRefreshComplete = jest.fn();
  
  const { getByRole } = render(
    <RefreshButton
      symbol="BTC"
      onRefreshComplete={onRefreshComplete}
    />
  );
  
  const button = getByRole('button');
  fireEvent.click(button);
  
  await waitFor(() => {
    expect(onRefreshComplete).toHaveBeenCalled();
  });
});
```

## Examples

See `RefreshButton.example.tsx` for complete usage examples:

1. **Trade Signal Card**: Compact refresh button with data quality badge
2. **Analysis Modal**: Full refresh button with detailed results
3. **Trade History**: Individual refresh buttons for each trade
4. **Target Hit Detection**: Automatic notifications when targets are hit

## Integration with Einstein Components

### EinsteinAnalysisModal

```tsx
import { RefreshButton } from './RefreshButton';

<EinsteinAnalysisModal>
  <RefreshButton
    symbol={signal.symbol}
    timeframe={signal.timeframe}
    onRefreshComplete={handleRefresh}
  />
</EinsteinAnalysisModal>
```

### EinsteinTradeHistory

```tsx
import { RefreshButton } from './RefreshButton';

<EinsteinTradeHistory>
  {trades.map(trade => (
    <div key={trade.id}>
      <RefreshButton
        symbol={trade.symbol}
        compact
      />
    </div>
  ))}
</EinsteinTradeHistory>
```

### EinsteinDashboard

```tsx
import { RefreshButton } from './RefreshButton';

<EinsteinDashboard>
  <RefreshButton
    symbol="BTC"
    timeframe="1h"
    className="mb-4"
  />
</EinsteinDashboard>
```

## Troubleshooting

### Button Not Refreshing

1. Check API endpoint is accessible: `POST /api/einstein/refresh-data`
2. Verify environment variables are set (API keys)
3. Check browser console for errors
4. Verify symbol is valid (e.g., 'BTC', 'ETH')

### Slow Refresh

1. Check network connection
2. Verify all 13+ APIs are responding
3. Check API rate limits
4. Consider increasing timeout (default: 30s)

### Changes Not Highlighted

1. Verify `onRefreshComplete` callback is implemented
2. Check that changed fields are tracked in state
3. Ensure orange glow CSS is applied
4. Verify timeout for removing highlight (default: 3s)

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Configurable refresh intervals (auto-refresh)
- [ ] Refresh history/log
- [ ] Batch refresh for multiple symbols
- [ ] Progressive refresh (show partial results)

## Support

For issues or questions:
1. Check this README
2. Review `RefreshButton.example.tsx`
3. Check Einstein spec: `.kiro/specs/einstein-trade-engine/`
4. Review requirements: Requirement 16 (Refresh Button Functionality)

---

**Status**: ✅ Complete  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025  
**Requirements**: 16.1, 16.2, 16.3, 16.4, 16.5
