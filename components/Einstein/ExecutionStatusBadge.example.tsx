/**
 * ExecutionStatusBadge - Usage Examples
 * 
 * This file demonstrates how to use the ExecutionStatusBadge component
 * in various scenarios within the Einstein Trade Engine.
 */

import React from 'react';
import ExecutionStatusBadge from './ExecutionStatusBadge';

export const ExecutionStatusBadgeExamples: React.FC = () => {
  return (
    <div className="bg-bitcoin-black p-8 space-y-8">
      <div className="border border-bitcoin-orange rounded-xl p-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-6">
          Execution Status Badge Examples
        </h2>

        {/* PENDING Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-bitcoin-orange mb-3">
            PENDING Status (with pulsing animation)
          </h3>
          <ExecutionStatusBadge status="PENDING" />
          <p className="text-sm text-gray-400 mt-2">
            Used when a trade signal has been approved but not yet executed.
            The orange color and pulsing animation indicate waiting state.
          </p>
        </div>

        {/* EXECUTED Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-bitcoin-orange mb-3">
            EXECUTED Status (with timestamp)
          </h3>
          <ExecutionStatusBadge 
            status="EXECUTED" 
            executedAt={new Date().toISOString()} 
          />
          <p className="text-sm text-gray-400 mt-2">
            Used when a trade has been executed. Shows solid orange background
            with black text and displays the execution timestamp.
          </p>
        </div>

        {/* PARTIAL_CLOSE Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-bitcoin-orange mb-3">
            PARTIAL_CLOSE Status
          </h3>
          <ExecutionStatusBadge status="PARTIAL_CLOSE" />
          <p className="text-sm text-gray-400 mt-2">
            Used when some take-profit targets have been hit but the trade
            is still partially open.
          </p>
        </div>

        {/* CLOSED Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-bitcoin-orange mb-3">
            CLOSED Status
          </h3>
          <ExecutionStatusBadge status="CLOSED" />
          <p className="text-sm text-gray-400 mt-2">
            Used when a trade has been fully closed. Gray color indicates
            the trade is no longer active.
          </p>
        </div>

        {/* Integration Example */}
        <div className="mt-8 border-t border-bitcoin-orange-20 pt-6">
          <h3 className="text-lg font-semibold text-bitcoin-orange mb-3">
            Integration Example (Trade Card)
          </h3>
          <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-bitcoin-white font-bold">BTC/USD LONG</h4>
                <p className="text-sm text-gray-400">Entry: $95,000</p>
              </div>
              <ExecutionStatusBadge 
                status="EXECUTED" 
                executedAt="2025-01-27T10:30:00Z" 
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-400">TP1:</span>
                <span className="text-bitcoin-orange ml-1">$97,000</span>
              </div>
              <div>
                <span className="text-gray-400">TP2:</span>
                <span className="text-bitcoin-orange ml-1">$99,000</span>
              </div>
              <div>
                <span className="text-gray-400">TP3:</span>
                <span className="text-bitcoin-orange ml-1">$101,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionStatusBadgeExamples;
