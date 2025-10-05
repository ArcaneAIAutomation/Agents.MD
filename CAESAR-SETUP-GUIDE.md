# Caesar API Setup Guide - AgentMDC Branch

## Quick Start

The AgentMDC branch is now fully configured to use Caesar API exclusively. Follow these steps to get started:

### 1. Verify Environment Configuration

Your `.env.local` file should already have:

```bash
# Caesar API Configuration
CAESAR_API_KEY=sk-572d19cd4d21.0XRZ1wLU0Vwnr6TpYkw3L2sWNgcsvzpXVuhVMN93HII
NEXT_PUBLIC_CAESAR_API_KEY=sk-572d19cd4d21.0XRZ1wLU0Vwnr6TpYkw3L2sWNgcsvzpXVuhVMN93HII
USE_CAESAR_API_ONLY=true
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### 4. Test Caesar API Integration

#### Test API Health
```bash
curl http://localhost:3000/api/caesar-health
```

Expected response:
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "latency": 150,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Test Market Data
```bash
curl http://localhost:3000/api/caesar-market-data?symbol=BTC
```

#### Test Trade Signals
```bash
curl http://localhost:3000/api/caesar-trade-signals?symbol=BTC
```

#### Test News Feed
```bash
curl http://localhost:3000/api/caesar-news?symbols=BTC,ETH&limit=10
```

### 5. Use Caesar Dashboard Component

Add to any page:

```typescript
import CaesarDashboard from '../components/CaesarDashboard';

export default function Page() {
  return (
    <div>
      <CaesarDashboard symbol="BTC" />
    </div>
  );
}
```

## Available Components

### CaesarDashboard
Full-featured dashboard with:
- Real-time market data
- Technical analysis indicators
- AI trade signals
- News feed with sentiment
- API health monitoring

```typescript
<CaesarDashboard symbol="BTC" />
```

## Available Hooks

### useCaesarMarketData
```typescript
const { data, loading, error, refetch } = useCaesarMarketData({
  symbol: 'BTC',
  refreshInterval: 30000, // 30 seconds
  enabled: true
});
```

### useCaesarTradeSignals
```typescript
const { data: signals, loading, error } = useCaesarTradeSignals({
  symbol: 'BTC',
  refreshInterval: 60000 // 1 minute
});
```

### useCaesarNews
```typescript
const { data: news, loading, error } = useCaesarNews(
  ['BTC', 'ETH'], // symbols
  15,             // limit
  300000          // refresh interval (5 minutes)
);
```

### useCaesarHealth
```typescript
const { health, loading } = useCaesarHealth(60000); // check every minute
```

## API Client Functions

Direct API calls without hooks:

```typescript
import {
  getCaesarMarketData,
  getCaesarTechnicalAnalysis,
  getCaesarTradeSignals,
  getCaesarNews,
  getCaesarHistoricalData,
  getCaesarOrderBook,
  caesarHealthCheck
} from '../utils/caesarApi';

// Example usage
async function fetchData() {
  try {
    const marketData = await getCaesarMarketData('BTC');
    const analysis = await getCaesarTechnicalAnalysis('BTC', '1h');
    const signals = await getCaesarTradeSignals('BTC');
    const news = await getCaesarNews(['BTC', 'ETH'], 15);
    
    console.log({ marketData, analysis, signals, news });
  } catch (error) {
    console.error('Caesar API error:', error);
  }
}
```

## Troubleshooting

### API Key Issues
If you get authentication errors:
1. Verify `CAESAR_API_KEY` is set in `.env.local`
2. Restart the development server
3. Check the API key is valid at https://docs.caesar.xyz

### Network Timeouts
Default timeout is 15 seconds. For slower connections:
```typescript
// Increase timeout in caesarApi.ts
const response = await caesarRequest('/endpoint', { timeout: 30000 });
```

### CORS Issues
If running into CORS errors, ensure you're making requests through Next.js API routes (`/api/*`) rather than directly to Caesar API from the browser.

### Rate Limiting
Caesar API may have rate limits. The integration includes:
- Automatic retry with exponential backoff
- Request queuing to prevent spam
- Caching to reduce API calls

## Development Workflow

### Making Changes
1. Always verify you're on AgentMDC branch: `git branch --show-current`
2. Make your changes
3. Test locally with `npm run dev`
4. Commit: `git commit -m "Description"`
5. Push: `git push origin AgentMDC`

### Never Merge to Main
This branch is for Caesar API testing only. Never merge to main without explicit permission.

## Next Steps

1. **Test the integration**: Run the development server and test all endpoints
2. **Customize components**: Modify `CaesarDashboard.tsx` for your needs
3. **Add features**: Build new components using Caesar API hooks
4. **Monitor performance**: Use `/api/caesar-health` for monitoring
5. **Review documentation**: Check `CAESAR-API-INTEGRATION.md` for details

## Support

- **Caesar API Docs**: https://docs.caesar.xyz/get-started/introduction
- **Integration Guide**: See `CAESAR-API-INTEGRATION.md`
- **API Client**: See `utils/caesarApi.ts`
- **Example Component**: See `components/CaesarDashboard.tsx`

## Production Deployment

When ready to deploy:

1. Add environment variables to Vercel:
   ```
   CAESAR_API_KEY=sk-572d19cd4d21.0XRZ1wLU0Vwnr6TpYkw3L2sWNgcsvzpXVuhVMN93HII
   NEXT_PUBLIC_CAESAR_API_KEY=sk-572d19cd4d21.0XRZ1wLU0Vwnr6TpYkw3L2sWNgcsvzpXVuhVMN93HII
   USE_CAESAR_API_ONLY=true
   ```

2. Deploy from AgentMDC branch:
   ```bash
   vercel --prod
   ```

3. Test production endpoints:
   ```bash
   curl https://your-domain.vercel.app/api/caesar-health
   ```

## Important Notes

- ✅ AgentMDC branch uses Caesar API exclusively
- ✅ All API calls go through Next.js API routes for security
- ✅ Mobile-optimized with proper timeout handling
- ✅ Comprehensive error handling and fallbacks
- ✅ Real-time updates with configurable refresh intervals
- ⚠️ Never merge to main without permission
- ⚠️ Keep API keys secure and never commit them to git
