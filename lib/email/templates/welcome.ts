/**
 * Welcome Email Template
 * 
 * Professional welcome email with Bitcoin Sovereign Technology branding
 * Sent to users after successful registration
 * 
 * Design:
 * - Black background (#000000)
 * - Bitcoin orange accents (#F7931A)
 * - Clean, minimalist layout
 * - Mobile-responsive HTML
 */

interface WelcomeEmailData {
  email: string;
  platformUrl?: string;
  verificationUrl?: string;
  expiresInHours?: number;
}

/**
 * Generate welcome email HTML with Bitcoin Sovereign branding
 * 
 * @param data User data for personalization
 * @returns HTML email content
 */
export function generateWelcomeEmail(data: WelcomeEmailData): string {
  const platformUrl = data.platformUrl || 'https://news.arcane.group';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Bitcoin Sovereign Technology</title>
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
    .greeting {
      font-size: 24px;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0 0 20px 0;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.8);
      margin: 0 0 30px 0;
    }
    .info-box {
      background-color: #000000;
      border: 1px solid #F7931A;
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
    }
    .info-item:before {
      content: "₿";
      position: absolute;
      left: 0;
      color: #F7931A;
      font-weight: 700;
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
    .features {
      margin: 30px 0;
    }
    .feature {
      margin: 20px 0;
      padding: 16px;
      border-left: 3px solid #F7931A;
      background-color: rgba(247, 147, 26, 0.05);
    }
    .feature-title {
      font-size: 16px;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0 0 8px 0;
    }
    .feature-desc {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
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
      .greeting {
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
      <h2 class="greeting">Welcome to the Platform</h2>
      
      <p class="message">
        Your account has been successfully created. ${data.verificationUrl ? 'To complete your registration and access the platform, please verify your email address using the button below.' : 'You now have access to the most advanced cryptocurrency trading intelligence platform available.'}
      </p>

      <!-- Account Info -->
      <div class="info-box">
        <h3 class="info-title">Your Account Details</h3>
        <div class="info-item">
          <strong>Email:</strong> ${data.email}
        </div>
        <div class="info-item">
          <strong>Platform:</strong> Bitcoin Sovereign Technology
        </div>
        <div class="info-item">
          <strong>Status:</strong> Active
        </div>
      </div>

      ${data.verificationUrl ? `
      <!-- Email Verification Required -->
      <div class="info-box" style="border-color: #F7931A; background-color: rgba(247, 147, 26, 0.1);">
        <h3 class="info-title" style="color: #F7931A;">⚠️ Action Required: Verify Your Email</h3>
        <p class="message" style="margin-bottom: 20px;">
          Before you can access the platform, please verify your email address by clicking the button below.
        </p>
        <div style="text-align: center;">
          <a href="${data.verificationUrl}" class="button" style="background-color: #F7931A; color: #000000;">
            Verify Email Address
          </a>
        </div>
        <p class="message" style="margin-top: 20px; font-size: 14px; color: rgba(255, 255, 255, 0.6);">
          This verification link will expire in ${data.expiresInHours || 24} hours.
        </p>
        <p class="message" style="font-size: 14px; color: rgba(255, 255, 255, 0.6);">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <span style="color: #F7931A; word-break: break-all;">${data.verificationUrl}</span>
        </p>
      </div>
      ` : `
      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${platformUrl}" class="button">Access Platform</a>
      </div>
      `}

      <div class="divider"></div>

      <!-- Features -->
      <div class="features">
        <h3 class="info-title">What You Get</h3>
        
        <div class="feature">
          <div class="feature-title">Real-Time Market Intelligence</div>
          <div class="feature-desc">
            Live Bitcoin and Ethereum analysis with technical indicators, trading zones, and market sentiment
          </div>
        </div>

        <div class="feature">
          <div class="feature-title">AI-Powered Trade Signals</div>
          <div class="feature-desc">
            GPT-4o generated trading signals with step-by-step reasoning and risk management
          </div>
        </div>

        <div class="feature">
          <div class="feature-title">Whale Watch Intelligence</div>
          <div class="feature-desc">
            Track large Bitcoin transactions with AI analysis of market impact and trader behavior
          </div>
        </div>

        <div class="feature">
          <div class="feature-title">Crypto News Wire</div>
          <div class="feature-desc">
            Real-time cryptocurrency news aggregation with sentiment analysis
          </div>
        </div>

        <div class="feature">
          <div class="feature-title">Regulatory Updates</div>
          <div class="feature-desc">
            Stay informed about cryptocurrency regulatory changes and compliance requirements
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Getting Started -->
      <div class="info-box">
        <h3 class="info-title">Getting Started</h3>
        <div class="info-item">
          Log in with your email and password
        </div>
        <div class="info-item">
          Explore the Bitcoin and Ethereum market reports
        </div>
        <div class="info-item">
          Check out the AI Trade Generation Engine
        </div>
        <div class="info-item">
          Monitor whale transactions in real-time
        </div>
        <div class="info-item">
          Stay updated with the Crypto News Wire
        </div>
      </div>

      <p class="message">
        If you have any questions or need assistance, our support team is here to help.
      </p>

      <p class="message" style="margin-top: 30px;">
        <strong>Welcome to the future of cryptocurrency intelligence.</strong>
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
        ${platformUrl}
      </p>
      <p class="footer-text" style="margin-top: 20px;">
        This is an automated message. Please do not reply to this email.
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
 * Generate plain text version of welcome email
 * Fallback for email clients that don't support HTML
 * 
 * @param data User data for personalization
 * @returns Plain text email content
 */
export function generateWelcomeEmailText(data: WelcomeEmailData): string {
  const platformUrl = data.platformUrl || 'https://news.arcane.group';
  
  return `
BITCOIN SOVEREIGN TECHNOLOGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WELCOME TO THE PLATFORM

Your account has been successfully created. ${data.verificationUrl ? 'To complete your registration and access the platform, please verify your email address using the link below.' : 'You now have access to the most advanced cryptocurrency trading intelligence platform available.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ACCOUNT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

₿ Email: ${data.email}
₿ Platform: Bitcoin Sovereign Technology
₿ Status: ${data.verificationUrl ? 'Pending Verification' : 'Active'}

${data.verificationUrl ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ ACTION REQUIRED: VERIFY YOUR EMAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before you can access the platform, please verify your email address by clicking the link below:

${data.verificationUrl}

This verification link will expire in ${data.expiresInHours || 24} hours.

` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT YOU GET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

₿ Real-Time Market Intelligence
  Live Bitcoin and Ethereum analysis with technical indicators, trading zones, and market sentiment

₿ AI-Powered Trade Signals
  GPT-4o generated trading signals with step-by-step reasoning and risk management

₿ Whale Watch Intelligence
  Track large Bitcoin transactions with AI analysis of market impact and trader behavior

₿ Crypto News Wire
  Real-time cryptocurrency news aggregation with sentiment analysis

₿ Regulatory Updates
  Stay informed about cryptocurrency regulatory changes and compliance requirements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GETTING STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

₿ Log in with your email and password
₿ Explore the Bitcoin and Ethereum market reports
₿ Check out the AI Trade Generation Engine
₿ Monitor whale transactions in real-time
₿ Stay updated with the Crypto News Wire

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Access the platform: ${platformUrl}

If you have any questions or need assistance, our support team is here to help.

Welcome to the future of cryptocurrency intelligence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bitcoin Sovereign Technology
Advanced Cryptocurrency Trading Intelligence
${platformUrl}

This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Bitcoin Sovereign Technology. All rights reserved.
  `.trim();
}
