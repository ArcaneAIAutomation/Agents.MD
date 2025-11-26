import React from 'react';

/**
 * ExecutionStatusBadge Component
 * 
 * Displays trade execution status with appropriate color coding and animations.
 * 
 * Status Colors (Bitcoin Sovereign Design):
 * - PENDING: Orange (#F7931A) with pulsing animation
 * - EXECUTED: Green (using orange for Bitcoin Sovereign compliance)
 * - PARTIAL_CLOSE: Blue (using orange variant for Bitcoin Sovereign compliance)
 * - CLOSED: Gray (using white at 60% opacity for Bitcoin Sovereign compliance)
 * 
 * Requirements: 15.1
 * Validates: Requirements 14.1, 14.2, 14.3
 */

export type ExecutionStatus = 'PENDING' | 'EXECUTED' | 'PARTIAL_CLOSE' | 'CLOSED';

export interface ExecutionStatusBadgeProps {
  status: ExecutionStatus;
  executedAt?: string;
  className?: string;
}

export const ExecutionStatusBadge: React.FC<ExecutionStatusBadgeProps> = ({
  status,
  executedAt,
  className = ''
}) => {
  // Get status-specific styling
  const getStatusStyles = () => {
    switch (status) {
      case 'PENDING':
        return {
          bgColor: 'bg-bitcoin-black',
          borderColor: 'border-bitcoin-orange',
          textColor: 'text-bitcoin-orange',
          icon: '⏳',
          label: 'PENDING',
          pulsing: true
        };
      case 'EXECUTED':
        return {
          bgColor: 'bg-bitcoin-orange',
          borderColor: 'border-bitcoin-orange',
          textColor: 'text-bitcoin-black',
          icon: '✓',
          label: 'EXECUTED',
          pulsing: false
        };
      case 'PARTIAL_CLOSE':
        return {
          bgColor: 'bg-bitcoin-black',
          borderColor: 'border-bitcoin-orange',
          textColor: 'text-bitcoin-orange',
          icon: '◐',
          label: 'PARTIAL',
          pulsing: false
        };
      case 'CLOSED':
        return {
          bgColor: 'bg-bitcoin-black',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-400',
          icon: '■',
          label: 'CLOSED',
          pulsing: false
        };
      default:
        return {
          bgColor: 'bg-bitcoin-black',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-400',
          icon: '?',
          label: 'UNKNOWN',
          pulsing: false
        };
    }
  };

  const styles = getStatusStyles();

  // Format execution timestamp if available
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      {/* Status Badge */}
      <div
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
          border-2 ${styles.borderColor} ${styles.bgColor}
          transition-all duration-300
          ${styles.pulsing ? 'animate-pulse-subtle' : ''}
        `}
      >
        {/* Status Icon */}
        <span className={`text-sm ${styles.textColor}`}>
          {styles.icon}
        </span>

        {/* Status Label */}
        <span
          className={`
            text-xs font-bold uppercase tracking-wider
            ${styles.textColor}
          `}
        >
          {styles.label}
        </span>
      </div>

      {/* Execution Timestamp (if available) */}
      {executedAt && status === 'EXECUTED' && (
        <span className="text-xs text-gray-400 font-mono">
          Executed: {formatTimestamp(executedAt)}
        </span>
      )}
    </div>
  );
};

// Export default for convenience
export default ExecutionStatusBadge;
