/**
 * Clear UCIE Cache Data from Supabase
 * 
 * This script clears all cached UCIE analysis data from the database
 * to allow for clean testing of the UCIE system.
 * 
 * Usage:
 *   npx tsx scripts/clear-ucie-cache.ts
 *   npx tsx scripts/clear-ucie-cache.ts BTC  # Clear only BTC data
 *   npx tsx scripts/clear-ucie-cache.ts --all # Clear all data including OpenAI summaries
 */

import { query } from '../lib/db';

async function clearUCIECache(symbol?: string, clearAll: boolean = false) {
  console.log('🗑️  UCIE Cache Cleanup Script\n');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await query('SELECT NOW()');
    console.log('✅ Database connected\n');
    
    if (clearAll) {
      // Clear ALL UCIE data
      console.log('⚠️  CLEARING ALL UCIE DATA (including OpenAI summaries)...\n');
      
      // Clear ucie_analysis_cache
      const result1 = await query('DELETE FROM ucie_analysis_cache');
      console.log(`✅ Cleared ${result1.rowCount || 0} entries from ucie_analysis_cache`);
      
      // Clear ucie_phase_data
      const result2 = await query('DELETE FROM ucie_phase_data');
      console.log(`✅ Cleared ${result2.rowCount || 0} entries from ucie_phase_data`);
      
      // Clear ucie_openai_analysis
      const result3 = await query('DELETE FROM ucie_openai_analysis');
      console.log(`✅ Cleared ${result3.rowCount || 0} entries from ucie_openai_analysis`);
      
      console.log('\n🎉 All UCIE cache data cleared!');
      
    } else if (symbol) {
      // Clear data for specific symbol
      console.log(`⚠️  CLEARING UCIE DATA FOR ${symbol.toUpperCase()}...\n`);
      
      const symbolUpper = symbol.toUpperCase();
      
      // Clear ucie_analysis_cache for symbol
      const result1 = await query(
        'DELETE FROM ucie_analysis_cache WHERE symbol = $1',
        [symbolUpper]
      );
      console.log(`✅ Cleared ${result1.rowCount || 0} entries from ucie_analysis_cache for ${symbolUpper}`);
      
      // Clear ucie_phase_data for symbol
      const result2 = await query(
        'DELETE FROM ucie_phase_data WHERE symbol = $1',
        [symbolUpper]
      );
      console.log(`✅ Cleared ${result2.rowCount || 0} entries from ucie_phase_data for ${symbolUpper}`);
      
      // Clear ucie_openai_analysis for symbol
      const result3 = await query(
        'DELETE FROM ucie_openai_analysis WHERE symbol = $1',
        [symbolUpper]
      );
      console.log(`✅ Cleared ${result3.rowCount || 0} entries from ucie_openai_analysis for ${symbolUpper}`);
      
      console.log(`\n🎉 All UCIE cache data cleared for ${symbolUpper}!`);
      
    } else {
      // Clear only expired cache entries (default behavior)
      console.log('⚠️  CLEARING EXPIRED UCIE CACHE ENTRIES...\n');
      
      // Clear expired ucie_analysis_cache entries
      const result1 = await query(
        'DELETE FROM ucie_analysis_cache WHERE expires_at < NOW()'
      );
      console.log(`✅ Cleared ${result1.rowCount || 0} expired entries from ucie_analysis_cache`);
      
      // Clear expired ucie_phase_data entries
      const result2 = await query(
        'DELETE FROM ucie_phase_data WHERE expires_at < NOW()'
      );
      console.log(`✅ Cleared ${result2.rowCount || 0} expired entries from ucie_phase_data`);
      
      // Clear expired ucie_openai_analysis entries
      const result3 = await query(
        'DELETE FROM ucie_openai_analysis WHERE expires_at < NOW()'
      );
      console.log(`✅ Cleared ${result3.rowCount || 0} expired entries from ucie_openai_analysis`);
      
      console.log('\n🎉 Expired UCIE cache entries cleared!');
      console.log('\n💡 Tip: Use "npx tsx scripts/clear-ucie-cache.ts BTC" to clear specific symbol');
      console.log('💡 Tip: Use "npx tsx scripts/clear-ucie-cache.ts --all" to clear ALL data');
    }
    
    // Show remaining cache stats
    console.log('\n📊 Remaining Cache Statistics:');
    
    const stats1 = await query('SELECT COUNT(*) as count FROM ucie_analysis_cache');
    console.log(`   ucie_analysis_cache: ${stats1.rows[0].count} entries`);
    
    const stats2 = await query('SELECT COUNT(*) as count FROM ucie_phase_data');
    console.log(`   ucie_phase_data: ${stats2.rows[0].count} entries`);
    
    const stats3 = await query('SELECT COUNT(*) as count FROM ucie_openai_analysis');
    console.log(`   ucie_openai_analysis: ${stats3.rows[0].count} entries`);
    
    // Show cache by symbol
    const symbolStats = await query(`
      SELECT symbol, COUNT(*) as count 
      FROM ucie_analysis_cache 
      GROUP BY symbol 
      ORDER BY count DESC
    `);
    
    if (symbolStats.rows.length > 0) {
      console.log('\n📈 Cache by Symbol:');
      symbolStats.rows.forEach((row: any) => {
        console.log(`   ${row.symbol}: ${row.count} entries`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error clearing UCIE cache:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Parse command line arguments
const args = process.argv.slice(2);
const clearAll = args.includes('--all');
const symbol = args.find(arg => !arg.startsWith('--'));

// Run the cleanup
clearUCIECache(symbol, clearAll);
