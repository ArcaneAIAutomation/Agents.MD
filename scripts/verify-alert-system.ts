/**
 * Verify Alert System Status
 * 
 * Quick verification that the alert system is operational
 */

import { veritasAlertSystem } from '../lib/ucie/veritas/utils/alertSystem';
import { testConnection } from '../lib/db';

async function verify() {
  console.log('🔍 Verifying Alert System Status...\n');
  
  // Check database
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }
  console.log('✅ Database connected\n');
  
  // Get statistics
  const stats = await veritasAlertSystem.getAlertStatistics();
  
  console.log('📊 Alert System Statistics:');
  console.log(`   Total Alerts: ${stats.total}`);
  console.log(`   Pending: ${stats.pending}`);
  console.log(`   Reviewed: ${stats.reviewed}`);
  console.log(`   By Severity:`, stats.bySeverity);
  console.log(`   By Type:`, stats.byType);
  console.log('\n✅ Alert system is operational!\n');
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
