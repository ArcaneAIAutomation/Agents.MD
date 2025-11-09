/**
 * Script to update UCIE endpoints with optional authentication
 * 
 * This script updates all UCIE data collection endpoints to use
 * withOptionalAuth middleware for user tracking.
 * 
 * Run: npx tsx scripts/update-ucie-endpoints-for-user-tracking.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Endpoints to update
const endpoints = [
  'pages/api/ucie/sentiment/[symbol].ts',
  'pages/api/ucie/technical/[symbol].ts',
  'pages/api/ucie/news/[symbol].ts',
  'pages/api/ucie/on-chain/[symbol].ts',
  'pages/api/ucie/risk/[symbol].ts',
  'pages/api/ucie/predictions/[symbol].ts',
  'pages/api/ucie/derivatives/[symbol].ts',
  'pages/api/ucie/defi/[symbol].ts',
  'pages/api/ucie/research/[symbol].ts',
  'pages/api/ucie/preview-data/[symbol].ts',
];

function updateEndpoint(filePath: string): boolean {
  try {
    console.log(`\n📝 Updating ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // Step 1: Add imports if not present
    if (!content.includes('withOptionalAuth')) {
      const importLine = "import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';";
      
      // Find the last import statement
      const lastImportMatch = content.match(/import[^;]+;(?=\n\n)/g);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        content = content.replace(lastImport, `${lastImport}\n${importLine}`);
        modified = true;
        console.log('  ✅ Added imports');
      }
    }
    
    // Step 2: Update handler signature
    if (content.includes('export default async function handler')) {
      content = content.replace(
        /export default async function handler\(\s*req: NextApiRequest,/g,
        'async function handler(\n  req: AuthenticatedRequest,'
      );
      modified = true;
      console.log('  ✅ Updated handler signature');
    }
    
    // Step 3: Add user extraction at start of handler
    if (!content.includes('const userId = req.user?.id')) {
      // Find the first line after handler opening brace
      const handlerMatch = content.match(/async function handler\([^)]+\)[^{]*{/);
      if (handlerMatch) {
        const userExtraction = `\n  // Get user info if authenticated (optional)\n  const userId = req.user?.id;\n  const userEmail = req.user?.email;\n`;
        content = content.replace(handlerMatch[0], handlerMatch[0] + userExtraction);
        modified = true;
        console.log('  ✅ Added user extraction');
      }
    }
    
    // Step 4: Update getCachedAnalysis calls
    const getCachedPattern = /getCachedAnalysis\(([^,]+),\s*'([^']+)'\)/g;
    if (getCachedPattern.test(content)) {
      content = content.replace(
        getCachedPattern,
        'getCachedAnalysis($1, \'$2\', userId, userEmail)'
      );
      modified = true;
      console.log('  ✅ Updated getCachedAnalysis calls');
    }
    
    // Step 5: Update setCachedAnalysis calls
    const setCachedPattern = /setCachedAnalysis\(([^,]+),\s*'([^']+)',\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/g;
    if (setCachedPattern.test(content)) {
      content = content.replace(
        setCachedPattern,
        'setCachedAnalysis($1, \'$2\', $3, $4, $5, userId, userEmail)'
      );
      modified = true;
      console.log('  ✅ Updated setCachedAnalysis calls');
    }
    
    // Step 6: Add export with middleware at end if not present
    if (!content.includes('export default withOptionalAuth')) {
      // Remove old export default if present
      content = content.replace(/\nexport default handler;?\s*$/, '');
      
      // Add new export
      content += '\n\n// Export with optional authentication middleware\nexport default withOptionalAuth(handler);\n';
      modified = true;
      console.log('  ✅ Added middleware export');
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`  ✅ Successfully updated ${filePath}`);
      return true;
    } else {
      console.log(`  ℹ️  No changes needed for ${filePath}`);
      return false;
    }
    
  } catch (error) {
    console.error(`  ❌ Error updating ${filePath}:`, error);
    return false;
  }
}

// Main execution
console.log('🚀 Starting UCIE endpoint updates for user tracking...\n');
console.log(`📊 Total endpoints to update: ${endpoints.length}\n`);

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (const endpoint of endpoints) {
  const result = updateEndpoint(endpoint);
  if (result === true) {
    successCount++;
  } else if (result === false) {
    skipCount++;
  } else {
    errorCount++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 Update Summary:');
console.log('='.repeat(60));
console.log(`✅ Successfully updated: ${successCount}`);
console.log(`ℹ️  Skipped (no changes): ${skipCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log('='.repeat(60));

if (successCount > 0) {
  console.log('\n✅ Updates complete! Next steps:');
  console.log('1. Review the changes with: git diff');
  console.log('2. Test the endpoints');
  console.log('3. Commit the changes');
  console.log('4. Deploy to production');
}

