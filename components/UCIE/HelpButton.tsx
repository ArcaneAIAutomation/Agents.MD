import React from 'react';
import Tooltip from './Tooltip';
import { getHelpContent } from '../../lib/ucie/helpContent';

interface HelpButtonProps {
  metricKey: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function HelpButton({ metricKey, className = '', size = 'md' }: HelpButtonProps) {
  const helpContent = getHelpContent(metricKey);

  if (!helpContent) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <Tooltip
      content={helpContent.description}
      learnMoreUrl={helpContent.learnMoreUrl}
      className={className}
    >
      <button
        className={`inline-flex items-center justify-center rounded-full border border-bitcoin-orange-20 text-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black transition-all ${sizeClasses[size]} ${className}`}
        aria-label={`Help: ${helpContent.title}`}
        type="button"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </Tooltip>
  );
}
