#!/usr/bin/env tsx
/**
 * Einstein Trade Engine - Monitoring Script
 * 
 * Monitors production deployment health and performance
 * Run this daily or after deployment
 */

import { query } from '../lib/db';

interface MonitoringMetrics {
  signalsGenerated24h: number;
  avgDataQuality: number;
  avgConfidence: number;
  approvalRate: number;
  errorRate: number;
  avgGenerationTime: number;
  activeUsers: number;
}

async function monitorProduction(): Promise<MonitoringMetrics> {
  console.log('📊 Einstein Trade Engine - Production Monitoring');
  console.log('='.repeat(80));
  console.log('');
  
  const metrics: Partial<MonitoringMetrics> = {};
  
  try {
    // 1. Signals generated in last 24 hours
    console.log('🔍 Checking signal generation rate...');
    const signalsResult = await query(
      `SELECT COUNT(*) as count 
       FROM einstein_trade_signals 
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );
    metrics.signalsGenerated24h = parseInt(signalsResult.rows[0].count);
    console.log(`   Signals (24h): ${metrics.signalsGenerated24h}`);
    
    // 2. Average data quality
    console.log('');
    console.log('🔍 Checking data quality...');
    const qualityResult = await query(
      `SELECT AVG(data_quality_score) as avg_quality 
       FROM einstein_trade_signals 
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );
    metrics.avgDataQuality = parseFloat(qualityResult.rows[0].avg_quality || '0');
    console.log(`   Avg Data Quality: ${metrics.avgDataQuality.toFixed(1)}%`);
    
    if (metrics.avgDataQuality < 90) {
      console.log(`   ⚠️  WARNING: Data quality below 90% threshold`);
    } else {
      console.log(`   ✅ Data quality acceptable`);
    }
    
    // 3. Average confidence
    console.log('');
    console.log('🔍 Checking confidence scores...');
    const confidenceResult = await query(
      `SELECT AVG(confidence_score) as avg_confidence 
       FROM einstein_trade_signals 
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );
    metrics.avgConfidence = parseFloat(confidenceResult.rows[0].avg_confidence || '0');
    console.log(`   Avg Confidence: ${metrics.avgConfidence.toFixed(1)}%`);
    
    if (metrics.avgConfidence < 70) {
      console.log(`   ⚠️  WARNING: Confidence below 70%`);
    } else {
      console.log(`   ✅ Confidence acceptable`);
    }
    
    // 4. Approval rate
    console.log('');
    console.log('🔍 Checking approval rate...');
    const approvalResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved
       FROM einstein_trade_signals 
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );
    const total = parseInt(approvalResult.rows[0].total);
    const approved = parseInt(approvalResult.rows[0].approved);
    metrics.approvalRate = total > 0 ? (approved / total) * 100 : 0;
    console.log(`   Approval Rate: ${metrics.approvalRate.toFixed(1)}% (${approved}/${total})`);
    
    // 5. Error rate
    console.log('');
    console.log('🔍 Checking error rate...');
    const errorResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'ERROR' THEN 1 END) as errors
       FROM einstein_trade_signals 
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );
    const totalSignals = parseInt(errorResult.rows[0].total);
    const errors = parseInt(errorResult.rows[0].errors || '0');
    metrics.errorRate = totalSignals > 0 ? (errors / totalSignals) * 100 : 0;
    console.log(`   Error Rate: ${metrics.errorRate.toFixed(1)}% (${errors}/${totalSignals})`);
    
    if (metrics.errorRate > 5) {
      console.log(`   ⚠️  WARNING: Error rate above 5% threshold`);
    } else {
      console.log(`   ✅ Error rate acceptable`);
    }
    
    // 6. Active users
    console.log('');
    console.log('🔍 Checking active users...');
    const usersResult = await query(
      `SELECT COUNT(DISTINCT user_id) as active_users 
       FROM einstein_trade_signals 
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );
    metrics.activeUsers = parseInt(usersResult.rows[0].active_users || '0');
    console.log(`   Active Users (24h): ${metrics.activeUsers}`);
    
    // 7. Database health
    console.log('');
    console.log('🔍 Checking database health...');
    const dbSizeResult = await query(
      `SELECT 
        pg_size_pretty(pg_database_size(current_database())) as db_size,
        pg_size_pretty(pg_total_relation_size('einstein_trade_signals')) as signals_size,
        pg_size_pretty(pg_total_relation_size('einstein_analysis_cache')) as cache_size
      `
    );
    console.log(`   Database Size: ${dbSizeResult.rows[0].db_size}`);
    console.log(`   Signals Table: ${dbSizeResult.rows[0].signals_size}`);
    console.log(`   Cache Table: ${dbSizeResult.rows[0].cache_size}`);
    
    // 8. Cache efficiency
    console.log('');
    console.log('🔍 Checking cache efficiency...');
    const cacheResult = await query(
      `SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as valid_entries,
        COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_entries
       FROM einstein_analysis_cache`
    );
    const totalCache = parseInt(cacheResult.rows[0].total_entries);
    const validCache = parseInt(cacheResult.rows[0].valid_entries);
    const expiredCache = parseInt(cacheResult.rows[0].expired_entries);
    console.log(`   Total Cache Entries: ${totalCache}`);
    console.log(`   Valid Entries: ${validCache}`);
    console.log(`   Expired Entries: ${expiredCache}`);
    
    if (expiredCache > 100) {
      console.log(`   ⚠️  WARNING: ${expiredCache} expired cache entries (run cleanup)`);
    }
    
    // 9. Recent signals
    console.log('');
    console.log('🔍 Recent signals...');
    const recentResult = await query(
      `SELECT 
        symbol,
        position_type,
        confidence_score,
        data_quality_score,
        status,
        created_at
       FROM einstein_trade_signals 
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    
    if (recentResult.rows.length > 0) {
      console.log('   Last 5 signals:');
      recentResult.rows.forEach((row, i) => {
        const time = new Date(row.created_at).toLocaleString();
        console.log(`   ${i + 1}. ${row.symbol} ${row.position_type} - Confidence: ${row.confidence_score}% - Status: ${row.status} - ${time}`);
      });
    } else {
      console.log('   No signals generated yet');
    }
    
    // Summary
    console.log('');
    console.log('='.repeat(80));
    console.log('📊 Monitoring Summary');
    console.log('='.repeat(80));
    console.log('');
    
    const issues: string[] = [];
    
    if (metrics.avgDataQuality! < 90) {
      issues.push('Low data quality');
    }
    if (metrics.avgConfidence! < 70) {
      issues.push('Low confidence scores');
    }
    if (metrics.errorRate! > 5) {
      issues.push('High error rate');
    }
    if (metrics.signalsGenerated24h === 0) {
      issues.push('No signals generated');
    }
    
    if (issues.length === 0) {
      console.log('✅ All systems operational');
      console.log('✅ No issues detected');
    } else {
      console.log('⚠️  Issues detected:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log('');
    console.log('📈 Key Metrics:');
    console.log(`   - Signals Generated: ${metrics.signalsGenerated24h}`);
    console.log(`   - Data Quality: ${metrics.avgDataQuality?.toFixed(1)}%`);
    console.log(`   - Confidence: ${metrics.avgConfidence?.toFixed(1)}%`);
    console.log(`   - Approval Rate: ${metrics.approvalRate?.toFixed(1)}%`);
    console.log(`   - Error Rate: ${metrics.errorRate?.toFixed(1)}%`);
    console.log(`   - Active Users: ${metrics.activeUsers}`);
    
    console.log('');
    console.log('='.repeat(80));
    
    return metrics as MonitoringMetrics;
  } catch (error) {
    console.error('\n❌ Monitoring failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const metrics = await monitorProduction();
    
    // Exit with appropriate code
    if (metrics.errorRate > 5 || metrics.avgDataQuality < 90) {
      console.log('\n⚠️  Monitoring completed with warnings\n');
      process.exit(1);
    } else {
      console.log('\n✅ Monitoring completed successfully\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Monitoring failed:', error.message);
    process.exit(1);
  }
}

main();
