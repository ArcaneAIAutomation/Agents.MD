/**
 * Intelligence Report Generator Component
 * 
 * Generates comprehensive PDF, JSON, and Markdown reports from UCIE analysis data.
 * Includes executive summary, all analysis sections, charts, and disclaimers.
 */

import React, { useState } from 'react';
import { Download, FileText, FileJson, FileCode } from 'lucide-react';

interface IntelligenceReportGeneratorProps {
  symbol: string;
  analysisData: any; // ComprehensiveAnalysis type
  className?: string;
}

export default function IntelligenceReportGenerator({
  symbol,
  analysisData,
  className = '',
}: IntelligenceReportGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'json' | 'markdown'>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [selectedSections, setSelectedSections] = useState({
    executiveSummary: true,
    marketData: true,
    consensus: true,
    technical: true,
    sentiment: true,
    onChain: true,
    research: true,
    risk: true,
    predictions: true,
    derivatives: false,
    defi: false,
  });

  const handleGenerateReport = async () => {
    setGenerating(true);

    try {
      const response = await fetch(`/api/ucie/export/${symbol}`, {
        credentials: 'include', // Required for authentication cookie
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          includeCharts,
          sections: selectedSections,
          analysisData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Get the blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${symbol}_UCIE_Report_${new Date().toISOString().split('T')[0]}.${format === 'markdown' ? 'md' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleSection = (section: keyof typeof selectedSections) => {
    setSelectedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const selectAllSections = () => {
    const allSelected = Object.keys(selectedSections).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as typeof selectedSections
    );
    setSelectedSections(allSelected);
  };

  const deselectAllSections = () => {
    const allDeselected = Object.keys(selectedSections).reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {} as typeof selectedSections
    );
    setSelectedSections(allDeselected);
  };

  const selectedCount = Object.values(selectedSections).filter(Boolean).length;

  return (
    <div className={`bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-bitcoin-white mb-2">
            Export Intelligence Report
          </h3>
          <p className="text-bitcoin-white-60 text-sm">
            Generate a comprehensive analysis report for {symbol}
          </p>
        </div>
        <Download className="text-bitcoin-orange" size={32} />
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <label className="block text-bitcoin-white-80 font-semibold mb-3">
          Export Format
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setFormat('pdf')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
              format === 'pdf'
                ? 'bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange'
                : 'bg-transparent text-bitcoin-white-80 border-bitcoin-orange-20 hover:border-bitcoin-orange'
            }`}
          >
            <FileText size={20} />
            <span className="font-semibold">PDF</span>
          </button>
          <button
            onClick={() => setFormat('json')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
              format === 'json'
                ? 'bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange'
                : 'bg-transparent text-bitcoin-white-80 border-bitcoin-orange-20 hover:border-bitcoin-orange'
            }`}
          >
            <FileJson size={20} />
            <span className="font-semibold">JSON</span>
          </button>
          <button
            onClick={() => setFormat('markdown')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
              format === 'markdown'
                ? 'bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange'
                : 'bg-transparent text-bitcoin-white-80 border-bitcoin-orange-20 hover:border-bitcoin-orange'
            }`}
          >
            <FileCode size={20} />
            <span className="font-semibold">Markdown</span>
          </button>
        </div>
      </div>

      {/* Options */}
      {format === 'pdf' && (
        <div className="mb-6">
          <label className="flex items-center gap-2 text-bitcoin-white-80 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
              className="w-5 h-5 accent-bitcoin-orange"
            />
            <span>Include charts and visualizations</span>
          </label>
        </div>
      )}

      {/* Section Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-bitcoin-white-80 font-semibold">
            Include Sections ({selectedCount} selected)
          </label>
          <div className="flex gap-2">
            <button
              onClick={selectAllSections}
              className="text-xs text-bitcoin-orange hover:text-bitcoin-white transition-colors"
            >
              Select All
            </button>
            <span className="text-bitcoin-white-60">|</span>
            <button
              onClick={deselectAllSections}
              className="text-xs text-bitcoin-orange hover:text-bitcoin-white transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(selectedSections).map(([key, value]) => (
            <label
              key={key}
              className="flex items-center gap-2 text-bitcoin-white-80 cursor-pointer hover:text-bitcoin-white transition-colors"
            >
              <input
                type="checkbox"
                checked={value}
                onChange={() => toggleSection(key as keyof typeof selectedSections)}
                className="w-4 h-4 accent-bitcoin-orange"
              />
              <span className="text-sm">
                {key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase())
                  .trim()}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateReport}
        disabled={generating || selectedCount === 0}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
          generating || selectedCount === 0
            ? 'bg-bitcoin-white-60 text-bitcoin-black cursor-not-allowed'
            : 'bg-bitcoin-orange text-bitcoin-black hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)]'
        }`}
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating Report...
          </span>
        ) : (
          `Generate ${format.toUpperCase()} Report`
        )}
      </button>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg">
        <p className="text-xs text-bitcoin-white-60 leading-relaxed">
          <strong className="text-bitcoin-white-80">Disclaimer:</strong> This report is for
          informational purposes only and does not constitute financial advice. Cryptocurrency
          investments carry significant risk. Always conduct your own research and consult with a
          qualified financial advisor before making investment decisions.
        </p>
      </div>
    </div>
  );
}
