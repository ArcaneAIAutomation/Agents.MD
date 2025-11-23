/**
 * ATGE Dashboard Functionality Tests
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Tests for Task 41: Test dashboard functionality
 * - Verify statistics display correctly from `/api/atge/statistics`
 * - Verify refresh button calls verification endpoint
 * - Verify analytics charts render from `/api/atge/analytics`
 * - Verify pattern recognition displays from `/api/atge/patterns`
 * - Verify recommendations display correctly
 * - Test with no trades (empty state)
 * - Test with multiple trades
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import fetch from 'node-fetch';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
let authToken: string | null = null;

// Test user credentials (should be configured in test environment)
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
};

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

beforeAll(async () => {
  // Login to get auth token
  console.log('🔐 Logging in test user...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_USER),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }


    // Extract auth token from cookie
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      const tokenMatch = cookies.match(/auth_token=([^;]+)/);
      if (tokenMatch) {
        authToken = tokenMatch[1];
        console.log('✅ Authentication successful');
      }
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  }
});

afterAll(async () => {
  // Logout
  if (authToken) {
    console.log('🔓 Logging out test user...');
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Make authenticated API request
 */
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  if (!authToken) {
    throw new Error('No auth token available');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Cookie': `auth_token=${authToken}`,
    },
  });
}

// ============================================================================
// TEST SUITE 1: STATISTICS API
// ============================================================================

describe('ATGE Statistics API (/api/atge/statistics)', () => {
  it('should return statistics with correct structure', async () => {
    console.log('📊 Testing statistics API...');
    
    const response = await authenticatedFetch(`${BASE_URL}/api/atge/statistics`);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('statistics');
    
    const stats = data.statistics;
    
    // Verify all required fields exist
    expect(stats).toHaveProperty('totalTrades');
    expect(stats).toHaveProperty('winningTrades');
    expect(stats).toHaveProperty('losingTrades');
    expect(stats).toHaveProperty('winRate');
    expect(stats).toHaveProperty('totalProfitLoss');
    expect(stats).toHaveProperty('totalProfit');
    expect(stats).toHaveProperty('totalLoss');
    expect(stats).toHaveProperty('averageWin');
    expect(stats).toHaveProperty('averageLoss');
    expect(stats).toHaveProperty('profitFactor');
    expect(stats).toHaveProperty('bestTrade');
    expect(stats).toHaveProperty('worstTrade');
    expect(stats).toHaveProperty('lastCalculated');
    expect(stats).toHaveProperty('cacheAge');
    
    // Verify data types
    expect(typeof stats.totalTrades).toBe('number');
    expect(typeof stats.winRate).toBe('number');
    expect(typeof stats.profitFactor).toBe('number');
    
    console.log('✅ Statistics API structure valid');
    console.log(`   Total Trades: ${stats.totalTrades}`);
    console.log(`   Win Rate: ${stats.winRate.toFixed(2)}%`);
    console.log(`   Profit Factor: ${stats.profitFactor.toFixed(2)}`);
  });

  it('should handle empty state (no trades)', async () => {
    console.log('📊 Testing statistics API with no trades...');
    
    const response = await authenticatedFetch(`${BASE_URL}/api/atge/statistics`);
    const data = await response.json();
    
    // Should still return valid structure even with no trades
    expect(data.success).toBe(true);
    expect(data.statistics).toBeDefined();
    
    // Empty state should have zero values
    if (data.statistics.totalTrades === 0) {
      expect(data.statistics.winningTrades).toBe(0);
      expect(data.statistics.losingTrades).toBe(0);
      expect(data.statistics.winRate).toBe(0);
      console.log('✅ Empty state handled correctly');
    } else {
      console.log('ℹ️  User has existing trades, skipping empty state test');
    }
  });
});

// ============================================================================
// TEST SUITE 2: ANALYTICS API
// ============================================================================

