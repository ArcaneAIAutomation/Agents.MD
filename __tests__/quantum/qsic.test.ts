/**
 * Quantum-Superior Intelligence Core (QSIC) Tests
 * 
 * Tests for the QSIC implementation covering all subtasks:
 * - Multi-probability state reasoning
 * - Wave-pattern collapse logic
 * - Time-symmetric trajectory analysis
 * - Self-correction engine
 * - Guardrail enforcement
 */

import {
  MultiProbabilityReasoning,
  ComprehensiveMarketData,
  PriceHistory,
  QuantumAnalysis,
  SystemOperation,
  GuardrailResult
} from '../../lib/quantum/qsic';

describe('Quantum-Superior Intelligence Core (QSIC)', () => {
  let qsic: MultiProbabilityReasoning;
  
  beforeEach(() => {
    qsic = new MultiProbabilityReasoning();
  });
  
  // ============================================================================
  // SUBTASK 4.1: Multi-Probability State Reasoning
  // ============================================================================
  
  describe('4.1 Multi-Probability State Reasoning', () => {
    it('should analyze market with comprehensive data', async () => {
      const marketData: ComprehensiveMarketData = {
        price: 95000,
        volume24h: 50000000000,
        marketCap: 1800000000000,
        priceHistory: {
          prices: [
            { timestamp: '2025-01-01T00:00:00Z', price: 94000 },
            { timestamp: '2025-01-01T01:00:00Z', price: 94500 },
            { timestamp: '2025-01-01T02:00:00Z', price: 95000 },
            { timestamp: '2025-01-01T03:00:00Z', price: 95500 },
            { timestamp: '2025-01-01T04:00:00Z', price: 95000 }
          ],
          timeframe: '1h'
        },
        onChainData: {
          mempoolSize: 15000,
          whaleTransactions: 10,
          difficulty: 70000000000000,
          hashRate: 500000000000000000
        },
        sentimentData: {
          score: 75,
          socialDominance: 45,
          mentions24h: 50000
        },
        timestamp: new Date().toISOString()
      };
      
      const analysis = await qsic.analyzeMarket(marketData);
      
      expect(analysis).toBeDefined();
      expect(analysis.wavePatternCollapse).toMatch(/CONTINUATION|BREAK|UNCERTAIN/);
      expect(analysis.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(analysis.confidenceScore).toBeLessThanOrEqual(100);
      expect(analysis.reasoning).toBeTruthy();
      expect(analysis.mathematicalJustification).toBeTruthy();
    });
    
    it('should detect patterns in price history', async () => {
      const priceHistory: PriceHistory = {
        prices: Array.from({ length: 20 }, (_, i) => ({
          timestamp: new Date(Date.now() - (20 - i) * 3600000).toISOString(),
          price: 95000 + Math.sin(i / 3) * 2000
        })),
        timeframe: '1h'
      };
      
      const patterns = await qsic.detectPatterns(priceHistory);
      
      expect(patterns).toBeDefined();
      expect(patterns.confidence).toBeGreaterThanOrEqual(0);
      expect(patterns.confidence).toBeLessThanOrEqual(100);
      expect(Array.isArray(patterns.patterns)).toBe(true);
    });
  });

  // ============================================================================
  // SUBTASK 4.2: Wave-Pattern Collapse Logic
  // ============================================================================
  
  describe('4.2 Wave-Pattern Collapse Logic', () => {
    it('should determine wave pattern collapse state', async () => {
      const marketData: ComprehensiveMarketData = {
        price: 95000,
        volume24h: 50000000000,
        marketCap: 1800000000000,
        priceHistory: {
          prices: Array.from({ length: 15 }, (_, i) => ({
            timestamp: new Date(Date.now() - (15 - i) * 3600000).toISOString(),
            price: 90000 + i * 500 // Uptrend
          })),
          timeframe: '1h'
        },
        onChainData: {
          mempoolSize: 15000,
          whaleTransactions: 10,
          difficulty: 70000000000000,
          hashRate: 500000000000000000
        },
        sentimentData: {
          score: 75,
          socialDominance: 45,
          mentions24h: 50000
        },
        timestamp: new Date().toISOString()
      };
      
      const analysis = await qsic.analyzeMarket(marketData);
      
      expect(analysis.wavePatternCollapse).toBeDefined();
      expect(['CONTINUATION', 'BREAK', 'UNCERTAIN']).toContain(analysis.wavePatternCollapse);
    });
  });
  
  // ============================================================================
  // SUBTASK 4.3: Time-Symmetric Trajectory Analysis
  // ============================================================================
  
  describe('4.3 Time-Symmetric Trajectory Analysis', () => {
    it('should analyze forward and reverse trajectories', async () => {
      const marketData: ComprehensiveMarketData = {
        price: 95000,
        volume24h: 50000000000,
        marketCap: 1800000000000,
        priceHistory: {
          prices: Array.from({ length: 20 }, (_, i) => ({
            timestamp: new Date(Date.now() - (20 - i) * 3600000).toISOString(),
            price: 90000 + i * 300
          })),
          timeframe: '1h'
        },
        onChainData: {
          mempoolSize: 15000,
          whaleTransactions: 10,
          difficulty: 70000000000000,
          hashRate: 500000000000000000
        },
        sentimentData: {
          score: 75,
          socialDominance: 45,
          mentions24h: 50000
        },
        timestamp: new Date().toISOString()
      };
      
      const analysis = await qsic.analyzeMarket(marketData);
      
      expect(analysis.timeSymmetricTrajectory).toBeDefined();
      expect(analysis.timeSymmetricTrajectory.forward).toBeDefined();
      expect(analysis.timeSymmetricTrajectory.reverse).toBeDefined();
      expect(analysis.timeSymmetricTrajectory.alignment).toBeGreaterThanOrEqual(0);
      expect(analysis.timeSymmetricTrajectory.alignment).toBeLessThanOrEqual(100);
      
      expect(['UP', 'DOWN', 'SIDEWAYS']).toContain(analysis.timeSymmetricTrajectory.forward.direction);
      expect(['UP', 'DOWN', 'SIDEWAYS']).toContain(analysis.timeSymmetricTrajectory.reverse.direction);
    });
  });

  // ============================================================================
  // SUBTASK 4.4: Self-Correction Engine
  // ============================================================================
  
  describe('4.4 Self-Correction Engine', () => {
    it('should validate reasoning and detect errors', () => {
      const analysis: QuantumAnalysis = {
        wavePatternCollapse: 'CONTINUATION',
        timeSymmetricTrajectory: {
          forward: {
            direction: 'UP',
            strength: 75,
            probability: 80,
            keyLevels: [95000, 96000, 97000]
          },
          reverse: {
            direction: 'UP',
            strength: 70,
            probability: 75,
            keyLevels: [94000, 93000, 92000]
          },
          alignment: 85
        },
        liquidityHarmonics: {
          bidDepth: 20000000000,
          askDepth: 30000000000,
          imbalance: 20,
          harmonicScore: 80
        },
        mempoolPattern: {
          congestionLevel: 'MEDIUM',
          feeEstimate: 5,
          transactionCount: 25000,
          pattern: 'NORMAL'
        },
        whaleMovement: {
          largeTransactions: 10,
          netFlow: 'NEUTRAL',
          confidence: 50
        },
        macroCyclePhase: {
          phase: 'MARKUP',
          confidence: 80,
          daysInPhase: 30
        },
        confidenceScore: 85,
        reasoning: 'Test reasoning',
        mathematicalJustification: 'Test justification',
        errors: [],
        corrections: []
      };
      
      const validation = qsic.validateReasoning(analysis);
      
      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.confidence).toBeGreaterThanOrEqual(0);
      expect(validation.confidence).toBeLessThanOrEqual(100);
      expect(Array.isArray(validation.errors)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });
    
    it('should correct invalid confidence scores', () => {
      const invalidAnalysis: QuantumAnalysis = {
        wavePatternCollapse: 'CONTINUATION',
        timeSymmetricTrajectory: {
          forward: { direction: 'UP', strength: 75, probability: 80, keyLevels: [] },
          reverse: { direction: 'UP', strength: 70, probability: 75, keyLevels: [] },
          alignment: 150 // Invalid: > 100
        },
        liquidityHarmonics: {
          bidDepth: 20000000000,
          askDepth: 30000000000,
          imbalance: 20,
          harmonicScore: 80
        },
        mempoolPattern: {
          congestionLevel: 'MEDIUM',
          feeEstimate: 5,
          transactionCount: 25000,
          pattern: 'NORMAL'
        },
        whaleMovement: {
          largeTransactions: 10,
          netFlow: 'NEUTRAL',
          confidence: 50
        },
        macroCyclePhase: {
          phase: 'MARKUP',
          confidence: 80,
          daysInPhase: 30
        },
        confidenceScore: -10, // Invalid: < 0
        reasoning: 'Test',
        mathematicalJustification: 'Test',
        errors: [],
        corrections: []
      };
      
      const corrected = qsic.correctErrors(invalidAnalysis);
      
      expect(corrected).toBeDefined();
      expect(corrected.corrected.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(corrected.corrected.confidenceScore).toBeLessThanOrEqual(100);
      expect(corrected.corrected.timeSymmetricTrajectory.alignment).toBeLessThanOrEqual(100);
      expect(corrected.corrections.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // SUBTASK 4.5: Guardrail Enforcement
  // ============================================================================
  
  describe('4.5 Guardrail Enforcement', () => {
    it('should enforce zero-hallucination guardrails', () => {
      const operation: SystemOperation = {
        type: 'TRADE_GENERATION',
        data: {
          sources: ['CMC', 'CoinGecko', 'Kraken'],
          price: 95000,
          dataQualityScore: 85,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      
      const result = qsic.enforceGuardrails(operation);
      
      expect(result).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(Array.isArray(result.violations)).toBe(true);
      expect(['INFO', 'WARNING', 'ERROR', 'FATAL']).toContain(result.severity);
      expect(['PROCEED', 'WARN', 'BLOCK', 'SUSPEND']).toContain(result.action);
    });
    
    it('should block operations with unapproved sources', () => {
      const operation: SystemOperation = {
        type: 'TRADE_GENERATION',
        data: {
          sources: ['UNAPPROVED_SOURCE'],
          price: 95000,
          dataQualityScore: 85,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      
      const result = qsic.enforceGuardrails(operation);
      
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('FATAL');
      expect(result.action).toBe('SUSPEND');
      expect(result.violations.length).toBeGreaterThan(0);
    });
    
    it('should block operations with low data quality', () => {
      const operation: SystemOperation = {
        type: 'TRADE_GENERATION',
        data: {
          sources: ['CMC', 'CoinGecko'],
          price: 95000,
          dataQualityScore: 50, // Below 70% threshold
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      
      const result = qsic.enforceGuardrails(operation);
      
      expect(result.passed).toBe(false);
      expect(result.violations.some(v => v.includes('DATA QUALITY'))).toBe(true);
    });
    
    it('should detect price anomalies', () => {
      const operation: SystemOperation = {
        type: 'TRADE_GENERATION',
        data: {
          sources: ['CMC', 'CoinGecko'],
          price: 5000000, // Anomalous price > $1M
          dataQualityScore: 85,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      
      const result = qsic.enforceGuardrails(operation);
      
      expect(result.passed).toBe(false);
      expect(result.violations.some(v => v.includes('ANOMALY'))).toBe(true);
    });
  });
});
