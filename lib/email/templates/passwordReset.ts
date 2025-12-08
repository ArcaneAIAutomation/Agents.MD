/**
 * Password Reset Email Template
 * 
 * Generates HTML email for password reset requests.
 */

interface PasswordResetEmailParams {
  email: string;
  resetUrl: string;
  expiresInHours: number;
  platformUrl: string;
}

/**
 * Generate password reset email HTML
 * 
 * @param params - Email parameters
 * @returns HTML email content
 */
export function generatePasswordResetEmail(params: PasswordResetEmailParams): string {
  const { email, resetUrl, expiresInHours, platformUrl } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Bitcoin Sovereign Technology</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #000000;
      color: #FFFFFF;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #F7931A;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      color: #F7931A;
      text-decoration: none;
      letter-spacing: -0.02em;
    }
    .content {
      background: #000000;
      border: 2px solid #F7931A;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
    }
    h1 {
      color: #F7931A;
      font-size: 24px;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 20px;
    }
    p {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 20px;
      font-size: 16px;
    }
    .button {
      display: inline-block;
      background: #F7931A;
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
      background: #FFFFFF;
      color: #000000;
    }
    .warning {
      background: rgba(247, 147, 26, 0.1);
      border: 1px solid rgba(247, 147, 26, 0.3);
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .warning-title {
      color: #F7931A;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .code-block {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(247, 147, 26, 0.2);
      border-radius: 6px;
      padding: 15px;
      font-family: 'Roboto Mono', monospace;
      font-size: 14px;
      color: #F7931A;
      word-break: break-all;
      margin: 15px 0;
    }
    .footer {
      text-align: center;
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(247, 147, 26, 0.2);
    }
    .footer a {
      color: #F7931A;
      text-decoration: none;
    }
    .expiry {
      color: #F7931A;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${platformUrl}" class="logo">₿ Bitcoin Sovereign Technology</a>
    </div>

    <div class="content">
      <h1>🔐 Reset Your Password</h1>
      
      <p>Hello,</p>
      
      <p>We received a request to reset the password for your account (<strong>${email}</strong>).</p>
      
      <p>Click the button below to reset your password:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      
      <div class="code-block">${resetUrl}</div>
      
      <div class="warning">
        <div class="warning-title">⏰ Important:</div>
        <p style="margin: 0;">This password reset link will expire in <span class="expiry">${expiresInHours} hour${expiresInHours > 1 ? 's' : ''}</span>. After that, you'll need to request a new one.</p>
      </div>
      
      <div class="warning">
        <div class="warning-title">🛡️ Security Notice:</div>
        <p style="margin: 0;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged. Someone may have entered your email address by mistake.</p>
      </div>
    </div>

    <div class="footer">
      <p>
        <strong>Bitcoin Sovereign Technology</strong><br>
        Real-time cryptocurrency intelligence and analysis
      </p>
      <p>
        <a href="${platformUrl}">Visit Platform</a> | 
        <a href="${platformUrl}/support">Support</a>
      </p>
      <p style="font-size: 12px; color: rgba(255, 255, 255, 0.4);">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of password reset email
 * 
 * @param params - Email parameters
 * @returns Plain text email content
 */
export function generatePasswordResetEmailText(params: PasswordResetEmailParams): string {
  const { email, resetUrl, expiresInHours, platformUrl } = params;

  return `
Bitcoin Sovereign Technology - Reset Your Password

Hello,

We received a request to reset the password for your account (${email}).

To reset your password, visit this link:
${resetUrl}

IMPORTANT:
- This link will expire in ${expiresInHours} hour${expiresInHours > 1 ? 's' : ''}
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged if you don't use this link

SECURITY NOTICE:
If you didn't request this password reset, someone may have entered your email address by mistake. Your account is still secure.

---
Bitcoin Sovereign Technology
Real-time cryptocurrency intelligence and analysis

Visit: ${platformUrl}
Support: ${platformUrl}/support

This is an automated email. Please do not reply to this message.
  `.trim();
}
