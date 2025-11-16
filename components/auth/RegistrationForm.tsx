import React, { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface RegistrationFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  onSwitchToLogin: () => void;
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
  };
}

export default function RegistrationForm({ onSuccess, onError, onSwitchToLogin }: RegistrationFormProps) {
  const { register, isLoading, csrfToken } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    accessCode: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Too weak',
    color: 'var(--bitcoin-white-60)',
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
    },
  });

  // Calculate password strength in real-time
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength({
        score: 0,
        label: 'Too weak',
        color: 'var(--bitcoin-white-60)',
        requirements: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
        },
      });
      return;
    }

    const requirements = {
      length: formData.password.length >= 8,
      uppercase: /[A-Z]/.test(formData.password),
      lowercase: /[a-z]/.test(formData.password),
      number: /[0-9]/.test(formData.password),
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;
    
    let score = 0;
    let label = 'Too weak';
    let color = 'var(--bitcoin-white-60)';

    if (metRequirements === 1) {
      score = 1;
      label = 'Weak';
      color = 'var(--bitcoin-orange-50)';
    } else if (metRequirements === 2) {
      score = 2;
      label = 'Fair';
      color = 'var(--bitcoin-orange-80)';
    } else if (metRequirements === 3) {
      score = 3;
      label = 'Good';
      color = 'var(--bitcoin-orange)';
    } else if (metRequirements === 4) {
      score = 4;
      label = 'Strong';
      color: 'var(--bitcoin-orange)';
    }

    setPasswordStrength({ score, label, color, requirements });
  }, [formData.password]);

  // Validate individual field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'accessCode':
        if (!value.trim()) {
          return 'Access code is required';
        }
        if (value.trim().length !== 8 && !value.includes('-')) {
          return 'Access code must be 8 characters or in format BTC-SOVEREIGN-XXXXXX-XX';
        }
        return '';
      
      case 'email':
        if (!value.trim()) {
          return 'Email address is required';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address';
        }
        return '';
      
      case 'password':
        if (!value) {
          return 'Password is required';
        }
        if (value.length < 8) {
          return 'Password must be at least 8 characters';
        }
        if (!/[A-Z]/.test(value)) {
          return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(value)) {
          return 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(value)) {
          return 'Password must contain at least one number';
        }
        return '';
      
      case 'confirmPassword':
        if (!value) {
          return 'Please confirm your password';
        }
        if (value !== formData.password) {
          return 'Passwords do not match';
        }
        return '';
      
      default:
        return '';
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        errors[key] = error;
      }
    });
    
    setFieldErrors(errors);
    setTouched({
      accessCode: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (!validateForm()) {
      return;
    }
    
    try {
      // Call register function from AuthProvider
      await register(formData);
      
      // Clear form on success
      setFormData({
        accessCode: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      setFieldErrors({});
      setTouched({});
      
      // Call success callback
      onSuccess();
    } catch (error) {
      // Error is already set in AuthProvider, just call error callback
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      onError(errorMessage);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-bitcoin-black border-2 border-bitcoin-orange">
          <Lock className="w-8 h-8 text-bitcoin-orange" style={{ filter: 'drop-shadow(0 0 10px rgba(247, 147, 26, 0.5))' }} />
        </div>
        <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
          Create Your Account
        </h2>
        <p className="text-bitcoin-white-60 text-sm">
          Enter your access code and create your credentials
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Hidden CSRF Token Field */}
        {csrfToken && (
          <input type="hidden" name="csrfToken" value={csrfToken} />
        )}
        
        {/* Access Code Field */}
        <div>
          <label htmlFor="accessCode" className="block text-sm font-semibold text-bitcoin-white-80 mb-2">
            Access Code <span className="text-bitcoin-orange">*</span>
          </label>
          <div className="relative">
            <input
              id="accessCode"
              name="accessCode"
              type="text"
              value={formData.accessCode}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your access code"
              className={`w-full px-4 py-3 bg-bitcoin-black text-bitcoin-white border-2 rounded-lg transition-all duration-300 focus:outline-none ${
                touched.accessCode && fieldErrors.accessCode
                  ? 'border-bitcoin-orange-80'
                  : 'border-bitcoin-orange-20 focus:border-bitcoin-orange'
              }`}
              style={{
                boxShadow: touched.accessCode && fieldErrors.accessCode 
                  ? '0 0 0 3px rgba(247, 147, 26, 0.2)' 
                  : undefined
              }}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
          {touched.accessCode && fieldErrors.accessCode && (
            <div className="flex items-center gap-1 mt-2 text-bitcoin-orange text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{fieldErrors.accessCode}</span>
            </div>
          )}
        </div>

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
              disabled={isLoading}
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
              placeholder="Create a strong password"
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
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-bitcoin-orange hover:text-bitcoin-white transition-colors bg-transparent border-0 p-1"
              tabIndex={-1}
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
          
          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-bitcoin-white-60">
                  Password Strength:
                </span>
                <span 
                  className="text-xs font-bold"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.label}
                </span>
              </div>
              
              {/* Strength Bar */}
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: level <= passwordStrength.score 
                        ? passwordStrength.color 
                        : 'var(--bitcoin-orange-10)'
                    }}
                  />
                ))}
              </div>
              
              {/* Requirements Checklist */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  {passwordStrength.requirements.length ? (
                    <CheckCircle className="w-3 h-3 text-bitcoin-orange" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-bitcoin-white-60" />
                  )}
                  <span className={passwordStrength.requirements.length ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {passwordStrength.requirements.uppercase ? (
                    <CheckCircle className="w-3 h-3 text-bitcoin-orange" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-bitcoin-white-60" />
                  )}
                  <span className={passwordStrength.requirements.uppercase ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}>
                    One uppercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {passwordStrength.requirements.lowercase ? (
                    <CheckCircle className="w-3 h-3 text-bitcoin-orange" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-bitcoin-white-60" />
                  )}
                  <span className={passwordStrength.requirements.lowercase ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}>
                    One lowercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {passwordStrength.requirements.number ? (
                    <CheckCircle className="w-3 h-3 text-bitcoin-orange" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-bitcoin-white-60" />
                  )}
                  <span className={passwordStrength.requirements.number ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}>
                    One number
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-bitcoin-white-80 mb-2">
            Confirm Password <span className="text-bitcoin-orange">*</span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Re-enter your password"
              className={`w-full px-4 py-3 pr-12 bg-bitcoin-black text-bitcoin-white border-2 rounded-lg transition-all duration-300 focus:outline-none ${
                touched.confirmPassword && fieldErrors.confirmPassword
                  ? 'border-bitcoin-orange-80'
                  : 'border-bitcoin-orange-20 focus:border-bitcoin-orange'
              }`}
              style={{
                boxShadow: touched.confirmPassword && fieldErrors.confirmPassword 
                  ? '0 0 0 3px rgba(247, 147, 26, 0.2)' 
                  : undefined
              }}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-bitcoin-orange hover:text-bitcoin-white transition-colors bg-transparent border-0 p-1"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {touched.confirmPassword && fieldErrors.confirmPassword && (
            <div className="flex items-center gap-1 mt-2 text-bitcoin-orange text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{fieldErrors.confirmPassword}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-bitcoin-primary btn-bitcoin-full mt-6"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-bitcoin-black border-t-transparent rounded-full animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Create Account
            </>
          )}
        </button>

        {/* Switch to Login */}
        <div className="text-center mt-6">
          <p className="text-sm text-bitcoin-white-60 mb-3">
            Already have an account?
          </p>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="btn-bitcoin-secondary w-full"
            disabled={isLoading}
          >
            Sign in here
          </button>
        </div>
      </form>
    </div>
  );
}
