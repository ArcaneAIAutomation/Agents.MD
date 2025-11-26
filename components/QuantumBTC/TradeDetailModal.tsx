import React, { useEffect, useState } from 'react';
import { X, TrendingUp, Target, Shield, Clock, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface TradeDetailModalProps {
  tradeId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TradeDetails {
  trade: any;
  validationHistory: any[];
  anomalies: any[];
  currentStatus: any;
}

export default function TradeDetailModal({ tradeId, isOpen, onClose }: TradeDetailModalProps) {
  const [details, setDetails] = useState<TradeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tradeId) {
      fetchTradeDetails();
    }
  }, [isOpen, tradeId]);

  const fetchTradeDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quantum/trade-details/${tradeId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trade details');
      }

      if (data.success) {
        setDetails(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Trade details error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bitcoin-black bg-opacity-90">
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-bitcoin-black border-b-2 border-bitcoin-orange px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-bitcoin-white">
            Trade Details
          </h2>
          <button
            onClick={onClose}
            className="text-bitcoin-orange hover:text-bitcoin-white transition-colors p-2 hover:bg-bitcoin-orange-10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin-orange"></div>
            </div>
          ) : error || !details ? (
            <div className="flex items-center gap-3 text-bitcoin-orange py-8">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <p className="font-bold">Failed to Load Trade Details</p>
                <p className="text-sm text-bitcoin-white-80 mt-1">
                  {error || 'No trade details available'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Trade Overview */}
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-bitcoin-orange" />
                  Trade Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-bitcoin-white-60 uppercase mb-1">Symbol</p>
                    <p className="font-mono text-lg font-bold text-bitcoin-white">
                      {details.trade.symbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-bitcoin-white-60 uppercase mb-1">Timeframe</p>
                    <p className="font-mono text-lg font-bold text-bitcoin-white">
                      {details.trade.timeframe}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-bitcoin-white-60 uppercase mb-1">Confidence</p>
                    <p className="font-mono text-lg font-bold text-bitcoin-orange">
                      {details.trade.confidence}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-bitcoin-white-60 uppercase mb-1">Status</p>
                    <p className="font-mono text-lg font-bold text-bitcoin-white">
                      {details.currentStatus.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Entry & Targets */}
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-bitcoin-orange" />
                  Entry Zone & Targets
                </h3>
                <div className="space-y-4">
                  {/* Entry Zone */}
                  <div>
                    <p className="text-sm text-bitcoin-white-60 mb-2">Entry Zone</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-2">
                        <p className="text-xs text-bitcoin-white-60">Min</p>
                        <p className="font-mono text-sm text-bitcoin-white">
                          ${details.trade.entryZone.min.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-bitcoin-orange border border-bitcoin-orange rounded p-2">
                        <p className="text-xs text-bitcoin-black">Optimal</p>
                        <p className="font-mono text-sm text-bitcoin-black font-bold">
                          ${details.trade.entryZone.optimal.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-2">
                        <p className="text-xs text-bitcoin-white-60">Max</p>
                        <p className="font-mono text-sm text-bitcoin-white">
                          ${details.trade.entryZone.max.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Take Profit Targets */}
                  <div>
                    <p className="text-sm text-bitcoin-white-60 mb-2">Take Profit Targets</p>
                    <div className="space-y-2">
                      {Object.entries(details.trade.targets).map(([key, target]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between bg-bitcoin-black border border-bitcoin-orange-20 rounded p-2">
                          <div className="flex items-center gap-2">
                            {details.currentStatus.targetsHit[key] && (
                              <CheckCircle className="w-4 h-4 text-bitcoin-orange" />
                            )}
                            <span className="text-sm text-bitcoin-white uppercase">{key}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm text-bitcoin-white">
                              ${target.price.toLocaleString()}
                            </p>
                            <p className="text-xs text-bitcoin-white-60">
                              {target.allocation}% allocation
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stop Loss */}
                  <div>
                    <p className="text-sm text-bitcoin-white-60 mb-2">Stop Loss</p>
                    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-bitcoin-orange" />
                          <span className="text-sm text-bitcoin-white">Stop Price</span>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm text-bitcoin-white">
                            ${details.trade.stopLoss.price.toLocaleString()}
                          </p>
                          <p className="text-xs text-bitcoin-white-60">
                            Max Loss: {details.trade.stopLoss.maxLossPercent}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantum Reasoning */}
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <h3 className="text-lg font-bold text-bitcoin-white mb-4">
                  Quantum Reasoning
                </h3>
                <p className="text-bitcoin-white-80 text-sm leading-relaxed whitespace-pre-wrap">
                  {details.trade.quantumReasoning}
                </p>
              </div>

              {/* Mathematical Justification */}
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <h3 className="text-lg font-bold text-bitcoin-white mb-4">
                  Mathematical Justification
                </h3>
                <p className="text-bitcoin-white-80 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {details.trade.mathematicalJustification}
                </p>
              </div>

              {/* Validation History */}
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-bitcoin-orange" />
                  Validation History
                </h3>
                {details.validationHistory.length === 0 ? (
                  <p className="text-bitcoin-white-60 text-sm text-center py-4">
                    No validation history available yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {details.validationHistory.map((snapshot, index) => (
                      <div
                        key={index}
                        className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-bitcoin-white">
                              {new Date(snapshot.timestamp).toLocaleString()}
                            </p>
                            <p className="text-xs text-bitcoin-white-60 mt-1">
                              Deviation: {snapshot.deviationFromPrediction.toFixed(2)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm text-bitcoin-orange">
                              ${snapshot.price.toLocaleString()}
                            </p>
                            <p className="text-xs text-bitcoin-white-60 mt-1">
                              Quality: {snapshot.dataQualityScore}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Anomalies */}
              {details.anomalies.length > 0 && (
                <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4">
                  <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-bitcoin-orange" />
                    Detected Anomalies
                  </h3>
                  <div className="space-y-2">
                    {details.anomalies.map((anomaly, index) => (
                      <div
                        key={index}
                        className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-3"
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-bitcoin-orange mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-bitcoin-white font-semibold">
                              {anomaly.type}
                            </p>
                            <p className="text-xs text-bitcoin-white-80 mt-1">
                              {anomaly.description}
                            </p>
                            <p className="text-xs text-bitcoin-white-60 mt-1">
                              Severity: {anomaly.severity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Quality Score */}
              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-bitcoin-orange" />
                  Data Quality at Generation
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-bitcoin-orange h-full transition-all"
                      style={{ width: `${details.trade.dataQualityScore}%` }}
                    />
                  </div>
                  <p className="font-mono text-lg font-bold text-bitcoin-orange">
                    {details.trade.dataQualityScore}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
