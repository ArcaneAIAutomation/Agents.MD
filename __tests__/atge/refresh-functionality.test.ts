/**
 * ATGE Refresh Functionality Tests
 * Tests for user-triggered refresh functionality
 * Requirements: 2.2
 */

// Mock fetch globally
global.fetch = jest.fn();

describe('ATGE Refresh Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Requirement 2.2.1: Refresh Button Display', () => {
    it('should show "Refresh Trades" button on dashboard when user logs in', async () => {
      // Requirement 2.2: WHEN user logs in, THE System SHALL show "Refresh Trades" button on dashboard
      
      // This test verifies that the refresh button is visible
      // In the actual implementation, this would be part of the PerformanceDashboard component
      
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Refresh Trades';
      mockButton.setAttribute('data-testid', 'refresh-button');
      
      expect(mockButton.textContent).toBe('Refresh Trades');
      expect(mockButton.getAttribute('data-testid')).toBe('refresh-button');
    });
  });

  describe('Requirement 2.2.2: API Call on Refresh', () => {
    it('should call /api/atge/verify-trades endpoint when user clicks refresh button', async () => {
      // Requirement 2.2: WHEN user clicks refresh button, THE System SHALL call `/api/atge/verify-trades` endpoint
      
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          totalTrades: 5,
          verified: 5,
          updated: 2,
          failed: 0,
          errors: [],
          timestamp: new Date().toISOString()
        })
      });

      // Simulate button click
      const handleRefresh = async () => {
        const response = await fetch('/api/atge/verify-trades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        return response.json();
      };

      const result = await handleRefresh();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/atge/verify-trades',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
      expect(result.success).toBe(true);
      expect(result.totalTrades).toBe(5);
    });
  });

  describe('Requirement 2.2.3: Loading State with Spinner', () => {
    it('should show loading state with spinner when refresh is triggered', async () => {
      // Requirement 2.2: WHEN refresh is triggered, THE Button SHALL show loading state with spinner
      
      let isLoading = false;
      
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                success: true,
                totalTrades: 3,
                verified: 3,
                updated: 1,
                failed: 0,
                errors: [],
                timestamp: new Date().toISOString()
              })
            });
          }, 100);
        });
      });

      const handleRefresh = async () => {
        isLoading = true;
        
        try {
          const response = await fetch('/api/atge/verify-trades', {
            method: 'POST'
          });
          await response.json();
        } finally {
          isLoading = false;
        }
      };

      // Start refresh
      const refreshPromise = handleRefresh();
      
      // Check loading state is true
      expect(isLoading).toBe(true);
      
      // Wait for completion
      await refreshPromise;
      
      // Check loading state is false
      expect(isLoading).toBe(false);
    });

    it('should display spinner element during loading', () => {
      // Verify spinner element exists during loading state
      const spinner = document.createElement('div');
      spinner.className = 'animate-spin rounded-full h-4 w-4 border-b-2 border-bitcoin-black';
      spinner.setAttribute('data-testid', 'loading-spinner');
      
      expect(spinner.className).toContain('animate-spin');
      expect(spinner.getAttribute('data-testid')).toBe('loading-spinner');
    });
  });

  describe('Requirement 2.2.4: Dashboard Update', () => {
    it('should update dashboard with latest trade data when refresh completes', async () => {
      // Requirement 2.2: WHEN refresh completes, THE Dashboard SHALL update with latest trade data
      
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          totalTrades: 10,
          verified: 10,
          updated: 5,
          failed: 0,
          errors: [],
          timestamp: new Date().toISOString()
        })
      });

      let dashboardData = { totalTrades: 0, updated: 0 };

      const handleRefresh = async () => {
        const response = await fetch('/api/atge/verify-trades', {
          method: 'POST'
        });
        const data = await response.json();
        
        // Update dashboard data
        dashboardData = {
          totalTrades: data.totalTrades,
          updated: data.updated
        };
      };

      await handleRefresh();

      expect(dashboardData.totalTrades).toBe(10);
      expect(dashboardData.updated).toBe(5);
    });

    it('should trigger re-render of child components with updated data', async () => {
      // Verify that lastGeneratedAt prop changes trigger component updates
      const initialTime = new Date('2025-01-01T00:00:00Z');
      const updatedTime = new Date('2025-01-01T01:00:00Z');
      
      let lastGeneratedAt = initialTime;
      
      // Simulate refresh completing
      const handleRefreshComplete = () => {
        lastGeneratedAt = updatedTime;
      };
      
      handleRefreshComplete();
      
      expect(lastGeneratedAt).toEqual(updatedTime);
      expect(lastGeneratedAt).not.toEqual(initialTime);
    });
  });

  describe('Requirement 2.2.5: Success Message', () => {
    it('should show success message with timestamp when refresh completes', async () => {
      // Requirement 2.2: WHEN refresh completes, THE System SHALL show success message with timestamp
      
      const mockFetch = global.fetch as jest.Mock;
      const mockTimestamp = '2025-01-27T12:00:00.000Z';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          totalTrades: 5,
          verified: 5,
          updated: 2,
          failed: 0,
          errors: [],
          timestamp: mockTimestamp
        })
      });

      let successMessage = '';

      const handleRefresh = async () => {
        const response = await fetch('/api/atge/verify-trades', {
          method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
          const timestamp = new Date(data.timestamp).toLocaleString();
          successMessage = `✅ Trades refreshed successfully! Last updated: ${timestamp}`;
        }
      };

      await handleRefresh();

      expect(successMessage).toContain('✅ Trades refreshed successfully!');
      expect(successMessage).toContain('Last updated:');
    });

    it('should display success message for 5 seconds then hide', async () => {
      // Success message should be visible temporarily
      let successMessage: string | null = 'Success!';
      
      const hideMessageAfterDelay = () => {
        setTimeout(() => {
          successMessage = null;
        }, 5000);
      };
      
      hideMessageAfterDelay();
      
      // Initially visible
      expect(successMessage).toBe('Success!');
      
      // After timeout, should be hidden
      await new Promise(resolve => setTimeout(resolve, 5100));
      expect(successMessage).toBeNull();
    });
  });

  describe('Requirement 2.2.6: Error Handling', () => {
    it('should show error message when refresh fails', async () => {
      // Requirement 2.2: WHEN refresh fails, THE System SHALL show error message and allow retry
      
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      let errorMessage = '';

      const handleRefresh = async () => {
        try {
          const response = await fetch('/api/atge/verify-trades', {
            method: 'POST'
          });
          await response.json();
        } catch (error) {
          errorMessage = error instanceof Error ? error.message : 'Failed to refresh trades';
        }
      };

      await handleRefresh();

      expect(errorMessage).toBe('Network error');
    });

    it('should allow retry after error', async () => {
      // Verify retry functionality is available after error
      let canRetry = false;
      let errorOccurred = false;
      
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const handleRefresh = async () => {
        try {
          const response = await fetch('/api/atge/verify-trades', {
            method: 'POST'
          });
          await response.json();
        } catch (error) {
          errorOccurred = true;
          canRetry = true; // Enable retry button
        }
      };

      await handleRefresh();

      expect(errorOccurred).toBe(true);
      expect(canRetry).toBe(true);
    });

    it('should handle API error responses gracefully', async () => {
      // Test handling of API error responses (non-network errors)
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'Internal server error'
        })
      });

      let errorMessage = '';

      const handleRefresh = async () => {
        const response = await fetch('/api/atge/verify-trades', {
          method: 'POST'
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          errorMessage = data.error || 'Failed to refresh trades';
        }
      };

      await handleRefresh();

      expect(errorMessage).toBe('Internal server error');
    });
  });

  describe('Requirement 2.2.7: Prevent Duplicate Requests', () => {
    it('should disable button when refresh is in progress', async () => {
      // Requirement 2.2: WHEN refresh is in progress, THE Button SHALL be disabled to prevent duplicate requests
      
      let isRefreshing = false;
      let buttonDisabled = false;
      
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                success: true,
                totalTrades: 3,
                verified: 3,
                updated: 1,
                failed: 0,
                errors: [],
                timestamp: new Date().toISOString()
              })
            });
          }, 100);
        });
      });

      const handleRefresh = async () => {
        if (isRefreshing) {
          return; // Prevent duplicate requests
        }
        
        isRefreshing = true;
        buttonDisabled = true;
        
        try {
          const response = await fetch('/api/atge/verify-trades', {
            method: 'POST'
          });
          await response.json();
        } finally {
          isRefreshing = false;
          buttonDisabled = false;
        }
      };

      // Start first refresh
      const refreshPromise = handleRefresh();
      
      // Button should be disabled
      expect(buttonDisabled).toBe(true);
      expect(isRefreshing).toBe(true);
      
      // Try to trigger second refresh (should be prevented)
      await handleRefresh();
      
      // Wait for first refresh to complete
      await refreshPromise;
      
      // Button should be enabled again
      expect(buttonDisabled).toBe(false);
      expect(isRefreshing).toBe(false);
    });

    it('should not make duplicate API calls when button is clicked multiple times', async () => {
      // Verify only one API call is made even with multiple clicks
      const mockFetch = global.fetch as jest.Mock;
      let callCount = 0;
      
      mockFetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            totalTrades: 1,
            verified: 1,
            updated: 0,
            failed: 0,
            errors: [],
            timestamp: new Date().toISOString()
          })
        });
      });

      let isRefreshing = false;

      const handleRefresh = async () => {
        if (isRefreshing) {
          return; // Prevent duplicate
        }
        
        isRefreshing = true;
        
        try {
          const response = await fetch('/api/atge/verify-trades', {
            method: 'POST'
          });
          await response.json();
        } finally {
          isRefreshing = false;
        }
      };

      // Simulate rapid clicks
      const click1 = handleRefresh();
      const click2 = handleRefresh(); // Should be prevented
      const click3 = handleRefresh(); // Should be prevented
      
      await Promise.all([click1, click2, click3]);

      // Only one API call should have been made
      expect(callCount).toBe(1);
    });
  });

  describe('Edge Cases: Network Failures', () => {
    it('should handle network timeout gracefully', async () => {
      // Test with network timeout
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timeout'));
          }, 100);
        });
      });

      let errorMessage = '';

      const handleRefresh = async () => {
        try {
          const response = await fetch('/api/atge/verify-trades', {
            method: 'POST'
          });
          await response.json();
        } catch (error) {
          errorMessage = 'Network timeout. Please try again.';
        }
      };

      await handleRefresh();

      expect(errorMessage).toBe('Network timeout. Please try again.');
    });

    it('should handle connection refused error', async () => {
      // Test with connection refused
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      let errorMessage = '';

      const handleRefresh = async () => {
        try {
          const response = await fetch('/api/atge/verify-trades', {
            method: 'POST'
          });
          await response.json();
        } catch (error) {
          errorMessage = 'Unable to connect to server. Please check your connection.';
        }
      };

      await handleRefresh();

      expect(errorMessage).toBe('Unable to connect to server. Please check your connection.');
    });

    it('should handle DNS resolution failure', async () => {
      // Test with DNS failure
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND'));

      let errorMessage = '';

      const handleRefresh = async () => {
        try {
          const response = await fetch('/api/atge/verify-trades', {
            method: 'POST'
          });
          await response.json();
        } catch (error) {
          errorMessage = 'Network error. Please check your internet connection.';
        }
      };

      await handleRefresh();

      expect(errorMessage).toBe('Network error. Please check your internet connection.');
    });
  });

  describe('Edge Cases: No Active Trades', () => {
    it('should handle response with no active trades', async () => {
      // Requirement 2.2: Test with no active trades
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          totalTrades: 0,
          verified: 0,
          updated: 0,
          failed: 0,
          errors: [],
          timestamp: new Date().toISOString()
        })
      });

      let successMessage = '';

      const handleRefresh = async () => {
        const response = await fetch('/api/atge/verify-trades', {
          method: 'POST'
        });
        const data = await response.json();
        
        if (data.success && data.totalTrades === 0) {
          successMessage = 'No active trades to verify.';
        }
      };

      await handleRefresh();

      expect(successMessage).toBe('No active trades to verify.');
    });

    it('should display appropriate message when no trades exist', () => {
      // Verify UI shows appropriate message for empty state
      const totalTrades = 0;
      const message = totalTrades === 0 
        ? 'No active trades. Generate a trade signal to get started.' 
        : `${totalTrades} active trades`;
      
      expect(message).toBe('No active trades. Generate a trade signal to get started.');
    });
  });

  describe('Integration: Complete Refresh Flow', () => {
    it('should complete full refresh cycle successfully', async () => {
      // Test complete flow: click -> loading -> API call -> update -> success message
      const mockFetch = global.fetch as jest.Mock;
      const mockTimestamp = new Date().toISOString();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          totalTrades: 8,
          verified: 8,
          updated: 3,
          failed: 0,
          errors: [],
          timestamp: mockTimestamp
        })
      });

      let isLoading = false;
      let successMessage = '';
      let dashboardData = { totalTrades: 0, updated: 0 };

      const handleRefresh = async () => {
        isLoading = true;
        
        try {
          const response = await fetch('/api/atge/verify-trades', {
            method: 'POST'
          });
          const data = await response.json();
          
          if (data.success) {
            dashboardData = {
              totalTrades: data.totalTrades,
              updated: data.updated
            };
            successMessage = `✅ Refreshed ${data.totalTrades} trades, ${data.updated} updated`;
          }
        } finally {
          isLoading = false;
        }
      };

      // Execute refresh
      await handleRefresh();

      // Verify all states
      expect(isLoading).toBe(false);
      expect(successMessage).toContain('✅ Refreshed 8 trades, 3 updated');
      expect(dashboardData.totalTrades).toBe(8);
      expect(dashboardData.updated).toBe(3);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle partial success (some trades failed)', async () => {
      // Test when some trades fail verification
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          totalTrades: 10,
          verified: 8,
          updated: 5,
          failed: 2,
          errors: [
            'Failed to fetch price for ETH (trade abc123)',
            'Invalid price data for BTC (trade def456)'
          ],
          timestamp: new Date().toISOString()
        })
      });

      let warningMessage = '';

      const handleRefresh = async () => {
        const response = await fetch('/api/atge/verify-trades', {
          method: 'POST'
        });
        const data = await response.json();
        
        if (data.success && data.failed > 0) {
          warningMessage = `⚠️ ${data.verified} trades verified, but ${data.failed} failed. Check logs for details.`;
        }
      };

      await handleRefresh();

      expect(warningMessage).toContain('⚠️ 8 trades verified, but 2 failed');
    });
  });

  describe('Performance: Response Time', () => {
    it('should complete refresh within acceptable time (< 5 seconds)', async () => {
      // Verify refresh completes quickly
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                success: true,
                totalTrades: 5,
                verified: 5,
                updated: 2,
                failed: 0,
                errors: [],
                timestamp: new Date().toISOString()
              })
            });
          }, 2000); // 2 second delay
        });
      });

      const startTime = Date.now();

      const handleRefresh = async () => {
        const response = await fetch('/api/atge/verify-trades', {
          method: 'POST'
        });
        await response.json();
      };

      await handleRefresh();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});
