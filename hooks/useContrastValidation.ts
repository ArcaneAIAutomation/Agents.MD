import { useEffect, useRef, useState } from 'react';
import { 
  validateElementContrast, 
  scanPageContrast, 
  ValidationWarning,
  enableContrastMonitoring 
} from '../utils/contrastValidation';

/**
 * React hook for contrast validation
 */
export function useContrastValidation(options: {
  enabled?: boolean;
  autoScan?: boolean;
  monitorChanges?: boolean;
} = {}) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    autoScan = true,
    monitorChanges = true,
  } = options;

  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);

  // Validate a specific element
  const validateElement = (element: Element): ValidationWarning | null => {
    if (!enabled) return null;
    return validateElementContrast(element);
  };

  // Scan the entire page for contrast issues
  const scanPage = (): ValidationWarning[] => {
    if (!enabled) return [];
    setIsScanning(true);
    
    try {
      const pageWarnings = scanPageContrast();
      setWarnings(pageWarnings);
      return pageWarnings;
    } finally {
      setIsScanning(false);
    }
  };

  // Enable automatic monitoring
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Enable global contrast monitoring
    enableContrastMonitoring();

    // Initial scan if requested
    if (autoScan) {
      setTimeout(scanPage, 1000);
    }

    // Set up mutation observer for dynamic content
    if (monitorChanges) {
      observerRef.current = new MutationObserver(() => {
        setTimeout(() => {
          const newWarnings = scanPageContrast();
          setWarnings(newWarnings);
        }, 500);
      });

      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, autoScan, monitorChanges]);

  return {
    warnings,
    isScanning,
    validateElement,
    scanPage,
    hasWarnings: warnings.length > 0,
    warningCount: warnings.length,
  };
}

/**
 * Hook for validating specific component contrast
 */
export function useComponentContrastValidation<T extends HTMLElement>(
  enabled: boolean = process.env.NODE_ENV === 'development'
) {
  const elementRef = useRef<T>(null);
  const [warning, setWarning] = useState<ValidationWarning | null>(null);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const validateComponent = () => {
      if (elementRef.current) {
        const result = validateElementContrast(elementRef.current);
        setWarning(result);
      }
    };

    // Initial validation
    setTimeout(validateComponent, 100);

    // Set up observer for this specific element
    const observer = new MutationObserver(validateComponent);
    observer.observe(elementRef.current, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => observer.disconnect();
  }, [enabled]);

  return {
    ref: elementRef,
    warning,
    hasWarning: warning !== null,
  };
}