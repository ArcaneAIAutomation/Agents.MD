/**
 * Update NULL user_id entries to 'system'
 * 
 * This updates existing cache entries that don't have a user_id
 * to use 'system' as the default user.
 */

import { config } from 'dotenv';
import { query } from '../lib/db';

// Load environment variables
config({ path: '.env.local' });

async function updateNullUserIds() {
  console.log('🔄 Updating NULL user_id entries...\n');

  try {
    // Update ucie_analysis_cache
    const cacheResult = await query(
      "UPDATE ucie_analysis_cache SET user_id = 'system' WHERE user_id IS NULL"
    );
    console.log(`✅ Updated ${cacheResult.rowCount || 0} entries in ucie_analysis_cache`);

    // For ucie_phase_data, just delete NULL entries (they're temporary session data anyway)
    const phaseResult = await query(
      "DELETE FROM ucie_phase_data WHERE user_id IS NULL"
    );
    console.log(`🗑️  Deleted ${phaseResult.rowCount || 0} NULL entries from ucie_phase_data (temporary session data)`);

    // Verify no NULL entries remain
    const verifyCache = await query(
      'SELECT COUNT(*) as count FROM ucie_analysis_cache WHERE user_id IS NULL'
    );
    const verifyPhase = await query(
      'SELECT COUNT(*) as count FROM ucie_phase_data WHERE user_id IS NULL'
    );

    console.log('\n📊 Verification:');
    console.log(`   ucie_analysis_cache NULL entries: ${verifyCache.rows[0].count}`);
    console.log(`   ucie_phase_data NULL entries: ${verifyPhase.rows[0].count}`);

    if (verifyCache.rows[0].count === '0' && verifyPhase.rows[0].count === '0') {
      console.log('\n✅ All NULL user_id entries have been updated!');
    } else {
      console.log('\n⚠️  Some NULL entries remain');
    }

  } catch (error) {
    console.error('❌ Failed to update NULL user_id entries:', error);
    process.exit(1);
  }
}

updateNullUserIds()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
