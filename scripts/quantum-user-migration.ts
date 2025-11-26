/**
 * Quantum BTC User Migration Script
 * 
 * This script manages the gradual migration of users from ATGE to Quantum BTC
 * Requirements: 15.1-15.10
 * 
 * Usage:
 *   # Set rollout percentage (0-100)
 *   npx tsx scripts/quantum-user-migration.ts --percentage 25
 *   
 *   # Monitor migration status
 *   npx tsx scripts/quantum-user-migration.ts --status
 *   
 *   # Rollback to ATGE
 *   npx tsx scripts/quantum-user-migration.ts --rollback
 */

import { query, queryOne, queryMany } from '../lib/db';

interface MigrationStatus {
  rolloutPercentage: number;
  totalUsers: number;
  quantumUsers: number;
  atgeUsers: number;
  quantumTrades24h: number;
  atgeTrades24h: number;
  quantumAvgConfidence: number;
  atgeAvgConfidence: number;
  anomalies24h: number;
}

/**
 * Get current migration status
 */
async function getMigrationStatus(): Promise<MigrationStatus> {
  try {
    // Get rollout percentage
    const rolloutResult = await queryOne(`
      SELECT quantum_btc_rollout_percentage, quantum_btc_enabled
      FROM global_feature_flags
      LIMIT 1
    `);
    
    const rolloutPercentage = rolloutResult?.quantum_btc_rollout_percentage || 0;
    
    // Get user counts
    const userCountResult = await queryOne(`
      SELECT COUNT(*) as total FROM users
    `);
    const totalUsers = parseInt(userCountResult.total);
    
    // Estimate quantum users based on rollout percentage
    const quantumUsers = Math.floor(totalUsers * (rolloutPercentage / 100));
    const atgeUsers = totalUsers - quantumUsers;
    
    // Get trade counts (last 24 hours)
    const quantumTradesResult = await queryOne(`
      SELECT COUNT(*) as count
      FROM btc_trades
      WHERE generated_at > NOW() - INTERVAL '24 hours'
    `);
    const quantumTrades24h = parseInt(quantumTradesResult.count);
    
    const atgeTradesResult = await queryOne(`
      SELECT COUNT(*) as count
      FROM trade_signals
      WHERE generated_at > NOW() - INTERVAL '24 hours'
        AND symbol = 'BTC'
    `);
    const atgeTrades24h = parseInt(atgeTradesResult.count);
    
    // Get average confidence scores
    const quantumConfidenceResult = await queryOne(`
      SELECT AVG(confidence_score) as avg
      FROM btc_trades
      WHERE generated_at > NOW() - INTERVAL '24 hours'
    `);
    const quantumAvgConfidence = parseFloat(quantumConfidenceResult.avg) || 0;
    
    const atgeConfidenceResult = await queryOne(`
      SELECT AVG(confidence_score) as avg
      FROM trade_signals
      WHERE generated_at > NOW() - INTERVAL '24 hours'
        AND symbol = 'BTC'
    `);
    const atgeAvgConfidence = parseFloat(atgeConfidenceResult.avg) || 0;
    
    // Get anomaly count
    const anomalyResult = await queryOne(`
      SELECT COUNT(*) as count
      FROM quantum_anomaly_logs
      WHERE detected_at > NOW() - INTERVAL '24 hours'
    `);
    const anomalies24h = parseInt(anomalyResult.count);
    
    return {
      rolloutPercentage,
      totalUsers,
      quantumUsers,
      atgeUsers,
      quantumTrades24h,
      atgeTrades24h,
      quantumAvgConfidence,
      atgeAvgConfidence,
      anomalies24h
    };
  } catch (error: any) {
    console.error('Error getting migration status:', error.message);
    throw error;
  }
}

/**
 * Display migration status
 */
