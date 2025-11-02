// Haptic feedback utilities for mobile interactions

export type HapticFeedbackType = 
  | 'light'      // Light tap (button press)
  | 'medium'     // Medium tap (selection)
  | 'heavy'      // Heavy tap (important action)
  | 'success'    // Success notification
  | 'warning'    // Warning notification
  | 'error'      // Error notification
  | 'selection'; // Selection change

/**
 * Trigger haptic feedback on supported devices
 */
export function triggerHaptic(type: HapticFeedbackType = 'light') {
  if (typeof window === 'undefined') return;

  // Check for Vibration API support
  if (!('vibrate' in navigator)) {
    return;
  }

  // Vibration patterns (in milliseconds)
  const patterns: Record<HapticFeedbackType, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 10],
    warning: [20, 100, 20],
    error: [30, 100, 30, 100, 30],
    selection: 5,
  };

  const pattern = patterns[type];
  
  try {
    if (Array.isArray(pattern)) {
      navigator.vibrate(pattern);
    } else {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return typeof window !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Haptic feedback for button interactions
 */
export function hapticButtonPress() {
  triggerHaptic('light');
}

/**
 * Haptic feedback for successful actions
 */
export function hapticSuccess() {
  triggerHaptic('success');
}

/**
 * Haptic feedback for errors
 */
export function hapticError() {
  triggerHaptic('error');
}

/**
 * Haptic feedback for warnings
 */
export function hapticWarning() {
  triggerHaptic('warning');
}

/**
 * Haptic feedback for selection changes
 */
export function hapticSelection() {
  triggerHaptic('selection');
}

/**
 * Haptic feedback for swipe gestures
 */
export function hapticSwipe() {
  triggerHaptic('medium');
}

/**
 * Haptic feedback for pull-to-refresh
 */
export function hapticRefresh() {
  triggerHaptic('heavy');
}

/**
 * React hook for haptic feedback
 */
export function useHaptic() {
  const isSupported = isHapticSupported();

  return {
    isSupported,
    trigger: triggerHaptic,
    buttonPress: hapticButtonPress,
    success: hapticSuccess,
    error: hapticError,
    warning: hapticWarning,
    selection: hapticSelection,
    swipe: hapticSwipe,
    refresh: hapticRefresh,
  };
}

/**
 * Higher-order function to add haptic feedback to event handlers
 */
export function withHaptic<T extends (...args: any[]) => any>(
  handler: T,
  hapticType: HapticFeedbackType = 'light'
): T {
  return ((...args: any[]) => {
    triggerHaptic(hapticType);
    return handler(...args);
  }) as T;
}

/**
 * Add haptic feedback to button clicks
 */
export function addHapticToButton(
  button: HTMLButtonElement,
  hapticType: HapticFeedbackType = 'light'
) {
  const originalOnClick = button.onclick;
  
  button.onclick = (e) => {
    triggerHaptic(hapticType);
    if (originalOnClick) {
      originalOnClick.call(button, e);
    }
  };
}

/**
 * Batch add haptic feedback to all buttons
 */
export function addHapticToAllButtons(
  container: HTMLElement = document.body,
  hapticType: HapticFeedbackType = 'light'
) {
  const buttons = container.querySelectorAll('button');
  buttons.forEach((button) => {
    addHapticToButton(button as HTMLButtonElement, hapticType);
  });
}
