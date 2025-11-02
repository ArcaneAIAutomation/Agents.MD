import React, { useEffect, useState } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // milliseconds, 0 for persistent
}

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  const getStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'border-bitcoin-orange bg-bitcoin-orange bg-opacity-10';
      case 'error':
        return 'border-bitcoin-white-60 bg-bitcoin-white-60 bg-opacity-10';
      case 'warning':
        return 'border-bitcoin-white bg-bitcoin-white bg-opacity-10';
      case 'info':
        return 'border-bitcoin-orange-20 bg-bitcoin-black';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg className="w-6 h-6 text-bitcoin-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-bitcoin-white-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-bitcoin-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6 text-bitcoin-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-[0_0_20px_rgba(247,147,26,0.3)] transition-all duration-300 ${getStyles()} ${
        isVisible && !isExiting ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div className="flex-shrink-0">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-bitcoin-white mb-1">
          {notification.title}
        </h4>
        <p className="text-sm text-bitcoin-white-80">
          {notification.message}
        </p>
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 text-bitcoin-white-60 hover:text-bitcoin-white transition-colors"
        aria-label="Close notification"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Notification container
 */
interface NotificationContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function NotificationContainer({
  notifications,
  onClose,
  position = 'top-right'
}: NotificationContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-[10000] flex flex-col gap-3 max-w-md w-full pointer-events-none`}
      aria-live="polite"
      aria-atomic="false"
    >
      {notifications.map(notification => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationToast notification={notification} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

/**
 * Hook to manage notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    type: Notification['type'],
    title: string,
    message: string,
    duration: number = 5000
  ) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success: (title: string, message: string, duration?: number) =>
      addNotification('success', title, message, duration),
    error: (title: string, message: string, duration?: number) =>
      addNotification('error', title, message, duration),
    warning: (title: string, message: string, duration?: number) =>
      addNotification('warning', title, message, duration),
    info: (title: string, message: string, duration?: number) =>
      addNotification('info', title, message, duration)
  };
}
