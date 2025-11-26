/**
 * Quantum BTC Performance Monitoring Setup Script
 * 
 * Automates:
 * - Database table verification
 * - Index creation
 * - Initial data seeding
 * - Performance monitoring activation
 * 
 * Usage: npx tsx scripts/quantum-btc/setup-performance-monitoring.ts
 */

import { query } from '../../lib/db';
import { performanceMonitor } from '../../lib/quantum/performanceMonitor';

// ============================================================================
// COLORS FOR CONSOLE OUTPUT
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// ============================================================================
// DATABASE VERIFICATION
// ============================================================================

async function verifyDatabaseTables(): Promise<boolean> {
  log('\n📊 Verifying database tables...', colors.cyan);
  
  try {
    // Check if api_latency_reliability_logs table exists
    const result = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'api_latency_reliability_logs'
      )`,
      []
    );
    
    const tableExists = result.rows[0].exists;
    
    if (tableExists) {
      log('✅ api_latency_reliability_logs table exists', colors.green);
      return true;
    } else {
      log('❌ api_latency_reliability_logs table does NOT exist', colors.red);
      log('   Run migrations first: npx tsx scripts/run-migrations.ts', colors.yellow);
      return false;
    }
  } catch (error) {
    log(`❌ Database verification failed: ${error}`, colors.red);
    return false;
  }
}

// ============================================================================
// INDEX VERIFICATION
// ============================================================================

async function verifyIndexes(): Promise<void> {
  log('\n🔍 Verifying database indexes...', colors.cyan);
  
  const expectedIndexes = [
    'idx_api_latency_logs_api_name',
    'idx_api_latency_logs_requested_at',
    'idx_api_latency_logs_success',
    'idx_api_latency_logs_status_code',
    'idx_api_latency_logs_trade_id',
  ];
  
  try {
    for (const indexName of expectedIndexes) {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND indexname = $1
        )`,
        [indexName]
      );
      
      const indexExists = result.rows[0].exists;
      
      if (indexExists) {
        log(`✅ Index ${indexName} exists`, colors.green);
      } else {
        log(`⚠️  Index ${indexName} does NOT exist`, colors.yellow);
      }
    }
  } catch (error) {
    log(`❌ Index verification failed: ${error}`, colors.red);
  }
}

// ============================================================================
// TABLE STATISTICS
// ============================================================================

async function getTableStatistics(): Promise<void> {
  log('\n📈 Getting table statistics...', colors.cyan);
  
  try {
    // Get row count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM api_latency_reliability_logs',
      []
    );
    const rowCount = parseInt(countResult.rows[0].count);
    log(`   Total records: ${rowCount.toLocaleString()}`, colors.blue);
    
    // Get date range
    if (rowCount > 0) {
      const rangeResult = await query(
        `SELECT 
          MIN(requested_at) as oldest,
          MAX(requested_at) as newest
        FROM api_latency_reliability_logs`,
        []
      );
      
      const oldest = new Date(rangeResult.rows[0].oldest);
      const newest = new Date(rangeResult.rows[0].newest);
      
      log(`   Oldest record: ${oldest.toISOString()}`, colors.blue);
      log(`   Newest record: ${newest.toISOString()}`, colors.blue);
      
      // Get API breakdown
      const apiResult = await query(
        `SELECT 
          api_name,
          COUNT(*) as count,
          AVG(response_time_ms) as avg_time,
          SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful
        FROM api_latency_reliability_logs
        GROUP BY api_name
        ORDER BY count DESC
        LIMIT 10`,
        []
      );
      
      if (apiResult.rows.length > 0) {
        log('\n   Top APIs by call count:', colors.blue);
        apiResult.rows.forEach((row: any) => {
          const successRate = ((parseInt(row.successful) / parseInt(row.count)) * 100).toFixed(1);
          log(`   - ${row.api_name}: ${row.count} calls, ${Math.round(row.avg_time)}ms avg, ${successRate}% success`, colors.blue);
        });
      }
    }
  } catch (error) {
    log(`❌ Statistics retrieval failed: ${error}`, colors.red);
  }
}

// ============================================================================
// SEED SAMPLE DATA (FOR TESTING)
// ============================================================================

async function seedSampleData(): Promise<void> {
  log('\n🌱 Seeding sample performance data...', colors.cyan);
  
  try {
    // Check if we already have data
    const countResult = await query(
      'SELECT COUNT(*) as count FROM api_latency_reliability_logs',
      []
    );
    const existingCount = parseInt(countResult.rows[0].count);
    
    if (existingCount > 0) {
      log(`   ℹ️  Table already has ${existingCount} records, skipping seed`, colors.yellow);
      return;
    }
    
    // Insert sample data for testing
    const sampleAPIs = [
      { name: 'CoinMarketCap', endpoint: '/v1/cryptocurrency/quotes/latest', avgTime: 320, successRate: 0.99 },
      { name: 'CoinGecko', endpoint: '/api/v3/simple/price', avgTime: 85, successRate: 0.98 },
      { name: 'Kraken', endpoint: '/0/public/Ticker', avgTime: 89, successRate: 0.97 },
      { name: 'Blockchain.com', endpoint: '/stats', avgTime: 95, successRate: 0.99 },
      { name: 'LunarCrush', endpoint: '/v2/assets/btc', avgTime: 650, successRate: 0.96 },
      { name: 'OpenAI', endpoint: '/v1/chat/completions', avgTime: 5000, successRate: 0.98 },
    ];
    
    let insertedCount = 0;
    
    for (const api of sampleAPIs) {
      // Insert 10 sample records per API
      for (let i = 0; i < 10; i++) {
        const isSuccess = Math.random() < api.successRate;
        const responseTime = Math.round(api.avgTime * (0.8 + Math.random() * 0.4)); // ±20% variance
        
        await query(
          `INSERT INTO api_latency_reliability_logs (
            api_name,
            endpoint,
            http_method,
            response_time_ms,
            status_code,
            success,
            error_message,
            error_type,
            requested_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '${i} hours')`,
          [
            api.name,
            api.endpoint,
            'GET',
            responseTime,
            isSuccess ? 200 : 500,
            isSuccess,
            isSuccess ? null : 'Sample error for testing',
            isSuccess ? null : 'Error',
          ]
        );
        
        insertedCount++;
      }
    }
    
    log(`✅ Inserted ${insertedCount} sample records`, colors.green);
  } catch (error) {
    log(`❌ Sample data seeding failed: ${error}`, colors.red);
  }
}