async function displayStatus() {
  console.log('📊 Quantum BTC Migration Status\n');
  console.log('=' .repeat(60));
  
  const status = await getMigrationStatus();
  
  console.log('\n🎯 Rollout Configuration:');
  console.log(`   Rollout Percentage: ${status.rolloutPercentage}%`);
  console.log(`   Total Users: ${status.totalUsers.toLocaleString()}`);
  console.log(`   Quantum BTC Users: ${status.quantumUsers.toLocaleString()} (${status.rolloutPercentage}%)`);
  console.log(`   ATGE Users: ${status.atgeUsers.toLocaleString()} (${100 - status.rolloutPercentage}%)`);
  
  console.log('\n📈 Trade Activity (Last 24 Hours):');
  console.log(`   Quantum BTC Trades: ${status.quantumTrades24h.toLocaleString()}`);
  console.log(`   ATGE Trades: ${status.atgeTrades24h.toLocaleString()}`);
  console.log(`   Total Trades: ${(status.quantumTrades24h + status.atgeTrades24h).toLocaleString()}`);
  
  console.log('\n🎲 Performance Metrics:');
  console.log(`   Quantum BTC Avg Confidence: ${status.quantumAvgConfidence.toFixed(2)}%`);
  console.log(`   ATGE Avg Confidence: ${status.atgeAvgConfidence.toFixed(2)}%`);
  
  if (status.quantumAvgConfidence > status.atgeAvgConfidence) {
    console.log(`   ✅ Quantum BTC performing ${(status.quantumAvgConfidence - status.atgeAvgConfidence).toFixed(2)}% better`);
  } else if (status.atgeAvgConfidence > status.quantumAvgConfidence) {
    console.log(`   ⚠️ ATGE performing ${(status.atgeAvgConfidence - status.quantumAvgConfidence).toFixed(2)}% better`);
  } else {
    console.log(`   ➡️ Both systems performing equally`);
  }
  
  console.log('\n⚠️ Anomalies (Last 24 Hours):');
  console.log(`   Total Anomalies: ${status.anomalies24h}`);
  
  if (status.anomalies24h === 0) {
    console.log(`   ✅ No anomalies detected`);
  } else if (status.anomalies24h < 10) {
    console.log(`   ⚠️ Low anomaly count - monitor closely`);
  } else {
    console.log(`   ❌ High anomaly count - consider rollback`);
  }
  
  console.log('\n' + '=' .repeat(60));
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (status.rolloutPercentage === 0) {
    console.log('   - Start with 10% rollout to test Quantum BTC');
    console.log('   - Run: npx tsx scripts/quantum-user-migration.ts --percentage 10');
  } else if (status.rolloutPercentage < 25) {
    if (status.anomalies24h < 5 && status.quantumAvgConfidence >= status.atgeAvgConfidence) {
      console.log('   - System stable, consider increasing to 25%');
      console.log('   - Run: npx tsx scripts/quantum-user-migration.ts --percentage 25');
    } else {
      console.log('   - Monitor for 24-48 hours before increasing rollout');
    }
  } else if (status.rolloutPercentage < 60) {
    if (status.anomalies24h < 10 && status.quantumAvgConfidence >= status.atgeAvgConfidence * 0.95) {
      console.log('   - System performing well, consider increasing to 60%');
      console.log('   - Run: npx tsx scripts/quantum-user-migration.ts --percentage 60');
    } else {
      console.log('   - Monitor performance before further rollout');
    }
  } else if (status.rolloutPercentage < 100) {
    if (status.anomalies24h < 15 && status.quantumAvgConfidence >= status.atgeAvgConfidence * 0.90) {
      console.log('   - Ready for full rollout to 100%');
      console.log('   - Run: npx tsx scripts/quantum-user-migration.ts --percentage 100');
    } else {
      console.log('   - Address anomalies before full rollout');
    }
  } else {
    console.log('   - ✅ Full migration complete!');
    console.log('   - Monitor for 7 days before deprecating ATGE');
  }
  
  console.log('');
}

/**
 * Set rollout percentage
 */
