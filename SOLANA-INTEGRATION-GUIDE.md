# Solana Blockchain Integration Guide

**Status**: 🆕 New Integration (January 2025)  
**Purpose**: Add Solana blockchain analytics to UCIE  
**Scope**: SOL token and SPL token on-chain analysis

---

## Overview

This guide covers the integration of Solana blockchain data into the Universal Crypto Intelligence Engine (UCIE). Solana integration enables comprehensive on-chain analytics for SOL and SPL tokens, including whale tracking, transaction analysis, and holder distribution.

---

## Why Solana?

### Market Significance
- **Top 5 Cryptocurrency**: SOL is consistently in the top 5 by market cap
- **High Transaction Volume**: Processes 2,000-3,000 TPS (transactions per second)
- **Growing DeFi Ecosystem**: Major DeFi protocols built on Solana
- **NFT Hub**: One of the largest NFT ecosystems after Ethereum

### Technical Advantages
- **Fast Finality**: Transactions confirm in 400-600ms
- **Low Fees**: Average transaction cost < $0.01
- **High Throughput**: Can handle 65,000 TPS theoretically
- **Rich Ecosystem**: Extensive tooling and APIs available

---

## Architecture

### Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    UCIE Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ SOL Analysis │  │ Whale Watch  │  │ On-Chain     │     │
│  │   Dashboard  │  │   (Solana)   │  │   Analytics  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              UCIE API Layer (Next.js)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/ucie/on-chain/SOL                              │  │
│  │  /api/whale-watch/solana/detect                      │  │
│  │  /api/ucie/solana/token-accounts                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            Solana Client Library                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  lib/solana/client.ts                                │  │
│  │  • Connection management                             │  │
│  │  • Fallback handling                                 │  │
│  │  • Rate limiting                                     │  │
│  │  • Caching                                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Solana RPC Providers                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ QuickNode│  │ Alchemy  │  │  Helius  │  │  Public  │  │
│  │   (Pro)  │  │  (Alt)   │  │  (Fast)  │  │   RPC    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install @solana/web3.js
npm install @solana/spl-token
```

### Step 2: Choose RPC Provider

#### Option A: Public RPC (Free - Testing Only)
```bash
# .env.local
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
```

**Pros**: Free, no signup required  
**Cons**: Rate limited (~100 req/10s), unreliable during high traffic  
**Best For**: Development and testing

#### Option B: QuickNode (Recommended)
```bash
# 1. Sign up at https://www.quicknode.com/
# 2. Create a Solana endpoint
# 3. Copy HTTP Provider URL

# .env.local
SOLANA_RPC_URL=https://your-endpoint.solana-mainnet.quiknode.pro/token/
SOLANA_RPC_FALLBACK_URL=https://api.mainnet-beta.solana.com
```

**Pros**: Reliable, 100k free requests/day, WebSocket support  
**Cons**: Requires signup, paid plans for higher usage  
**Best For**: Production applications

#### Option C: Alchemy
```bash
# 1. Sign up at https://www.alchemy.com/
# 2. Create a Solana app
# 3. Copy HTTPS URL

# .env.local
SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/your-api-key
```

**Pros**: 300M compute units/month free, enhanced APIs  
**Cons**: Compute unit limits can be confusing  
**Best For**: Apps needing NFT/Token APIs

#### Option D: Helius
```bash
# 1. Sign up at https://www.helius.dev/
# 2. Create API key
# 3. Copy RPC URL

# .env.local
SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=your-api-key
```

**Pros**: High performance, 100k free requests/day, DAS API  
**Cons**: Requires signup  
**Best For**: High-performance DeFi applications

### Step 3: Configure Environment Variables

```bash
# Required
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta

# Optional but recommended
SOLANA_RPC_FALLBACK_URL=https://api.mainnet-beta.solana.com
SOLANA_COMMITMENT=confirmed
SOLANA_RPC_TIMEOUT_MS=30000

# Optional: Enhanced blockchain explorer
SOLSCAN_API_KEY=your_solscan_api_key_here
```

### Step 4: Create Solana Client

Create `lib/solana/client.ts`:

```typescript
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

interface SolanaConfig {
  rpcUrl: string;
  fallbackUrl?: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
  timeout?: number;
}

class SolanaClient {
  private connection: Connection;
  private fallbackConnection?: Connection;
  
  constructor(config: SolanaConfig) {
    this.connection = new Connection(
      config.rpcUrl,
      {
        commitment: config.commitment || 'confirmed',
        confirmTransactionInitialTimeout: config.timeout || 30000
      }
    );
    
    if (config.fallbackUrl) {
      this.fallbackConnection = new Connection(
        config.fallbackUrl,
        { commitment: config.commitment || 'confirmed' }
      );
    }
  }
  
