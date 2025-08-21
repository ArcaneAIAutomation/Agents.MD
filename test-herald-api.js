// Test script to verify Herald API with web scraping
const http = require('http');

console.log('🧪 Testing Herald API with Web Scraping...\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/crypto-herald',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      console.log('📊 API Response Summary:');
      console.log(`- Total Articles: ${response.meta.totalArticles}`);
      console.log(`- Live Data: ${response.meta.isLiveData ? '✅ YES' : '❌ NO'}`);
      console.log(`- Sources: ${response.meta.sources.join(', ')}`);
      console.log(`- Last Updated: ${response.meta.lastUpdated}\n`);
      
      if (response.meta.sources.includes('Crypto Websites')) {
        console.log('🌐 Web Scraping ACTIVE - Enhanced with crypto news websites!');
      } else {
        console.log('🔍 Web scraping not detected in sources');
      }
      
      console.log('\n📰 Sample Articles:');
      response.articles.slice(0, 5).forEach((article, index) => {
        console.log(`${index + 1}. ${article.headline}`);
        console.log(`   Source: ${article.source} | Category: ${article.category}`);
        if (article.url) {
          console.log(`   URL: ${article.url}`);
        }
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Failed to parse API response:', error);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('Make sure the development server is running on port 3000');
});

req.end();
