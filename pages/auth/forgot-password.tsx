/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset email.
 */

import { useRouter } from 'next/router';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bitcoin-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ForgotPasswordForm
          onSuccess={() => {
            // Success message is shown in the form
          }}
          onCancel={() => {
            router.push('/auth/login');
          }}
        />
      </div>
    </div>
  );
}
