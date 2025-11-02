/**
 * Unit Tests: Risk Scoring
 * 
 * Tests for risk assessment calculations including:
 * - Overall risk score calculation
 * - Risk categorization
 * - Volatility risk
 * - Liquidity risk
 * - Concentration risk
 */

import {
  calculateRiskScore,
  categorizeRisk,
  calculateVolatilityRisk,
  calculateLiquidityRisk,
  calculateConcentrationRisk,
} from '../../../lib/ucie/riskScoring';

describe('Risk Scoring', () => {
  describe('calculateRiskScore', () => {
    it('should calculate overall risk score correctly', () => {
      const riskFactors = {
        volatility: 30,
        liquidity: 20,
        concentration: 40,
        regulatory: 10,
      };
      
      const score = calculateRiskScore(riskFactors);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should weight factors appropriately', () => {
      const highVolatility = {
        volatility: 90,
        liquidity: 10,
        concentration: 10,
        regulatory: 10,
      };
      
      const highLiquidity = {
        volatility: 10,
        liquidity: 90,
        concentration: 10,
        regulatory: 10,
      };
      
      const scoreVol = calculateRiskScore(highVolatility);
      const scoreLiq = calculateRiskScore(highLiquidity);
      
      // Both should be high risk, but volatility typically weighted more
      expect(scoreVol).toBeGreaterThan(50);
      expect(scoreLiq).toBeGreaterThan(50);
    });

    it('should return 0 for zero risk factors', () => {
      const riskFactors = {
        volatility: 0,
        liquidity: 0,
        concentration: 0,
        regulatory: 0,
      };
      
      const score = calculateRiskScore(riskFactors);
      
      expect(score).toBe(0);
    });

    it('should return 100 for maximum risk factors', () => {
      const riskFactors = {
        volatility: 100,
        liquidity: 100,
        concentration: 100,
        regulatory: 100,
      };
      
      const score = calculateRiskScore(riskFactors);
      
      expect(score).toBe(100);
    });

    it('should handle partial risk factors', () => {
      const riskFactors = {
        volatility: 50,
        liquidity: 50,
      };
      
      const score = calculateRiskScore(riskFactors);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('categorizeRisk', () => {
    it('should categorize low risk correctly', () => {
      expect(categorizeRisk(0)).toBe('low');
      expect(categorizeRisk(10)).toBe('low');
      expect(categorizeRisk(25)).toBe('low');
    });

    it('should categorize medium risk correctly', () => {
      expect(categorizeRisk(30)).toBe('medium');
      expect(categorizeRisk(50)).toBe('medium');
      expect(categorizeRisk(60)).toBe('medium');
    });

    it('should categorize high risk correctly', () => {
      expect(categorizeRisk(70)).toBe('high');
      expect(categorizeRisk(85)).toBe('high');
    });

    it('should categorize critical risk correctly', () => {
      expect(categorizeRisk(90)).toBe('critical');
      expect(categorizeRisk(95)).toBe('critical');
      expect(categorizeRisk(100)).toBe('critical');
    });

    it('should handle boundary values', () => {
      expect(categorizeRisk(29.9)).toBe('low');
      expect(categorizeRisk(30)).toBe('medium');
      expect(categorizeRisk(69.9)).toBe('medium');
      expect(categorizeRisk(70)).toBe('high');
      expect(categorizeRisk(89.9)).toBe('high');
      expect(categorizeRisk(90)).toBe('critical');
    });

    it('should handle negative values as low risk', () => {
      expect(categorizeRisk(-10)).toBe('low');
    });

    it('should handle values over 100 as critical', () => {
      expect(categorizeRisk(150)).toBe('critical');
    });
  });

  describe('calculateVolatilityRisk', () => {
    it('should calculate volatility risk from standard deviation', () => {
      const prices = [100, 110, 90, 105, 95, 100, 110, 90, 105, 95];
      const risk = calculateVolatilityRisk(prices);
      
      expect(risk).toBeGreaterThan(0);
      expect(risk).toBeLessThanOrEqual(100);
    });

    it('should return high risk for high volatility', () => {
      const prices = [100, 150, 50, 200, 25, 175, 75, 150, 50, 125];
      const risk = calculateVolatilityRisk(prices);
      
      expect(risk).toBeGreaterThan(70);
    });

    it('should return low risk for low volatility', () => {
      const prices = [100, 100.5, 99.5, 100.2, 99.8, 100.1, 99.9, 100.3, 99.7, 100];
      const risk = calculateVolatilityRisk(prices);
      
      expect(risk).toBeLessThan(30);
    });

    it('should return 0 for constant prices', () => {
      const prices = [100, 100, 100, 100, 100];
      const risk = calculateVolatilityRisk(prices);
      
      expect(risk).toBe(0);
    });

    it('should handle insufficient data', () => {
      const prices = [100];
      const risk = calculateVolatilityRisk(prices);
      
      expect(risk).toBe(0);
    });
  });

  describe('calculateLiquidityRisk', () => {
    it('should calculate liquidity risk from volume', () => {
      const volume24h = 1000000;
      const marketCap = 100000000;
      
      const risk = calculateLiquidityRisk(volume24h, marketCap);
      
      expect(risk).toBeGreaterThanOrEqual(0);
      expect(risk).toBeLessThanOrEqual(100);
    });

    it('should return high risk for low volume', () => {
      const volume24h = 100;
      const marketCap = 10000000;
      
      const risk = calculateLiquidityRisk(volume24h, marketCap);
      
      expect(risk).toBeGreaterThan(70);
    });

    it('should return low risk for high volume', () => {
      const volume24h = 50000000;
      const marketCap = 100000000;
      
      const risk = calculateLiquidityRisk(volume24h, marketCap);
      
      expect(risk).toBeLessThan(30);
    });

    it('should handle zero volume as critical risk', () => {
      const volume24h = 0;
      const marketCap = 100000000;
      
      const risk = calculateLiquidityRisk(volume24h, marketCap);
      
      expect(risk).toBe(100);
    });

    it('should handle zero market cap', () => {
      const volume24h = 1000000;
      const marketCap = 0;
      
      const risk = calculateLiquidityRisk(volume24h, marketCap);
      
      expect(risk).toBe(100);
    });

    it('should consider volume-to-market-cap ratio', () => {
      // Same volume, different market caps
      const volume = 1000000;
      
      const risk1 = calculateLiquidityRisk(volume, 10000000);  // 10% ratio
      const risk2 = calculateLiquidityRisk(volume, 100000000); // 1% ratio
      
      // Lower ratio should have higher risk
      expect(risk2).toBeGreaterThan(risk1);
    });
  });

  describe('calculateConcentrationRisk', () => {
    it('should calculate concentration risk from holder distribution', () => {
      const holderDistribution = {
        top10Percentage: 60,
        giniCoefficient: 0.7,
      };
      
      const risk = calculateConcentrationRisk(holderDistribution);
      
      expect(risk).toBeGreaterThanOrEqual(0);
      expect(risk).toBeLessThanOrEqual(100);
    });

    it('should return high risk for high concentration', () => {
      const holderDistribution = {
        top10Percentage: 95,
        giniCoefficient: 0.95,
      };
      
      const risk = calculateConcentrationRisk(holderDistribution);
      
      expect(risk).toBeGreaterThan(80);
    });

    it('should return low risk for low concentration', () => {
      const holderDistribution = {
        top10Percentage: 20,
        giniCoefficient: 0.3,
      };
      
      const risk = calculateConcentrationRisk(holderDistribution);
      
      expect(risk).toBeLessThan(30);
    });

    it('should handle perfect distribution', () => {
      const holderDistribution = {
        top10Percentage: 10,
        giniCoefficient: 0,
      };
      
      const risk = calculateConcentrationRisk(holderDistribution);
      
      expect(risk).toBe(0);
    });

    it('should handle complete concentration', () => {
      const holderDistribution = {
        top10Percentage: 100,
        giniCoefficient: 1,
      };
      
      const risk = calculateConcentrationRisk(holderDistribution);
      
      expect(risk).toBe(100);
    });

    it('should weight Gini coefficient appropriately', () => {
      const highGini = {
        top10Percentage: 50,
        giniCoefficient: 0.9,
      };
      
      const lowGini = {
        top10Percentage: 50,
        giniCoefficient: 0.3,
      };
      
      const riskHigh = calculateConcentrationRisk(highGini);
      const riskLow = calculateConcentrationRisk(lowGini);
      
      expect(riskHigh).toBeGreaterThan(riskLow);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative values gracefully', () => {
      const riskFactors = {
        volatility: -10,
        liquidity: -20,
        concentration: -30,
        regulatory: -40,
      };
      
      const score = calculateRiskScore(riskFactors);
      
      // Should treat negatives as 0
      expect(score).toBe(0);
    });

    it('should handle values over 100 gracefully', () => {
      const riskFactors = {
        volatility: 150,
        liquidity: 200,
        concentration: 300,
        regulatory: 400,
      };
      
      const score = calculateRiskScore(riskFactors);
      
      // Should cap at 100
      expect(score).toBe(100);
    });

    it('should handle NaN values', () => {
      const riskFactors = {
        volatility: NaN,
        liquidity: 50,
        concentration: 50,
        regulatory: 50,
      };
      
      const score = calculateRiskScore(riskFactors);
      
      // Should handle NaN gracefully
      expect(isNaN(score)).toBe(false);
    });

    it('should handle Infinity values', () => {
      const riskFactors = {
        volatility: Infinity,
        liquidity: 50,
        concentration: 50,
        regulatory: 50,
      };
      
      const score = calculateRiskScore(riskFactors);
      
      // Should cap at 100
      expect(score).toBe(100);
    });
  });

  describe('Integration', () => {
    it('should produce consistent results for same inputs', () => {
      const riskFactors = {
        volatility: 45,
        liquidity: 35,
        concentration: 55,
        regulatory: 25,
      };
      
      const score1 = calculateRiskScore(riskFactors);
      const score2 = calculateRiskScore(riskFactors);
      
      expect(score1).toBe(score2);
    });

    it('should categorize calculated scores correctly', () => {
      const lowRisk = {
        volatility: 10,
        liquidity: 10,
        concentration: 10,
        regulatory: 10,
      };
      
      const highRisk = {
        volatility: 90,
        liquidity: 90,
        concentration: 90,
        regulatory: 90,
      };
      
      const lowScore = calculateRiskScore(lowRisk);
      const highScore = calculateRiskScore(highRisk);
      
      expect(categorizeRisk(lowScore)).toBe('low');
      expect(categorizeRisk(highScore)).toBe('critical');
    });
  });

  describe('Performance', () => {
    it('should calculate risk scores efficiently', () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        calculateRiskScore({
          volatility: Math.random() * 100,
          liquidity: Math.random() * 100,
          concentration: Math.random() * 100,
          regulatory: Math.random() * 100,
        });
      }
      
      const duration = Date.now() - start;
      
      // 1000 calculations should complete in under 50ms
      expect(duration).toBeLessThan(50);
    });
  });
});
