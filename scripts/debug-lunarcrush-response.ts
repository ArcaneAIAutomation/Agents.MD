/**
 * Debug LunarCrush API Response Structure
 * 
 * This script dumps the complete raw response from LunarCrush
 * to help diagnose why social metrics are returning N/A
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function debugLunarCrushResponse() {
  console.log('🔍 Debugging LunarCrush API Response Structure\n');
  
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.error('❌ LUNARCRUSH_API_KEY not configured');
    process.exit(1);
  }
  
  console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...`);
  
  const symbol = 'BTC';
  const url = `https://lunarcrush.com/api4/public/coins/${symbol}/v1`;
  
  console.log(`\n📡 Fetching: ${url}\n`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📊 Response Headers:`);
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ API Error Response:`);
      console.error(errorText);
      process.exit(1);
    }
    
    const json = await response.json();
    
    console.log(`\n📦 Complete Raw Response:`);
    console.log(JSON.stringify(json, null, 2));
    
    console.log(`\n🔍 Response Structure Analysis:`);
    console.log(`   Top-level keys: ${Object.keys(json).join(', ')}`);
    
    if (json.data) {
      console.log(`   data keys: ${Object.keys(json.data).join(', ')}`);
      
      if (json.data.topic) {
        console.log(`   data.topic keys: ${Object.keys(json.data.topic).join(', ')}`);
      }
    }
    
    // Check for the specific fields we need
    const data = json.data?.topic || json.data;
    
    console.log(`\n✅ Field Availability Check:`);
    const fields = [
      'galaxy_score',
      'alt_rank',
      'interactions_24h',
      'posts_active_24h',
      'creators_active_24h',
      'social_dominance',
      'sentiment',
      'sentiment_absolute',
      'sentiment_relative',
      'social_volume',
      'num_posts',
      'social_contributors',
    ];
    
    fields.forEach(field => {
      const value = data[field];
      const status = value !== undefined && value !== null ? '✅' : '❌';
      console.log(`   ${status} ${field}: ${value !== undefined ? value : 'undefined'}`);
    });
    
  } catch (error) {
    console.error(`\n❌ Error:`, error);
  }
}

// Run debug
debugLunarCrushResponse().catch(console.error);
