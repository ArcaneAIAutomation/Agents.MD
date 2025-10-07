/**
 * Text Overflow Prevention Example Component
 * 
 * Demonstrates the usage of text overflow prevention utilities and components.
 * This component is for development and testing purposes.
 */

import React, { useRef } from 'react';
import {
  SafeContainer,
  SafeFlexContainer,
  SafeFlexChild,
  TruncatedText,
  SafePrice,
  SafeAmount,
  SafePercentage,
  SafeBadge,
  SafeStatusMessage,
  ScrollableContainer,
} from './SafeContainer';
import { useOverflowDetection, useElementOverflow } from '../hooks/useOverflowDetection';

/**
 * Example component showing various overflow prevention techniques
 */
export const TextOverflowExample: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Enable overflow detection in development
  const { overflowElements, scan, clearHighlights } = useOverflowDetection({
    enabled: process.env.NODE_ENV === 'development',
    autoScan: true,
    highlightElements: true,
  });

  // Check specific element overflow
  const { hasOverflow } = useElementOverflow(containerRef);

  return (
    <div className="p-6 space-y-8 bg-gray-50">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Text Overflow Prevention Examples</h2>
        
        {/* Development Tools */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-bold mb-2">Development Tools</h3>
            <div className="flex gap-2">
              <button
                onClick={scan}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Scan for Overflow
              </button>
              <button
                onClick={clearHighlights}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear Highlights
              </button>
            </div>
            {overflowElements.length > 0 && (
              <p className="mt-2 text-red-600 font-bold">
                ⚠️ Found {overflowElements.length} overflow issues
              </p>
            )}
          </div>
        )}
      </div>

      {/* Example 1: Single-line Ellipsis */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">1. Single-line Text with Ellipsis</h3>
        <div className="w-64 border border-gray-300 p-2">
          <div className="text-overflow-ellipsis">
            This is a very long text that will be truncated with an ellipsis when it exceeds the container width
          </div>
        </div>
        <code className="text-sm text-gray-600 mt-2 block">
          className="text-overflow-ellipsis"
        </code>
      </div>

      {/* Example 2: Multi-line Word Breaking */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">2. Multi-line Text with Word Breaking</h3>
        <div className="w-64 border border-gray-300 p-2">
          <div className="text-overflow-break">
            This is a very long text that will wrap to multiple lines and break words if necessary to fit within the container
          </div>
        </div>
        <code className="text-sm text-gray-600 mt-2 block">
          className="text-overflow-break"
        </code>
      </div>

      {/* Example 3: Truncated Text Component */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">3. Truncated Text (2 lines)</h3>
        <div className="w-64 border border-gray-300 p-2">
          <TruncatedText lines={2}>
            This is a longer text that will be truncated to exactly 2 lines with an ellipsis at the end. Any additional text beyond 2 lines will be hidden.
          </TruncatedText>
        </div>
        <code className="text-sm text-gray-600 mt-2 block">
          {'<TruncatedText lines={2}>...</TruncatedText>'}
        </code>
      </div>

      {/* Example 4: Safe Flex Container */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">4. Safe Flex Container</h3>
        <SafeFlexContainer className="w-64 border border-gray-300 p-2 gap-2">
          <SafeFlexChild className="flex-1 bg-blue-100 p-2">
            Very long text in flex child that won't overflow
          </SafeFlexChild>
          <SafeFlexChild className="flex-1 bg-green-100 p-2">
            Another long text in flex child
          </SafeFlexChild>
        </SafeFlexContainer>
        <code className="text-sm text-gray-600 mt-2 block">
          {'<SafeFlexContainer>...</SafeFlexContainer>'}
        </code>
      </div>

      {/* Example 5: Price Components */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">5. Safe Price Components</h3>
        <div className="w-48 border border-gray-300 p-2 space-y-2">
          <div>
            <span className="text-sm text-gray-600">Price: </span>
            <SafePrice className="font-bold">$123,456,789.12</SafePrice>
          </div>
          <div>
            <span className="text-sm text-gray-600">Amount: </span>
            <SafeAmount className="font-bold">1,234,567.89012345 BTC</SafeAmount>
          </div>
          <div>
            <span className="text-sm text-gray-600">Change: </span>
            <SafePercentage className="font-bold text-green-600">+123.45%</SafePercentage>
          </div>
        </div>
        <code className="text-sm text-gray-600 mt-2 block">
          {'<SafePrice>...</SafePrice>'}
        </code>
      </div>

      {/* Example 6: Badges */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">6. Safe Badges</h3>
        <div className="w-32 border border-gray-300 p-2">
          <SafeBadge className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Very Long Badge Label
          </SafeBadge>
        </div>
        <code className="text-sm text-gray-600 mt-2 block">
          {'<SafeBadge>...</SafeBadge>'}
        </code>
      </div>

      {/* Example 7: Crypto Address (Anywhere Breaking) */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">7. Crypto Address (Break Anywhere)</h3>
        <div className="w-64 border border-gray-300 p-2">
          <code className="text-overflow-anywhere text-sm">
            0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
          </code>
        </div>
        <code className="text-sm text-gray-600 mt-2 block">
          className="text-overflow-anywhere"
        </code>
      </div>

      {/* Example 8: Scrollable Container */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">8. Scrollable Container</h3>
        <ScrollableContainer className="w-64 border border-gray-300 p-2">
          <div className="whitespace-nowrap">
            This is a very long line of text that will require horizontal scrolling to view completely
          </div>
        </ScrollableContainer>
        <code className="text-sm text-gray-600 mt-2 block">
          {'<ScrollableContainer>...</ScrollableContainer>'}
        </code>
      </div>

      {/* Example 9: Status Message */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">9. Safe Status Message</h3>
        <div className="w-64 border border-gray-300 p-2">
          <SafeStatusMessage className="text-sm">
            This is a status message that can contain long text and will wrap properly without overflowing the container boundaries
          </SafeStatusMessage>
        </div>
        <code className="text-sm text-gray-600 mt-2 block">
          {'<SafeStatusMessage>...</SafeStatusMessage>'}
        </code>
      </div>

      {/* Example 10: Element Overflow Detection */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-2">10. Element Overflow Detection</h3>
        <div ref={containerRef} className="w-64 border border-gray-300 p-2">
          <div className="text-overflow-ellipsis">
            Monitored element with overflow detection
          </div>
        </div>
        {hasOverflow && (
          <p className="mt-2 text-red-600 font-bold">
            ⚠️ This element has overflow!
          </p>
        )}
        <code className="text-sm text-gray-600 mt-2 block">
          useElementOverflow(ref)
        </code>
      </div>

      {/* CSS Classes Reference */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold mb-4">Available CSS Classes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Containment Strategies:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• text-overflow-ellipsis</li>
              <li>• text-overflow-break</li>
              <li>• text-overflow-anywhere</li>
              <li>• text-overflow-scroll</li>
              <li>• text-overflow-safe</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Container Classes:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• safe-container</li>
              <li>• safe-flex-child</li>
              <li>• safe-grid-child</li>
              <li>• mobile-safe-container</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Truncation:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• truncate-1-line</li>
              <li>• truncate-2-lines</li>
              <li>• truncate-3-lines</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Word Break:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• word-break-normal</li>
              <li>• word-break-words</li>
              <li>• word-break-all</li>
              <li>• word-break-keep</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextOverflowExample;
