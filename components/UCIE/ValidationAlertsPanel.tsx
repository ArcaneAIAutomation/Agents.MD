import React, { useState } from 'react';
import { ValidationAlert, Discrepancy } from '../../lib/ucie/veritas/types/validationTypes';
import { AlertTriangle, AlertCircle, Info, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ValidationAlertsPanelProps {
  alerts: ValidationAlert[];
  discrepancies: Discrepancy[];
  className?: string;
}

export default function ValidationAlertsPanel({
  alerts,
  discrepancies,
  className = ''
}: ValidationAlertsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Don't render if no alerts or discrepancies
  if (!alerts || alerts.length === 0) {
    return null;
  }

  // Filter alerts by severity
  const filteredAlerts = selectedSeverity === 'all'
    ? alerts
    : alerts.filter(alert => alert.severity === selectedSeverity);

  // Get icon and color for severity
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'fatal':
        return <XCircle className="text-red-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-400" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-orange-400" size={20} />;
      case 'info':
        return <Info className="text-blue-400" size={20} />;
      default:
        return <Info className="text-bitcoin-white-60" size={20} />;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'fatal':
        return 'border-red-500 bg-red-500 bg-opacity-10';
      case 'error':
        return 'border-red-400 bg-red-400 bg-opacity-10';
      case 'warning':
        return 'border-orange-400 bg-orange-400 bg-opacity-10';
      case 'info':
        return 'border-blue-400 bg-blue-400 bg-opacity-10';
      default:
        return 'border-bitcoin-orange-20';
    }
  };

  // Count alerts by severity
  const severityCounts = {
    fatal: alerts.filter(a => a.severity === 'fatal').length,
    error: alerts.filter(a => a.severity === 'error').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length
  };

  return (
    <div className={`bitcoin-block ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-bitcoin-white">
            Validation Alerts
          </h3>
          <span className="text-bitcoin-white-60 text-sm">
            ({alerts.length} total)
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-bitcoin-orange hover:text-bitcoin-white transition-colors"
        >
          {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {/* Severity Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedSeverity('all')}
          className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
            selectedSeverity === 'all'
              ? 'bg-bitcoin-orange text-bitcoin-black'
              : 'bg-bitcoin-black text-bitcoin-white-60 border border-bitcoin-orange-20 hover:border-bitcoin-orange'
          }`}
        >
          All ({alerts.length})
        </button>
        {severityCounts.fatal > 0 && (
          <button
            onClick={() => setSelectedSeverity('fatal')}
            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
              selectedSeverity === 'fatal'
                ? 'bg-red-500 text-white'
                : 'bg-bitcoin-black text-red-400 border border-red-500 hover:bg-red-500 hover:text-white'
            }`}
          >
            Fatal ({severityCounts.fatal})
          </button>
        )}
        {severityCounts.error > 0 && (
          <button
            onClick={() => setSelectedSeverity('error')}
            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
              selectedSeverity === 'error'
                ? 'bg-red-400 text-white'
                : 'bg-bitcoin-black text-red-300 border border-red-400 hover:bg-red-400 hover:text-white'
            }`}
          >
            Error ({severityCounts.error})
          </button>
        )}
        {severityCounts.warning > 0 && (
          <button
            onClick={() => setSelectedSeverity('warning')}
            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
              selectedSeverity === 'warning'
                ? 'bg-orange-400 text-bitcoin-black'
                : 'bg-bitcoin-black text-orange-400 border border-orange-400 hover:bg-orange-400 hover:text-bitcoin-black'
            }`}
          >
            Warning ({severityCounts.warning})
          </button>
        )}
        {severityCounts.info > 0 && (
          <button
            onClick={() => setSelectedSeverity('info')}
            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
              selectedSeverity === 'info'
                ? 'bg-blue-400 text-white'
                : 'bg-bitcoin-black text-blue-400 border border-blue-400 hover:bg-blue-400 hover:text-white'
            }`}
          >
            Info ({severityCounts.info})
          </button>
        )}
      </div>

      {/* Alerts List */}
      {expanded && (
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <p className="text-bitcoin-white-60 text-sm text-center py-4">
              No alerts for selected severity level
            </p>
          ) : (
            filteredAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                {/* Alert Header */}
                <div className="flex items-start gap-3 mb-2">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-bitcoin-white font-semibold">
                        {alert.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        alert.severity === 'fatal' ? 'bg-red-500 text-white' :
                        alert.severity === 'error' ? 'bg-red-400 text-white' :
                        alert.severity === 'warning' ? 'bg-orange-400 text-bitcoin-black' :
                        'bg-blue-400 text-white'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-bitcoin-white-80 text-sm">
                      {alert.message}
                    </p>
                  </div>
                </div>

                {/* Affected Sources */}
                {alert.affectedSources && alert.affectedSources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
                    <p className="text-bitcoin-white-60 text-xs mb-1">
                      Affected Sources:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {alert.affectedSources.map((source, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-bitcoin-black rounded text-bitcoin-white-80 text-xs font-mono"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                {alert.recommendation && (
                  <div className="mt-3 pt-3 border-t border-bitcoin-orange-20">
                    <p className="text-bitcoin-white-60 text-xs mb-1">
                      Recommendation:
                    </p>
                    <p className="text-bitcoin-orange text-sm">
                      {alert.recommendation}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Discrepancies Section */}
      {expanded && discrepancies && discrepancies.length > 0 && (
        <div className="mt-6 pt-6 border-t border-bitcoin-orange-20">
          <h4 className="text-bitcoin-white font-semibold mb-3">
            Data Discrepancies ({discrepancies.length})
          </h4>
          <div className="space-y-3">
            {discrepancies.map((discrepancy, index) => (
              <div
                key={index}
                className="bitcoin-block-subtle p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-bitcoin-white font-semibold text-sm">
                    {discrepancy.metric.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                  <span className={`text-xs font-bold ${
                    discrepancy.exceeded ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {discrepancy.exceeded ? 'EXCEEDED' : 'WITHIN THRESHOLD'}
                  </span>
                </div>

                {/* Source Values */}
                <div className="space-y-1 mb-2">
                  {discrepancy.sources.map((source, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-bitcoin-white-60 text-xs">
                        {source.name}:
                      </span>
                      <span className="text-bitcoin-white text-xs font-mono">
                        {typeof source.value === 'number' 
                          ? source.value.toLocaleString()
                          : source.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Variance Info */}
                <div className="flex justify-between items-center text-xs pt-2 border-t border-bitcoin-orange-20">
                  <span className="text-bitcoin-white-60">
                    Variance: {(discrepancy.variance * 100).toFixed(2)}%
                  </span>
                  <span className="text-bitcoin-white-60">
                    Threshold: {(discrepancy.threshold * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
