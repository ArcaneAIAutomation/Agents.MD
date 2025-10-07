/**
 * Safe Container Components
 * 
 * React wrapper components that prevent text overflow issues
 * by applying proper CSS containment strategies.
 */

import React, { ReactNode, HTMLAttributes } from 'react';

/**
 * Base safe container props
 */
interface SafeContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  strategy?: 'ellipsis' | 'break' | 'anywhere' | 'scroll' | 'safe';
}

/**
 * SafeContainer - General purpose safe container
 * Prevents text overflow with configurable strategies
 */
export const SafeContainer: React.FC<SafeContainerProps> = ({
  children,
  as: Component = 'div',
  strategy = 'safe',
  className = '',
  ...props
}) => {
  const strategyClass = {
    ellipsis: 'text-overflow-ellipsis',
    break: 'text-overflow-break',
    anywhere: 'text-overflow-anywhere',
    scroll: 'text-overflow-scroll',
    safe: 'text-overflow-safe',
  }[strategy];

  const combinedClassName = `safe-container ${strategyClass} ${className}`.trim();

  return React.createElement(
    Component,
    { className: combinedClassName, ...props },
    children
  );
};

/**
 * SafeFlexContainer - Safe container for flex layouts
 * Prevents flex child overflow issues
 */
export const SafeFlexContainer: React.FC<SafeContainerProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`safe-container flex ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

/**
 * SafeFlexChild - Safe flex child component
 * Prevents overflow in flex children
 */
export const SafeFlexChild: React.FC<SafeContainerProps> = ({
  children,
  as: Component = 'div',
  className = '',
  ...props
}) => {
  return React.createElement(
    Component,
    { className: `safe-flex-child ${className}`.trim(), ...props },
    children
  );
};

/**
 * SafeGridContainer - Safe container for grid layouts
 * Prevents grid child overflow issues
 */
export const SafeGridContainer: React.FC<SafeContainerProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`safe-container grid ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

/**
 * SafeGridChild - Safe grid child component
 * Prevents overflow in grid children
 */
export const SafeGridChild: React.FC<SafeContainerProps> = ({
  children,
  as: Component = 'div',
  className = '',
  ...props
}) => {
  return React.createElement(
    Component,
    { className: `safe-grid-child ${className}`.trim(), ...props },
    children
  );
};

/**
 * TruncatedText - Text component with line clamping
 */
interface TruncatedTextProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  lines?: 1 | 2 | 3;
  as?: keyof JSX.IntrinsicElements;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({
  children,
  lines = 1,
  as: Component = 'div',
  className = '',
  ...props
}) => {
  const truncateClass = `truncate-${lines}-line${lines > 1 ? 's' : ''}`;
  
  return React.createElement(
    Component,
    { className: `${truncateClass} ${className}`.trim(), ...props },
    children
  );
};

/**
 * SafePrice - Safe container for price displays
 * Prevents price overflow with ellipsis
 */
export const SafePrice: React.FC<SafeContainerProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`price-display text-overflow-ellipsis ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
};

/**
 * SafeAmount - Safe container for amount displays
 * Prevents amount overflow with ellipsis
 */
export const SafeAmount: React.FC<SafeContainerProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`amount-display text-overflow-ellipsis ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
};

/**
 * SafePercentage - Safe container for percentage displays
 * Prevents percentage overflow with ellipsis
 */
export const SafePercentage: React.FC<SafeContainerProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`percentage-display text-overflow-ellipsis ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
};

/**
 * SafeBadge - Safe container for badges and labels
 * Prevents badge text overflow with ellipsis
 */
export const SafeBadge: React.FC<SafeContainerProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`badge text-overflow-ellipsis ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
};

/**
 * SafeStatusMessage - Safe container for status messages
 * Prevents message overflow with word breaking
 */
export const SafeStatusMessage: React.FC<SafeContainerProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`status-message text-overflow-break ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * MobileSafeContainer - Mobile-specific safe container
 * Only applies overflow prevention on mobile devices
 */
export const MobileSafeContainer: React.FC<SafeContainerProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`mobile-safe-container ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

/**
 * ScrollableContainer - Container with horizontal scroll
 * Useful for tables and wide content on mobile
 */
export const ScrollableContainer: React.FC<SafeContainerProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`text-overflow-scroll ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

// Export all components as named exports
export default {
  SafeContainer,
  SafeFlexContainer,
  SafeFlexChild,
  SafeGridContainer,
  SafeGridChild,
  TruncatedText,
  SafePrice,
  SafeAmount,
  SafePercentage,
  SafeBadge,
  SafeStatusMessage,
  MobileSafeContainer,
  ScrollableContainer,
};
