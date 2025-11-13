/**
 * List Available OpenAI Models
 * 
 * This script lists all available OpenAI models for your account
 * 
 * Usage: npx tsx scripts/list-openai-models.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModels() {
  console.log('📋 Listing Available OpenAI Models...\n');

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ERROR: OPENAI_API_KEY not found');
    process.exit(1);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      process.exit(1);
    }

    const data = await response.json();
    
    // Filter for GPT models only
    const gptModels = data.data
      .filter((model: any) => model.id.includes('gpt'))
      .sort((a: any, b: any) => a.id.localeCompare(b.id));

    console.log('🤖 Available GPT Models:\n');
    
    gptModels.forEach((model: any) => {
      console.log(`   ✅ ${model.id}`);
    });

    console.log(`\n📊 Total GPT Models: ${gptModels.length}\n`);

    // Highlight recommended models
    console.log('🎯 Recommended Models for ATGE:\n');
    const recommended = [
      'gpt-4o',
      'gpt-4o-2024-08-06',
      'gpt-4-turbo',
      'gpt-4-turbo-2024-04-09',
      'o1-preview',
      'o1-mini'
    ];

    recommended.forEach(modelName => {
      const exists = gptModels.find((m: any) => m.id === modelName);
      if (exists) {
        console.log(`   ✅ ${modelName} (Available)`);
      } else {
        console.log(`   ❌ ${modelName} (Not Available)`);
      }
    });

    console.log('');

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Run the script
listModels()
  .then(() => {
    console.log('✅ Model list retrieved successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
