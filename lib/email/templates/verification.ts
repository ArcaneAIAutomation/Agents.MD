/**
 * Email Verification Template
 * Bitcoin Sovereign Technology
 * 
 * Generates HTML email for email address verification
 */

interface VerificationEmailOptions {
  email: string;
  verificationUrl: string;
  expiresInHours?: number;
}

/**
 * Generate verification email HTML
 * 
 * @param options Verification email options
 * @returns HTML email content
 */
export function generateVerificationEmail(options: VerificationEmailOptions): string {
  const { email, verificationUrl, expiresInHours = 24 } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Bitcoin Sovereign Technology</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #000000;
      color: #FFFFFF;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      border: 3px solid #F7931A;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #000000;
    }
    .logo-icon {
      font-size: 40px;
      color: #F7931A;
    }
    h1 {
      color: #FFFFFF;
      font-size: 28px;
      font-weight: 800;
      margin: 0 0 10px 0;
      letter-spacing: -0.02em;
    }
    .subtitle {
      color: rgba(255, 255, 255, 0.6);
      font-size: 16px;
      margin: 0;
    }
    .content {
      background-color: #000000;
      border: 2px solid #F7931A;
      border-radius: 12px;
      padding: 40px 30px;
      margin-bottom: 30px;
    }
    .greeting {
      color: #FFFFFF;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 20px 0;
    }
    .message {
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 30px 0;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .verify-button {
      display: inline-block;
      background-color: #F7931A;
      color: #000000;
      text-decoration: none;
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 16px 40px;
      border-radius: 8px;
      box-shadow: 0 0 30px rgba(247, 147, 26, 0.5);
      transition: all 0.3s ease;
    }
    .verify-button:hover {
      background-color: #000000;
      color: #F7931A;
      box-shadow: 0 0 40px rgba(247, 147, 26, 0.7);
    }
    .alternative-link {
      margin-top: 30px;
      padding-top: 30px;
      border-top: 1px solid rgba(247, 147, 26, 0.2);
    }
    .alternative-text {
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      margin: 0 0 10px 0;
    }
    .link-text {
      color: #F7931A;
      font-size: 12px;
      word-break: break-all;
      font-family: 'Roboto Mono', monospace;
    }
    .warning {
      background-color: rgba(247, 147, 26, 0.1);
      border: 1px solid rgba(247, 147, 26, 0.3);
      border-radius: 8px;
      padding: 20px;
      margin-top: 30px;
    }
    .warning-text {
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }
    .footer {
      text-align: center;
      color: rgba(255, 255, 255, 0.4);
      font-size: 12px;
      line-height: 1.6;
      margin-top: 40px;
    }
    .footer-link {
      color: #F7931A;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <span class="logo-icon">🔐</span>
      </div>
      <h1>Verify Your Email</h1>
      <p class="subtitle">Bitcoin Sovereign Technology</p>
    </div>

    <!-- Main Content -->
    <div class="content">
      <p class="greeting">Welcome to Bitcoin Sovereign Technology!</p>
      
      <p class="message">
        Thank you for registering with Bitcoin Sovereign Technology. To complete your registration and access the platform, please verify your email address.
      </p>

      <p class="message">
        Click the button below to verify your email address:
      </p>

      <!-- Verification Button -->
      <div class="button-container">
        <a href="${verificationUrl}" class="verify-button">
          Verify Email Address
        </a>
      </div>

      <!-- Alternative Link -->
      <div class="alternative-link">
        <p class="alternative-text">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p class="link-text">${verificationUrl}</p>
      </div>

      <!-- Warning -->
      <div class="warning">
        <p class="warning-text">
          <strong>⏰ This link will expire in ${expiresInHours} hours.</strong><br>
          If you didn't create an account with Bitcoin Sovereign Technology, please ignore this email.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        © ${new Date().getFullYear()} Bitcoin Sovereign Technology<br>
        Secure Authentication Platform
      </p>
      <p>
        Need help? Contact us at <a href="mailto:support@arcane.group" class="footer-link">support@arcane.group</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of verification email
 * 
 * @param options Verification email options
 * @returns Plain text email content
 */
export function generateVerificationEmailText(options: VerificationEmailOptions): string {
  const { email, verificationUrl, expiresInHours = 24 } = options;

  return `
Bitcoin Sovereign Technology - Verify Your Email

Welcome to Bitcoin Sovereign Technology!

Thank you for registering. To complete your registration and access the platform, please verify your email address.

Verify your email by clicking this link:
${verificationUrl}

This link will expire in ${expiresInHours} hours.

If you didn't create an account with Bitcoin Sovereign Technology, please ignore this email.

---
© ${new Date().getFullYear()} Bitcoin Sovereign Technology
Secure Authentication Platform

Need help? Contact us at support@arcane.group
  `.trim();
}