  async getBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      if (this.fallbackConnection) {
        const publicKey = new PublicKey(address);
        const balance = await this.fallbackConnection.getBalance(publicKey);
        return balance / 1e9;
      }
      throw error;
    }
  }
  
  async getTransactionHistory(address: string, limit: number = 10) {
    const publicKey = new PublicKey(address);
    const signatures = await this.connection.getSignaturesForAddress(
      publicKey,
      { limit }
    );
    
    const transactions = await Promise.all(
      signatures.map(sig => 
        this.connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        })
      )
    );
    
    return transactions.filter(tx => tx !== null);
  }
  
  async getTokenAccounts(address: string) {
    const publicKey = new PublicKey(address);
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    );
    
    return tokenAccounts.value.map(account => ({
      mint: account.account.data.parsed.info.mint,
      balance: account.account.data.parsed.info.tokenAmount.uiAmount,
      decimals: account.account.data.parsed.info.tokenAmount.decimals
    }));
  }
}

export const solanaClient = new SolanaClient({
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  fallbackUrl: process.env.SOLANA_RPC_FALLBACK_URL,
  commitment: (process.env.SOLANA_COMMITMENT as any) || 'confirmed',
  timeout: parseInt(process.env.SOLANA_RPC_TIMEOUT_MS || '30000')
});
```

### Step 5: Test Integration

Create `scripts/test-solana.ts`:

```typescript
import { solanaClient } from '../lib/solana/client';

async function testSolana() {
  console.log('🧪 Testing Solana Integration...\n');
  
  try {
    // Test connection
    const version = await solanaClient.connection.getVersion();
    console.log('✅ Connected to Solana');
    console.log(`   Version: ${version['solana-core']}\n`);
    
    // Test blockhash
    const { blockhash } = await solanaClient.connection.getLatestBlockhash();
    console.log('✅ Latest blockhash retrieved');
    console.log(`   Blockhash: ${blockhash.substring(0, 20)}...\n`);
    
    console.log('🎉 Solana integration working!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSolana();
```

Run test:
```bash
npx tsx scripts/test-solana.ts
```

---

## UCIE Integration

### On-Chain Analytics Endpoint

Update `pages/api/ucie/on-chain/[symbol].ts`:

```typescript
import { solanaClient } from '../../../../lib/solana/client';

export default async function handler(req, res) {
  const { symbol } = req.query;
  
  if (symbol.toUpperCase() === 'SOL') {
    try {
      const onChainData = await getSolanaOnChainData();
      
      return res.status(200).json({
        success: true,
        data: onChainData,
        source: 'solana-rpc',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Solana on-chain error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch Solana on-chain data'
      });
    }
  }
  
  // Handle other blockchains...
}

async function getSolanaOnChainData() {
  // Example whale addresses (replace with actual monitoring)
  const whaleAddresses = [
    'YOUR_WHALE_ADDRESS_1',
    'YOUR_WHALE_ADDRESS_2'
  ];
  
  const whaleData = await Promise.all(
    whaleAddresses.map(async (address) => {
      const [balance, transactions] = await Promise.all([
        solanaClient.getBalance(address),
        solanaClient.getTransactionHistory(address, 10)
      ]);
      
      return {
        address,
        balance,
        recentTransactions: transactions.length
      };
    })
  );
  
  return {
    blockchain: 'solana',
    whaleActivity: whaleData,
    timestamp: new Date().toISOString()
  };
}
```

### Whale Watch Integration

Create `pages/api/whale-watch/solana/detect.ts`:

```typescript
import { solanaClient } from '../../../../lib/solana/client';

export default async function handler(req, res) {
  const { threshold = 100 } = req.query;
  
  try {
    const whaleTransactions = await detectSolanaWhales(Number(threshold));
    
    return res.status(200).json({
      success: true,
      whales: whaleTransactions,
      count: whaleTransactions.length,
      threshold: Number(threshold)
    });
  } catch (error) {
    console.error('Solana whale detection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to detect Solana whales'
    });
  }
}

async function detectSolanaWhales(threshold: number) {
  const recentSlot = await solanaClient.connection.getSlot();
  const block = await solanaClient.connection.getBlock(recentSlot, {
    maxSupportedTransactionVersion: 0
  });
  
  if (!block) return [];
  
  const whaleTransactions = [];
  
  for (const tx of block.transactions) {
    if (!tx.meta) continue;
    
    const preBalance = tx.meta.preBalances[0] / 1e9;
    const postBalance = tx.meta.postBalances[0] / 1e9;
    const amount = Math.abs(postBalance - preBalance);
    
    if (amount >= threshold) {
      whaleTransactions.push({
        signature: tx.transaction.signatures[0],
        blockTime: block.blockTime,
        slot: recentSlot,
        amount: amount,
        fromAddress: tx.transaction.message.accountKeys[0].toString(),
        toAddress: tx.transaction.message.accountKeys[1]?.toString() || 'unknown',
        fee: tx.meta.fee / 1e9,
        status: tx.meta.err ? 'failed' : 'success'
      });
    }
  }
  
  return whaleTransactions;
}
```

---

## Performance Optimization

### Rate Limiting

```typescript
import { RateLimiter } from 'limiter';

const solanaRateLimiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 10000 // 100 requests per 10 seconds
});

