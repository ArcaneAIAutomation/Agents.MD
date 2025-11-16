/**
 * Source Reliability Tracker
 * UCIE Veritas Protocol - Dynamic Trust Adjustment System
 * 
 * Tracks and dynamically adjusts trust scores for data sources based on
 * historical validation results. Sources with higher reliability get higher
 * trust weights in validation calculations.
 */

import { query, queryOne, queryMany } from '../../../db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Source reliability score with dynamic trust weight
 */
export interface SourceReliabilityScore {
  sourceName: string;
  reliabilityScore: number; // 0-100
  totalValidations: number;
  successfulValidations: number;
  deviationCount: number;
  lastUpdated: string;
  trustWeight: number; // 0-1, dynamically adjusted
}

/**
 * Historical reliability entry
 */
export interface ReliabilityHistory {
  timestamp: string;
  validationResult: 'pass' | 'fail' | 'deviation';
  deviationAmount?: number;
}

/**
 * Database row for source reliability
 */
interface SourceReliabilityRow {
  id: string;
  source_name: string;
  reliability_score: number;
  total_validations: number;
  successful_validations: number;
  deviation_count: number;
  last_updated: string;
  trust_weight: number;
  created_at: string;
}

// ============================================================================
// SOURCE RELIABILITY TRACKER CLASS
// ============================================================================

/**
 * Tracks and manages reliability scores for data sources
 * with dynamic trust weight adjustment
 */
export class SourceReliabilityTracker {
  private reliabilityScores: Map<string, SourceReliabilityScore>;
  private history: Map<string, ReliabilityHistory[]>;
  private maxHistorySize: number;
  
  constructor(maxHistorySize: number = 100) {
    this.reliabilityScores = new Map();
    this.history = new Map();
    this.maxHistorySize = maxHistorySize;
  }
  
  /**
   * Initialize tracker by loading existing scores from database
   */
  async initialize(): Promise<void> {
    try {
      const rows = await queryMany<SourceReliabilityRow>(
        'SELECT * FROM veritas_source_reliability ORDER BY source_name'
      );
      
      for (const row of rows) {
        this.reliabilityScores.set(row.source_name, {
          sourceName: row.source_name,
          reliabilityScore: parseFloat(row.reliability_score.toString()),
          totalValidations: parseInt(row.total_validations.toString()),
          successfulValidations: parseInt(row.successful_validations.toString()),
          deviationCount: parseInt(row.deviation_count.toString()),
          lastUpdated: row.last_updated,
          trustWeight: parseFloat(row.trust_weight.toString())
        });
      }
      
      console.log(`✅ Loaded ${rows.length} source reliability scores`);
    } catch (error) {
      console.error('Failed to initialize source reliability tracker:', error);
      // Continue with empty scores - will be created on first update
    }
  }
  
  /**
   * Update reliability score after each validation
   * 
   * @param sourceName - Name of the data source
   * @param validationResult - Result of validation (pass/fail/deviation)
   * @param deviationAmount - Optional deviation percentage
   */
  async updateReliability(
    sourceName: string,
    validationResult: 'pass' | 'fail' | 'deviation',
    deviationAmount?: number
  ): Promise<void> {
    // Get current score or create new one
    const current = this.reliabilityScores.get(sourceName) || {
      sourceName,
      reliabilityScore: 100, // Start with perfect score
      totalValidations: 0,
      successfulValidations: 0,
      deviationCount: 0,
      lastUpdated: new Date().toISOString(),
      trustWeight: 1.0
    };
    
    // Update validation counts
    current.totalValidations++;
    
    if (validationResult === 'pass') {
      current.successfulValidations++;
    } else if (validationResult === 'deviation') {
      current.deviationCount++;
    }
    
    // Calculate reliability score (percentage of successful validations)
    current.reliabilityScore = 
      (current.successfulValidations / current.totalValidations) * 100;
    
    // Dynamically adjust trust weight based on reliability
    // Sources with >90% reliability get full weight (1.0)
    // Sources with <70% reliability get reduced weight (0.5-0.9)
    if (current.reliabilityScore >= 90) {
      current.trustWeight = 1.0;
    } else if (current.reliabilityScore >= 80) {
      current.trustWeight = 0.9;
    } else if (current.reliabilityScore >= 70) {
      current.trustWeight = 0.8;
    } else if (current.reliabilityScore >= 60) {
      current.trustWeight = 0.7;
    } else if (current.reliabilityScore >= 50) {
      current.trustWeight = 0.6;
    } else {
      current.trustWeight = 0.5; // Minimum weight for very unreliable sources
    }
    
    current.lastUpdated = new Date().toISOString();
    
    // Update in-memory cache
    this.reliabilityScores.set(sourceName, current);
    
    // Add to history
    this.addToHistory(sourceName, {
      timestamp: new Date().toISOString(),
      validationResult,
      deviationAmount
    });
    
    // Persist to database (async, don't wait)
    this.persistToDatabase(current).catch(error => {
      console.error(`Failed to persist reliability score for ${sourceName}:`, error);
    });
  }
  
  /**
   * Get weighted trust score for a source
   * 
   * @param sourceName - Name of the data source
   * @returns Trust weight (0-1), defaults to 1.0 for unknown sources
   */
  getTrustWeight(sourceName: string): number {
    const score = this.reliabilityScores.get(sourceName);
    return score?.trustWeight || 1.0; // Default to full trust for new sources
  }
  
