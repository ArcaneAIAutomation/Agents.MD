# UCIE Caesar AI Integration - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Caesar API key configured in `.env.local`
- Next.js development server running

### Step 1: Verify Environment Variables

Check your `.env.local` file has the Caesar API key:

```bash
CAESAR_API_KEY=sk-your-api-key-here
```

### Step 2: Start Development Server

```bash
npm run dev
```

### Step 3: Test the API Endpoint

Open your browser or use curl:

```bash
# Test with Bitcoin
curl http://localhost:3000/api/ucie/research/BTC

# Test with Ethereum
curl http://localhost:3000/api/ucie/research/ETH
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "technologyOverview": "...",
    "teamLeadership": "...",
    "partnerships": "...",
    "marketPosition": "...",
    "riskFactors": ["..."],
    "recentDevelopments": "...",
    "sources": [...],
    "confidence": 85
  },
  "cached": false,
  "timestamp": "2025-01-27T..."
}
```

### Step 4: Use the Example Component

Create a test page at `pages/test-caesar.tsx`:

```tsx
import CaesarResearchExample from '../components/UCIE/CaesarResearchExample';

export default function TestCaesar() {
  return <CaesarResearchExample />;
}
```

Visit: http://localhost:3000/test-caesar

### Step 5: Integrate into Your Component

```tsx
import { useCaesarResearch } from '../hooks/useCaesarResearch';
import CaesarResearchPanel from '../components/UCIE/CaesarResearchPanel';

export default function MyAnalysisPage() {
  const { research, loading, error } = useCaesarResearch('BTC');

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-bitcoin-white mb-6">
        Bitcoin Analysis
      </h1>
      
      <CaesarResearchPanel
        symbol="BTC"
        research={research!}
        loading={loading}
        error={error}
      />
    </div>
  );
}
```

## 📚 Key Files

| File | Purpose |
|------|---------|
| `lib/ucie/caesarClient.ts` | Core Caesar AI utilities |
| `components/UCIE/CaesarResearchPanel.tsx` | Display component |
| `pages/api/ucie/research/[symbol].ts` | API endpoint |
| `hooks/useCaesarResearch.ts` | React hook |
| `components/UCIE/CaesarResearchExample.tsx` | Example usage |

## 🎯 Common Use Cases

### 1. Simple Research Display
```tsx
const { research, loading } = useCaesarResearch('BTC');

if (loading) return <div>Loading...</div>;

return <CaesarResearchPanel symbol="BTC" research={research!} />;
```

### 2. With Cache Indicator
```tsx
const { research, loading, cached, refetch } = useCaesarResearch('BTC');

return (
  <div>
    {cached && <button onClick={refetch}>Refresh</button>}
    <CaesarResearchPanel symbol="BTC" research={research!} loading={loading} />
  </div>
);
```

### 3. Manual Fetch
```tsx
const { research, loading, refetch } = useCaesarResearch(null, false);

return (
  <div>
    <button onClick={() => refetch()}>Fetch Research</button>
    {research && <CaesarResearchPanel symbol="BTC" research={research} />}
  </div>
);
```

### 4. Direct API Call
```tsx
async function fetchResearch(symbol: string) {
  const response = await fetch(`/api/ucie/research/${symbol}`);
  const data = await response.json();
  
  if (data.success) {
    console.log('Research:', data.data);
    console.log('Cached:', data.cached);
  }
}
```

## ⚙️ Configuration

### Adjust Compute Units
Edit `lib/ucie/caesarClient.ts`:

```typescript
// Default: 5 CU (5 minutes)
export async function createCryptoResearch(
  symbol: string,
  computeUnits: number = 5  // Change this
)
```

### Adjust Cache TTL
Edit `pages/api/ucie/research/[symbol].ts`:

```typescript
// Default: 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000;  // Change this
```

### Adjust Polling Timeout
Edit `lib/ucie/caesarClient.ts`:

```typescript
// Default: 10 minutes
export async function pollCaesarResearch(
  jobId: string,
  maxWaitTime: number = 600  // Change this (seconds)
)
```

## 🐛 Troubleshooting

### Issue: "CAESAR_API_KEY not found"
**Solution**: Add to `.env.local`:
```bash
CAESAR_API_KEY=sk-your-key-here
```

### Issue: Research takes too long
**Solution**: Reduce compute units:
```typescript
const research = await performCryptoResearch('BTC', 2); // 2 CU instead of 5
```

### Issue: Cache not working
**Solution**: Check symbol is uppercase:
```typescript
const symbol = 'btc'.toUpperCase(); // 'BTC'
```

### Issue: API timeout
**Solution**: Increase Vercel timeout (Pro plan) or use client-side polling

## 📊 Performance Tips

1. **Use Caching**: Results are cached for 24 hours
2. **Reduce CU**: Use 2-3 CU for faster results
3. **Batch Requests**: Plan to implement batch processing
4. **Monitor Logs**: Check Vercel function logs for issues

## 🔗 Next Steps

1. ✅ Test the API endpoint
2. ✅ Try the example component
3. ✅ Integrate into your analysis page
4. ⏳ Add to navigation menu
5. ⏳ Create user documentation
6. ⏳ Set up monitoring

## 📖 Full Documentation

- [Complete Implementation Guide](./UCIE-CAESAR-INTEGRATION-COMPLETE.md)
- [Component README](./components/UCIE/README.md)
- [Caesar API Reference](./.kiro/steering/caesar-api-reference.md)
- [UCIE Design Document](./.kiro/specs/universal-crypto-intelligence/design.md)

## 💡 Tips

- Start with the example component to understand the flow
- Use the React hook for automatic data management
- Check browser console for detailed logs
- Monitor Vercel function logs for API issues
- Test with multiple tokens to verify caching

---

**Ready to go!** 🎉

Start with: `npm run dev` and visit `/test-caesar`
