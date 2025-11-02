/**
 * Email Verification Page
 * Handles email verification via token from email link
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, AlertCircle, Loader, ArrowRight } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token } = router.query;
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'already-verified'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!token) return;

    // Verify the email token
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus(data.message.includes('already') ? 'already-verified' : 'success');
          setMessage(data.message);
          setEmail(data.email || '');
          
          // Start countdown to redirect
          let count = 5;
          const interval = setInterval(() => {
            count--;
            setCountdown(count);
            if (count === 0) {
              clearInterval(interval);
              router.push('/');
            }
          }, 1000);
          
          return () => clearInterval(interval);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-bitcoin-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-bitcoin-black border-2 border-bitcoin-orange">
            {status === 'verifying' && (
              <Loader className="w-10 h-10 text-bitcoin-orange animate-spin" />
            )}
            {(status === 'success' || status === 'already-verified') && (
              <CheckCircle className="w-10 h-10 text-bitcoin-orange" style={{ filter: 'drop-shadow(0 0 20px rgba(247, 147, 26, 0.5))' }} />
            )}
            {status === 'error' && (
              <AlertCircle className="w-10 h-10 text-bitcoin-orange" />
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-bitcoin-white mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Bitcoin Sovereign Technology
          </h1>
          <p className="text-lg text-bitcoin-white-60">
            Email Verification
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 mb-6">
          {/* Verifying State */}
          {status === 'verifying' && (
            <div className="text-center">
              <Loader className="w-12 h-12 text-bitcoin-orange mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-bitcoin-white mb-3">
                Verifying Your Email
              </h2>
              <p className="text-bitcoin-white-80">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-bitcoin-orange mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 30px rgba(247, 147, 26, 0.5))' }} />
              <h2 className="text-2xl font-bold text-bitcoin-white mb-3">
                Email Verified Successfully!
              </h2>
              <p className="text-bitcoin-white-80 mb-6">
                {message}
              </p>
              
              {email && (
                <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-bitcoin-white-60 mb-1">Verified Email:</p>
                  <p className="text-bitcoin-orange font-mono font-semibold">{email}</p>
                </div>
              )}

              <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4 mb-6">
                <p className="text-sm text-bitcoin-white-80 text-left">
                  <strong className="text-bitcoin-orange">✅ Your Account is Now Active!</strong><br /><br />
                  <strong>What's Next:</strong><br />
                  1. Click the "Go to Login" button below<br />
                  2. Enter your email address: <span className="text-bitcoin-orange font-mono">{email}</span><br />
                  3. Enter the password you created during registration<br />
                  4. Click "Login" to access the platform<br /><br />
                  <strong className="text-bitcoin-orange">✅ Full Platform Access Granted</strong>
                </p>
              </div>

              <div className="bg-bitcoin-black border border-bitcoin-orange rounded-lg p-4 mb-6">
                <p className="text-xs text-bitcoin-white-60 text-center">
                  <strong className="text-bitcoin-white">Security Note:</strong><br />
                  Your email has been verified and your account is now secure.<br />
                  You can now access all platform features.
                </p>
              </div>

              <p className="text-sm text-bitcoin-white-60 mb-4">
                Redirecting to login in {countdown} seconds...
              </p>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-4 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px] flex items-center justify-center gap-3"
              >
                <span>Go to Login Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Already Verified State */}
          {status === 'already-verified' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-bitcoin-orange mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-bitcoin-white mb-3">
                Email Already Verified
              </h2>
              <p className="text-bitcoin-white-80 mb-6">
                {message}
              </p>

              {email && (
                <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-bitcoin-white-60 mb-1">Your Email:</p>
                  <p className="text-bitcoin-orange font-mono font-semibold">{email}</p>
                </div>
              )}

              <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4 mb-6">
                <p className="text-sm text-bitcoin-white-80 text-left">
                  <strong className="text-bitcoin-orange">✅ Your Account is Active</strong><br /><br />
                  <strong>To Access the Platform:</strong><br />
                  1. Click the "Go to Login" button below<br />
                  2. Enter your email address{email && `: ${email}`}<br />
                  3. Enter your password<br />
                  4. Click "Login" to access your account
                </p>
              </div>

              <p className="text-sm text-bitcoin-white-60 mb-4">
                Redirecting to login in {countdown} seconds...
              </p>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-4 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px] flex items-center justify-center gap-3"
              >
                <span>Go to Login Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-bitcoin-orange mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-bitcoin-white mb-3">
                Verification Failed
              </h2>
              <p className="text-bitcoin-white-80 mb-6">
                {message}
              </p>

              <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4 mb-6">
                <p className="text-sm text-bitcoin-white-80 text-left">
                  <strong>Common reasons:</strong><br />
                  • Verification link expired (24 hours)<br />
                  • Link already used<br />
                  • Invalid or corrupted link
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-4 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px]"
                >
                  Request New Verification Email
                </button>

                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:scale-105 active:scale-95 min-h-[48px]"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-bitcoin-white-60">
            © 2025 Bitcoin Sovereign Technology • Secure Authentication Platform
          </p>
        </div>
      </div>
    </div>
  );
}
