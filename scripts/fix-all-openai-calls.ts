/**
 * Fix ALL OpenAI API calls to use new Responses API
 * 
 * This script replaces all instances of:
 * - openai.chat.completions.create() → callOpenAI()
 * - max_tokens → max_completion_tokens
 * - completion.choices[0].message.content → result.content
 */

import * as fs from 'fs';
import * as path from 'path';

const filesToFix = [
  'pages/api/btc-analysis-enhanced.ts',
  'pages/api/eth-analysis-enhanced.ts',
  'pages/api/btc-analysis.ts',
  'pages/api/eth-analysis.ts',
  'pages/api/btc-analysis-simple.ts',
  'pages/api/eth-analysis-simple.ts',
  'pages/api/crypto-herald.ts',
  'pages/api/crypto-herald-clean.ts',
  'pages/api/crypto-herald-fast-15.ts',
  'pages/api/enhanced-trade-generation.ts',
  'pages/api/nexo-regulatory.ts',
  'pages/api/reliable-trade-generation.ts',
  'pages/api/simple-trade-generation.ts',
  'pages/api/trade-generation.ts',
  'pages/api/trade-generation-new.ts',
  'pages/api/ucie-technical.ts',
  'pages/api/ultimate-trade-generation.ts',
  'pages/api/ucie/openai-analysis/[symbol].ts',
  'pages/api/ucie/openai-summary/[symbol].ts',
];

function fixFile(filePath: string) {
  console.log(`\n📝 Fixing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;
  
  // Check if file already imports callOpenAI
  if (!content.includes('import { callOpenAI')) {
    // Add import at the top after other openai imports
    if (content.includes("import { openai")) {
      content = content.replace(
        /(import { openai[^}]*} from ['"].*openai['"];)/,
        "$1\nimport { callOpenAI } from '../../lib/openai';"
      );
      changes++;
      console.log('  ✅ Added callOpenAI import');
    } else if (content.includes("import OpenAI")) {
      content = content.replace(
        /(import OpenAI from ['"]openai['"];)/,
        "$1\nimport { callOpenAI } from '../../lib/openai';"
      );
      changes++;
      console.log('  ✅ Added callOpenAI import');
    }
  }
  
  // Replace openai.chat.completions.create with callOpenAI
  const oldPattern = /const\s+completion\s*=\s*await\s+openai\.chat\.completions\.create\(\{([^}]+model:\s*[^,]+,\s*messages:\s*\[[^\]]+\][^}]*)\}\);/gs;
  
  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, (match) => {
      // Extract messages array
      const messagesMatch = match.match(/messages:\s*(\[[^\]]+\])/s);
      const messages = messagesMatch ? messagesMatch[1] : '[]';
      
      // Extract max_tokens if present
      const maxTokensMatch = match.match(/max_tokens:\s*(\d+)/);
      const maxTokens = maxTokensMatch ? maxTokensMatch[1] : '1000';
      
      changes++;
      return `const result = await callOpenAI(${messages}, ${maxTokens});`;
    });
    console.log('  ✅ Replaced openai.chat.completions.create with callOpenAI');
  }
  
  // Replace completion.choices[0].message.content with result.content
  if (content.includes('completion.choices[0]?.message?.content')) {
    content = content.replace(/completion\.choices\[0\]\?\.message\?\.content/g, 'result.content');
    changes++;
    console.log('  ✅ Replaced completion.choices[0].message.content with result.content');
  }
  
  if (content.includes('completion.choices[0].message.content')) {
    content = content.replace(/completion\.choices\[0\]\.message\.content/g, 'result.content');
    changes++;
    console.log('  ✅ Replaced completion.choices[0].message.content with result.content');
  }
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Fixed ${changes} issues in ${filePath}`);
    return true;
  } else {
    console.log(`  ⏭️  No changes needed`);
    return false;
  }
}

console.log('🔧 Fixing ALL OpenAI API calls to use Responses API...\n');

let totalFixed = 0;
for (const file of filesToFix) {
  try {
    if (fixFile(file)) {
      totalFixed++;
    }
  } catch (error: any) {
    console.error(`  ❌ Error fixing ${file}:`, error.message);
  }
}

console.log(`\n✅ Fixed ${totalFixed}/${filesToFix.length} files`);
console.log('\n🚀 Ready to deploy!');