async function setRolloutPercentage(percentage: number) {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Rollout percentage must be between 0 and 100');
  }
  
  console.log(`🚀 Setting Quantum BTC rollout to ${percentage}%...\n`);
  
  // Check if global_feature_flags table exists
  const tableExists = await queryOne(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'global_feature_flags'
    ) as exists
  `);
  
  if (!tableExists.exists) {
    console.log('📋 Creating global_feature_flags table...');
    await query(`
      CREATE TABLE IF NOT EXISTS global_feature_flags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quantum_btc_rollout_percentage INTEGER NOT NULL DEFAULT 0,
        quantum_btc_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    
    await query(`
      INSERT INTO global_feature_flags (quantum_btc_rollout_percentage, quantum_btc_enabled)
      VALUES (0, FALSE)
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✅ Table created\n');
  }
  
  // Update rollout percentage
  await query(`
    UPDATE global_feature_flags
    SET quantum_btc_rollout_percentage = $1,
        quantum_btc_enabled = $2,
        updated_at = NOW()
  `, [percentage, percentage > 0]);
  
  console.log(`✅ Rollout percentage set to ${percentage}%\n`);
  
  // Display updated status
  await displayStatus();
}

/**
 * Rollback to ATGE
 */
async function rollback() {
  console.log('⏪ Rolling back to ATGE...\n');
  
  await query(`
    UPDATE global_feature_flags
    SET quantum_btc_rollout_percentage = 0,
        quantum_btc_enabled = FALSE,
        updated_at = NOW()
  `);
  
  console.log('✅ Rollback complete - All users now using ATGE\n');
  
  // Display status
  await displayStatus();
}

/**
 * Monitor migration performance
 */
async function monitorPerformance() {
  console.log('📊 Quantum BTC Performance Monitoring\n');
  console.log('=' .repeat(60));
  
  // Get performance comparison
  const comparison = await queryMany(`
    SELECT 
      'Quantum BTC' as system,
      COUNT(*) as total_trades,
      AVG(confidence_score) as avg_confidence,
      SUM(CASE WHEN status = 'HIT' THEN 1 ELSE 0 END) as successful_trades,
      ROUND(SUM(CASE WHEN status = 'HIT' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100, 2) as success_rate
    FROM btc_trades
    WHERE generated_at > NOW() - INTERVAL '7 days'
    
    UNION ALL
    
    SELECT 
      'ATGE' as system,
      COUNT(*) as total_trades,
      AVG(confidence_score) as avg_confidence,
      SUM(CASE WHEN status = 'completed_success' THEN 1 ELSE 0 END) as successful_trades,
      ROUND(SUM(CASE WHEN status = 'completed_success' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100, 2) as success_rate
    FROM trade_signals
    WHERE generated_at > NOW() - INTERVAL '7 days'
      AND symbol = 'BTC'
  `);
  
  console.log('\n📈 7-Day Performance Comparison:\n');
  
  comparison.forEach((row: any) => {
    console.log(`${row.system}:`);
    console.log(`   Total Trades: ${row.total_trades}`);
    console.log(`   Avg Confidence: ${parseFloat(row.avg_confidence).toFixed(2)}%`);
    console.log(`   Successful Trades: ${row.successful_trades}`);
    console.log(`   Success Rate: ${row.success_rate}%`);
    console.log('');
  });
  
  console.log('=' .repeat(60));
  console.log('');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--status')) {
      await displayStatus();
    } else if (args.includes('--percentage')) {
      const percentageIndex = args.indexOf('--percentage');
      const percentage = parseInt(args[percentageIndex + 1]);
      
      if (isNaN(percentage)) {
        throw new Error('Invalid percentage value');
      }
      
      await setRolloutPercentage(percentage);
    } else if (args.includes('--rollback')) {
      await rollback();
    } else if (args.includes('--monitor')) {
      await monitorPerformance();
    } else {
      console.log('Quantum BTC User Migration Script\n');
      console.log('Usage:');
      console.log('  npx tsx scripts/quantum-user-migration.ts --status');
      console.log('  npx tsx scripts/quantum-user-migration.ts --percentage <0-100>');
      console.log('  npx tsx scripts/quantum-user-migration.ts --rollback');
      console.log('  npx tsx scripts/quantum-user-migration.ts --monitor');
      console.log('');
      console.log('Examples:');
      console.log('  npx tsx scripts/quantum-user-migration.ts --status');
      console.log('  npx tsx scripts/quantum-user-migration.ts --percentage 25');
      console.log('  npx tsx scripts/quantum-user-migration.ts --rollback');
      console.log('  npx tsx scripts/quantum-user-migration.ts --monitor');
      console.log('');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run main function
main();
