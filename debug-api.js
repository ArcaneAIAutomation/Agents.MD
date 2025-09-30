// Debug script to see what's being returned
const BASE_URL = 'https://agents-pmn0rtss8-arcane-ai-automations-projects.vercel.app';

async function debugAPI(endpoint) {
  try {
    console.log(`\n🔍 Testing ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const text = await response.text();
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    console.log(`Response (first 500 chars): ${text.substring(0, 500)}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runDebug() {
  await debugAPI('/api/health-check');
  await debugAPI('/api/btc-analysis-simple');
}

runDebug();