async function rateLimitedCall<T>(fn: () => Promise<T>): Promise<T> {
  await solanaRateLimiter.removeTokens(1);
  return fn();
}
```

### Caching

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
```

### Batch Requests

```typescript
async function batchGetBalances(addresses: string[]): Promise<number[]> {
  const publicKeys = addresses.map(addr => new PublicKey(addr));
  
  // Use getMultipleAccountsInfo for batch fetching
  const accounts = await solanaClient.connection.getMultipleAccountsInfo(publicKeys);
  
  return accounts.map(account => 
    account ? account.lamports / 1e9 : 0
  );
}
```

---

## Testing

### Unit Tests

```typescript
// __tests__/solana-client.test.ts
import { solanaClient } from '../lib/solana/client';

describe('Solana Client', () => {
  test('should connect to Solana RPC', async () => {
    const version = await solanaClient.connection.getVersion();
    expect(version['solana-core']).toBeDefined();
  });
  
  test('should get balance for address', async () => {
    const address = 'YOUR_TEST_ADDRESS';
    const balance = await solanaClient.getBalance(address);
    expect(typeof balance).toBe('number');
    expect(balance).toBeGreaterThanOrEqual(0);
  });
  
  test('should get transaction history', async () => {
    const address = 'YOUR_TEST_ADDRESS';
    const transactions = await solanaClient.getTransactionHistory(address, 5);
    expect(Array.isArray(transactions)).toBe(true);
  });
});
```

### Integration Tests

```bash
# Test Solana API endpoint
curl http://localhost:3000/api/ucie/on-chain/SOL

# Test whale detection
curl http://localhost:3000/api/whale-watch/solana/detect?threshold=100
```

---

## Deployment

### Vercel Environment Variables

Add to Vercel dashboard:

```
SOLANA_RPC_URL=https://your-quicknode-endpoint.solana-mainnet.quiknode.pro/token/
SOLANA_RPC_FALLBACK_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
SOLANA_COMMITMENT=confirmed
SOLANA_RPC_TIMEOUT_MS=30000
```

### Production Checklist

- [ ] Use paid RPC provider (QuickNode/Alchemy/Helius)
- [ ] Configure fallback RPC endpoint
- [ ] Enable rate limiting
- [ ] Implement caching strategy
- [ ] Set up monitoring and alerts
- [ ] Test with production data
- [ ] Document API endpoints
- [ ] Update UCIE documentation

---

## Monitoring

### Key Metrics

- **RPC Response Time**: < 500ms (target)
- **Success Rate**: > 99% (target)
- **Cache Hit Rate**: > 80% (target)
- **Rate Limit Hits**: < 1% (target)

### Logging

```typescript
console.log('[Solana] Balance query:', {
  address,
  balance,
  responseTime: Date.now() - startTime,
  cached: fromCache
});
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Connection Timeout
```
Error: Connection timeout
```
**Solution**: Increase `SOLANA_RPC_TIMEOUT_MS` or use faster RPC provider

#### Issue 2: Rate Limit Exceeded
```
Error: 429 Too Many Requests
```
**Solution**: Implement rate limiting and caching, or upgrade RPC plan

#### Issue 3: Invalid Public Key
```
Error: Invalid public key input
```
**Solution**: Validate address format before querying

---

## Next Steps

1. **Implement SOL price tracking** in UCIE market data
2. **Add SPL token support** for token-specific analysis
3. **Integrate Solana DeFi protocols** (Raydium, Orca, etc.)
4. **Add Solana NFT tracking** for NFT whale activity
5. **Implement Solana staking analytics**

---

## Resources

- **Solana Documentation**: https://docs.solana.com/
- **Solana Web3.js**: https://solana-labs.github.io/solana-web3.js/
- **QuickNode Docs**: https://www.quicknode.com/docs/solana
- **Alchemy Docs**: https://docs.alchemy.com/reference/solana-api-quickstart
- **Helius Docs**: https://docs.helius.dev/

---

**Status**: ✅ Ready for Implementation  
**Last Updated**: January 27, 2025  
**Version**: 1.0.0
