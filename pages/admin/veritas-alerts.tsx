import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { useRouter } from 'next/router';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface AlertNotification {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'fatal';
  symbol: string;
  alert_type: string;
  message: string;
  details: {
    affectedSources: string[];
    discrepancyValue?: number;
    threshold?: number;
    recommendation: string;
  };
  timestamp: string;
  requires_human_review: boolean;
  reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
}

export default function VeritasAlertsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [selectedAlert, setSelectedAlert] = useState<AlertNotification | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Load alerts
  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user, filter]);

  async function loadAlerts() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/veritas-alerts?filter=${filter}`);
      
      if (!response.ok) {
        throw new Error('Failed to load alerts');
      }
      
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(alertId: string) {
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/admin/veritas-alerts/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          reviewedBy: user?.email,
          notes: reviewNotes
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark alert as reviewed');
      }
      
      // Reload alerts
      await loadAlerts();
      
      // Reset state
      setSelectedAlert(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error reviewing alert:', error);
      alert('Failed to mark alert as reviewed');
    } finally {
      setSubmitting(false);
    }
  }

  // Get severity icon and color
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'fatal':
        return <XCircle className="text-red-500" size={24} />;
      case 'error':
        return <AlertTriangle className="text-red-400" size={24} />;
      case 'warning':
        return <AlertTriangle className="text-orange-400" size={24} />;
      case 'info':
        return <Clock className="text-blue-400" size={24} />;
      default:
        return <Clock className="text-bitcoin-white-60" size={24} />;
    }
  };

  const getSeverityBadgeColor = (severity: string): string => {
    switch (severity) {
      case 'fatal':
        return 'bg-red-500 text-white';
      case 'error':
        return 'bg-red-400 text-white';
      case 'warning':
        return 'bg-orange-400 text-bitcoin-black';
      case 'info':
        return 'bg-blue-400 text-white';
      default:
        return 'bg-bitcoin-orange text-bitcoin-black';
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-bitcoin-black flex items-center justify-center">
        <p className="text-bitcoin-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bitcoin-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-bitcoin-white mb-2">
            Veritas Protocol Alerts
          </h1>
          <p className="text-bitcoin-white-60">
            Review and manage data validation alerts requiring human attention
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'pending'
                ? 'bg-bitcoin-orange text-bitcoin-black'
                : 'bg-bitcoin-black text-bitcoin-white-60 border border-bitcoin-orange-20 hover:border-bitcoin-orange'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilter('reviewed')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'reviewed'
                ? 'bg-bitcoin-orange text-bitcoin-black'
                : 'bg-bitcoin-black text-bitcoin-white-60 border border-bitcoin-orange-20 hover:border-bitcoin-orange'
            }`}
          >
            Reviewed
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-bitcoin-orange text-bitcoin-black'
                : 'bg-bitcoin-black text-bitcoin-white-60 border border-bitcoin-orange-20 hover:border-bitcoin-orange'
            }`}
          >
            All Alerts
          </button>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-bitcoin-white-60">Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bitcoin-block text-center py-12">
            <CheckCircle className="text-green-400 mx-auto mb-4" size={48} />
            <p className="text-bitcoin-white-60 text-lg">
              {filter === 'pending' ? 'No pending alerts' : 'No alerts found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`bitcoin-block ${
                  alert.severity === 'fatal' ? 'border-red-500' : ''
                } ${alert.reviewed ? 'opacity-60' : ''}`}
              >
                {/* Alert Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-bitcoin-white">
                          {alert.symbol} - {alert.alert_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </h3>
                        <span className={`px-3 py-1 rounded text-sm font-bold ${getSeverityBadgeColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-bitcoin-white-60 text-sm">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {alert.reviewed && (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle size={20} />
                      <span className="text-sm font-semibold">Reviewed</span>
                    </div>
                  )}
                </div>

                {/* Alert Message */}
                <p className="text-bitcoin-white mb-4">{alert.message}</p>

                {/* Alert Details */}
                <div className="mb-4 space-y-2">
                  <div>
                    <p className="text-bitcoin-white-60 text-sm mb-1">
                      <strong>Affected Sources:</strong>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {alert.details.affectedSources.map((source, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-bitcoin-black rounded text-bitcoin-white-80 text-xs font-mono"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {alert.details.discrepancyValue && (
                    <p className="text-bitcoin-white-60 text-sm">
                      <strong>Discrepancy:</strong> {alert.details.discrepancyValue}%
                    </p>
                  )}
                  
                  <p className="text-bitcoin-white-60 text-sm">
                    <strong>Recommendation:</strong> {alert.details.recommendation}
                  </p>
                </div>

                {/* Review Section */}
                {!alert.reviewed ? (
                  <div className="pt-4 border-t border-bitcoin-orange-20">
                    {selectedAlert?.id === alert.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Add review notes (optional)..."
                          className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 text-bitcoin-white focus:border-bitcoin-orange focus:outline-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(alert.id)}
                            disabled={submitting}
                            className="btn-bitcoin-primary"
                          >
                            {submitting ? 'Submitting...' : 'Mark as Reviewed'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAlert(null);
                              setReviewNotes('');
                            }}
                            className="btn-bitcoin-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="btn-bitcoin-primary"
                      >
                        Review Alert
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="pt-4 border-t border-bitcoin-orange-20">
                    <p className="text-bitcoin-white-60 text-sm mb-1">
                      <strong>Reviewed by:</strong> {alert.reviewed_by}
                    </p>
                    <p className="text-bitcoin-white-60 text-sm mb-1">
                      <strong>Reviewed at:</strong> {new Date(alert.reviewed_at!).toLocaleString()}
                    </p>
                    {alert.review_notes && (
                      <p className="text-bitcoin-white-80 text-sm mt-2">
                        <strong>Notes:</strong> {alert.review_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
