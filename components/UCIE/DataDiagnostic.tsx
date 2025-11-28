/**
 * Data Diagnostic Component
 * 
 * Displays raw data structure for debugging
 * Shows what data is actually available in analysisData
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Database } from 'lucide-react';

interface DataDiagnosticProps {
  data: any;
  label?: string;
}

export default function DataDiagnostic({ data, label = 'Analysis Data' }: DataDiagnosticProps) {
  const [expanded, setExpanded] = useState(false);

  if (!data) {
    return (
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-4">
        <div className="flex items-center gap-2 text-bitcoin-white-60">
          <Database className="w-5 h-5" />
          <span className="font-semibold">{label}: No data available</span>
        </div>
      </div>
    );
  }

  const dataKeys = Object.keys(data);
  const dataCount = dataKeys.length;

  return (
    <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-bitcoin-orange-5 hover:bg-bitcoin-orange-10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-bitcoin-orange" />
          <div className="text-left">
            <h3 className="text-lg font-bold text-bitcoin-white">
              {label}
            </h3>
            <p className="text-xs text-bitcoin-white-60">
              {dataCount} properties available
            </p>
          </div>
        </div>
        <div className="text-bitcoin-orange">
          {expanded ? (
            <ChevronUp className="w-6 h-6" />
          ) : (
            <ChevronDown className="w-6 h-6" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Data Keys */}
          <div>
            <h4 className="text-sm font-bold text-bitcoin-orange uppercase mb-2">
              Available Properties ({dataCount})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {dataKeys.map((key) => {
                const value = data[key];
                const hasData = value !== null && value !== undefined;
                const isObject = typeof value === 'object' && value !== null;
                const isArray = Array.isArray(value);
                
                let typeLabel = '';
                if (isArray) typeLabel = `Array(${value.length})`;
                else if (isObject) typeLabel = 'Object';
                else typeLabel = typeof value;

                return (
                  <div
                    key={key}
                    className={`p-2 rounded border ${
                      hasData
                        ? 'border-bitcoin-orange bg-bitcoin-orange-5'
                        : 'border-bitcoin-orange-20 bg-bitcoin-black'
                    }`}
                  >
                    <div className="text-xs font-mono text-bitcoin-white truncate">
                      {key}
                    </div>
                    <div className="text-xs text-bitcoin-white-60 mt-1">
                      {typeLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sample Data */}
          <div>
            <h4 className="text-sm font-bold text-bitcoin-orange uppercase mb-2">
              Sample Data (First 3 Properties)
            </h4>
            <div className="space-y-2">
              {dataKeys.slice(0, 3).map((key) => {
                const value = data[key];
                let displayValue = '';

                try {
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value, null, 2).substring(0, 200);
                    if (JSON.stringify(value).length > 200) displayValue += '...';
                  } else {
                    displayValue = String(value);
                  }
                } catch {
                  displayValue = '[Unable to display]';
                }

                return (
                  <div key={key} className="p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded">
                    <div className="text-xs font-bold text-bitcoin-orange mb-1">
                      {key}:
                    </div>
                    <pre className="text-xs text-bitcoin-white-80 font-mono overflow-x-auto">
                      {displayValue}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full JSON (Collapsed) */}
          <details className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-3">
            <summary className="text-sm font-bold text-bitcoin-orange cursor-pointer">
              View Full JSON
            </summary>
            <pre className="text-xs text-bitcoin-white-80 font-mono overflow-x-auto mt-2 max-h-96 overflow-y-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
