/**
 * Custom hook for managing Deep Dive analysis state
 * 
 * Handles:
 * - Deep Dive analysis initiation
 * - Progress tracking
 * - Cancel functionality
 * - Fallback to standard analysis
 */

import { useState, useRef } from 'react';

interface WhaleTransaction {
  txHash: string;
  blockchain: 'BTC';
  amount: number;
  amountUSD: number;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  type: string;
  description: string;
}

interface DeepDiveState {
  isAnalyzing: boolean;
  stage: string;
  error: string | null;
  analysis: any | null;
  blockchainData: any | null;
}

export function useDeepDive() {
  const [state, setState] = useState<DeepDiveState>({
    isAnalyzing: false,
    stage: 'Fetching blockchain data...',
    error: null,
    analysis: null,
    blockchainData: null,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  /**
   * Start Deep Dive analysis
   */
  const startDeepDive = async (whale: WhaleTransaction) => {
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    setState({
      isAnalyzing: true,
      stage: 'Fetching blockchain data...',
      error: null,
      analysis: null,
      blockchainData: null,
    });
    
    try {
      // Simulate progress stages
      const stages = [
        'Fetching blockchain data...',
        'Analyzing transaction history...',
        'Tracing fund flows...',
        'Identifying patterns...',
        'Generating comprehensive analysis...',
      ];
      
      let currentStage = 0;
      const stageInterval = setInterval(() => {
        if (currentStage < stages.length - 1) {
          currentStage++;
          setState(prev => ({ ...prev, stage: stages[currentStage] }));
        }
      }, 2000); // Update stage every 2 seconds
      
      // Call Deep Dive API
      const response = await fetch('/api/whale-watch/deep-dive-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whale),
        signal: abortControllerRef.current.signal,
      });
      
      clearInterval(stageInterval);
      
      if (!response.ok) {
        throw new Error(`Deep Dive API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.analysis) {
        setState({
          isAnalyzing: false,
          stage: '',
          error: null,
          analysis: data.analysis,
          blockchainData: data.blockchainData,
        });
        
        return { success: true, data };
      } else {
        throw new Error(data.error || 'Failed to get Deep Dive analysis');
      }
    } catch (error: any) {
      // Check if it was cancelled
      if (error.name === 'AbortError') {
        console.log('Deep Dive cancelled by user');
        setState({
          isAnalyzing: false,
          stage: '',
          error: 'Analysis cancelled',
          analysis: null,
          blockchainData: null,
        });
        return { success: false, cancelled: true };
      }
      
      console.error('Deep Dive error:', error);
      setState({
        isAnalyzing: false,
        stage: '',
        error: error.message || 'Failed to perform Deep Dive analysis',
        analysis: null,
        blockchainData: null,
      });
      
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Cancel ongoing Deep Dive analysis
   */
  const cancelDeepDive = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setState({
      isAnalyzing: false,
      stage: '',
      error: null,
      analysis: null,
      blockchainData: null,
    });
  };
  
  /**
   * Fallback to standard Gemini Flash analysis
   */
  const fallbackToStandard = async (whale: WhaleTransaction) => {
    try {
      const response = await fetch('/api/whale-watch/analyze-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whale),
      });
      
      if (!response.ok) {
        throw new Error(`Analysis API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.analysis) {
        return { success: true, data };
      } else {
        throw new Error(data.error || 'Failed to get analysis');
      }
    } catch (error: any) {
      console.error('Fallback analysis error:', error);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Reset state
   */
  const reset = () => {
    setState({
      isAnalyzing: false,
      stage: '',
      error: null,
      analysis: null,
      blockchainData: null,
    });
  };
  
  return {
    ...state,
    startDeepDive,
    cancelDeepDive,
    fallbackToStandard,
    reset,
  };
}
