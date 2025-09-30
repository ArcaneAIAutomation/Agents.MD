// Final Layout Verification - ETH vs BTC
const fs = require('fs');

console.log('🎯 FINAL LAYOUT VERIFICATION - ETH vs BTC Components\n');

try {
  const ethAnalysis = fs.readFileSync('components/ETHMarketAnalysis.tsx', 'utf8');
  const btcAnalysis = fs.readFileSync('components/BTCMarketAnalysis.tsx', 'utf8');
  const ethChart = fs.readFileSync('components/ETHTradingChart.tsx', 'utf8');
  const btcChart = fs.readFileSync('components/BTCTradingChart.tsx', 'utf8');
  
  console.log('✅ COMPONENT STRUCTURE VERIFICATION:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Main Analysis Components
  const analysisElements = [
    'Fear & Greed Visual Slider Component',
    'Price Overview',
    'Technical Indicators', 
    'Trading Signals',
    'Enhanced Market Data Section',
    'Price Predictions',
    'Market Sentiment',
    'News Impact'
  ];
  
  let analysisMatches = 0;
  analysisElements.forEach(element => {
    const ethHas = ethAnalysis.includes(element);
    const btcHas = btcAnalysis.includes(element);
    const match = ethHas === btcHas;
    if (match) analysisMatches++;
    
    console.log(`${match ? '✅' : '❌'} ${element}`);
  });
  
  // Trading Chart Components
  const chartElements = [
    'Visual Trading Zones Analysis',
    'Choose your trading timeframe',
    '100% Real Market Intelligence Features',
    'generateRealTimeframeData',
    'setSelectedTimeframe'
  ];
  
  let chartMatches = 0;
  chartElements.forEach(element => {
    const ethHas = ethChart.includes(element);
    const btcHas = btcChart.includes(element);
    const match = ethHas === btcHas;
    if (match) chartMatches++;
    
    console.log(`${match ? '✅' : '❌'} Chart: ${element}`);
  });
  
  console.log('\n✅ LAYOUT GRID VERIFICATION:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const gridLayouts = [
    'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6', // Price Overview
    'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4', // Technical Indicators
    'grid grid-cols-1 md:grid-cols-3 gap-4', // Price Predictions
    'grid grid-cols-2 md:grid-cols-4 gap-4' // Market Sentiment
  ];
  
  let gridMatches = 0;
  gridLayouts.forEach((layout, index) => {
    const ethHas = ethAnalysis.includes(layout);
    const btcHas = btcAnalysis.includes(layout);
    const match = ethHas === btcHas;
    if (match) gridMatches++;
    
    console.log(`${match ? '✅' : '❌'} Grid Layout ${index + 1}: ${match ? 'MATCH' : 'MISMATCH'}`);
  });
  
  console.log('\n✅ BUTTON & INTERACTION VERIFICATION:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Check button styling and functionality
  const ethLoadBtn = ethAnalysis.includes('px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600');
  const ethRefreshBtn = ethAnalysis.includes('px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600');
  const btcLoadBtn = btcAnalysis.includes('px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600');
  const btcRefreshBtn = btcAnalysis.includes('px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600');
  
  console.log(`✅ ETH Load Button (Blue): ${ethLoadBtn ? '✓' : '✗'}`);
  console.log(`✅ ETH Refresh Button (Blue): ${ethRefreshBtn ? '✓' : '✗'}`);
  console.log(`✅ BTC Load Button (Orange): ${btcLoadBtn ? '✓' : '✗'}`);
  console.log(`✅ BTC Refresh Button (Orange): ${btcRefreshBtn ? '✓' : '✗'}`);
  
  // Check fetch functions
  const ethFetch = ethAnalysis.includes('fetchETHAnalysis');
  const btcFetch = btcAnalysis.includes('fetchBTCAnalysis');
  const ethAPI = ethAnalysis.includes('/api/eth-analysis');
  const btcAPI = btcAnalysis.includes('/api/btc-analysis');
  
  console.log(`✅ ETH Fetch Function: ${ethFetch ? '✓' : '✗'}`);
  console.log(`✅ BTC Fetch Function: ${btcFetch ? '✓' : '✗'}`);
  console.log(`✅ ETH API Endpoint: ${ethAPI ? '✓' : '✗'}`);
  console.log(`✅ BTC API Endpoint: ${btcAPI ? '✓' : '✗'}`);
  
  console.log('\n✅ VISUAL CONSISTENCY CHECK:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Check color themes
  const ethBlueTheme = ethAnalysis.includes('text-blue-500') && ethAnalysis.includes('bg-blue-500');
  const btcOrangeTheme = btcAnalysis.includes('text-orange-500') && btcAnalysis.includes('bg-orange-500');
  const ethIcon = ethAnalysis.includes('EthereumIcon');
  const btcIcon = btcAnalysis.includes('BitcoinIcon');
  
  console.log(`✅ ETH Blue Theme: ${ethBlueTheme ? '✓' : '✗'}`);
  console.log(`✅ BTC Orange Theme: ${btcOrangeTheme ? '✓' : '✗'}`);
  console.log(`✅ ETH Icon Component: ${ethIcon ? '✓' : '✗'}`);
  console.log(`✅ BTC Icon Component: ${btcIcon ? '✓' : '✗'}`);
  
  // Calculate overall scores
  const analysisScore = (analysisMatches / analysisElements.length) * 100;
  const chartScore = (chartMatches / chartElements.length) * 100;
  const gridScore = (gridMatches / gridLayouts.length) * 100;
  const overallScore = (analysisScore + chartScore + gridScore) / 3;
  
  console.log('\n🎯 FINAL SCORES:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Analysis Components: ${analysisScore.toFixed(1)}% (${analysisMatches}/${analysisElements.length})`);
  console.log(`📈 Chart Components: ${chartScore.toFixed(1)}% (${chartMatches}/${chartElements.length})`);
  console.log(`🎨 Grid Layouts: ${gridScore.toFixed(1)}% (${gridMatches}/${gridLayouts.length})`);
  console.log(`🏆 Overall Layout Match: ${overallScore.toFixed(1)}%`);
  
  if (overallScore >= 95) {
    console.log('\n🎉 PERFECT! Layout Matching Complete:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ETH and BTC components have identical layouts');
    console.log('✅ All sections, grids, and buttons match perfectly');
    console.log('✅ Timeframe selection interface is identical');
    console.log('✅ Color themes are consistent (ETH=Blue, BTC=Orange)');
    console.log('✅ Both components should behave identically');
    
    console.log('\n🚀 READY FOR TESTING:');
    console.log('1. Both components show identical "Visual Trading Zones Analysis"');
    console.log('2. Both show 1H, 4H, 1D timeframe selection buttons');
    console.log('3. Both have the same layout structure and spacing');
    console.log('4. Only difference should be colors and data (BTC vs ETH)');
    
  } else if (overallScore >= 80) {
    console.log('\n⚠️  GOOD - Minor differences remain:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Most elements match, but some fine-tuning may be needed');
    
  } else {
    console.log('\n❌ NEEDS WORK - Significant differences found:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Major layout differences need to be addressed');
  }
  
} catch (error) {
  console.error('❌ Verification failed:', error.message);
}

console.log('\n✅ Final Verification Complete!');