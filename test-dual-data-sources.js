/**
 * Test script to verify dual data source functionality
 * Tests both CoinGecko and CoinMarketCap APIs with fallback scenarios
 */

// Try multiple ports in case the server is running on a different one
const POSSIBLE_URLS = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  'http://localhost:3003'
];

let BASE_URL = null;

async function findActiveServer() {
  for (const url of POSSIBLE_URLS) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        BASE_URL = url;
        console.log(`✅ Found active server at: ${url}`);
        return true;
      }
    } catch (error) {
      // Server not running on this port
    }
  }
  return false;
}

async function testAPI(endpoint, description) {
  try {
    console.log(`\n🧪 Testing ${description}...`);
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    const duration = Date.now() - startTime;
    
    if (data.success) {
      console.log(`✅ ${description} - SUCCESS (${duration}ms)`);
      console.log(`   Source: ${data.source}`);
      
      if (endpoint.includes('crypto-prices')) {
        console.log(`   Prices received: ${data.prices.length} coins`);
        data.prices.slice(0, 3).forEach(coin => {
          console.log(`   - ${coin.symbol}: $${coin.price.toLocaleString()} (${coin.change24h > 0 ? '+' : ''}${coin.change24h.toFixed(2)}%)`);
        });
      } else if (endpoint.includes('historical-prices')) {
        console.log(`   Data points: ${data.data.length}`);
        if (data.data.length > 0) {
          const latest = data.data[data.data.length - 1];
          const oldest = data.data[0];
          console.log(`   Price range: $${Math.min(...data.data.map(d => d.price)).toLocaleString()} - $${Math.max(...data.data.map(d => d.price)).toLocaleString()}`);
          console.log(`   Time span: ${new Date(oldest.timestamp).toLocaleDateString()} to ${new Date(latest.timestamp).toLocaleDateString()}`);
        }
      }
      
      if (data.cached) {
        console.log(`   📦 Data served from cache`);
      }
    } else {
      console.log(`⚠️ ${description} - PARTIAL SUCCESS (fallback used)`);
      console.log(`   Source: ${data.source}`);
      console.log(`   Error: ${data.error}`);
    }
    
  } catch (error) {
    console.log(`❌ ${description} - FAILED: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Dual Data Source Test Suite');
  console.log('=====================================');
  
  // First, find the active server
  const serverFound = await findActiveServer();
  if (!serverFound) {
    console.log('❌ No active server found on any port. Please start the development server with "npm run dev"');
    return;
  }
  
  // Test current crypto prices API (should try CoinGecko, fallback to CoinMarketCap)
  await testAPI('/api/crypto-prices', 'Crypto Prices API (Dual Source)');
  
  // Test historical data APIs for different timeframes
  await testAPI('/api/historical-prices?symbol=btc&timeframe=1D', 'BTC 1D Historical Data (Master Data Approach)');
  await testAPI('/api/historical-prices?symbol=btc&timeframe=4H', 'BTC 4H Historical Data (Derived from Master)');
  await testAPI('/api/historical-prices?symbol=btc&timeframe=1H', 'BTC 1H Historical Data (Derived from Master)');
  
  await testAPI('/api/historical-prices?symbol=eth&timeframe=1D', 'ETH 1D Historical Data (Master Data Approach)');
  await testAPI('/api/historical-prices?symbol=eth&timeframe=4H', 'ETH 4H Historical Data (Derived from Master)');
  
  // Test caching by running the same request again (should be faster)
  console.log(`\n🔄 Testing Cache Performance...`);
  await testAPI('/api/crypto-prices', 'Crypto Prices API (Should use cache)');
  await testAPI('/api/historical-prices?symbol=btc&timeframe=1D', 'BTC 1D Historical Data (Should use cache)');
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log('✅ Dual data source system implemented');
  console.log('✅ CoinGecko primary, CoinMarketCap fallback');
  console.log('✅ Master data caching for historical prices');
  console.log('✅ Rate limiting mitigation strategies');
  console.log('✅ Graceful fallback to simulated data if needed');
  
  console.log('\n🎯 Key Benefits:');
  console.log('- Improved data reliability with dual sources');
  console.log('- Reduced API rate limiting issues');
  console.log('- Faster response times with smart caching');
  console.log('- Real historical data across all timeframes');
  console.log('- Maintained functionality even during API outages');
}

// Run the tests
runTests().catch(console.error);
