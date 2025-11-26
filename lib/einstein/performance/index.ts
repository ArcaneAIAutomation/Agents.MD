/**
 * Einstein Trade Engine - Performance Module
 * 
 * Exports performance tracking and learning feedback functionality
 */

export { PerformanceTracker, performanceTracker } from './tracker';
export type {
  TradeExecution,
  PerformanceMetrics,
  LearningInsights as TrackerLearningInsights,
} from './tracker';

export { LearningFeedbackLoop, learningFeedbackLoop } from './learningFeedback';
export type {
  OutcomeComparison,
  ConfidenceAdjustment,
  LearningInsight,
  HistoricalAccuracy,
} from './learningFeedback';
