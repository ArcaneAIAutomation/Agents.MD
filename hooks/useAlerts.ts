import { useState, useEffect, useCallback } from 'react';

export type AlertType = 'price_above' | 'price_below' | 'sentiment_change' | 'whale_transaction';
export type AlertStatus = 'active' | 'triggered' | 'disabled';

interface Alert {
  id: number;
  symbol: string;
  alert_type: AlertType;
  threshold_value: number;
  status: AlertStatus;
  created_at: string;
  triggered_at?: string;
  notification_sent: boolean;
}

interface CreateAlertParams {
  symbol: string;
  alert_type: AlertType;
  threshold_value: number;
}

interface UseAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  createAlert: (params: CreateAlertParams) => Promise<boolean>;
  updateAlertStatus: (alertId: number, status: AlertStatus) => Promise<boolean>;
  deleteAlert: (alertId: number) => Promise<boolean>;
  refreshAlerts: () => Promise<void>;
  getAlertsForSymbol: (symbol: string) => Alert[];
  getActiveAlerts: () => Alert[];
  getTriggeredAlerts: () => Alert[];
}

/**
 * Hook for managing user's custom alerts
 */
export function useAlerts(): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch alerts from API
   */
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ucie/alerts');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch alerts');
      }

      setAlerts(data.alerts || []);
    } catch (err: any) {
      console.error('Fetch alerts error:', err);
      setError(err.message || 'Failed to fetch alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new alert
   */
  const createAlert = useCallback(async (params: CreateAlertParams): Promise<boolean> => {
    try {
      const response = await fetch('/api/ucie/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create alert');
      }

      // Refresh alerts
      await fetchAlerts();
      return true;
    } catch (err: any) {
      console.error('Create alert error:', err);
      setError(err.message || 'Failed to create alert');
      return false;
    }
  }, [fetchAlerts]);

  /**
   * Update alert status
   */
  const updateAlertStatus = useCallback(async (alertId: number, status: AlertStatus): Promise<boolean> => {
    try {
      const response = await fetch('/api/ucie/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId, status }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update alert');
      }

      // Refresh alerts
      await fetchAlerts();
      return true;
    } catch (err: any) {
      console.error('Update alert error:', err);
      setError(err.message || 'Failed to update alert');
      return false;
    }
  }, [fetchAlerts]);

  /**
   * Delete alert
   */
  const deleteAlert = useCallback(async (alertId: number): Promise<boolean> => {
    try {
      const response = await fetch('/api/ucie/alerts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete alert');
      }

      // Refresh alerts
      await fetchAlerts();
      return true;
    } catch (err: any) {
      console.error('Delete alert error:', err);
      setError(err.message || 'Failed to delete alert');
      return false;
    }
  }, [fetchAlerts]);

  /**
   * Refresh alerts
   */
  const refreshAlerts = useCallback(async () => {
    await fetchAlerts();
  }, [fetchAlerts]);

  /**
   * Get alerts for specific symbol
   */
  const getAlertsForSymbol = useCallback((symbol: string): Alert[] => {
    return alerts.filter(alert => alert.symbol.toUpperCase() === symbol.toUpperCase());
  }, [alerts]);

  /**
   * Get active alerts
   */
  const getActiveAlerts = useCallback((): Alert[] => {
    return alerts.filter(alert => alert.status === 'active');
  }, [alerts]);

  /**
   * Get triggered alerts
   */
  const getTriggeredAlerts = useCallback((): Alert[] => {
    return alerts.filter(alert => alert.status === 'triggered');
  }, [alerts]);

  // Fetch alerts on mount
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    createAlert,
    updateAlertStatus,
    deleteAlert,
    refreshAlerts,
    getAlertsForSymbol,
    getActiveAlerts,
    getTriggeredAlerts,
  };
}

/**
 * Hook for checking if alerts should be triggered
 */
export function useAlertChecker(symbol: string, currentPrice: number, enabled: boolean = true) {
  const { alerts, updateAlertStatus } = useAlerts();
  const [triggeredAlerts, setTriggeredAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!enabled || !symbol || !currentPrice) return;

    const checkAlerts = async () => {
      const symbolAlerts = alerts.filter(
        alert => alert.symbol.toUpperCase() === symbol.toUpperCase() && alert.status === 'active'
      );

      const triggered: Alert[] = [];

      for (const alert of symbolAlerts) {
        let shouldTrigger = false;

        switch (alert.alert_type) {
          case 'price_above':
            shouldTrigger = currentPrice >= alert.threshold_value;
            break;
          case 'price_below':
            shouldTrigger = currentPrice <= alert.threshold_value;
            break;
          // sentiment_change and whale_transaction would need additional data
          default:
            break;
        }

        if (shouldTrigger) {
          triggered.push(alert);
          // Update alert status to triggered
          await updateAlertStatus(alert.id, 'triggered');
        }
      }

      if (triggered.length > 0) {
        setTriggeredAlerts(prev => [...prev, ...triggered]);
      }
    };

    checkAlerts();
  }, [symbol, currentPrice, alerts, enabled, updateAlertStatus]);

  const clearTriggeredAlerts = useCallback(() => {
    setTriggeredAlerts([]);
  }, []);

  return { triggeredAlerts, clearTriggeredAlerts };
}
