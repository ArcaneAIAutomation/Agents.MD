/**
 * Einstein 100000x Trade Generation Engine - Approval Workflow Manager
 * 
 * Manages user review, approval, rejection, and modification of trade signals.
 * Implements 5-minute approval timeout and concurrent modification detection.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { query, queryOne } from '../../db';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface TradeSignal {
  id: string;
  symbol: string;
  positionType: 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  takeProfits: {
    tp1: { price: number; allocation: number };
    tp2: { price: number; allocation: number };
    tp3: { price: number; allocation: number };
  };
  confidence: {
    overall: number;
    technical: number;
    sentiment: number;
    onChain: number;
    risk: number;
  };
  riskReward: number;
  positionSize: number;
  maxLoss: number;
  timeframe: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'PARTIAL_CLOSE' | 'CLOSED';
  dataQuality: {
    overall: number;
    market: number;
    sentiment: number;
    onChain: number;
    technical: number;
    sources: {
      successful: string[];
      failed: string[];
    };
  };
  analysis: any; // ComprehensiveAnalysis
}

export interface AIAnalysis {
  positionType: 'LONG' | 'SHORT' | 'NO_TRADE';
  confidence: {
    overall: number;
    technical: number;
    sentiment: number;
    onChain: number;
    risk: number;
  };
  reasoning: {
    technical: string;
    sentiment: string;
    onChain: string;
    risk: string;
    overall: string;
  };
  entry: number;
  stopLoss: number;
  takeProfits: {
    tp1: { price: number; allocation: number };
    tp2: { price: number; allocation: number };
    tp3: { price: number; allocation: number };
  };
  timeframeAlignment: {
    '15m': 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    '1h': 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    '4h': 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    '1d': 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    alignment: number;
  };
  riskReward: number;
}

export interface ApprovalResult {
  action: 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'TIMEOUT';
  modifiedSignal?: TradeSignal;
  rejectionReason?: string;
  timestamp: string;
}

export interface DatabaseResult {
  success: boolean;
  tradeId?: string;
  error?: string;
  timestamp: string;
}

// ============================================================================
// Approval Workflow Manager Class
// ============================================================================

export class ApprovalWorkflowManager {
  private readonly APPROVAL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  private pendingApprovals: Map<string, {
    signal: TradeSignal;
    analysis: AIAnalysis;
    presentedAt: number;
    version: number;
  }> = new Map();

  /**
   * Present a trade signal for user approval
   * Requirement 5.1: Display comprehensive preview modal before database commit
   * Requirement 5.2: Include all analysis details, reasoning, and risk metrics
   */
  async presentForApproval(
    signal: TradeSignal,
    analysis: AIAnalysis
  ): Promise<{ signalId: string; expiresAt: string }> {
    const signalId = signal.id;
    const presentedAt = Date.now();
    const expiresAt = new Date(presentedAt + this.APPROVAL_TIMEOUT_MS).toISOString();

    // Store pending approval with version tracking for concurrent modification detection
    this.pendingApprovals.set(signalId, {
      signal,
      analysis,
      presentedAt,
      version: 1
    });

    // Set timeout to auto-reject if no action taken
    setTimeout(() => {
      this.handleTimeout(signalId);
    }, this.APPROVAL_TIMEOUT_MS);

    return {
      signalId,
      expiresAt
    };
  }

  /**
   * Handle user approval of a trade signal
   * Requirement 5.3: Save trade signal to Supabase database on approval
   */
  async handleApproval(signalId: string, userId: string): Promise<DatabaseResult> {
    try {
      // Check if signal is still pending
      const pending = this.pendingApprovals.get(signalId);
      if (!pending) {
        return {
          success: false,
          error: 'Signal not found or already processed',
          timestamp: new Date().toISOString()
        };
      }

      // Check if approval timeout has expired
      const now = Date.now();
      if (now - pending.presentedAt > this.APPROVAL_TIMEOUT_MS) {
        this.pendingApprovals.delete(signalId);
        return {
          success: false,
          error: 'Approval timeout expired (5 minutes)',
          timestamp: new Date().toISOString()
        };
      }

      // Update signal status to APPROVED
      const approvedSignal = {
        ...pending.signal,
        status: 'APPROVED' as const,
        approvedAt: new Date().toISOString(),
        approvedBy: userId
      };

      // Save to database
      const result = await this.saveToDatabase(approvedSignal, pending.analysis);

      // Remove from pending approvals
      this.pendingApprovals.delete(signalId);

      // Log approval event
      await this.logApprovalEvent(signalId, userId, 'APPROVED');

      return result;
    } catch (error) {
      console.error('Error handling approval:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handle user rejection of a trade signal
   * Requirement 5.4: Discard trade signal and log rejection reason
   */
  async handleRejection(
    signalId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    try {
      // Check if signal is still pending
      const pending = this.pendingApprovals.get(signalId);
      if (!pending) {
        throw new Error('Signal not found or already processed');
      }

      // Log rejection event with reason
      await this.logRejectionEvent(signalId, userId, reason);

      // Remove from pending approvals
      this.pendingApprovals.delete(signalId);

      console.log(`Trade signal ${signalId} rejected by user ${userId}: ${reason}`);
    } catch (error) {
      console.error('Error handling rejection:', error);
      throw error;
    }
  }

  /**
   * Handle user modification of a trade signal
   * Requirement 5.5: Allow manual adjustments to entry, targets, and stops before saving
   */
  async handleModification(
    signalId: string,
    userId: string,
    modifications: Partial<TradeSignal>
  ): Promise<DatabaseResult> {
    try {
      // Check if signal is still pending
      const pending = this.pendingApprovals.get(signalId);
      if (!pending) {
        return {
          success: false,
          error: 'Signal not found or already processed',
          timestamp: new Date().toISOString()
        };
      }

      // Check for concurrent modification
      const currentVersion = pending.version;
      if (modifications.version && modifications.version !== currentVersion) {
        return {
          success: false,
          error: 'Concurrent modification detected. Please refresh and try again.',
          timestamp: new Date().toISOString()
        };
      }

      // Check if approval timeout has expired
      const now = Date.now();
      if (now - pending.presentedAt > this.APPROVAL_TIMEOUT_MS) {
        this.pendingApprovals.delete(signalId);
        return {
          success: false,
          error: 'Approval timeout expired (5 minutes)',
          timestamp: new Date().toISOString()
        };
      }

      // Validate modifications
      const validationError = this.validateModifications(pending.signal, modifications);
      if (validationError) {
        return {
          success: false,
          error: validationError,
          timestamp: new Date().toISOString()
        };
      }

      // Apply modifications
      const modifiedSignal: TradeSignal = {
        ...pending.signal,
        ...modifications,
        status: 'APPROVED' as const,
        modifiedAt: new Date().toISOString(),
        modifiedBy: userId,
        originalSignalId: signalId
      };

      // Recalculate risk-reward ratio if entry, stop, or targets changed
      if (
        modifications.entry ||
        modifications.stopLoss ||
        modifications.takeProfits
      ) {
        modifiedSignal.riskReward = this.calculateRiskReward(
          modifiedSignal.entry,
          modifiedSignal.stopLoss,
          modifiedSignal.takeProfits.tp1.price
        );
      }

      // Save to database
      const result = await this.saveToDatabase(modifiedSignal, pending.analysis);

      // Update pending approval with new version
      pending.version += 1;
      pending.signal = modifiedSignal;

      // Log modification event
      await this.logModificationEvent(signalId, userId, modifications);

      return result;
    } catch (error) {
      console.error('Error handling modification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get pending approval status
   */
  getPendingApproval(signalId: string): {
    signal: TradeSignal;
    analysis: AIAnalysis;
    timeRemaining: number;
    version: number;
  } | null {
    const pending = this.pendingApprovals.get(signalId);
    if (!pending) {
      return null;
    }

    const now = Date.now();
    const timeRemaining = Math.max(
      0,
      this.APPROVAL_TIMEOUT_MS - (now - pending.presentedAt)
    );

    return {
      signal: pending.signal,
      analysis: pending.analysis,
      timeRemaining,
      version: pending.version
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Handle approval timeout
   */
  private async handleTimeout(signalId: string): Promise<void> {
    const pending = this.pendingApprovals.get(signalId);
    if (!pending) {
      return; // Already processed
    }

    // Log timeout event
    await this.logTimeoutEvent(signalId);

    // Remove from pending approvals
    this.pendingApprovals.delete(signalId);

    console.log(`Trade signal ${signalId} approval timeout (5 minutes)`);
  }

  /**
   * Validate user modifications
   */
  private validateModifications(
    original: TradeSignal,
    modifications: Partial<TradeSignal>
  ): string | null {
    // Validate entry price
    if (modifications.entry !== undefined) {
      if (modifications.entry <= 0) {
        return 'Entry price must be greater than 0';
      }
    }

    // Validate stop loss
    if (modifications.stopLoss !== undefined) {
      const entry = modifications.entry || original.entry;
      if (original.positionType === 'LONG' && modifications.stopLoss >= entry) {
        return 'Stop loss must be below entry price for LONG positions';
      }
      if (original.positionType === 'SHORT' && modifications.stopLoss <= entry) {
        return 'Stop loss must be above entry price for SHORT positions';
      }
    }

    // Validate take profit targets
    if (modifications.takeProfits) {
      const entry = modifications.entry || original.entry;
      const { tp1, tp2, tp3 } = modifications.takeProfits;

      if (original.positionType === 'LONG') {
        if (tp1.price <= entry || tp2.price <= entry || tp3.price <= entry) {
          return 'Take profit targets must be above entry price for LONG positions';
        }
        if (tp1.price >= tp2.price || tp2.price >= tp3.price) {
          return 'Take profit targets must be ordered: TP1 < TP2 < TP3 for LONG';
        }
      } else {
        if (tp1.price >= entry || tp2.price >= entry || tp3.price >= entry) {
          return 'Take profit targets must be below entry price for SHORT positions';
        }
        if (tp1.price <= tp2.price || tp2.price <= tp3.price) {
          return 'Take profit targets must be ordered: TP1 > TP2 > TP3 for SHORT';
        }
      }

      // Validate allocations sum to 100%
      const totalAllocation = tp1.allocation + tp2.allocation + tp3.allocation;
      if (Math.abs(totalAllocation - 100) > 0.01) {
        return 'Take profit allocations must sum to 100%';
      }
    }

    return null; // Valid
  }

  /**
   * Calculate risk-reward ratio
   */
  private calculateRiskReward(
    entry: number,
    stopLoss: number,
    firstTarget: number
  ): number {
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(firstTarget - entry);
    return reward / risk;
  }

  /**
   * Save approved signal to database
   */
  private async saveToDatabase(
    signal: TradeSignal,
    analysis: AIAnalysis
  ): Promise<DatabaseResult> {
    try {
      // Insert into einstein_trade_signals table
      const result = await query(
        `INSERT INTO einstein_trade_signals (
          id, symbol, position_type, entry, stop_loss,
          tp1_price, tp1_allocation, tp2_price, tp2_allocation, tp3_price, tp3_allocation,
          confidence_overall, confidence_technical, confidence_sentiment, confidence_onchain, confidence_risk,
          risk_reward, position_size, max_loss, timeframe,
          status, created_at, approved_at, approved_by,
          data_quality_overall, data_quality_market, data_quality_sentiment, data_quality_onchain, data_quality_technical,
          analysis_data
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24,
          $25, $26, $27, $28, $29,
          $30
        ) RETURNING id`,
        [
          signal.id,
          signal.symbol,
          signal.positionType,
          signal.entry,
          signal.stopLoss,
          signal.takeProfits.tp1.price,
          signal.takeProfits.tp1.allocation,
          signal.takeProfits.tp2.price,
          signal.takeProfits.tp2.allocation,
          signal.takeProfits.tp3.price,
          signal.takeProfits.tp3.allocation,
          signal.confidence.overall,
          signal.confidence.technical,
          signal.confidence.sentiment,
          signal.confidence.onChain,
          signal.confidence.risk,
          signal.riskReward,
          signal.positionSize,
          signal.maxLoss,
          signal.timeframe,
          signal.status,
          signal.createdAt,
          signal.approvedAt || new Date().toISOString(),
          signal.approvedBy || 'system',
          signal.dataQuality.overall,
          signal.dataQuality.market,
          signal.dataQuality.sentiment,
          signal.dataQuality.onChain,
          signal.dataQuality.technical,
          JSON.stringify(analysis)
        ]
      );

      return {
        success: true,
        tradeId: signal.id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Database save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Log approval event
   */
  private async logApprovalEvent(
    signalId: string,
    userId: string,
    action: string
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO einstein_approval_logs (
          signal_id, user_id, action, timestamp
        ) VALUES ($1, $2, $3, $4)`,
        [signalId, userId, action, new Date().toISOString()]
      );
    } catch (error) {
      console.error('Error logging approval event:', error);
    }
  }

  /**
   * Log rejection event
   */
  private async logRejectionEvent(
    signalId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO einstein_approval_logs (
          signal_id, user_id, action, reason, timestamp
        ) VALUES ($1, $2, $3, $4, $5)`,
        [signalId, userId, 'REJECTED', reason, new Date().toISOString()]
      );
    } catch (error) {
      console.error('Error logging rejection event:', error);
    }
  }

  /**
   * Log modification event
   */
  private async logModificationEvent(
    signalId: string,
    userId: string,
    modifications: Partial<TradeSignal>
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO einstein_approval_logs (
          signal_id, user_id, action, modifications, timestamp
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          signalId,
          userId,
          'MODIFIED',
          JSON.stringify(modifications),
          new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error('Error logging modification event:', error);
    }
  }

  /**
   * Log timeout event
   */
  private async logTimeoutEvent(signalId: string): Promise<void> {
    try {
      await query(
        `INSERT INTO einstein_approval_logs (
          signal_id, user_id, action, timestamp
        ) VALUES ($1, $2, $3, $4)`,
        [signalId, 'system', 'TIMEOUT', new Date().toISOString()]
      );
    } catch (error) {
      console.error('Error logging timeout event:', error);
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const approvalWorkflowManager = new ApprovalWorkflowManager();
