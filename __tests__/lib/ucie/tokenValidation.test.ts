/**
 * Unit Tests: Token Validation
 * 
 * Tests for token symbol validation and sanitization
 */

import { validateTokenSymbol, sanitizeTokenSymbol } from '../../../lib/ucie/tokenValidation';

describe('Token Validation', () => {
  describe('validateTokenSymbol', () => {
    test('accepts valid uppercase token symbols', () => {
      expect(validateTokenSymbol('BTC')).toBe(true);
      expect(validateTokenSymbol('ETH')).toBe(true);
      expect(validateTokenSymbol('USDT')).toBe(true);
      expect(validateTokenSymbol('SOL')).toBe(true);
    });

    test('accepts valid lowercase token symbols', () => {
      expect(validateTokenSymbol('btc')).toBe(true);
      expect(validateTokenSymbol('eth')).toBe(true);
    });

    test('accepts alphanumeric symbols', () => {
      expect(validateTokenSymbol('BTC2')).toBe(true);
      expect(validateTokenSymbol('ETH2')).toBe(true);
    });

    test('rejects symbols with special characters', () => {
      expect(validateTokenSymbol('BTC-USD')).toBe(false);
      expect(validateTokenSymbol('BTC/USD')).toBe(false);
      expect(validateTokenSymbol('BTC.D')).toBe(false);
      expect(validateTokenSymbol('BTC@')).toBe(false);
    });

    test('rejects empty or whitespace symbols', () => {
      expect(validateTokenSymbol('')).toBe(false);
      expect(validateTokenSymbol('   ')).toBe(false);
      expect(validateTokenSymbol('\t')).toBe(false);
    });

    test('rejects symbols exceeding max length', () => {
      expect(validateTokenSymbol('VERYLONGTOKENSYMBOL')).toBe(false);
      expect(validateTokenSymbol('A'.repeat(11))).toBe(false);
    });

    test('accepts symbols at max length boundary', () => {
      expect(validateTokenSymbol('A'.repeat(10))).toBe(true);
    });
  });

  describe('sanitizeTokenSymbol', () => {
    test('converts to uppercase', () => {
      expect(sanitizeTokenSymbol('btc')).toBe('BTC');
      expect(sanitizeTokenSymbol('eth')).toBe('ETH');
    });

    test('removes special characters', () => {
      expect(sanitizeTokenSymbol('BTC-USD')).toBe('BTCUSD');
      expect(sanitizeTokenSymbol('BTC/USD')).toBe('BTCUSD');
      expect(sanitizeTokenSymbol('BTC.D')).toBe('BTCD');
    });

    test('trims whitespace', () => {
      expect(sanitizeTokenSymbol('  BTC  ')).toBe('BTC');
      expect(sanitizeTokenSymbol('\tETH\n')).toBe('ETH');
    });

    test('handles mixed case and special chars', () => {
      expect(sanitizeTokenSymbol('btc-usd')).toBe('BTCUSD');
      expect(sanitizeTokenSymbol('Eth/Usdt')).toBe('ETHUSDT');
    });

    test('returns empty string for invalid input', () => {
      expect(sanitizeTokenSymbol('!!!')).toBe('');
      expect(sanitizeTokenSymbol('   ')).toBe('');
    });
  });
});
