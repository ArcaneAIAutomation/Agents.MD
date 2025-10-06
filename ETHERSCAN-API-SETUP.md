# Etherscan API Key Setup Guide

## Current Status
❌ **Etherscan V2 API Key Invalid**
- Current Key: `6S8BPC9PYMKQXFX9P265NTMEYQAT98QQR2`
- Error: "Invalid API Key (#err2)|10"
- API Version: V2 (multi-chain support)
- Endpoint Format: `https://api.etherscan.io/v2/api?chainid=1&...`

## Why V2 API?
Etherscan V2 allows you to use **ONE API key** for all 50+ supported chains:
- Ethereum (chainid=1)
- BSC (chainid=56)
- Polygon (chainid=137)
- Arbitrum (chainid=42161)
- Optimism (chainid=10)
- And 45+ more chains!

## How to Get a Valid Etherscan V2 API Key

### Step 1: Create/Login to Etherscan Account
1. Go to https://etherscan.io/register (or login if you have account)
2. Create a free account
3. **IMPORTANT**: Verify your email (key won't work without verification!)

### Step 2: Generate V2 API Key
1. Log in to https://etherscan.io/login
2. Go to https://etherscan.io/myapikey
3. Click "Add" to create a new API key
4. Give it a name (e.g., "AgentMDC Whale Watch V2")
5. **Wait 5 minutes** for the key to activate
6. Copy the generated API key

### Step 3: Verify Key is Active
Test your new key immediately:
```bash
curl "https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=0x28C6c06298d514Db089934071355E5743bf21d60&tag=latest&apikey=YOUR_NEW_KEY"
```

Expected response:
```json
{
  "status": "1",
  "message": "OK",
  "result": "123456789000000000000000"
}
```

### Step 3: Update Environment Variables

**Local (.env.local):**
```bash
ETHERSCAN_API_KEY=YOUR_NEW_KEY_HERE
```

**Vercel:**
```bash
vercel env rm ETHERSCAN_API_KEY production
vercel env add ETHERSCAN_API_KEY production
# Paste your new key when prompted
```

### Step 4: Test the New Key
```bash
node test-blockchain-apis.js
```

## Alternative: Use Alchemy API (Recommended)

Alchemy provides more reliable Ethereum data with better rate limits.

### Setup Alchemy
1. Go to https://www.alchemy.com/
2. Sign up for free account
3. Create a new app (Ethereum Mainnet)
4. Copy your API key

### Add to Environment
```bash
# .env.local
ALCHEMY_API_KEY=your_alchemy_key_here
ALCHEMY_API_URL=https://eth-mainnet.g.alchemy.com/v2/
```

### Alchemy Advantages
- ✅ Better rate limits (300M compute units/month free)
- ✅ More reliable uptime
- ✅ Enhanced APIs (NFT, WebSocket, etc.)
- ✅ Better documentation
- ✅ No CAPTCHA issues

## Alternative: Use Infura API

### Setup Infura
1. Go to https://infura.io/
2. Sign up for free account
3. Create a new project (Ethereum Mainnet)
4. Copy your project ID

### Add to Environment
```bash
# .env.local
INFURA_PROJECT_ID=your_project_id_here
INFURA_API_URL=https://mainnet.infura.io/v3/
```

## Comparison

| Provider | Free Tier | Rate Limit | Best For |
|----------|-----------|------------|----------|
| **Etherscan** | ✅ Yes | 5 calls/sec | Basic queries |
| **Alchemy** | ✅ Yes | 300M CU/month | Production apps |
| **Infura** | ✅ Yes | 100k calls/day | General use |
| **Blockchain.com** | ✅ Yes | Good | Bitcoin only |

## Recommendation

**For Whale Watch:**
1. **Bitcoin**: Use Blockchain.com API ✅ (already working)
2. **Ethereum**: Use Alchemy API (more reliable than Etherscan)

**Why Alchemy?**
- Better for production apps
- More generous rate limits
- Enhanced APIs for whale tracking
- Better error handling
- No CAPTCHA issues

## Quick Start with Alchemy

```javascript
// Example: Get ETH balance
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY;
const url = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`;

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_getBalance',
    params: ['0x28C6c06298d514Db089934071355E5743bf21d60', 'latest']
  })
});

const data = await response.json();
const balanceInEth = parseInt(data.result, 16) / 1e18;
console.log(`Balance: ${balanceInEth} ETH`);
```

## Next Steps

Choose one option:

**Option A: Fix Etherscan**
1. Get new Etherscan API key
2. Update environment variables
3. Test with `node test-blockchain-apis.js`

**Option B: Use Alchemy (Recommended)**
1. Sign up for Alchemy
2. Get API key
3. Update Whale Watch code to use Alchemy
4. Better performance and reliability

**Option C: Use Both**
1. Alchemy for primary Ethereum data
2. Etherscan for transaction history
3. Best of both worlds

Let me know which option you prefer and I can help implement it!
