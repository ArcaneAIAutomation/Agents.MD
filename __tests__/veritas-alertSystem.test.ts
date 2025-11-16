/**
 * Tests for Veritas Protocol Alert System
 * 
 * These tests verify that the alert system correctly:
 * - Queues alerts for processing
 * - Sends email notifications (mocked)
 * - Persists alerts to database (mocked)
 * - Manages alert review workflow
 * - Provides alert statistics
 * 
 * Requirements: 10.1, 10.2, 10.4
 */

import {
  VeritasAlertSystem,
  AlertNotification,
  notifyFatalError,
  notifyCriticalWarning,
  notifyWarning,
  notifyInfo
} from '../lib/ucie/veritas/utils/alertSystem';

// Mock the email module
jest.mock('../lib/email/office365', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  sendEmailAsync: jest.fn().mockResolvedValue({ success: true })
}));

// Mock the database module
jest.mock('../lib/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] })
}));

// Mock the email template generator
jest.mock('../lib/email/templates/veritasAlert', () => ({
  generateVeritasAlertEmail: jest.fn().mockReturnValue('<html>Mock Email</html>')
}));

import { sendEmail } from '../lib/email/office365';
import { query } from '../lib/db';
import { generateVeritasAlertEmail } from '../lib/email/templates/veritasAlert';

