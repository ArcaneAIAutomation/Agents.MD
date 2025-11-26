/**
 * QSTGE (Quantum-Superior Trade Generation Engine) Tests
 * 
 * Tests for the trade signal generation engine
 */

import { qstge } from '../../lib/quantum/qstge';

describe('Quantum-Superior Trade Generation Engine (QSTGE)', () => {
  // Note: These tests require API keys and live data
  // They are integration tests, not unit tests
  
  describe('GPT-5.1 Integration', () => {
    it('should have OpenAI client configured', () => {
      expect(qstge).toBeDefined();
      expect(qstge['openai']).toBeDefined();
    });
  });
  
  describe('Trade Signal Generation', () => {
    it('should have generateTradeSignal method', () => {
      expect(typeof qstge.generateTradeSignal).toBe('function');
    });
    
    // Integration test - requires API keys
    it.skip('should generate a complete trade signal', async () => {
      const signal = await qstge.generateTradeSignal();
      
      expect(signal).toBeDefined();
      expect(signal.symbol).toBe('BTC');
      expect(signal.entryZone).toBeDefined();
      expect(signal.entryZone.min).toBeGreaterThan(0);
      expect(signal.entryZone.max).toBeGreaterThan(signal.entryZone.min);
      expect(signal.entryZone.optimal).toBeGreaterThanOrEqual(signal.entryZone.min);
      expect(signal.entryZone.optimal).toBeLessThanOrEqual(signal.entryZone.max);
      
      expect(signal.targets).toBeDefined();
      expect(signal.targets.tp1.allocation).toBe(50);
      expect(signal.targets.tp2.allocation).toBe(30);
      expect(signal.targets.tp3.allocation).toBe(20);
      
      expect(signal.stopLoss).toBeDefined();
      expect(signal.stopLoss.price).toBeGreaterThan(0);
      expect(signal.stopLoss.maxLossPercent).toBeGreaterThan(0);
      expect(signal.stopLoss.maxLossPercent).toBeLessThanOrEqual(5);
      
      expect(signal.timeframe).toMatch(/^(1h|4h|1d|1w)$/);
      
      expect(signal.confidence).toBeGreaterThanOrEqual(0);
      expect(signal.confidence).toBeLessThanOrEqual(100);
      
      expect(signal.dataQualityScore).toBeGreaterThanOrEqual(70);
      
      expect(signal.quantumReasoning).toBeDefined();
      expect(signal.mathematicalJustification).toBeDefined();
      expect(signal.crossAPIProof.length).toBeGreaterThan(0);
      expect(signal.historicalTriggers.length).toBeGreaterThan(0);
    }, 60000); // 60 second timeout for API calls
  });
});