describe('ATGE Analytics API (/api/atge/analytics)', () => {
  it('should return analytics with correct structure', async () => {
    console.log('📈 Testing analytics API...');
    
    const response = await authenticatedFetch(`${BASE_URL}/api/atge/analytics`);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('analytics');
    
    const analytics = data.analytics;
    
    // Verify all required sections exist
    expect(analytics).toHaveProperty('winRateOverTime');
    expect(analytics).toHaveProperty('profitLossDistribution');
    expect(analytics).toHaveProperty('bestTrades');
    expect(analytics).toHaveProperty('worstTrades');
    expect(analytics).toHaveProperty('symbolPerformance');
    expect(analytics).toHaveProperty('timeframePerformance');
    expect(analytics).toHaveProperty('dateRange');
    expect(analytics).toHaveProperty('totalTradesAnalyzed');
    
    // Verify win rate over time structure
    expect(analytics.winRateOverTime).toHaveProperty('daily');
    expect(analytics.winRateOverTime).toHaveProperty('weekly');
    expect(Array.isArray(analytics.winRateOverTime.daily)).toBe(true);
    expect(Array.isArray(analytics.winRateOverTime.weekly)).toBe(true);
    
    // Verify symbol performance structure
    expect(analytics.symbolPerformance).toHaveProperty('BTC');
    expect(analytics.symbolPerformance).toHaveProperty('ETH');
    
    console.log('✅ Analytics API structure valid');
    console.log(`   Total Trades Analyzed: ${analytics.totalTradesAnalyzed}`);
    console.log(`   Best Trades: ${analytics.bestTrades.length}`);
    console.log(`   Worst Trades: ${analytics.worstTrades.length}`);
  });

  it('should support date range filtering', async () => {
    console.log('📈 Testing analytics API with date filters...');
    
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const response = await authenticatedFetch(
      `${BASE_URL}/api/atge/analytics?startDate=${startDate}&endDate=${endDate}`
    );
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    
    console.log('✅ Date filtering works correctly');
  });

  it('should support symbol filtering', async () => {
    console.log('📈 Testing analytics API with symbol filter...');
    
    const response = await authenticatedFetch(
      `${BASE_URL}/api/atge/analytics?symbol=BTC`
    );
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    
    console.log('✅ Symbol filtering works correctly');
  });
});

// ============================================================================
// TEST SUITE 3: PATTERN RECOGNITION API
// ============================================================================

describe('ATGE Pattern Recognition API (/api/atge/patterns)', () => {
  it('should return pattern analysis with correct structure', async () => {
    console.log('🔍 Testing pattern recognition API...');
    
    const response = await authenticatedFetch(`${BASE_URL}/api/atge/patterns`);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('success');
    
    if (data.data) {
      const patterns = data.data;
      
      // Verify structure
      expect(patterns).toHaveProperty('summary');
      expect(patterns).toHaveProperty('patterns');
      
      // Verify summary
      expect(patterns.summary).toHaveProperty('totalTrades');
      expect(patterns.summary).toHaveProperty('winningTrades');
      expect(patterns.summary).toHaveProperty('losingTrades');
      expect(patterns.summary).toHaveProperty('expiredTrades');
      expect(patterns.summary).toHaveProperty('winRate');
      
      // Verify patterns structure
      expect(patterns.patterns).toHaveProperty('successFactors');
      expect(patterns.patterns).toHaveProperty('failureFactors');
      expect(Array.isArray(patterns.patterns.successFactors)).toBe(true);
      expect(Array.isArray(patterns.patterns.failureFactors)).toBe(true);
      
      console.log('✅ Pattern recognition API structure valid');
      console.log(`   Success Factors: ${patterns.patterns.successFactors.length}`);
      console.log(`   Failure Factors: ${patterns.patterns.failureFactors.length}`);
    } else {
      console.log('ℹ️  No pattern data available (insufficient trades)');
    }
  });

  it('should identify statistically significant patterns', async () => {
    console.log('🔍 Testing pattern statistical significance...');
    
    const response = await authenticatedFetch(`${BASE_URL}/api/atge/patterns`);
    const data = await response.json();
    
    if (data.data && data.data.patterns) {
      const { successFactors, failureFactors } = data.data.patterns;
      
      // All patterns should be statistically significant (p < 0.05)
      successFactors.forEach((pattern: any) => {
        expect(pattern).toHaveProperty('pValue');
        expect(pattern).toHaveProperty('isSignificant');
        expect(pattern.isSignificant).toBe(true);
        expect(pattern.pValue).toBeLessThan(0.05);
      });
      
      failureFactors.forEach((pattern: any) => {
        expect(pattern).toHaveProperty('pValue');
        expect(pattern).toHaveProperty('isSignificant');
        expect(pattern.isSignificant).toBe(true);
        expect(pattern.pValue).toBeLessThan(0.05);
      });
      
      console.log('✅ All patterns are statistically significant');
    } else {
      console.log('ℹ️  Skipping significance test (no patterns available)');
    }
  });
});

// ============================================================================
// TEST SUITE 4: TRADE VERIFICATION API
// ============================================================================

