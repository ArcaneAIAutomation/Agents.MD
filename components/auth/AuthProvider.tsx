import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// User interface
interface User {
  id: string;
  email: string;
  createdAt: string;
}

// Registration form data interface
interface RegistrationFormData {
  accessCode: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Auth context value interface
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  csrfToken: string | null;
  pendingVerificationEmail: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegistrationFormData) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  fetchCsrfToken: () => Promise<string | null>;
  resendVerification: (email: string) => Promise<void>;
  clearPendingVerification: () => void;
}

// Create the context with undefined default value
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// AuthProvider props
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  // Computed property for authentication status
  const isAuthenticated = user !== null;

  // Fetch CSRF token
  const fetchCsrfToken = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/auth/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.csrfToken) {
          setCsrfToken(data.csrfToken);
          return data.csrfToken;
        }
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err);
      return null;
    }
  };

  // Check authentication status and fetch CSRF token on mount
  // DISABLED: No automatic auth check - users must login every time
  useEffect(() => {
    const initialize = async () => {
      await fetchCsrfToken();
      // Do NOT check auth automatically - force fresh login every time
      setIsLoading(false);
      setUser(null);
    };
    initialize();
  }, []);

  // Check if user is authenticated by calling /api/auth/me
  // This is now only called manually, not automatically on mount
  const checkAuth = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache control to prevent caching
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        // Not authenticated or token expired
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
      // Don't set error for auth check failures (silent)
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure we have a CSRF token
      let token = csrfToken;
      if (!token) {
        token = await fetchCsrfToken();
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token || '',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        setError(null);
      } else {
        setError(data.message || 'Login failed. Please try again.');
        throw new Error(data.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure we have a CSRF token
      let token = csrfToken;
      if (!token) {
        token = await fetchCsrfToken();
      }

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token || '',
        },
      });

      const data = await response.json();

      // Always clear user state, even if API call fails
      setUser(null);
      setError(null);
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear session storage
        sessionStorage.clear();
        // Clear local storage (if any auth data is stored there)
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }

      if (!response.ok || !data.success) {
        console.warn('Logout API call failed, but user state cleared:', data.message);
      }
    } catch (err) {
      // Even on error, ensure user is logged out locally
      setUser(null);
      setError(null);
      console.error('Logout error, but user state cleared:', err);
    } finally {
      setIsLoading(false);
      // Force a page reload to ensure clean state
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  // Register function
  const register = async (data: RegistrationFormData): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Ensure we have a CSRF token
      let token = csrfToken;
      if (!token) {
        token = await fetchCsrfToken();
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token || '',
        },
        body: JSON.stringify({
          accessCode: data.accessCode,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        // Check if email verification is required
        if (responseData.requiresVerification) {
          setPendingVerificationEmail(data.email);
          setUser(null); // Don't set user until verified
        } else {
          setUser(responseData.user);
        }
        setError(null);
      } else {
        setError(responseData.message || 'Registration failed. Please try again.');
        throw new Error(responseData.message || 'Registration failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error function
  const clearError = (): void => {
    setError(null);
  };

  // Resend verification email
  const resendVerification = async (email: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to resend verification email');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend verification email';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear pending verification
  const clearPendingVerification = (): void => {
    setPendingVerificationEmail(null);
  };

  // Context value
  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    csrfToken,
    pendingVerificationEmail,
    login,
    logout,
    register,
    checkAuth,
    clearError,
    fetchCsrfToken,
    resendVerification,
    clearPendingVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export the context for advanced use cases
export { AuthContext };
