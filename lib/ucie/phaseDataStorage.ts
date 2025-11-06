/**
 * UCIE Phase Data Storage Utility
 * 
 * Manages storage and retrieval of phase data during progressive loading.
 * Stores data in database to persist across serverless function restarts.
 */

import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface PhaseData {
  sessionId: string;
  symbol: string;
  phaseNumber: number;
  data: any;
}

/**
 * Store phase data in database
 * 
 * @param sessionId - Unique session identifier
 * @param symbol - Token symbol
 * @param phaseNumber - Phase number (1-4)
 * @param data - Phase data to store
 */
export async function storePhaseData(
  sessionId: string,
  symbol: string,
  phaseNumber: number,
  data: any
): Promise<void> {
  try {
    await query(
      `INSERT INTO ucie_phase_data (session_id, symbol, phase_number, phase_data, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour')
       ON CONFLICT (session_id, symbol, phase_number)
       DO UPDATE SET phase_data = $4, expires_at = NOW() + INTERVAL '1 hour', created_at = NOW()`,
      [sessionId, symbol.toUpperCase(), phaseNumber, JSON.stringify(data)]
    );
    
    console.log(`💾 Stored Phase ${phaseNumber} data for ${symbol} (session: ${sessionId})`);
  } catch (error) {
    console.error(`❌ Failed to store Phase ${phaseNumber} data:`, error);
    throw error;
  }
}

/**
 * Retrieve all phase data for a session
 * 
 * @param sessionId - Unique session identifier
 * @param symbol - Token symbol
 * @returns Object mapping phase numbers to their data
 */
export async function getPhaseData(
  sessionId: string,
  symbol: string
): Promise<Record<number, any>> {
  try {
    const result = await query(
      `SELECT phase_number, phase_data, created_at
       FROM ucie_phase_data
       WHERE session_id = $1 AND symbol = $2 AND expires_at > NOW()
       ORDER BY phase_number`,
      [sessionId, symbol.toUpperCase()]
    );
    
    const phaseData: Record<number, any> = {};
    for (const row of result.rows) {
      phaseData[row.phase_number] = JSON.parse(row.phase_data);
      
      const age = Date.now() - new Date(row.created_at).getTime();
      console.log(`📊 Retrieved Phase ${row.phase_number} data (age: ${Math.floor(age / 1000)}s)`);
    }
    
    return phaseData;
  } catch (error) {
    console.error(`❌ Failed to retrieve phase data:`, error);
    return {};
  }
}

/**
 * Get aggregated data from all previous phases
 * 
 * @param sessionId - Unique session identifier
 * @param symbol - Token symbol
 * @param upToPhase - Get data up to (but not including) this phase
 * @returns Aggregated data from all previous phases
 */
export async function getAggregatedPhaseData(
  sessionId: string,
  symbol: string,
  upToPhase: number
): Promise<any> {
  const allPhaseData = await getPhaseData(sessionId, symbol);
  
  const aggregated: any = {};
  let phaseCount = 0;
  
  for (let phase = 1; phase < upToPhase; phase++) {
    if (allPhaseData[phase]) {
      Object.assign(aggregated, allPhaseData[phase]);
      phaseCount++;
    }
  }
  
  console.log(`📦 Aggregated data from ${phaseCount} phases for ${symbol}`);
  
  return aggregated;
}

/**
 * Generate or retrieve session ID from browser storage
 * 
 * @returns Session ID (UUID)
 */
export function getOrCreateSessionId(): string {
  // Server-side: generate new UUID
  if (typeof window === 'undefined') {
    return uuidv4();
  }
  
  // Client-side: use sessionStorage
  let sessionId = sessionStorage.getItem('ucie_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('ucie_session_id', sessionId);
    console.log(`🆔 Created new session: ${sessionId}`);
  } else {
    console.log(`🆔 Using existing session: ${sessionId}`);
  }
  
  return sessionId;
}

/**
 * Clear session data (for testing or manual reset)
 * 
 * @param sessionId - Session ID to clear
 * @param symbol - Optional symbol to clear (if omitted, clears all for session)
 */
export async function clearSessionData(
  sessionId: string,
  symbol?: string
): Promise<void> {
  try {
    if (symbol) {
      await query(
        `DELETE FROM ucie_phase_data WHERE session_id = $1 AND symbol = $2`,
        [sessionId, symbol.toUpperCase()]
      );
      console.log(`🗑️ Cleared session data for ${symbol}`);
    } else {
      await query(
        `DELETE FROM ucie_phase_data WHERE session_id = $1`,
        [sessionId]
      );
      console.log(`🗑️ Cleared all session data for session ${sessionId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to clear session data:`, error);
  }
}

/**
 * Get session statistics (for debugging)
 * 
 * @param sessionId - Session ID
 * @returns Statistics about the session
 */
export async function getSessionStats(sessionId: string): Promise<{
  totalPhases: number;
  symbols: string[];
  oldestData: Date | null;
  newestData: Date | null;
}> {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_phases,
        ARRAY_AGG(DISTINCT symbol) as symbols,
        MIN(created_at) as oldest_data,
        MAX(created_at) as newest_data
       FROM ucie_phase_data
       WHERE session_id = $1 AND expires_at > NOW()`,
      [sessionId]
    );
    
    const row = result.rows[0];
    return {
      totalPhases: parseInt(row.total_phases),
      symbols: row.symbols || [],
      oldestData: row.oldest_data ? new Date(row.oldest_data) : null,
      newestData: row.newest_data ? new Date(row.newest_data) : null
    };
  } catch (error) {
    console.error(`❌ Failed to get session stats:`, error);
    return {
      totalPhases: 0,
      symbols: [],
      oldestData: null,
      newestData: null
    };
  }
}
