// Configuration Verification Script
const fs = require('fs');

console.log('🔧 CONFIGURATION VERIFICATION');
console.log('Checking .env.local and API configurations');
console.log('═══════════════════════════════════════════════════════════════\n');

try {
  // Read .env.local file
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  // Extract key configurations
  const configs = {};
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      configs[key] = value;
    }
  });
  
  console.log('🤖 OPENAI CONFIGURATION:');
  console.log('─────────────────────────────────────────────────────────────');
  
  const openaiKey = configs.OPENAI_API_KEY;
  const openaiModel = configs.OPENAI_MODEL;
  const useRealAI = configs.USE_REAL_AI_ANALYSIS;
  
  console.log(`🔑 OpenAI API Key: ${openaiKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🤖 OpenAI Model: ${openaiModel || 'Not specified'}`);
  console.log(`⚡ Real AI Analysis: ${useRealAI || 'Not specified'}`);
  
  if (openaiModel) {
    const isLatest = openaiModel.includes('gpt-4o-2024-08-06');
    console.log(`📅 Latest Model: ${isLatest ? '✅ YES (gpt-4o-2024-08-06)' : '⚠️ May be outdated'}`);
  }
  
  console.log('\n📊 MARKET DATA APIS:');
  console.log('─────────────────────────────────────────────────────────────');
  
  const marketAPIs = {
    'CoinMarketCap': configs.COINMARKETCAP_API_KEY,
    'CoinGecko': configs.COINGECKO_API_KEY,
    'Alpha Vantage': configs.ALPHA_VANTAGE_API_KEY,
    'NewsAPI': configs.NEWS_API_KEY
  };
  
  Object.entries(marketAPIs).forEach(([name, key]) => {
    const isConfigured = key && key !== 'your_api_key_here' && key !== 'CG-YourActualAPIKeyHere';
    console.log(`${isConfigured ? '✅' : '❌'} ${name}: ${isConfigured ? 'Configured' : 'Missing/Default'}`);
  });
  
  console.log('\n🔴 LIVE DATA SETTINGS:');
  console.log('─────────────────────────────────────────────────────────────');
  
  const liveDataEnabled = configs.ENABLE_LIVE_DATA === 'true';
  const aiNewsEnabled = configs.ENABLE_AI_NEWS_ANALYSIS === 'true';
  const advancedTAEnabled = configs.ENABLE_ADVANCED_TA === 'true';
  
  console.log(`🔴 Live Data Enabled: ${liveDataEnabled ? '✅ YES' : '❌ NO'}`);
  console.log(`📰 AI News Analysis: ${aiNewsEnabled ? '✅ YES' : '❌ NO'}`);
  console.log(`📈 Advanced Technical Analysis: ${advancedTAEnabled ? '✅ YES' : '❌ NO'}`);
  
  console.log('\n🔍 API IMPLEMENTATION CHECK:');
  console.log('─────────────────────────────────────────────────────────────');
  
  // Check BTC API
  const btcAPI = fs.readFileSync('pages/api/btc-analysis.ts', 'utf8');
  const btcUsesLatestModel = btcAPI.includes('gpt-4o-2024-08-06');
  const btcUsesRealData = btcAPI.includes('isLiveData: true');
  const btcHasEnhanced = btcAPI.includes('enhancedMarketData');
  
  console.log(`🟠 Bitcoin API:`);
  console.log(`   🤖 Latest Model: ${btcUsesLatestModel ? '✅' : '❌'}`);
  console.log(`   🔴 Live Data: ${btcUsesRealData ? '✅' : '❌'}`);
  console.log(`   ⚡ Enhanced Features: ${btcHasEnhanced ? '✅' : '❌'}`);
  
  // Check ETH API
  const ethAPI = fs.readFileSync('pages/api/eth-analysis.ts', 'utf8');
  const ethUsesLatestModel = ethAPI.includes('gpt-4o-2024-08-06');
  const ethUsesRealData = ethAPI.includes('isLiveData: true');
  const ethHasEnhanced = ethAPI.includes('enhancedMarketData');
  
  console.log(`🔵 Ethereum API:`);
  console.log(`   🤖 Latest Model: ${ethUsesLatestModel ? '✅' : '❌'}`);
  console.log(`   🔴 Live Data: ${ethUsesRealData ? '✅' : '❌'}`);
  console.log(`   ⚡ Enhanced Features: ${ethHasEnhanced ? '✅' : '❌'}`);
  
  console.log('\n🎯 CONFIGURATION SUMMARY:');
  console.log('─────────────────────────────────────────────────────────────');
  
  const configScore = [
    !!openaiKey,
    openaiModel === 'gpt-4o-2024-08-06',
    useRealAI === 'true',
    liveDataEnabled,
    btcUsesLatestModel,
    ethUsesLatestModel,
    btcHasEnhanced,
    ethHasEnhanced
  ].filter(Boolean).length;
  
  const totalChecks = 8;
  const percentage = (configScore / totalChecks) * 100;
  
  console.log(`📊 Configuration Score: ${configScore}/${totalChecks} (${percentage.toFixed(1)}%)`);
  
  if (percentage === 100) {
    console.log('🎉 PERFECT! All configurations are optimal:');
    console.log('✅ Latest OpenAI model configured');
    console.log('✅ Live data enabled');
    console.log('✅ Both APIs use enhanced features');
    console.log('✅ Ready for 100% live data testing');
  } else if (percentage >= 80) {
    console.log('✅ GOOD! Most configurations are correct');
    console.log('⚠️  Minor optimizations possible');
  } else {
    console.log('⚠️  NEEDS ATTENTION! Several configurations need updates');
  }
  
  console.log('\n💡 NEXT STEPS:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('1. Ensure development server is running: npm run dev');
  console.log('2. Run live API test: node test-live-api-simple.js');
  console.log('3. Test both Bitcoin and Ethereum components in browser');
  console.log('4. Verify "LIVE DATA" badges appear on both components');
  
} catch (error) {
  console.error('❌ Configuration check failed:', error.message);
}

console.log('\n✅ Configuration verification complete!');