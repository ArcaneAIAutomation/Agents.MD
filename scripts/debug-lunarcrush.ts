/**
 * Debug LunarCrush API Response Structure
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugLunarCrush() {
  console.log('🔍 Debugging LunarCrush API Response Structure\n');
  
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.log('❌ LUNARCRUSH_API_KEY not configured');
    return;
  }
  
  console.log('✅ API Key configured');
  console.log(`   Key preview: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);
  
  const symbol = 'BTC';
  const url = `https://lunarcrush.com/api4/public/coins/${symbol}/v1`;
  
  console.log(`📡 Testing endpoint: ${url}\n`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ Full Response Structure:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(data, null, 2));
    console.log('='.repeat(60));
    
    if (data.data) {
      console.log('\n📋 Available Fields in data.data:');
      console.log('='.repeat(60));
      Object.keys(data.data).forEach(key => {
        const value = data.data[key];
        const type = typeof value;
        const preview = type === 'object' ? JSON.stringify(value).substring(0, 50) : value;
        console.log(`  ${key}: ${preview} (${type})`);
      });
      console.log('='.repeat(60));
      
      // Check for social metrics
      console.log('\n🔍 Social Metrics Analysis:');
      console.log('='.repeat(60));
      
      const socialFields = [
        'sentiment',
        'social_dominance',
        'social_score',
        'social_volume',
        'social_volume_24h',
        'num_influencers',
        'influencers',
        'galaxy_score',
        'alt_rank',
        'interactions',
        'posts',
        'contributors',
        'social_contributors',
        'social_engagement',
        'reddit_posts',
        'reddit_comments',
        'twitter_posts',
        'twitter_followers',
      ];
      
      socialFields.forEach(field => {
        if (data.data[field] !== undefined) {
          console.log(`  ✅ ${field}: ${data.data[field]}`);
        } else {
          console.log(`  ❌ ${field}: NOT FOUND`);
        }
      });
      console.log('='.repeat(60));
    }
    
  } catch (error) {
    console.log('❌ Error:', error);
  }
}

debugLunarCrush();
