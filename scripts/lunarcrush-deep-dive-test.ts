/**
 * LunarCrush API Deep Dive Test
 * 
 * CEO confirmed the API should work - let's find what we're missing
 * 
 * Testing multiple variations:
 * 1. Different authentication methods
 * 2. Different header combinations
 * 3. Different endpoint variations
 * 4. Different parameter combinations
 * 5. Raw response inspection
 * 
 * Run: npx tsx scripts/lunarcrush-deep-dive-test.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.LUNARCRUSH_API_KEY;
const SYMBOL = 'BTC';

interface TestVariation {
  name: string;
  url: string;
  headers: Record<string, string>;
  description: string;
}

/**
 * Test 1: Try different authentication methods
 */
async function testAuthenticationMethods() {
  console.log('\n🔐 TEST 1: Authentication Methods');
  console.log('='.repeat(60));
  
  const variations: TestVariation[] = [
    {
      name: 'Bearer Token (Current)',
      url: `https://lunarcrush.com/api4/public/coins/${SYMBOL}/v1?data=all`,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      },
      description: 'Standard Bearer token authentication'
    },
    {
      name: 'API Key Header',
      url: `https://lunarcrush.com/api4/public/coins/${SYMBOL}/v1?data=all`,
      headers: {
        'x-api-key': API_KEY!,
        'Accept': 'application/json'
      },
      description: 'API key in custom header'
    },
    {
      name: 'Query Parameter',
      url: `https://lunarcrush.com/api4/public/coins/${SYMBOL}/v1?data=all&api_key=${API_KEY}`,
      headers: {
        'Accept': 'application/json'
      },
      description: 'API key as query parameter'
    },
    {
      name: 'No Auth (Public)',
      url: `https://lunarcrush.com/api4/public/coins/${SYMBOL}/v1?data=all`,
      headers: {
        'Accept': 'application/json'
      },
      description: 'No authentication (public endpoint)'
    }
  ];

  for (const variation of variations) {
    try {
      console.log(`\n📝 Testing: ${variation.name}`);
      console.log(`   ${variation.description}`);
      console.log(`   URL: ${variation.url.substring(0, 80)}...`);
      
      const response = await fetch(variation.url, {
        headers: variation.headers,
        signal: AbortSignal.timeout(10000)
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        const topicData = data.data?.topic || data.data || data.topic || data;
        
        console.log(`   ✅ SUCCESS!`);
        console.log(`   Response structure:`, Object.keys(data).join(', '));
        console.log(`   Social metrics:`, {
          social_volume: topicData.social_volume,
          interactions_24h: topicData.interactions_24h,
          social_contributors: topicData.social_contributors
        });
      } else {
        console.log(`   ❌ Failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }
}

/**
 * Test 2: Try different endpoint variations
 */
async function testEndpointVariations() {
  console.log('\n\n🌐 TEST 2: Endpoint Variations');
  console.log('='.repeat(60));
  
  const endpoints = [
    {
      name: 'Current (with ?data=all)',
      url: `https://lunarcrush.com/api4/public/coins/${SYMBOL}/v1?data=all`
    },
    {
      name: 'Without ?data=all',
      url: `https://lunarcrush.com/api4/public/coins/${SYMBOL}/v1`
    },
    {
      name: 'With ?data=social',
      url: `https://lunarcrush.com/api4/public/coins/${SYMBOL}/v1?data=social`
    },
    {
      name: 'With ?data=metrics',
      url: `https://lunarcrush.com/api4/public/coins/${SYMBOL}/v1?data=metrics`
    },
    {
      name: 'With ?include=social',
      url: `https://lunarcrush.com/api4/public/coins/${SYMBOL}/v1?include=social`
    },
    {
      name: 'Lowercase symbol',
      url: `https://lunarcrush.com/api4/public/coins/${SYMBOL.toLowerCase()}/v1?data=all`
    },
    {
      name: 'Without /public/',
      url: `https://lunarcrush.com/api4/coins/${SYMBOL}/v1?data=all`
    },
    {
      name: 'Topic endpoint',
      url: `https://lunarcrush.com/api4/public/topic/${SYMBOL}/v1?data=all`
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📝 Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        const topicData = data.data?.topic || data.data || data.topic || data;
        
        console.log(`   ✅ SUCCESS!`);
        console.log(`   Has social_volume: ${topicData.social_volume !== undefined && topicData.social_volume !== null}`);
        console.log(`   Has interactions_24h: ${topicData.interactions_24h !== undefined && topicData.interactions_24h !== null}`);
        
        if (topicData.social_volume || topicData.interactions_24h) {
          console.log(`   🎉 FOUND SOCIAL METRICS!`);
          console.log(`   social_volume: ${topicData.social_volume}`);
          console.log(`   interactions_24h: ${topicData.interactions_24h}`);
        }
      } else {
        console.log(`   ❌ Failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }
}

/**
 * Test 3: Inspect raw response structure
 */
async function inspectRawResponse() {
  console.log('\n\n🔍 TEST 3: Raw Response Inspection');
  console.log('='.repeat(60));
  
  const url = `https://lunarcrush.com/api4/public/coins/${SYMBOL}/v1?data=all`;
  
  try {
    console.log(`\nFetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    console.log(`\nResponse Status: ${response.status} ${response.statusText}`);
    console.log(`Response Headers:`);
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    if (response.ok) {
      const rawText = await response.text();
      console.log(`\nRaw Response (first 2000 chars):`);
      console.log(rawText.substring(0, 2000));
      
      try {
        const data = JSON.parse(rawText);
        console.log(`\nParsed JSON Structure:`);
        console.log(JSON.stringify(data, null, 2).substring(0, 3000));
      } catch (e) {
        console.log(`\n❌ Failed to parse JSON: ${e}`);
      }
    }
  } catch (error) {
    console.log(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Test 4: Try feeds endpoint with different variations
 */
async function testFeedsEndpoint() {
  console.log('\n\n📰 TEST 4: Feeds Endpoint Variations');
  console.log('='.repeat(60));
  
  const feedEndpoints = [
    `https://lunarcrush.com/api4/public/feeds/v1?symbol=${SYMBOL}&limit=10`,
    `https://lunarcrush.com/api4/public/feeds/v1?coin=${SYMBOL}&limit=10`,
    `https://lunarcrush.com/api4/public/feeds?symbol=${SYMBOL}&limit=10`,
    `https://lunarcrush.com/api4/feeds/v1?symbol=${SYMBOL}&limit=10`,
    `https://lunarcrush.com/api4/public/posts/v1?symbol=${SYMBOL}&limit=10`,
    `https://lunarcrush.com/api4/public/social/v1?symbol=${SYMBOL}&limit=10`
  ];

  for (const url of feedEndpoints) {
    try {
      console.log(`\n📝 Testing: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS! Found working endpoint!`);
        console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 500));
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }
}

/**
 * Test 5: Check API key validity
 */
async function testAPIKeyValidity() {
  console.log('\n\n🔑 TEST 5: API Key Validity Check');
  console.log('='.repeat(60));
  
  console.log(`\nAPI Key: ${API_KEY?.substring(0, 10)}...${API_KEY?.substring(API_KEY.length - 5)}`);
  console.log(`API Key Length: ${API_KEY?.length} characters`);
  console.log(`API Key Format: ${API_KEY?.match(/^[a-z0-9]+$/) ? 'Valid (lowercase alphanumeric)' : 'Invalid format'}`);
  
  // Try a simple endpoint to verify key works at all
  const testUrl = `https://lunarcrush.com/api4/public/coins/${SYMBOL}/v1`;
  
  try {
    console.log(`\nTesting basic endpoint: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.log(`❌ API Key is INVALID or EXPIRED`);
    } else if (response.status === 403) {
      console.log(`❌ API Key is valid but LACKS PERMISSIONS`);
    } else if (response.ok) {
      console.log(`✅ API Key is VALID and WORKING`);
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Main test runner
 */
async function runDeepDive() {
  console.log('🚀 LunarCrush API Deep Dive Test');
  console.log('CEO confirmed it should work - finding the issue...');
  console.log('='.repeat(60));
  
  if (!API_KEY) {
    console.error('\n❌ ERROR: LUNARCRUSH_API_KEY not found in .env.local');
    process.exit(1);
  }

  await testAPIKeyValidity();
  await testAuthenticationMethods();
  await testEndpointVariations();
  await testFeedsEndpoint();
  await inspectRawResponse();
  
  console.log('\n\n' + '='.repeat(60));
  console.log('🏁 Deep Dive Complete');
  console.log('='.repeat(60));
  console.log('\nIf any test showed ✅ SUCCESS with social metrics,');
  console.log('that variation should be implemented in the code.');
  console.log('\n');
}

runDeepDive().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
