import React from 'react';

/**
 * DataQualityBadge Component
 * 
 * Displays data quality score with appropriate color coding and verification status.
 * 
 * Quality Colors (Bitcoin Sovereign Design):
 * - ≥90%: Green (using orange for Bitcoin Sovereign compliance) - Excellent quality
 * - 70-89%: Orange (#F7931A) - Acceptable quality
 * - <70%: Red (using white at 60% opacity for Bitcoin Sovereign compliance) - Poor quality
 * 
 * Requirements: 15.2, 13.5
 * Validates: Requirements 2.3, 2.5, 13.5
 */

export interface DataQualityBadgeProps {
  quality: number; // 0-100 percentage
  showText?: boolean; // Show "100% Data Verified" text
  className?: string;
}

export const DataQualityBadge: React.FC<DataQualityBadgeProps> = ({
  quality,
  showText = true,
  className = ''
}) => {
  // Ensure quality is within valid range
  const normalizedQuality = Math.max(0, Math.min(100, quality));

  // Get quality-specific styling
  const getQualityStyles = () => {
    if (normalizedQuality >= 90) {
      return {
        bgColor: 'bg-bitcoin-orange',
        borderColor: 'border-bitcoin-orange',
        textColor: 'text-bitcoin-black',
        icon: '✓',
        label: normalizedQuality === 100 ? '100% Data Verified' : `${normalizedQuality}% Quality`,
        glowEffect: true,
        status: 'excellent'
      };
    } else if (normalizedQuality >= 70) {
      return {
        bgColor: 'bg-bitcoin-black',
        borderColor: 'border-bitcoin-orange',
        textColor: 'text-bitcoin-orange',
        icon: '⚠',
        label: `${normalizedQuality}% Quality`,
        glowEffect: false,
        status: 'acceptable'
      };
    } else {
      return {
        bgColor: 'bg-bitcoin-black',
        borderColor: 'border-gray-500',
        textColor: 'text-gray-400',
        icon: '✗',
        label: `${normalizedQuality}% Quality`,
        glowEffect: false,
        status: 'poor'
      };
    }
  };

  const styles = getQualityStyles();

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      {/* Quality Badge */}
      <div
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
          border-2 ${styles.borderColor} ${styles.bgColor}
          transition-all duration-300
          ${styles.glowEffect ? 'shadow-[0_0_20px_rgba(247,147,26,0.5)]' : ''}
        `}
      >
        {/* Quality Icon */}
        <span className={`text-sm ${styles.textColor} font-bold`}>
          {styles.icon}
        </span>

        {/* Quality Label */}
        {showText && (
          <span
            className={`
              text-xs font-bold uppercase tracking-wider
              ${styles.textColor}
            `}
          >
            {styles.label}
          </span>
        )}

        {/* Quality Percentage (if text is hidden) */}
        {!showText && (
          <span
            className={`
              text-xs font-bold font-mono
              ${styles.textColor}
            `}
          >
            {normalizedQuality}%
          </span>
        )}
      </div>

      {/* Quality Status Indicator */}
      {normalizedQuality < 90 && (
        <span className="text-xs text-gray-400 italic">
          {normalizedQuality >= 70 
            ? 'Acceptable data quality' 
            : 'Insufficient data quality'}
        </span>
      )}
    </div>
  );
};

// Export default for convenience
export default DataQualityBadge;
