import React, { useState, useEffect } from 'react';

interface BeginnerModeToggleProps {
  onChange?: (isBeginnerMode: boolean) => void;
  className?: string;
}

export default function BeginnerModeToggle({ onChange, className = '' }: BeginnerModeToggleProps) {
  const [isBeginnerMode, setIsBeginnerMode] = useState(true);

  useEffect(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem('ucie_beginner_mode');
    if (saved !== null) {
      const mode = saved === 'true';
      setIsBeginnerMode(mode);
      onChange?.(mode);
    }
  }, []);

  const handleToggle = () => {
    const newMode = !isBeginnerMode;
    setIsBeginnerMode(newMode);
    localStorage.setItem('ucie_beginner_mode', String(newMode));
    onChange?.(newMode);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm text-bitcoin-white-60">
        {isBeginnerMode ? 'Beginner Mode' : 'Advanced Mode'}
      </span>
      
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-bitcoin-orange focus:ring-offset-2 focus:ring-offset-bitcoin-black ${
          isBeginnerMode ? 'bg-bitcoin-orange' : 'bg-bitcoin-white-60'
        }`}
        role="switch"
        aria-checked={isBeginnerMode}
        aria-label="Toggle beginner mode"
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-bitcoin-black transition-transform ${
            isBeginnerMode ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>

      <span className="text-xs text-bitcoin-white-60">
        {isBeginnerMode ? 'Simplified view' : 'Full analysis'}
      </span>
    </div>
  );
}

/**
 * Hook to manage beginner mode state
 */
export function useBeginnerMode() {
  const [isBeginnerMode, setIsBeginnerMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ucie_beginner_mode');
    if (saved !== null) {
      setIsBeginnerMode(saved === 'true');
    }
  }, []);

  const toggleBeginnerMode = () => {
    const newMode = !isBeginnerMode;
    setIsBeginnerMode(newMode);
    localStorage.setItem('ucie_beginner_mode', String(newMode));
  };

  return { isBeginnerMode, setIsBeginnerMode, toggleBeginnerMode };
}
