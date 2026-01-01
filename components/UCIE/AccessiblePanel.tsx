import React, { useEffect, useRef } from 'react';

interface AccessiblePanelProps {
  id: string;
  title: string;
  children: React.ReactNode;
  ariaLabel?: string;
  ariaDescription?: string;
  className?: string;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

export default function AccessiblePanel({
  id,
  title,
  children,
  ariaLabel,
  ariaDescription,
  className = '',
  isCollapsible = false,
  defaultExpanded = true
}: AccessiblePanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const headingId = `${id}-heading`;
  const contentId = `${id}-content`;

  useEffect(() => {
    // Announce state changes to screen readers
    if (isCollapsible && contentRef.current) {
      const message = isExpanded 
        ? `${title} section expanded` 
        : `${title} section collapsed`;
      
      // Create temporary announcement element
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [isExpanded, title, isCollapsible]);

  const handleToggle = () => {
    if (isCollapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isCollapsible && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <section
      id={id}
      className={`bg-bitcoin-black border border-bitcoin-orange rounded-xl overflow-hidden ${className}`}
      aria-labelledby={headingId}
      aria-describedby={ariaDescription ? `${id}-description` : undefined}
    >
      {/* Header */}
      <div
        className={`border-b-2 border-bitcoin-orange bg-bitcoin-black px-6 py-4 ${
          isCollapsible ? 'cursor-pointer hover:bg-bitcoin-orange hover:bg-opacity-10 transition-colors' : ''
        }`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role={isCollapsible ? 'button' : undefined}
        tabIndex={isCollapsible ? 0 : undefined}
        aria-expanded={isCollapsible ? isExpanded : undefined}
        aria-controls={isCollapsible ? contentId : undefined}
      >
        <div className="flex items-center justify-between">
          <h2
            id={headingId}
            className="text-2xl font-bold text-bitcoin-white"
          >
            {ariaLabel || title}
          </h2>
          
          {isCollapsible && (
            <svg
              className={`w-6 h-6 text-bitcoin-orange transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
        
        {ariaDescription && (
          <p
            id={`${id}-description`}
            className="text-sm text-bitcoin-white-60 italic mt-2"
          >
            {ariaDescription}
          </p>
        )}
      </div>

      {/* Content */}
      <div
        id={contentId}
        ref={contentRef}
        className={`transition-all duration-300 ${
          isCollapsible && !isExpanded ? 'max-h-0 overflow-hidden' : 'max-h-none'
        }`}
        aria-hidden={isCollapsible && !isExpanded}
      >
        <div className="p-6">
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * Accessible data table component
 */
interface AccessibleTableProps {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
  className?: string;
}

export function AccessibleTable({ caption, headers, rows, className = '' }: AccessibleTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${className}`}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-bitcoin-orange-20">
            {(headers || []).map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-4 py-3 text-left text-sm font-semibold text-bitcoin-white uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-bitcoin-orange-20 hover:bg-bitcoin-orange hover:bg-opacity-5 transition-colors"
            >
              {(row || []).map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3 text-sm text-bitcoin-white-80"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Accessible loading indicator
 */
interface AccessibleLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AccessibleLoading({ message = 'Loading...', size = 'md' }: AccessibleLoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="flex flex-col items-center justify-center gap-3"
    >
      <div
        className={`${sizeClasses[size]} border-4 border-bitcoin-orange-20 border-t-bitcoin-orange rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className="text-sm text-bitcoin-white-60">{message}</span>
    </div>
  );
}

/**
 * Accessible error message
 */
interface AccessibleErrorProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

export function AccessibleError({ title, message, onRetry }: AccessibleErrorProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6"
    >
      <h3 className="text-xl font-bold text-bitcoin-white mb-2">
        {title}
      </h3>
      <p className="text-bitcoin-white-80 mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-bitcoin-orange text-bitcoin-black px-4 py-2 rounded-lg font-semibold hover:bg-bitcoin-black hover:text-bitcoin-orange hover:border-2 hover:border-bitcoin-orange transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
