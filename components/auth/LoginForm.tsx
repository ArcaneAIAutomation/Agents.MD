import React, { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface LoginFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onSuccess, onError, onSwitchToRegister }: LoginFormProps) {
  const { login, isLoading, csrfToken } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && rateLimitError) {
      setRateLimitError(null);
    }
  }, [countdown, rateLimitError]);

  // Validate individual field
  const validateField = (name: string, value: string | boolean): string => {
    if (name === 'email') {
      const emailValue = value as string;
      if (!emailValue.trim()) {
        return 'Email address is required';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        return 'Please enter a valid email address';
      }
      return '';
    }
    
    if (name === 'password') {
      const passwordValue = value as string;
      if (!passwordValue) {
        return 'Password is required';
      }
      return '';
    }
    
    return '';
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: fieldValue }));
    
    // Clear error for this field when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle blur (field loses focus)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    const emailError = validateField('email', formData.email);
    if (emailError) errors.email = emailError;
    
    const passwordError = validateField('password', formData.password);
    if (passwordError) errors.password = passwordError;
    
    setFieldErrors(errors);
    setTouched({
      email: true,
      password: true,
    });
    
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if rate limited
    if (countdown > 0) {
      return;
    }
    
    // Validate all fields
    if (!validateForm()) {
      return;
    }
    
    try {
      // Call login function from AuthProvider
      await login(formData.email, formData.password, formData.rememberMe);
      
      // Clear form on success
      setFormData({
        email: '',
        password: '',
        rememberMe: false,
      });
      setFieldErrors({});
      setTouched({});
      
      // Call success callback
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      
      // Check if it's a rate limit error
      if (errorMessage.includes('Too many attempts') || errorMessage.includes('rate limit')) {
        setRateLimitError(errorMessage);
        setCountdown(900); // 15 minutes = 900 seconds
      }
      
      // Call error callback
      onError(errorMessage);
    }
  };

  // Format countdown time
  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-bitcoin-black border-2 border-bitcoin-orange">
          <Lock className="w-8 h-8 text-bitcoin-orange" style={{ filter: 'drop-shadow(0 0 10px rgba(247, 147, 26, 0.5))' }} />
        </div>
        <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
          Welcome Back
        </h2>
        <p className="text-bitcoin-white-60 text-sm">
          Sign in to access your account
        </p>
      </div>

      {/* Rate Limit Warning */}
      {rateLimitError && countdown > 0 && (
        <div className="mb-6 p-4 bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-bitcoin-orange flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-bitcoin-orange mb-1">
                Too Many Login Attempts
              </p>
              <p className="text-xs text-bitcoin-white-80 mb-2">
                For security reasons, please wait before trying again.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-bitcoin-orange-10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-bitcoin-orange transition-all duration-1000"
                    style={{ width: `${(countdown / 900) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-bold text-bitcoin-orange">
                  {formatCountdown(countdown)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Hidden CSRF Token Field */}
        {csrfToken && (
          <input type="hidden" name="csrfToken" value={csrfToken} />
        )}
        
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-bitcoin-white-80 mb-2">
            Email Address <span className="text-bitcoin-orange">*</span>
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="your.email@example.com"
              className={`w-full px-4 py-3 bg-bitcoin-black text-bitcoin-white border-2 rounded-lg transition-all duration-300 focus:outline-none ${
                touched.email && fieldErrors.email
                  ? 'border-bitcoin-orange-80'
                  : 'border-bitcoin-orange-20 focus:border-bitcoin-orange'
              }`}
              style={{
                boxShadow: touched.email && fieldErrors.email 
                  ? '0 0 0 3px rgba(247, 147, 26, 0.2)' 
                  : undefined
              }}
              disabled={isLoading || countdown > 0}
              autoComplete="email"
            />
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-bitcoin-white-60" />
          </div>
          {touched.email && fieldErrors.email && (
            <div className="flex items-center gap-1 mt-2 text-bitcoin-orange text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{fieldErrors.email}</span>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-bitcoin-white-80 mb-2">
            Password <span className="text-bitcoin-orange">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your password"
              className={`w-full px-4 py-3 pr-12 bg-bitcoin-black text-bitcoin-white border-2 rounded-lg transition-all duration-300 focus:outline-none ${
                touched.password && fieldErrors.password
                  ? 'border-bitcoin-orange-80'
                  : 'border-bitcoin-orange-20 focus:border-bitcoin-orange'
              }`}
              style={{
                boxShadow: touched.password && fieldErrors.password 
                  ? '0 0 0 3px rgba(247, 147, 26, 0.2)' 
                  : undefined
              }}
              disabled={isLoading || countdown > 0}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-bitcoin-orange hover:text-bitcoin-white transition-colors bg-transparent border-0 p-1"
              tabIndex={-1}
              disabled={isLoading || countdown > 0}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {touched.password && fieldErrors.password && (
            <div className="flex items-center gap-1 mt-2 text-bitcoin-orange text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{fieldErrors.password}</span>
            </div>
          )}
        </div>

        {/* Remember Me Checkbox & Forgot Password */}
        <div className="flex items-center justify-between">
          <label htmlFor="rememberMe" className="flex items-center gap-2 cursor-pointer">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded cursor-pointer accent-bitcoin-orange focus:ring-2 focus:ring-bitcoin-orange focus:ring-offset-2 focus:ring-offset-bitcoin-black"
              disabled={isLoading || countdown > 0}
            />
            <span className="text-sm text-bitcoin-white-80 select-none">
              Remember me for 30 days
            </span>
          </label>
          
          <a
            href="/auth/forgot-password"
            className="text-sm text-bitcoin-orange hover:text-bitcoin-white transition-colors duration-200"
            tabIndex={isLoading || countdown > 0 ? -1 : 0}
          >
            Forgot Password?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || countdown > 0}
          className="btn-bitcoin-primary btn-bitcoin-full mt-6"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-bitcoin-black border-t-transparent rounded-full animate-spin" />
              Signing In...
            </>
          ) : countdown > 0 ? (
            <>
              <Clock className="w-5 h-5" />
              Wait {formatCountdown(countdown)}
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Sign In
            </>
          )}
        </button>

        {/* Switch to Register */}
        <div className="flex flex-col items-center justify-center text-center mt-6">
          <p className="text-sm text-bitcoin-white-60 mb-3">
            Don't have an account?
          </p>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="btn-bitcoin-secondary w-full"
            disabled={isLoading || countdown > 0}
          >
            Create one here
          </button>
        </div>
      </form>
    </div>
  );
}
