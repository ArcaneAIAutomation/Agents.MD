/**
 * Clear UCIE Cache - Remove Poisoned Data
 * 
 * This script clears all cached UCIE data from Supabase before
 * deploying the data shape fix. This prevents crashes from trying
 * to read old format data with new logic.
 * 
 * Run this BEFORE deploying the unwrapping fix.
 */

import { query } from '../lib/db';

async function clearUCIECache() {
  console.log('🧹 Clearing UCIE cache from Supabase...\n');
  
  try {
    // Delete all UCIE analysis cache entries
    const result = await query(
      `DELETE FROM ucie_analysis_cache 
       WHERE analysis_type IN (
         'market-data', 
         'sentiment', 
         'technical', 
         'news', 
         'on-chain'
       )
       RETURNING symbol, analysis_type`,
      []
    );
    
    console.log(`✅ Deleted ${result.rows.length} cache entries:`);
    
    // Group by type
    const byType: Record<string, number> = {};
    result.rows.forEach((row: any) => {
      byType[row.analysis_type] = (byType[row.analysis_type] || 0) + 1;
    });
    
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} entries`);
    });
    
    console.log('\n✅ Cache cleared successfully!');
    console.log('📝 Next step: Deploy the unwrapping fix');
    console.log('⚠️  Users will need to re-fetch data (cache miss on first request)');
    
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
    process.exit(1);
  }
}

clearUCIECache();
