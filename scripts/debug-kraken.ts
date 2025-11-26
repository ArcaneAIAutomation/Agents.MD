/**
 * Debug Kraken API Response Structure
 */

async function debugKraken() {
  console.log('🔍 Debugging Kraken API Response Structure\n');
  
  const pairs = ['XBTUSD', 'XXBTZUSD', 'BTCUSD', 'XBT/USD'];
  
  for (const pair of pairs) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing pair: ${pair}`);
    console.log('='.repeat(60));
    
    try {
      const url = `https://api.kraken.com/0/public/Ticker?pair=${pair}`;
      console.log(`URL: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('\n📊 Response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.result) {
        console.log('\n✅ Result keys:', Object.keys(data.result));
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
  }
}

debugKraken();