  /**
   * Get reliability score for a source
   * 
   * @param sourceName - Name of the data source
   * @returns Reliability score object or null if not found
   */
  getReliabilityScore(sourceName: string): SourceReliabilityScore | null {
    return this.reliabilityScores.get(sourceName) || null;
  }
  
  /**
   * Get all reliability scores
   * 
   * @returns Array of all reliability scores
   */
  getAllScores(): SourceReliabilityScore[] {
    return Array.from(this.reliabilityScores.values());
  }
  
  /**
   * Get sources that should be deprioritized
   * 
   * @param threshold - Minimum reliability score (default: 70)
   * @returns Array of unreliable source names
   */
  getUnreliableSources(threshold: number = 70): string[] {
    return Array.from(this.reliabilityScores.values())
      .filter(s => s.reliabilityScore < threshold)
      .map(s => s.sourceName);
  }
  
  /**
   * Get sources with high reliability
   * 
   * @param threshold - Minimum reliability score (default: 90)
   * @returns Array of reliable source names
   */
  getReliableSources(threshold: number = 90): string[] {
    return Array.from(this.reliabilityScores.values())
      .filter(s => s.reliabilityScore >= threshold)
      .map(s => s.sourceName);
  }
  
  /**
   * Get validation history for a source
   * 
   * @param sourceName - Name of the data source
   * @returns Array of historical validation results
   */
  getHistory(sourceName: string): ReliabilityHistory[] {
    return this.history.get(sourceName) || [];
  }
  
  /**
   * Add entry to validation history
   * 
   * @param sourceName - Name of the data source
   * @param entry - Historical entry to add
   */
  private addToHistory(sourceName: string, entry: ReliabilityHistory): void {
    const sourceHistory = this.history.get(sourceName) || [];
    sourceHistory.push(entry);
    
    // Limit history size
    if (sourceHistory.length > this.maxHistorySize) {
      sourceHistory.shift(); // Remove oldest entry
    }
    
    this.history.set(sourceName, sourceHistory);
  }
  
  /**
   * Persist reliability score to database
   * 
   * @param score - Reliability score to persist
   */
  async persistToDatabase(score: SourceReliabilityScore): Promise<void> {
    try {
      // Upsert (insert or update)
      await query(
        `INSERT INTO veritas_source_reliability (
          source_name,
          reliability_score,
          total_validations,
          successful_validations,
          deviation_count,
          last_updated,
          trust_weight
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (source_name)
        DO UPDATE SET
          reliability_score = EXCLUDED.reliability_score,
          total_validations = EXCLUDED.total_validations,
          successful_validations = EXCLUDED.successful_validations,
          deviation_count = EXCLUDED.deviation_count,
          last_updated = EXCLUDED.last_updated,
          trust_weight = EXCLUDED.trust_weight`,
        [
          score.sourceName,
          score.reliabilityScore,
          score.totalValidations,
          score.successfulValidations,
          score.deviationCount,
          score.lastUpdated,
          score.trustWeight
        ]
      );
    } catch (error) {
      console.error(`Failed to persist reliability score for ${score.sourceName}:`, error);
      throw error;
    }
  }
  
  /**
   * Reset reliability score for a source
   * 
   * @param sourceName - Name of the data source
   */
  async resetSource(sourceName: string): Promise<void> {
    this.reliabilityScores.delete(sourceName);
    this.history.delete(sourceName);
    
    await query(
      'DELETE FROM veritas_source_reliability WHERE source_name = $1',
      [sourceName]
    );
  }
  
  /**
   * Reset all reliability scores
   */
  async resetAll(): Promise<void> {
    this.reliabilityScores.clear();
    this.history.clear();
    
    await query('DELETE FROM veritas_source_reliability');
  }
  
  /**
   * Get summary statistics
   * 
   * @returns Summary of reliability tracking
   */
  getSummary(): {
    totalSources: number;
    averageReliability: number;
    reliableSources: number;
    unreliableSources: number;
    totalValidations: number;
  } {
    const scores = Array.from(this.reliabilityScores.values());
    
    if (scores.length === 0) {
      return {
        totalSources: 0,
        averageReliability: 0,
        reliableSources: 0,
        unreliableSources: 0,
        totalValidations: 0
      };
    }
    
    const totalReliability = scores.reduce((sum, s) => sum + s.reliabilityScore, 0);
    const totalValidations = scores.reduce((sum, s) => sum + s.totalValidations, 0);
    
    return {
      totalSources: scores.length,
      averageReliability: totalReliability / scores.length,
      reliableSources: scores.filter(s => s.reliabilityScore >= 90).length,
      unreliableSources: scores.filter(s => s.reliabilityScore < 70).length,
      totalValidations
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global singleton instance of the source reliability tracker
 */
let trackerInstance: SourceReliabilityTracker | null = null;

/**
 * Get or create the global source reliability tracker instance
 * 
 * @returns Initialized tracker instance
 */
export async function getSourceReliabilityTracker(): Promise<SourceReliabilityTracker> {
  if (!trackerInstance) {
    trackerInstance = new SourceReliabilityTracker();
    await trackerInstance.initialize();
  }
  
  return trackerInstance;
}

/**
 * Reset the global tracker instance (useful for testing)
 */
export function resetTrackerInstance(): void {
  trackerInstance = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SourceReliabilityTracker;
