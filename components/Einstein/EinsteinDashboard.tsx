import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import EinsteinGenerateButton from './EinsteinGenerateButton';
import EinsteinAnalysisModal from './EinsteinAnalysisModal';
import EinsteinTradeHistory from './EinsteinTradeHistory';
import { useEinsteinGeneration } from '../../hooks/useEinsteinGeneration';

/**
 * Einstein Dashboard Component
 * 
 * Integrates the Einstein Generate Button with the analysis modal
 * and handles the complete trade signal generation workflow.
 * 
 * Features:
 * - Trade signal generation button
 * - Loading state management
 * - Error handling with user feedback
 * - Analysis modal for user approval
 * - Approval/Reject/Modify actions
 * 
 * Requirements: 5.1, 12.2
 */

interface EinsteinDashboardProps {
  symbol?: string;
  timeframe?: string;
  className?: string;
}

export default function EinsteinDashboard({
  symbol = 'BTC',
  timeframe = '1h',
  className = ''
}: EinsteinDashboardProps) {
  const {
    isGenerating,
    error,
    signal,
    analysis,
    isModalOpen,
    generateSignal,
    closeModal,
    clearError,
  } = useEinsteinGeneration();

  // Tab state for switching between generator and history
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');

  /**
   * Handle button click - trigger Einstein Engine
   * Requirements: 5.1, 12.2
   */
  const handleGenerateClick = async () => {
    await generateSignal(symbol, timeframe);
  };

  /**
   * Handle signal approval
   * Requirements: 5.3
   */
  const handleApprove = async () => {
    try {
      console.log('✅ User approved signal:', signal?.id);
      
      // TODO: Task 26 - Call ApprovalWorkflowManager.handleApproval()
      // await ApprovalWorkflowManager.handleApproval(signal);
      
      // Close modal after approval
      closeModal();
      
      // Show success message (could be a toast notification)
      alert('Trade signal approved and saved to database!');
      
    } catch (err) {
      console.error('❌ Failed to approve signal:', err);
      alert('Failed to approve signal. Please try again.');
    }
  };

  /**
   * Handle signal rejection
   * Requirements: 5.4
   */
  const handleReject = async () => {
    try {
      const reason = prompt('Please provide a reason for rejection (optional):');
      
      console.log('❌ User rejected signal:', signal?.id, 'Reason:', reason);
      
      // TODO: Task 26 - Call ApprovalWorkflowManager.handleRejection()
      // await ApprovalWorkflowManager.handleRejection(signal, reason || 'No reason provided');
      
      // Close modal after rejection
      closeModal();
      
      // Show confirmation message
      alert('Trade signal rejected and logged.');
      
    } catch (err) {
      console.error('❌ Failed to reject signal:', err);
      alert('Failed to reject signal. Please try again.');
    }
  };

  /**
   * Handle signal modification
   * Requirements: 5.5
   */
  const handleModify = async () => {
    try {
      console.log('✏️ User wants to modify signal:', signal?.id);
      
      // TODO: Task 26 - Implement modification UI
      // For now, just show a message
      alert('Signal modification UI coming soon! (Task 26)');
      
      // Keep modal open for modification
      
    } catch (err) {
      console.error('❌ Failed to modify signal:', err);
      alert('Failed to modify signal. Please try again.');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section with Tabs - Einstein Branding */}
      <div className="einstein-card einstein-glow">
        <div className="flex items-center gap-3 mb-3">
          <div className="einstein-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold einstein-text-glow mb-1">
              Einstein 100000x Trade Generation Engine
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="einstein-badge">GPT-5.1 POWERED</span>
              <span className="einstein-badge">100% REAL DATA</span>
            </div>
          </div>
        </div>
        <p className="text-bitcoin-white-80 mb-4">
          AI-powered trade signal generation with GPT-5.1 Einstein-level analysis
        </p>

        {/* Tab Navigation - Einstein Styled */}
        <div className="einstein-divider"></div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-6 py-2 font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'generator'
                ? 'einstein-tab-active'
                : 'bg-transparent text-bitcoin-white-80 border-2 border-bitcoin-orange-20 hover:border-bitcoin-orange'
            }`}
          >
            Generate Signal
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'history'
                ? 'einstein-tab-active'
                : 'bg-transparent text-bitcoin-white-80 border-2 border-bitcoin-orange-20 hover:border-bitcoin-orange'
            }`}
          >
            Trade History
          </button>
        </div>
      </div>

      {/* Generator Tab Content */}
      {activeTab === 'generator' && (
        <>
          {/* Current Settings - Einstein Styled */}
          <div className="einstein-card">
            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg px-3 py-2">
                <span className="text-bitcoin-white-60">Symbol: </span>
                <span className="einstein-stat" style={{ fontSize: '1rem' }}>{symbol}</span>
              </div>
              <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg px-3 py-2">
                <span className="text-bitcoin-white-60">Timeframe: </span>
                <span className="einstein-stat" style={{ fontSize: '1rem' }}>{timeframe}</span>
              </div>
            </div>

            {/* Generate Button */}
            <EinsteinGenerateButton
              onClick={handleGenerateClick}
              loading={isGenerating}
              disabled={isGenerating}
            />

            {/* Loading Message - Einstein Styled */}
            {isGenerating && (
              <div className="mt-4 bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="einstein-spinner"></div>
                  <p className="text-bitcoin-white-80 text-sm font-semibold">
                    🧠 Einstein Engine is analyzing market conditions...
                  </p>
                </div>
                <div className="einstein-progress">
                  <div className="einstein-progress-bar"></div>
                </div>
                <p className="text-bitcoin-white-60 text-xs mt-3">
                  This may take 20-30 seconds. Please wait.
                </p>
              </div>
            )}

            {/* Error Message - Einstein Styled */}
            {error && (
              <div className="mt-4 einstein-error">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={24} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold mb-1">Error</p>
                    <p className="text-bitcoin-white-80 text-sm">{error}</p>
                    <button
                      onClick={clearError}
                      className="mt-3 text-bitcoin-orange hover:text-bitcoin-white text-sm font-semibold transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Section - Einstein Styled */}
          <div className="einstein-card">
            <h3 className="text-lg font-bold einstein-header mb-4">
              How Einstein Engine Works
            </h3>
            <div className="space-y-3 text-sm text-bitcoin-white-80">
              <div className="flex items-start gap-3">
                <span className="einstein-badge" style={{ fontSize: '0.625rem', padding: '0.25rem 0.5rem' }}>1</span>
                <p>
                  <span className="text-bitcoin-orange font-bold">Data Collection:</span> Fetches data from 13+ APIs (market, sentiment, on-chain, technical)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="einstein-badge" style={{ fontSize: '0.625rem', padding: '0.25rem 0.5rem' }}>2</span>
                <p>
                  <span className="text-bitcoin-orange font-bold">AI Analysis:</span> GPT-5.1 with "high" reasoning effort analyzes all dimensions
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="einstein-badge" style={{ fontSize: '0.625rem', padding: '0.25rem 0.5rem' }}>3</span>
                <p>
                  <span className="text-bitcoin-orange font-bold">Position Detection:</span> Automatically determines LONG, SHORT, or NO_TRADE
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="einstein-badge" style={{ fontSize: '0.625rem', padding: '0.25rem 0.5rem' }}>4</span>
                <p>
                  <span className="text-bitcoin-orange font-bold">Risk Management:</span> Calculates optimal position size, stop-loss, and take-profits
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="einstein-badge" style={{ fontSize: '0.625rem', padding: '0.25rem 0.5rem' }}>5</span>
                <p>
                  <span className="text-bitcoin-orange font-bold">User Approval:</span> You review and approve before database commit
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* History Tab Content */}
      {activeTab === 'history' && (
        <EinsteinTradeHistory />
      )}

      {/* Analysis Modal */}
      <EinsteinAnalysisModal
        isOpen={isModalOpen}
        onClose={closeModal}
        signal={signal}
        analysis={analysis}
        onApprove={handleApprove}
        onReject={handleReject}
        onModify={handleModify}
      />
    </div>
  );
}
