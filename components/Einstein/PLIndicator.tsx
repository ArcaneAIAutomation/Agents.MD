import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

/**
 * PLIndicator Component
 * 
 * Displays profit/loss for trade signals with appropriate color coding and icons.
 * Updates in real-time for executed trades.
 * 
 * Color Coding (Bitcoin Sovereign Design):
 * - Profit: Orange (#F7931A) with upward arrow (Bitcoin Sovereign compliance)
 * - Loss: White at 80% opacity with downward arrow (Bitcoin Sovereign compliance)
 * 
 * Note: Traditional green/red colors are replaced with orange/white to comply
 * with Bitcoin Sovereign design system (black, orange, white only).
 * 
 * Requirements: 15.3, 15.4
 * Validates: Requirements 14.3
 */

export interface PLCalculation {
  profitLoss: number;
  profitLossPercent: number;
  isProfit: boolean;
  color: 'green' | 'red';
  icon: 'up' | 'down';
}

export interface PLIndicatorProps {
  pl: PLCalculation;
  showPercentage?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PLIndicator: React.FC<PLIndicatorProps> = ({
  pl,
  showPercentage = true,
  showIcon = true,
  size = 'md',
  className = ''
}) => {
  // Get size-specific styling
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          containerClass: 'text-sm',
          iconSize: 14,
          amountClass: 'text-sm font-semibold',
          percentClass: 'text-xs'
        };
      case 'md':
        return {
          containerClass: 'text-base',
          iconSize: 18,
          amountClass: 'text-lg font-bold',
          percentClass: 'text-sm'
        };
      case 'lg':
        return {
          containerClass: 'text-lg',
          iconSize: 22,
          amountClass: 'text-2xl font-bold',
          percentClass: 'text-base'
        };
      default:
        return {
          containerClass: 'text-base',
          iconSize: 18,
          amountClass: 'text-lg font-bold',
          percentClass: 'text-sm'
        };
    }
  };

  const sizeStyles = getSizeStyles();

  // Bitcoin Sovereign color mapping
  // Profit: Orange (#F7931A)
  // Loss: White at 80% opacity
  const colorClass = pl.isProfit ? 'text-bitcoin-orange' : 'text-bitcoin-white-80';
  const bgClass = pl.isProfit ? 'bg-bitcoin-orange-10' : 'bg-bitcoin-black';
  const borderClass = pl.isProfit ? 'border-bitcoin-orange-20' : 'border-gray-700';

  // Format currency
  const formatCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000000) {
      return `$${(absAmount / 1000000).toFixed(2)}M`;
    } else if (absAmount >= 1000) {
      return `$${(absAmount / 1000).toFixed(2)}K`;
    } else {
      return `$${absAmount.toFixed(2)}`;
    }
  };

  // Format percentage
  const formatPercentage = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Get icon component
  const IconComponent = pl.icon === 'up' ? ArrowUp : ArrowDown;

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-lg
        border ${borderClass} ${bgClass}
        transition-all duration-300
        ${sizeStyles.containerClass}
        ${className}
      `}
    >
      {/* Icon */}
      {showIcon && (
        <IconComponent
          size={sizeStyles.iconSize}
          className={`${colorClass} flex-shrink-0`}
          strokeWidth={2.5}
        />
      )}

      {/* P/L Amount and Percentage */}
      <div className="flex flex-col items-start">
        {/* Amount */}
        <span
          className={`
            font-mono ${sizeStyles.amountClass} ${colorClass}
            leading-tight
          `}
        >
          {pl.isProfit ? '+' : ''}{formatCurrency(pl.profitLoss)}
        </span>

        {/* Percentage */}
        {showPercentage && (
          <span
            className={`
              font-mono ${sizeStyles.percentClass} ${colorClass}
              leading-tight opacity-80
            `}
          >
            {formatPercentage(pl.profitLossPercent)}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Compact P/L Indicator (single line)
 * 
 * Displays P/L in a more compact format for use in tables or lists.
 */
export interface CompactPLIndicatorProps {
  pl: PLCalculation;
  className?: string;
}

export const CompactPLIndicator: React.FC<CompactPLIndicatorProps> = ({
  pl,
  className = ''
}) => {
  const colorClass = pl.isProfit ? 'text-bitcoin-orange' : 'text-bitcoin-white-80';
  const IconComponent = pl.icon === 'up' ? ArrowUp : ArrowDown;

  const formatCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000000) {
      return `$${(absAmount / 1000000).toFixed(2)}M`;
    } else if (absAmount >= 1000) {
      return `$${(absAmount / 1000).toFixed(2)}K`;
    } else {
      return `$${absAmount.toFixed(2)}`;
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <IconComponent
        size={14}
        className={`${colorClass} flex-shrink-0`}
        strokeWidth={2.5}
      />
      <span className={`font-mono text-sm font-semibold ${colorClass}`}>
        {pl.isProfit ? '+' : ''}{formatCurrency(pl.profitLoss)}
      </span>
      <span className={`font-mono text-xs ${colorClass} opacity-70`}>
        ({pl.isProfit ? '+' : ''}{pl.profitLossPercent.toFixed(2)}%)
      </span>
    </div>
  );
};

// Export default for convenience
export default PLIndicator;