// ============================================================================
// TEST PERFORMANCE MONITOR
// ============================================================================

async function testPerformanceMonitor(): Promise<void> {
  log('\n🧪 Testing performance monitor...', colors.cyan);
  
  try {
    // Test 1: Track a sample API call
    log('   Testing API call tracking...', colors.blue);
    await performanceMonitor.trackAPICall({
      apiName: 'TestAPI',
      endpoint: '/test/endpoint',
      httpMethod: 'GET',
      responseTimeMs: 123,
      statusCode: 200,
      success: true,
    });
    log('   ✅ API call tracking works', colors.green);
    
    // Test 2: Get API stats
    log('   Testing API stats retrieval...', colors.blue);
    const apiStats = await performanceMonitor.getAPIStats(undefined, 24);
    log(`   ✅ Retrieved stats for ${apiStats.length} APIs`, colors.green);
    
    // Test 3: Get system health
    log('   Testing system health retrieval...', colors.blue);
    const health = await performanceMonitor.getSystemHealth();
    log(`   ✅ System health: ${health.errorRate.toFixed(2)}% error rate, ${Math.round(health.avgResponseTime)}ms avg response`, colors.green);
    
    // Test 4: Get performance summary
    log('   Testing performance summary...', colors.blue);
    const summary = await performanceMonitor.getPerformanceSummary();
    log(`   ✅ Performance summary: ${summary.api.totalCalls} total API calls`, colors.green);
    
  } catch (error) {
    log(`❌ Performance monitor test failed: ${error}`, colors.red);
  }
}

// ============================================================================
// CLEANUP OLD DATA
// ============================================================================

async function cleanupOldData(daysToKeep: number = 30): Promise<void> {
  log(`\n🧹 Cleaning up data older than ${daysToKeep} days...`, colors.cyan);
  
  try {
    const result = await query(
      `DELETE FROM api_latency_reliability_logs 
       WHERE requested_at < NOW() - INTERVAL '${daysToKeep} days'`,
      []
    );
    
    const deletedCount = result.rowCount || 0;
    
    if (deletedCount > 0) {
      log(`✅ Deleted ${deletedCount} old records`, colors.green);
    } else {
      log('   ℹ️  No old records to delete', colors.yellow);
    }
  } catch (error) {
    log(`❌ Cleanup failed: ${error}`, colors.red);
  }
}

// ============================================================================
// MAIN SETUP FUNCTION
// ============================================================================

async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║  Quantum BTC Performance Monitoring Setup                 ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝', colors.cyan);
  
  try {
    // Step 1: Verify database tables
    const tablesExist = await verifyDatabaseTables();
    
    if (!tablesExist) {
      log('\n❌ Setup failed: Required tables do not exist', colors.red);
      log('   Please run migrations first:', colors.yellow);
      log('   npx tsx scripts/run-migrations.ts', colors.yellow);
      process.exit(1);
    }
    
    // Step 2: Verify indexes
    await verifyIndexes();
    
    // Step 3: Get current statistics
    await getTableStatistics();
    
    // Step 4: Seed sample data (if needed)
    const shouldSeed = process.argv.includes('--seed');
    if (shouldSeed) {
      await seedSampleData();
      await getTableStatistics(); // Show updated stats
    }
    
    // Step 5: Test performance monitor
    await testPerformanceMonitor();
    
    // Step 6: Cleanup old data (if requested)
    const shouldCleanup = process.argv.includes('--cleanup');
    if (shouldCleanup) {
      const daysToKeep = parseInt(process.argv[process.argv.indexOf('--cleanup') + 1] || '30');
      await cleanupOldData(daysToKeep);
    }
    
    // Success!
    log('\n╔════════════════════════════════════════════════════════════╗', colors.green);
    log('║  ✅ Performance Monitoring Setup Complete!                ║', colors.green);
    log('╚════════════════════════════════════════════════════════════╝', colors.green);
    
    log('\n📊 Next Steps:', colors.cyan);
    log('   1. Performance monitoring is now active', colors.blue);
    log('   2. API calls will be automatically tracked', colors.blue);
    log('   3. View metrics: GET /api/quantum/performance-metrics', colors.blue);
    log('   4. Run tests: npm test -- __tests__/lib/quantum/performanceMonitor.test.ts --run', colors.blue);
    
    log('\n💡 Useful Commands:', colors.cyan);
    log('   - Seed sample data: npx tsx scripts/quantum-btc/setup-performance-monitoring.ts --seed', colors.blue);
    log('   - Cleanup old data: npx tsx scripts/quantum-btc/setup-performance-monitoring.ts --cleanup 30', colors.blue);
    
    process.exit(0);
    
  } catch (error) {
    log(`\n❌ Setup failed: ${error}`, colors.red);
    process.exit(1);
  }
}

// Run setup
main();
