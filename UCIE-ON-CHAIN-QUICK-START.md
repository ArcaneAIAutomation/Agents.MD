# UCIE On-Chain Analytics - Quick Start Guide

## Setup (5 minutes)

### 1. Get API Keys
```bash
# Etherscan (for Ethereum tokens)
https://etherscan.io/myapikey

# BSCScan (for BSC tokens)
https://bscscan.com/myapikey

# Polygonscan (for Polygon tokens)
https://polygonscan.com/myapikey
```

### 2. Configure Environment
```bash
# Add to .env.local
ETHERSCAN_API_KEY=your_key_here
BSCSCAN_API_KEY=your_key_here
POLYGONSCAN_API_KEY=your_key_here
```

### 3. Test API
```bash
# Test endpoint
curl http://localhost:3000/api/ucie/on-chain/USDT

# Expected response
{
  "success": true,
  "symbol": "USDT",
  "chain": "ethereum",
  "data": {
    "holders": [...],
    "whaleTransactions": [...],
    "smartContract": {...}
  }
}
```

---

## Usage Examples

### Fetch Holder Distribution
```typescript
import { fetchHolderDistribution } from '@/lib/ucie/onChainData';

const holders = await fetchHolderDistribution(
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT contract
  'ethereum'
);

console.log(`Top holder: ${holders[0].percentage}%`);
```

### Detect Whale Transactions
```typescript
import { detectWhaleTransactions } from '@/lib/ucie/onChainData';

const whales = await detectWhaleTransactions(
  '0xdac17f958d2ee523a2206206994597c13d831ec7',
  'ethereum',
  100000 // $100k threshold
);

console.log(`Found ${whales.length} whale transactions`);
```

### Analyze Smart Contract
```typescript
import { analyzeSmartContract } from '@/lib/ucie/smartContractAnalysis';

const security = await analyzeSmartContract(
  '0xdac17f958d2ee523a2206206994597c13d831ec7',
  'ethereum'
);

console.log(`Security score: ${security.score}/100`);
console.log(`Vulnerabilities: ${security.vulnerabilities.length}`);
```

### Classify Wallet
```typescript
import { classifyWallet } from '@/lib/ucie/walletBehavior';

const classification = classifyWallet(
  '0x28c6c06298d514db089934071355e5743bf21d60', // Binance wallet
  holders,
  transactions
);

console.log(`Type: ${classification.type}`);
console.log(`Confidence: ${classification.confidence}%`);
console.log(`Pattern: ${classification.pattern}`);
```

### Use React Component
```tsx
import OnChainAnalyticsPanel from '@/components/UCIE/OnChainAnalyticsPanel';

function MyPage() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/ucie/on-chain/USDT')
      .then(res => res.json())
      .then(result => setData(result.data));
  }, []);
  
  if (!data) return <div>Loading...</div>;
  
  return (
    <OnChainAnalyticsPanel
      symbol="USDT"
      holderData={data.holders}
      whaleTransactions={data.whaleTransactions}
      exchangeFlows={data.exchangeFlows}
      smartContractAnalysis={data.smartContract}
    />
  );
}
```

---

## Add New Token

### 1. Find Contract Address
```bash
# Etherscan
https://etherscan.io/token/[TOKEN_NAME]

# BSCScan
https://bscscan.com/token/[TOKEN_NAME]

# Polygonscan
https://polygonscan.com/token/[TOKEN_NAME]
```

### 2. Add to Configuration
```typescript
// pages/api/ucie/on-chain/[symbol].ts

const TOKEN_CONTRACTS: Record<string, { address: string; chain: string }> = {
  // ... existing tokens
  'LINK': { 
    address: '0x514910771af9ca656af840dff83e8264ecf986ca', 
    chain: 'ethereum' 
  },
};
```

### 3. Test New Token
```bash
curl http://localhost:3000/api/ucie/on-chain/LINK
```

---

## Common Issues

### Issue: "API key not configured"
**Solution**: Add API key to `.env.local` and restart dev server

### Issue: "Token not supported"
**Solution**: Add token contract address to `TOKEN_CONTRACTS` in API endpoint

### Issue: "No holder data"
**Solution**: Some explorers don't provide holder lists. Use alternative data sources.

### Issue: "Rate limit exceeded"
**Solution**: Upgrade to paid API tier or implement request queuing

---

## Performance Tips

1. **Use Caching**: API responses are cached for 5 minutes
2. **Batch Requests**: Fetch multiple tokens in parallel
3. **Optimize Thresholds**: Adjust whale transaction threshold based on token
4. **Monitor Rate Limits**: Track API usage to avoid hitting limits

---

## Security Best Practices

1. **Never Commit API Keys**: Use environment variables only
2. **Validate Input**: Always sanitize token symbols
3. **Handle Errors**: Implement graceful fallbacks
4. **Rate Limit**: Implement client-side rate limiting
5. **Monitor Usage**: Track API costs and usage patterns

---

## Next Steps

1. ✅ Test with different tokens
2. ✅ Integrate into UCIE dashboard
3. ✅ Add real-time updates
4. ✅ Implement historical tracking
5. ✅ Build alert system

---

## Support

- **Documentation**: See `UCIE-ON-CHAIN-ANALYTICS-COMPLETE.md`
- **API Reference**: See `pages/api/ucie/on-chain/[symbol].ts`
- **Component Docs**: See `components/UCIE/OnChainAnalyticsPanel.tsx`

---

**Quick Start Complete!** 🚀
