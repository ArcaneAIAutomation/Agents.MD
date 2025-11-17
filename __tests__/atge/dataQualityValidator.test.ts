/**
 * Tests for Data Quality Validator
 * 
 * Validates that the data quality validator correctly:
 * - Detects gaps in data
 * - Validates OHLC relationships
 * - Flags suspicious price movements
 * - Calculates accurate quality scores
 * - Returns detailed quality reports
 */

import { validateDataQuality, isDataQualityAcceptable } from '../../lib/atge/dataQualityValidator';
import { OHLCVDataPoint } from '../../lib/atge/historicalPriceQuery';

describe('Data Quality Validator', () => {
  const baseDate = new Date('2025-01-01T00:00:00Z');
  
  // Helper to create test data
  function createTestData(count: number, intervalMinutes: number = 15): OHLCVDataPoint[] {
    const data: OHLCVDataPoint[] = [];
    let price = 100;
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(baseDate.getTime() + i * intervalMinutes * 60 * 1000);
      const open = price;
      const close = price + (Math.random() - 0.5) * 2;
      const high = Math.max(open, close) + Math.random();
      const low = Math.min(open, close) - Math.random();
      
      data.push({
        timestamp: timestamp.toISOString(),
        open,
        high,
        low,
        close,
        volume: 1000000
      });
      
      price = close;
    }
    
    return data;
  }
  
  describe('Perfect Data (100% Quality)', () => {
    it('should return 100% quality for complete, valid data', () => {
      const data = createTestData(96, 15); // 24 hours of 15m data
      const startDate = baseDate.toISOString();
      const endDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
      
      const report = validateDataQuality(data, startDate, endDate, '15m');
      
      expect(report.overallScore).toBeGreaterThanOrEqual(90);
      expect(report.recommendation).toBe('excellent');
      expect(report.gaps).toHaveLength(0);
      expect(report.ohlcViolations).toHaveLength(0);
    });
  });
  
  describe('Gap Detection', () => {
    it('should detect gaps in timestamp sequence', () => {
      const data = createTestData(50, 15);
      // Remove data points to create a gap
      data.splice(25, 10);
      
      const startDate = baseDate.toISOString();
      const endDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
      
      const report = validateDataQuality(data, startDate, endDate, '15m');
      
      expect(report.gaps.length).toBeGreaterThan(0);
      expect(report.gaps[0].missedDataPoints).toBeGreaterThan(0);
      expect(report.completeness).toBeLessThan(100);
    });
  });
  
  describe('OHLC Validation', () => {
    it('should detect OHLC relationship violations', () => {
      const data = createTestData(10, 15);
      
      // Create invalid OHLC: high < low
      data[5].high = 90;
      data[5].low = 100;
      
      const startDate = baseDate.toISOString();
      const endDate = new Date(baseDate.getTime() + 3 * 60 * 60 * 1000).toISOString();
      
      const report = validateDataQuality(data, startDate, endDate, '15m');
      
      expect(report.ohlcViolations.length).toBeGreaterThan(0);
      expect(report.validityScore).toBeLessThan(100);
    });
    
    it('should detect when high is less than open or close', () => {
      const data = createTestData(10, 15);
      
      // Create invalid OHLC: high < open
      data[3].open = 100;
      data[3].high = 95;
      data[3].close = 98;
      data[3].low = 94;
      
      const startDate = baseDate.toISOString();
      const endDate = new Date(baseDate.getTime() + 3 * 60 * 60 * 1000).toISOString();
      
      const report = validateDataQuality(data, startDate, endDate, '15m');
      
      expect(report.ohlcViolations.length).toBeGreaterThan(0);
    });
  });
  
  describe('Suspicious Price Movements', () => {
    it('should flag large price changes', () => {
      const data = createTestData(10, 15);
      
      // Create suspicious price spike (>50% change)
      data[5].open = 100;
      data[5].close = 200; // 100% increase
      
      const startDate = baseDate.toISOString();
      const endDate = new Date(baseDate.getTime() + 3 * 60 * 60 * 1000).toISOString();
      
      const report = validateDataQuality(data, startDate, endDate, '15m');
      
      expect(report.suspiciousPriceMovements.length).toBeGreaterThan(0);
      expect(report.suspiciousPriceMovements[0].percentageChange).toBeGreaterThan(50);
    });
  });
  
  describe('Quality Score Calculation', () => {
    it('should calculate quality score based on completeness, validity, and consistency', () => {
      const data = createTestData(80, 15); // 80 out of 96 expected = 83% completeness
      const startDate = baseDate.toISOString();
      const endDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
      
      const report = validateDataQuality(data, startDate, endDate, '15m');
      
      // Should be weighted: completeness (60%) + validity (30%) + consistency (10%)
      expect(report.overallScore).toBeGreaterThan(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(report.completeness).toBeCloseTo(83.3, 0);
    });
    
    it('should return 0% quality for empty data', () => {
      const data: OHLCVDataPoint[] = [];
      const startDate = baseDate.toISOString();
      const endDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
      
      const report = validateDataQuality(data, startDate, endDate, '15m');
      
      expect(report.overallScore).toBe(0);
      expect(report.recommendation).toBe('poor');
    });
  });
  
  describe('Quality Threshold Check', () => {
    it('should accept data with quality >= 70%', () => {
      const data = createTestData(90, 15); // High quality data
      const startDate = baseDate.toISOString();
      const endDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
      
      const isAcceptable = isDataQualityAcceptable(data, startDate, endDate, '15m', 70);
      
      expect(isAcceptable).toBe(true);
    });
    
    it('should reject data with quality < 70%', () => {
      const data = createTestData(30, 15); // Only 30 out of 96 = ~31% completeness
      const startDate = baseDate.toISOString();
      const endDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
      
      const isAcceptable = isDataQualityAcceptable(data, startDate, endDate, '15m', 70);
      
      expect(isAcceptable).toBe(false);
    });
  });
  
  describe('Recommendation Levels', () => {
    it('should recommend "excellent" for quality >= 90%', () => {
      const data = createTestData(96, 15);
      const startDate = baseDate.toISOString();
      const endDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
      
      const report = validateDataQuality(data, startDate, endDate, '15m');
      
      expect(report.recommendation).toBe('excellent');
    });
    
    it('should recommend "good" for quality 70-89%', () => {
      const data = createTestData(75, 15); // ~78% completeness
      const startDate = baseDate.toISOString();
      const endDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
      
      const report = validateDataQuality(data, startDate, endDate, '15m');
      
      expect(report.recommendation).toBe('good');
    });
  });
});
