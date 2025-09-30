// API Testing Script
// Tests all APIs and reports their status

const testAPIs = async () => {
  const baseUrl = 'http://localhost:3000';
  const apis = [
    '/api/crypto-herald',
    '/api/btc-analysis', 
    '/api/eth-analysis',
    '/api/bitcoin-analysis',
    '/api/trade-generation',
    '/api/nexo-regulatory',
    '/api/nexo-news',
    '/api/news-aggregation'
  ];

  console.log('🧪 Starting API Test Suite...\n');

  for (const endpoint of apis) {
    try {
      console.log(`Testing: ${endpoint}`);
      const startTime = Date.now();
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let result = {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        headers: Object.fromEntries(response.headers.entries())
      };

      if (response.ok) {
        try {
          const data = await response.json();
          result.success = data.success || true;
          result.dataStructure = {
            hasData: !!data.data,
            hasArticles: !!(data.data?.articles),
            hasMarketData: !!(data.data?.marketTicker || data.data?.marketData),
            hasApiStatus: !!(data.data?.apiStatus || data.apiStatus),
            articleCount: data.data?.articles?.length || 0
          };
          
          // Check for rate limiting indicators
          if (data.data?.apiStatus) {
            result.apiStatus = data.data.apiStatus;
          }
          
          console.log(`✅ SUCCESS - ${response.status} (${responseTime}ms)`);
          if (data.data?.apiStatus?.message) {
            console.log(`   Status: ${data.data.apiStatus.message}`);
          }
        } catch (parseError) {
          result.parseError = parseError.message;
          console.log(`⚠️  SUCCESS but JSON parse failed - ${response.status} (${responseTime}ms)`);
        }
      } else {
        console.log(`❌ FAILED - ${response.status} ${response.statusText} (${responseTime}ms)`);
      }
      
      console.log(`   Response time: ${responseTime}ms\n`);
      
      // Store result for summary
      window.apiTestResults = window.apiTestResults || [];
      window.apiTestResults.push(result);
      
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}\n`);
      
      window.apiTestResults = window.apiTestResults || [];
      window.apiTestResults.push({
        endpoint,
        error: error.message,
        status: 'ERROR'
      });
    }
    
    // Small delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎯 API Test Summary:');
  console.log('==================');
  
  const results = window.apiTestResults || [];
  const successful = results.filter(r => r.status === 200 || r.success);
  const failed = results.filter(r => r.status !== 200 && !r.success);
  const errors = results.filter(r => r.error);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  console.log(`⚠️  Errors: ${errors.length}/${results.length}`);
  
  // Show rate limit status
  const rateLimited = results.filter(r => 
    r.apiStatus?.message?.includes('rate limit') || 
    r.apiStatus?.message?.includes('limit exceeded') ||
    r.apiStatus?.isRateLimit
  );
  
  if (rateLimited.length > 0) {
    console.log(`⏱️  Rate Limited: ${rateLimited.length} APIs`);
    rateLimited.forEach(r => {
      console.log(`   ${r.endpoint}: ${r.apiStatus.message}`);
    });
  }
  
  return window.apiTestResults;
};

// Auto-run the test
testAPIs().then(results => {
  console.log('\n🏁 All API tests completed!');
  console.log('Full results available in window.apiTestResults');
});
