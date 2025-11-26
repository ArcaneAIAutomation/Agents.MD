/**
 * Einstein 100000x Trade Generation Engine
 * 
 * Main entry point for the Einstein Engine module.
 * This module provides GPT-5.1 powered trade signal generation with:
 * - Comprehensive multi-source data collection (13+ APIs)
 * - Einstein-level AI analysis with high reasoning effort
 * - Automatic long/short position detection
 * - Advanced risk management
 * - User approval workflow
 * - Superior visualization
 * 
 * @module einstein
 */

// Core types and interfaces
export * from './types';

// Coordinator - Main entry point for trade signal generation
export * from './coordinator/engine';

// Data collection utilities
export * from './data/collector';

// AI analysis engines
export * from './analysis/gpt51';
export * from './analysis/riskCalculator';

// Workflow management
export * from './workflow/approval';

// Execution tracking
export * from './execution/tracker';

// Visualization components (to be implemented)
// export * from './visualization/components';

/**
 * Module version
 */
export const EINSTEIN_MODULE_VERSION = '1.0.0';
