import React from 'react';
import { Brain, Loader2 } from 'lucide-react';

interface EinsteinGenerateButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Einstein Generate Button Component
 * 
 * Bitcoin Sovereign styled button for triggering Einstein trade signal generation.
 * Features:
 * - Solid orange background with black text (primary action)
 * - Loading state with spinner animation
 * - Disabled state during generation
 * - Hover effects with glow
 * - Minimum 48px touch target for accessibility
 * 
 * Requirements: 5.1 - User Approval Workflow
 */
export default function EinsteinGenerateButton({
  onClick,
  loading = false,
  disabled = false,
  className = ''
}: EinsteinGenerateButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        /* Einstein Button Styling - Enhanced Bitcoin Sovereign */
        einstein-button
        bg-bitcoin-orange 
        text-bitcoin-black 
        border-2 
        border-bitcoin-orange
        
        /* Typography */
        font-bold 
        uppercase 
        tracking-wider
        text-sm
        md:text-base
        
        /* Spacing & Size */
        px-6 
        py-3 
        rounded-lg
        min-h-[48px]
        min-w-[48px]
        
        /* Flexbox for icon + text */
        flex
        items-center
        justify-center
        gap-2
        
        /* Transitions */
        transition-all 
        duration-300
        ease-in-out
        
        /* Hover State - Invert colors with Einstein glow */
        ${!isDisabled && `
          hover:bg-bitcoin-black 
          hover:text-bitcoin-orange 
          hover:shadow-[0_0_30px_rgba(247,147,26,0.5),0_0_60px_rgba(247,147,26,0.2)]
          hover:scale-105
        `}
        
        /* Active State - Slight scale down */
        ${!isDisabled && 'active:scale-95'}
        
        /* Disabled State - Reduced opacity, no pointer events */
        ${isDisabled && `
          opacity-50 
          cursor-not-allowed
          pointer-events-none
        `}
        
        /* Focus State - Orange outline for accessibility */
        focus-visible:outline-2
        focus-visible:outline-bitcoin-orange
        focus-visible:outline-offset-2
        focus-visible:shadow-[0_0_0_3px_rgba(247,147,26,0.3)]
        
        /* Custom className */
        ${className}
      `}
      aria-label={loading ? 'Generating trade signal...' : 'Generate Einstein trade signal'}
      aria-busy={loading}
    >
      {/* Icon - Brain or Spinner */}
      {loading ? (
        <Loader2 
          size={20} 
          className="animate-spin" 
          aria-hidden="true"
        />
      ) : (
        <Brain 
          size={20} 
          aria-hidden="true"
        />
      )}
      
      {/* Button Text */}
      <span>
        {loading ? 'Generating...' : 'Generate Trade Signal'}
      </span>
    </button>
  );
}
