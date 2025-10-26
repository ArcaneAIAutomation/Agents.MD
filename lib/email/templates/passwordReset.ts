/**
 * Password Reset Email Template
 * 
 * Professional password reset email with Bitcoin Sovereign Technology branding
 * Sent to users when they request a password reset
 * 
 * Design:
 * - Black background (#000000)
 * - Bitcoin orange accents (#F7931A)
 * - Clean, minimalist layout
 * - Mobile-responsive HTML
 * - Security-focused messaging
 */

interface PasswordResetEmailData {
  email: string;
  resetToken: string;
  resetUrl?: string;
  expirationMinutes?: number;
}

/**
 * Generate password reset email HTML with Bitcoin Sovereign branding
 * 
 * @param data Reset data including token and expiration
 * @returns HTML email content
 */
export function generatePasswordResetEmail(data: PasswordResetEmailData): string {
  const baseUrl = data.resetUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://news.arcane.group';
  const resetLink = `${baseUrl}/reset-password?token=${data.resetToken}`;
  const expirationMinutes = data.expirationMinutes || 60;
  const expirationTime = new Date(Date.now() + expirationMinutes * 60 * 1000).toLocaleString();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - Bitcoin Sovereign Technology</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #000000;
      color: #FFFFFF;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #000000;
    }
    .header {
      padding: 40px 20px;
      text-align: center;
      border-bottom: 2px solid #F7931A;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      color: #F7931A;
      text-shadow: 0 0 20px rgba(247, 147, 26, 0.5);
      margin: 0;
      letter-spacing: -0.02em;
    }
    .content {
      padding: 40px 20px;
    }
    .alert-box {
      background-color: rgba(247, 147, 26, 0.1);
      border: 2px solid #F7931A;
      border-radius: 12px;
      padding: 24px;
      margin: 30px 0;
      text-align: center;
    }
    .alert-icon {
      font-size: 48px;
      color: #F7931A;
      margin-bottom: 16px;
    }
    .alert-title {
      font-size: 24px;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0 0 12px 0;
    }
    .alert-message {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
      line-height: 1.6;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.8);
      margin: 0 0 20px 0;
    }
    .button {
      display: inline-block;
      background-color: #F7931A;
      color: #000000;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 20px 0;
      transition: all 0.3s ease;
    }
    .button:hover {
      box-shadow: 0 0 30px rgba(247, 147, 26, 0.5);
    }
    .info-box {
      background-color: #000000;
      border: 1px solid rgba(247, 147, 26, 0.2);
      border-radius: 12px;
      padding: 24px;
      margin: 30px 0;
    }
    .info-title {
      font-size: 18px;
      font-weight: 700;
      color: #F7931A;
      margin: 0 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .info-item {
      margin: 12px 0;
      padding-left: 20px;
      position: relative;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
    }
    .info-item:before {
      content: "₿";
      position: absolute;
      left: 0;
      color: #F7931A;
      font-weight: 700;
    }
    .warning-box {
      background-color: rgba(247, 147, 26, 0.05);
      border-left: 4px solid #F7931A;
      padding: 16px 20px;
      margin: 30px 0;
    }
    .warning-title {
      font-size: 16px;
      font-weight: 700;
      color: #F7931A;
      margin: 0 0 8px 0;
    }
    .warning-text {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
      line-height: 1.6;
    }
    .code-box {
      background-color: rgba(247, 147, 26, 0.05);
      border: 1px solid rgba(247, 147, 26, 0.2);
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
      font-family: 'Roboto Mono', monospace;
      font-size: 14px;
      color: #F7931A;
      word-break: break-all;
      text-align: center;
    }
    .footer {
      padding: 30px 20px;
      text-align: center;
      border-top: 1px solid rgba(247, 147, 26, 0.2);
      margin-top: 40px;
    }
    .footer-text {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      margin: 8px 0;
    }
    .divider {
      height: 1px;
      background-color: rgba(247, 147, 26, 0.2);
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 16px;
      }
      .alert-title {
        font-size: 20px;
      }
      .message {
        font-size: 14px;
      }
      .button {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1 class="logo">BITCOIN SOVEREIGN TECHNOLOGY</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Alert Box -->
      <div class="alert-box">
        <div class="alert-icon">🔐</div>
        <h2 class="alert-title">Password Reset Request</h2>
        <p class="alert-message">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
      </div>

      <p class="message">
        A password reset was requested for the account associated with <strong>${data.email}</strong>.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>

      <p class="message" style="text-align: center; margin-top: 20px;">
        Or copy and paste this link into your browser:
      </p>

      <div class="code-box">
        ${resetLink}
      </div>

      <div class="divider"></div>

      <!-- Security Information -->
      <div class="info-box">
        <h3 class="info-title">Security Information</h3>
        <div class="info-item">
          <strong>Requested for:</strong> ${data.email}
        </div>
        <div class="info-item">
          <strong>Expires:</strong> ${expirationTime}
        </div>
        <div class="info-item">
          <strong>Valid for:</strong> ${expirationMinutes} minutes
        </div>
        <div class="info-item">
          <strong>One-time use:</strong> Link becomes invalid after use
        </div>
      </div>

      <!-- Warning Box -->
      <div class="warning-box">
        <div class="warning-title">⚠️ Important Security Notice</div>
        <p class="warning-text">
          If you did not request a password reset, please ignore this email and your password will remain unchanged. 
          Your account security has not been compromised.
        </p>
      </div>

      <div class="divider"></div>

      <!-- Best Practices -->
      <div class="info-box">
        <h3 class="info-title">Password Best Practices</h3>
        <div class="info-item">
          Use at least 8 characters
        </div>
        <div class="info-item">
          Include uppercase and lowercase letters
        </div>
        <div class="info-item">
          Include at least one number
        </div>
        <div class="info-item">
          Avoid common words or patterns
        </div>
        <div class="info-item">
          Don't reuse passwords from other accounts
        </div>
      </div>

      <p class="message" style="margin-top: 30px;">
        If you have any questions or concerns about your account security, please contact our support team immediately.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        <strong>Bitcoin Sovereign Technology</strong>
      </p>
      <p class="footer-text">
        Advanced Cryptocurrency Trading Intelligence
      </p>
      <p class="footer-text">
        ${baseUrl}
      </p>
      <p class="footer-text" style="margin-top: 20px;">
        This is an automated security message. Please do not reply to this email.
      </p>
      <p class="footer-text">
        © ${new Date().getFullYear()} Bitcoin Sovereign Technology. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of password reset email
 * Fallback for email clients that don't support HTML
 * 
 * @param data Reset data including token and expiration
 * @returns Plain text email content
 */
export function generatePasswordResetEmailText(data: PasswordResetEmailData): string {
  const baseUrl = data.resetUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://news.arcane.group';
  const resetLink = `${baseUrl}/reset-password?token=${data.resetToken}`;
  const expirationMinutes = data.expirationMinutes || 60;
  const expirationTime = new Date(Date.now() + expirationMinutes * 60 * 1000).toLocaleString();
  
  return `
BITCOIN SOVEREIGN TECHNOLOGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 PASSWORD RESET REQUEST

We received a request to reset your password. Use the link below to create a new password.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A password reset was requested for the account associated with ${data.email}.

RESET YOUR PASSWORD:
${resetLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECURITY INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

₿ Requested for: ${data.email}
₿ Expires: ${expirationTime}
₿ Valid for: ${expirationMinutes} minutes
₿ One-time use: Link becomes invalid after use

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ IMPORTANT SECURITY NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you did not request a password reset, please ignore this email and your password will remain unchanged. Your account security has not been compromised.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSWORD BEST PRACTICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

₿ Use at least 8 characters
₿ Include uppercase and lowercase letters
₿ Include at least one number
₿ Avoid common words or patterns
₿ Don't reuse passwords from other accounts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you have any questions or concerns about your account security, please contact our support team immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bitcoin Sovereign Technology
Advanced Cryptocurrency Trading Intelligence
${baseUrl}

This is an automated security message. Please do not reply to this email.
© ${new Date().getFullYear()} Bitcoin Sovereign Technology. All rights reserved.
  `.trim();
}