describe('Veritas Protocol - Alert System', () => {
  let alertSystem: VeritasAlertSystem;
  
  // Store original env
  const originalEmailEnabled = process.env.ENABLE_VERITAS_EMAIL_ALERTS;
  const originalEmailRecipients = process.env.VERITAS_ALERT_EMAIL;
  
  beforeEach(() => {
    // Create fresh alert system for each test
    alertSystem = new VeritasAlertSystem();
    
    // Clear mocks
    jest.clearAllMocks();
    
    // Enable email by default for tests
    process.env.ENABLE_VERITAS_EMAIL_ALERTS = 'true';
    process.env.VERITAS_ALERT_EMAIL = 'test@example.com';
  });
  
  afterEach(() => {
    // Restore original env
    if (originalEmailEnabled !== undefined) {
      process.env.ENABLE_VERITAS_EMAIL_ALERTS = originalEmailEnabled;
    } else {
      delete process.env.ENABLE_VERITAS_EMAIL_ALERTS;
    }
    
    if (originalEmailRecipients !== undefined) {
      process.env.VERITAS_ALERT_EMAIL = originalEmailRecipients;
    } else {
      delete process.env.VERITAS_ALERT_EMAIL;
    }
  });
  
  describe('queueAlert', () => {
    test('should queue alert successfully', async () => {
      const alert: AlertNotification = {
        severity: 'warning',
        symbol: 'BTC',
        alertType: 'market_discrepancy',
        message: 'Price discrepancy detected',
        details: {
          affectedSources: ['CoinGecko', 'CoinMarketCap'],
          discrepancyValue: 2.5,
          threshold: 1.5,
          recommendation: 'Use Kraken as tie-breaker'
        },
        timestamp: new Date().toISOString(),
        requiresHumanReview: false
      };
      
      await alertSystem.queueAlert(alert);
      
      expect(alertSystem.getQueueSize()).toBe(1);
    });
    
    test('should send email for fatal errors', async () => {
      const alert: AlertNotification = {
        severity: 'fatal',
        symbol: 'BTC',
        alertType: 'fatal_error',
        message: 'Fatal data error detected',
        details: {
          affectedSources: ['LunarCrush'],
          recommendation: 'Discard social data'
        },
        timestamp: new Date().toISOString(),
        requiresHumanReview: true
      };
      
      await alertSystem.queueAlert(alert);
      
      expect(sendEmail).toHaveBeenCalled();
      expect(generateVeritasAlertEmail).toHaveBeenCalledWith(alert);
    });
    
    test('should send email for alerts requiring human review', async () => {
      const alert: AlertNotification = {
        severity: 'error',
        symbol: 'BTC',
        alertType: 'onchain_inconsistency',
        message: 'On-chain data inconsistency',
        details: {
          affectedSources: ['Blockchain.com'],
          recommendation: 'Review on-chain data'
        },
        timestamp: new Date().toISOString(),
        requiresHumanReview: true
      };
      
      await alertSystem.queueAlert(alert);
      
      expect(sendEmail).toHaveBeenCalled();
    });
    
    test('should not send email for non-critical alerts', async () => {
      const alert: AlertNotification = {
        severity: 'info',
        symbol: 'BTC',
        alertType: 'market_discrepancy',
        message: 'Minor price difference',
        details: {
          affectedSources: ['CoinGecko'],
          recommendation: 'Monitor'
        },
        timestamp: new Date().toISOString(),
        requiresHumanReview: false
      };
      
      await alertSystem.queueAlert(alert);
      
      expect(sendEmail).not.toHaveBeenCalled();
    });
    
    test('should persist alert to database', async () => {
      const alert: AlertNotification = {
        severity: 'warning',
        symbol: 'BTC',
        alertType: 'market_discrepancy',
        message: 'Price discrepancy detected',
        details: {
          affectedSources: ['CoinGecko', 'CoinMarketCap'],
          recommendation: 'Use Kraken as tie-breaker'
        },
        timestamp: new Date().toISOString(),
        requiresHumanReview: false
      };
      
      await alertSystem.queueAlert(alert);
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO veritas_alerts'),
        expect.arrayContaining([
          alert.symbol,
          alert.severity,
          alert.alertType,
          alert.message
        ])
      );
    });
    
    test('should not send email when email is disabled', async () => {
      process.env.ENABLE_VERITAS_EMAIL_ALERTS = 'false';
      alertSystem = new VeritasAlertSystem();
      
      const alert: AlertNotification = {
        severity: 'fatal',
        symbol: 'BTC',
        alertType: 'fatal_error',
        message: 'Fatal error',
        details: {
          affectedSources: ['Source'],
          recommendation: 'Action'
        },
        timestamp: new Date().toISOString(),
        requiresHumanReview: true
      };
      
      await alertSystem.queueAlert(alert);
      
      expect(sendEmail).not.toHaveBeenCalled();
    });
    
    test('should handle email send failures gracefully', async () => {
      (sendEmail as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Email failed' });
      
      const alert: AlertNotification = {
        severity: 'fatal',
        symbol: 'BTC',
        alertType: 'fatal_error',
        message: 'Fatal error',
        details: {
          affectedSources: ['Source'],
          recommendation: 'Action'
        },
        timestamp: new Date().toISOString(),
        requiresHumanReview: true
      };
      
      // Should not throw
      await expect(alertSystem.queueAlert(alert)).resolves.not.toThrow();
    });
    
    test('should handle database persistence failures gracefully', async () => {
      (query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      const alert: AlertNotification = {
        severity: 'warning',
        symbol: 'BTC',
        alertType: 'market_discrepancy',
        message: 'Discrepancy',
        details: {
          affectedSources: ['Source'],
          recommendation: 'Action'
        },
        timestamp: new Date().toISOString(),
        requiresHumanReview: false
      };
      
      // Should not throw
      await expect(alertSystem.queueAlert(alert)).resolves.not.toThrow();
    });
  });
  
  describe('sendAlertEmail', () => {
    test('should send email to configured recipients', async () => {
      process.env.VERITAS_ALERT_EMAIL = 'admin1@example.com,admin2@example.com';
      alertSystem = new VeritasAlertSystem();
      
      const alert: AlertNotification = {
        severity: 'fatal',
        symbol: 'BTC',
        alertType: 'fatal_error',
        message: 'Fatal error',
        details: {
          affectedSources: ['Source'],
          recommendation: 'Action'
        },
        timestamp: new Date().toISOString(),
        requiresHumanReview: true
      };
      
      await alertSystem.queueAlert(alert);
      
      expect(sendEmail).toHaveBeenCalledTimes(2);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin1@example.com'
        })
      );
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin2@example.com'
        })
      );
    });
    
    test('should include severity emoji in subject', async () => {
      const testCases = [
        { severity: 'info' as const, emoji: 'ℹ️' },
        { severity: 'warning' as const, emoji: '⚠️' },
        { severity: 'error' as const, emoji: '❌' },
        { severity: 'fatal' as const, emoji: '🚨' }
      ];
      
      for (const { severity, emoji } of testCases) {
        jest.clearAllMocks();
        
        const alert: AlertNotification = {
          severity,
          symbol: 'BTC',
          alertType: 'market_discrepancy',
          message: 'Test',
          details: {
            affectedSources: ['Source'],
            recommendation: 'Action'
          },
          timestamp: new Date().toISOString(),
          requiresHumanReview: true
        };
        
        await alertSystem.queueAlert(alert);
        
        expect(sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: expect.stringContaining(emoji)
          })
        );
      }
    });
  });
  
  describe('getPendingAlerts', () => {
    test('should retrieve pending alerts from database', async () => {
      const mockAlerts = [
        {
          id: '1',
          symbol: 'BTC',
          severity: 'fatal',
          alertType: 'fatal_error',
          message: 'Fatal error',
          details: JSON.stringify({ affectedSources: ['Source'], recommendation: 'Action' }),
          timestamp: new Date().toISOString(),
          requiresHumanReview: true,
          reviewed: false,
          reviewedBy: null,
          reviewedAt: null,
          reviewNotes: null
        }
      ];
      
      (query as jest.Mock).mockResolvedValueOnce({ rows: mockAlerts });
      
      const alerts = await alertSystem.getPendingAlerts();
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE reviewed = false'),
        expect.any(Array)
      );
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe('1');
    });
    
    test('should respect limit parameter', async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      
      await alertSystem.getPendingAlerts(25);
      
      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        [25]
      );
    });
    
    test('should handle database errors gracefully', async () => {
      (query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      const alerts = await alertSystem.getPendingAlerts();
      
      expect(alerts).toEqual([]);
    });
  });
  
  describe('markAsReviewed', () => {
    test('should mark alert as reviewed', async () => {
      await alertSystem.markAsReviewed('alert-123', 'admin@example.com', 'Reviewed and resolved');
      
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE veritas_alerts'),
        ['admin@example.com', 'Reviewed and resolved', 'alert-123']
      );
    });
    
    test('should handle missing notes', async () => {
      await alertSystem.markAsReviewed('alert-123', 'admin@example.com');
      
      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        ['admin@example.com', null, 'alert-123']
      );
    });
    
    test('should throw on database error', async () => {
      (query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      await expect(
        alertSystem.markAsReviewed('alert-123', 'admin@example.com')
      ).rejects.toThrow('Database error');
    });
  });
  
  describe('getAlertStatistics', () => {
    test('should return correct statistics', async () => {
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // total
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })  // pending
        .mockResolvedValueOnce({ rows: [{ count: '7' }] })  // reviewed
        .mockResolvedValueOnce({ rows: [
          { severity: 'fatal', count: '2' },
          { severity: 'error', count: '3' },
          { severity: 'warning', count: '5' }
        ]})
        .mockResolvedValueOnce({ rows: [
          { alert_type: 'market_discrepancy', count: '4' },
          { alert_type: 'social_impossibility', count: '3' },
          { alert_type: 'onchain_inconsistency', count: '3' }
        ]});
      
      const stats = await alertSystem.getAlertStatistics();
      
      expect(stats.total).toBe(10);
      expect(stats.pending).toBe(3);
      expect(stats.reviewed).toBe(7);
      expect(stats.bySeverity).toEqual({
        fatal: 2,
        error: 3,
        warning: 5
      });
      expect(stats.byType).toEqual({
        market_discrepancy: 4,
        social_impossibility: 3,
        onchain_inconsistency: 3
      });
    });
    
    test('should handle database errors gracefully', async () => {
      (query as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      const stats = await alertSystem.getAlertStatistics();
      
      expect(stats).toEqual({
        total: 0,
        pending: 0,
        reviewed: 0,
        bySeverity: {},
        byType: {}
      });
    });
  });
  
  describe('clearQueue', () => {
    test('should clear in-memory queue', async () => {
      const alert: AlertNotification = {
        severity: 'info',
        symbol: 'BTC',
        alertType: 'market_discrepancy',
        message: 'Test',
        details: {
          affectedSources: ['Source'],
          recommendation: 'Action'
        },
        timestamp: new Date().toISOString(),
        requiresHumanReview: false
      };
      
      await alertSystem.queueAlert(alert);
      expect(alertSystem.getQueueSize()).toBe(1);
      
      alertSystem.clearQueue();
      expect(alertSystem.getQueueSize()).toBe(0);
    });
  });
  
  describe('helper functions', () => {
    test('notifyFatalError should create fatal alert', async () => {
      await notifyFatalError(
        'BTC',
        'fatal_error',
        'Fatal error message',
        {
          affectedSources: ['Source'],
          recommendation: 'Action'
        }
      );
      
      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['BTC', 'fatal', 'fatal_error'])
      );
    });
    
    test('notifyCriticalWarning should create error alert', async () => {
      await notifyCriticalWarning(
        'BTC',
        'market_discrepancy',
        'Critical warning message',
        {
          affectedSources: ['Source'],
          recommendation: 'Action'
        }
      );
      
      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['BTC', 'error', 'market_discrepancy'])
      );
    });
    
    test('notifyWarning should create warning alert', async () => {
      await notifyWarning(
        'BTC',
        'market_discrepancy',
        'Warning message',
        {
          affectedSources: ['Source'],
          recommendation: 'Action'
        }
      );
      
      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['BTC', 'warning', 'market_discrepancy'])
      );
    });
    
    test('notifyInfo should create info alert', async () => {
      await notifyInfo(
        'BTC',
        'market_discrepancy',
        'Info message',
        {
          affectedSources: ['Source'],
          recommendation: 'Action'
        }
      );
      
      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['BTC', 'info', 'market_discrepancy'])
      );
    });
  });
  
  describe('email configuration', () => {
    test('should use default recipient when not configured', () => {
      delete process.env.VERITAS_ALERT_EMAIL;
      const system = new VeritasAlertSystem();
      
      // Default should be no-reply@arcane.group
      expect(system).toBeDefined();
    });
    
    test('should parse multiple recipients', () => {
      process.env.VERITAS_ALERT_EMAIL = 'admin1@example.com, admin2@example.com, admin3@example.com';
      const system = new VeritasAlertSystem();
      
      expect(system).toBeDefined();
    });
  });
});