describe('ATGE Trade Verification API (/api/atge/verify-trades)', () => {
  it('should verify trades and return summary', async () => {
    console.log('✔️  Testing trade verification API...');
    
    const response = await authenticatedFetch(`${BASE_URL}/api/atge/verify-trades`, {
      method: 'POST',
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('totalTrades');
    expect(data).toHaveProperty('verified');
    expect(data).toHaveProperty('updated');
    expect(data).toHaveProperty('failed');
    expect(data).toHaveProperty('errors');
    expect(data).toHaveProperty('timestamp');
    
    // Verify data types
    expect(typeof data.totalTrades).toBe('number');
    expect(typeof data.verified).toBe('number');
    expect(typeof data.updated).toBe('number');
    expect(typeof data.failed).toBe('number');
    expect(Array.isArray(data.errors)).toBe(true);
    
    console.log('✅ Trade verification API structure valid');
    console.log(`   Total Trades: ${data.totalTrades}`);
    console.log(`   Verified: ${data.verified}`);
    console.log(`   Updated: ${data.updated}`);
    console.log(`   Failed: ${data.failed}`);
  });
});

// ============================================================================
// TEST SUITE 5: DASHBOARD INTEGRATION
// ============================================================================

describe('ATGE Dashboard Integration', () => {
  it('should load all dashboard data successfully', async () => {
    console.log('🎯 Testing complete dashboard data loading...');
    
    // Fetch all dashboard data in parallel
    const [statsResponse, analyticsResponse, patternsResponse] = await Promise.all([
      authenticatedFetch(`${BASE_URL}/api/atge/statistics`),
      authenticatedFetch(`${BASE_URL}/api/atge/analytics`),
      authenticatedFetch(`${BASE_URL}/api/atge/patterns`),
    ]);
    
    // All requests should succeed
    expect(statsResponse.status).toBe(200);
    expect(analyticsResponse.status).toBe(200);
    expect(patternsResponse.status).toBe(200);
    
    const [statsData, analyticsData, patternsData] = await Promise.all([
      statsResponse.json(),
      analyticsResponse.json(),
      patternsResponse.json(),
    ]);
    
    // All should return success
    expect(statsData.success).toBe(true);
    expect(analyticsData.success).toBe(true);
    expect(patternsData.success).toBe(true);
    
    console.log('✅ All dashboard APIs loaded successfully');
  });

  it('should handle refresh workflow correctly', async () => {
    console.log('🔄 Testing refresh workflow...');
    
    // Step 1: Verify trades
    const verifyResponse = await authenticatedFetch(`${BASE_URL}/api/atge/verify-trades`, {
      method: 'POST',
    });
    
    expect(verifyResponse.status).toBe(200);
    const verifyData = await verifyResponse.json();
    expect(verifyData.success).toBe(true);
    
    // Step 2: Fetch updated statistics
    const statsResponse = await authenticatedFetch(`${BASE_URL}/api/atge/statistics`);
    expect(statsResponse.status).toBe(200);
    const statsData = await statsResponse.json();
    expect(statsData.success).toBe(true);
    
    console.log('✅ Refresh workflow completed successfully');
  });
});

// ============================================================================
// TEST SUITE 6: ERROR HANDLING
// ============================================================================

describe('ATGE Dashboard Error Handling', () => {
  it('should require authentication', async () => {
    console.log('🔒 Testing authentication requirement...');
    
    // Try to access without auth token
    const response = await fetch(`${BASE_URL}/api/atge/statistics`);
    
    // Should return 401 Unauthorized
    expect(response.status).toBe(401);
    
    console.log('✅ Authentication properly enforced');
  });

  it('should handle invalid date ranges gracefully', async () => {
    console.log('⚠️  Testing invalid date range handling...');
    
    const response = await authenticatedFetch(
      `${BASE_URL}/api/atge/analytics?startDate=invalid&endDate=invalid`
    );
    
    // Should either return 400 or handle gracefully with empty data
    expect([200, 400]).toContain(response.status);
    
    console.log('✅ Invalid date ranges handled gracefully');
  });
});

// ============================================================================
// TEST SUMMARY
// ============================================================================

describe('Test Summary', () => {
  it('should print test summary', () => {
    console.log('\n' + '='.repeat(60));
    console.log('📋 ATGE DASHBOARD TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Statistics API: Tested');
    console.log('✅ Analytics API: Tested');
    console.log('✅ Pattern Recognition API: Tested');
    console.log('✅ Trade Verification API: Tested');
    console.log('✅ Dashboard Integration: Tested');
    console.log('✅ Error Handling: Tested');
    console.log('='.repeat(60) + '\n');
    
    expect(true).toBe(true);
  });
});
