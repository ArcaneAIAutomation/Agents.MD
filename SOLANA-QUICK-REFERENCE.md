# Solana Integration - Quick Reference Card

**For**: Developers implementing Solana support in UCIE  
**Status**: Configuration Complete - Ready for Implementation

---

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
npm install @solana/web3.js @solana/spl-token
```

### 2. Test Connection
```bash
# Create test file
cat > scripts/test-solana.ts << 'EOF'
import { Connection } from '@solana/web3.js';

async function test() {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed'
  );
  
  const version = await connection.getVersion();
  console.log('✅ Connected:', version['solana-core']);
}

test();
EOF

# Run test
npx tsx scripts/test-solana.ts
```

---

## 📋 Environment Variables

```bash
# Required
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Optional but recommended
SOLANA_RPC_FALLBACK_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
SOLANA_COMMITMENT=confirmed
SOLANA_RPC_TIMEOUT_MS=30000
```

---

## 💻 Code Snippets

### Get Balance
```typescript
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');

async function getBalance(address: string): Promise<number> {
  const publicKey = new PublicKey(address);
  const balance = await connection.getBalance(publicKey);
  return balance / 1e9; // Convert lamports to SOL
}
```

### Get Transaction History
```typescript
async function getTransactions(address: string, limit: number = 10) {
  const publicKey = new PublicKey(address);
  const signatures = await connection.getSignaturesForAddress(publicKey, { limit });
  
  return Promise.all(
    signatures.map(sig => 
      connection.getTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0
      })
    )
  );
}
```

### Get Token Accounts
```typescript
async function getTokenAccounts(address: string) {
  const publicKey = new PublicKey(address);
  const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  
  const accounts = await connection.getParsedTokenAccountsByOwner(
    publicKey,
    { programId: TOKEN_PROGRAM_ID }
  );
  
  return accounts.value.map(acc => ({
    mint: acc.account.data.parsed.info.mint,
    balance: acc.account.data.parsed.info.tokenAmount.uiAmount,
    decimals: acc.account.data.parsed.info.tokenAmount.decimals
  }));
}
```

### Detect Whale Transactions
```typescript
async function detectWhales(threshold: number = 100) {
  const slot = await connection.getSlot();
  const block = await connection.getBlock(slot, {
    maxSupportedTransactionVersion: 0
  });
  
  if (!block) return [];
  
  return block.transactions
    .filter(tx => {
      if (!tx.meta) return false;
      const amount = Math.abs(
        (tx.meta.postBalances[0] - tx.meta.preBalances[0]) / 1e9
      );
      return amount >= threshold;
    })
    .map(tx => ({
      signature: tx.transaction.signatures[0],
      amount: Math.abs(
        (tx.meta!.postBalances[0] - tx.meta!.preBalances[0]) / 1e9
      ),
      from: tx.transaction.message.accountKeys[0].toString(),
      to: tx.transaction.message.accountKeys[1]?.toString() || 'unknown'
    }));
}
```

---

## 🔌 API Endpoints to Create

### 1. On-Chain Analytics
```typescript
// pages/api/ucie/on-chain/[symbol].ts
if (symbol.toUpperCase() === 'SOL') {
  const data = await getSolanaOnChainData();
  return res.json({ success: true, data });
}
```

### 2. Whale Detection
```typescript
// pages/api/whale-watch/solana/detect.ts
export default async function handler(req, res) {
  const { threshold = 100 } = req.query;
  const whales = await detectSolanaWhales(Number(threshold));
  return res.json({ success: true, whales });
}
```

### 3. Token Accounts
```typescript
// pages/api/ucie/solana/token-accounts.ts
export default async function handler(req, res) {
  const { address } = req.query;
  const accounts = await getTokenAccounts(address as string);
  return res.json({ success: true, accounts });
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Check if Address is Whale
```typescript
async function isWhale(address: string, threshold: number = 1000): Promise<boolean> {
  const balance = await getBalance(address);
  return balance >= threshold;
}
```

### Use Case 2: Get Top Token Holdings
```typescript
async function getTopTokens(address: string, limit: number = 5) {
  const accounts = await getTokenAccounts(address);
  return accounts
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}
```

### Use Case 3: Calculate Transaction Volume
```typescript
async function get24hVolume(address: string): Promise<number> {
  const transactions = await getTransactions(address, 100);
  const oneDayAgo = Date.now() / 1000 - 86400;
  
  return transactions
    .filter(tx => tx?.blockTime && tx.blockTime > oneDayAgo)
    .reduce((sum, tx) => {
      if (!tx?.meta) return sum;
      const amount = Math.abs(
        (tx.meta.postBalances[0] - tx.meta.preBalances[0]) / 1e9
      );
      return sum + amount;
    }, 0);
}
```

---

## ⚡ Performance Tips

### 1. Caching
```typescript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

async function getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// Usage
const balance = await getCached(`balance:${address}`, () => getBalance(address));
```

### 2. Rate Limiting
```typescript
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 10000 // 100 requests per 10 seconds
});

async function rateLimited<T>(fn: () => Promise<T>): Promise<T> {
  await limiter.removeTokens(1);
  return fn();
}
```

### 3. Batch Requests
```typescript
async function batchGetBalances(addresses: string[]): Promise<number[]> {
  const publicKeys = addresses.map(addr => new PublicKey(addr));
  const accounts = await connection.getMultipleAccountsInfo(publicKeys);
  return accounts.map(acc => acc ? acc.lamports / 1e9 : 0);
}
```

---

## 🐛 Error Handling

### Validate Address
```typescript
function isValidAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
```

### Handle Timeouts
```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]);
}
```

### Fallback Pattern
```typescript
async function getBalanceWithFallback(address: string): Promise<number> {
  try {
    return await getBalance(address);
  } catch (error) {
    console.warn('Primary RPC failed, trying fallback...');
    const fallbackConnection = new Connection(
      process.env.SOLANA_RPC_FALLBACK_URL!,
      'confirmed'
    );
    const publicKey = new PublicKey(address);
    const balance = await fallbackConnection.getBalance(publicKey);
    return balance / 1e9;
  }
}
```

---

## 🧪 Testing

### Unit Test Example
```typescript
// __tests__/solana.test.ts
import { Connection } from '@solana/web3.js';

describe('Solana Integration', () => {
  test('should connect to RPC', async () => {
    const connection = new Connection(
      process.env.SOLANA_RPC_URL!,
      'confirmed'
    );
    const version = await connection.getVersion();
    expect(version['solana-core']).toBeDefined();
  });
  
  test('should get balance', async () => {
    const balance = await getBalance('YOUR_TEST_ADDRESS');
    expect(typeof balance).toBe('number');
    expect(balance).toBeGreaterThanOrEqual(0);
  });
});
```

### Integration Test
```bash
# Test API endpoint
curl http://localhost:3000/api/ucie/on-chain/SOL

# Expected response
{
  "success": true,
  "data": {
    "blockchain": "solana",
    "whaleActivity": [...]
  }
}
```

---

## 📊 Monitoring

### Log Format
```typescript
console.log('[Solana]', {
  action: 'getBalance',
  address: address.substring(0, 8) + '...',
  balance,
  responseTime: Date.now() - startTime,
  cached: fromCache,
  provider: 'public-rpc'
});
```

### Key Metrics
- Response Time: < 500ms (target)
- Success Rate: > 99% (target)
- Cache Hit Rate: > 80% (target)
- Rate Limit Hits: < 1% (target)

---

## 🔗 Useful Links

- **Solana Docs**: https://docs.solana.com/
- **Web3.js Docs**: https://solana-labs.github.io/solana-web3.js/
- **Solscan Explorer**: https://solscan.io/
- **QuickNode**: https://www.quicknode.com/
- **Full Guide**: See `SOLANA-INTEGRATION-GUIDE.md`

---

## 🎓 Key Concepts

### Lamports
- 1 SOL = 1,000,000,000 lamports (1e9)
- Always convert: `lamports / 1e9 = SOL`

### Commitment Levels
- `processed`: Fastest (1-2s), least secure
- `confirmed`: Balanced (4-8s), recommended
- `finalized`: Slowest (12-32s), most secure

### Public Key
- Base58 encoded string
- 32-44 characters long
- Example: `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`

---

## ✅ Implementation Checklist

- [ ] Install @solana/web3.js
- [ ] Create lib/solana/client.ts
- [ ] Test connection with public RPC
- [ ] Implement caching
- [ ] Implement rate limiting
- [ ] Create API endpoints
- [ ] Add error handling
- [ ] Write tests
- [ ] Update documentation
- [ ] Deploy to production

---

**Quick Start Time**: 5 minutes  
**Full Implementation**: 1-2 hours  
**Status**: Ready to Code! 🚀
