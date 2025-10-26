/**
 * Office 365 Email Utility
 * 
 * Provides email sending functionality using Microsoft Graph API
 * with Azure AD authentication for Office 365 email delivery.
 * 
 * Features:
 * - Azure AD client credentials authentication
 * - Microsoft Graph API integration
 * - Retry logic with exponential backoff
 * - Non-blocking async email sending
 * - Comprehensive error handling
 * - HTML and plain text email support
 */

interface AzureTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  contentType?: 'Text' | 'HTML';
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

interface SendEmailResult {
  success: boolean;
  error?: string;
  timestamp: Date;
}

// Token cache to avoid unnecessary authentication requests
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get Azure AD access token for Microsoft Graph API
 * Uses client credentials flow with token caching
 * 
 * @returns Access token for Microsoft Graph API
 * @throws Error if authentication fails or credentials are missing
 */
async function getAzureAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 minute buffer)
  const now = Date.now();
  if (cachedToken && tokenExpiry > now + 300000) {
    return cachedToken;
  }

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Azure credentials not configured. Please set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET environment variables.');
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get Azure access token: ${response.status} ${error}`);
    }

    const data: AzureTokenResponse = await response.json();
    
    // Cache token with expiry time
    cachedToken = data.access_token;
    tokenExpiry = now + (data.expires_in * 1000);
    
    return data.access_token;
  } catch (error) {
    console.error('Azure AD authentication error:', error);
    throw new Error(`Azure AD authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Send email using Microsoft Graph API with retry logic
 * 
 * @param options Email options including recipient, subject, body, etc.
 * @param retryCount Current retry attempt (internal use)
 * @returns Promise resolving to send result
 */
async function sendEmailWithRetry(
  options: EmailOptions,
  retryCount: number = 0
): Promise<SendEmailResult> {
  const maxRetries = 3;
  const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s

  try {
    const accessToken = await getAzureAccessToken();
    const fromEmail = process.env.SENDER_EMAIL || 'no-reply@arcane.group';

    if (!fromEmail) {
      throw new Error('SENDER_EMAIL environment variable not configured');
    }

    const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`;
    
    // Build email message
    const message = {
      message: {
        subject: options.subject,
        body: {
          contentType: options.contentType || 'HTML',
          content: options.body
        },
        toRecipients: [
          {
            emailAddress: {
              address: options.to
            }
          }
        ],
        ...(options.replyTo && {
          replyTo: [
            {
              emailAddress: {
                address: options.replyTo
              }
            }
          ]
        }),
        ...(options.cc && options.cc.length > 0 && {
          ccRecipients: options.cc.map(email => ({
            emailAddress: { address: email }
          }))
        }),
        ...(options.bcc && options.bcc.length > 0 && {
          bccRecipients: options.bcc.map(email => ({
            emailAddress: { address: email }
          }))
        })
      },
      saveToSentItems: true
    };

    const response = await fetch(graphEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      const error = await response.text();
      
      // Retry on server errors (5xx) or rate limiting (429)
      if ((response.status >= 500 || response.status === 429) && retryCount < maxRetries) {
        console.warn(`Email send failed (${response.status}), retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return sendEmailWithRetry(options, retryCount + 1);
      }
      
      throw new Error(`Failed to send email via Graph API: ${response.status} ${error}`);
    }

    return {
      success: true,
      timestamp: new Date()
    };

  } catch (error) {
    // Retry on network errors
    if (retryCount < maxRetries && error instanceof Error && 
        (error.message.includes('fetch') || error.message.includes('network'))) {
      console.warn(`Email send error, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return sendEmailWithRetry(options, retryCount + 1);
    }

    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
}

/**
 * Send email using Office 365 via Microsoft Graph API
 * Non-blocking async function with automatic retry logic
 * 
 * @param options Email options
 * @returns Promise resolving to send result
 * 
 * @example
 * ```typescript
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome to Bitcoin Sovereign',
 *   body: '<h1>Welcome!</h1><p>Your account is ready.</p>',
 *   contentType: 'HTML'
 * });
 * 
 * if (result.success) {
 *   console.log('Email sent successfully');
 * } else {
 *   console.error('Email failed:', result.error);
 * }
 * ```
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  // Validate required fields
  if (!options.to || !options.subject || !options.body) {
    return {
      success: false,
      error: 'Missing required fields: to, subject, and body are required',
      timestamp: new Date()
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(options.to)) {
    return {
      success: false,
      error: 'Invalid email address format',
      timestamp: new Date()
    };
  }

  return sendEmailWithRetry(options);
}

/**
 * Send email without waiting for result (fire and forget)
 * Useful for non-critical emails that shouldn't block the main flow
 * 
 * @param options Email options
 * @returns void (logs errors but doesn't throw)
 * 
 * @example
 * ```typescript
 * // Send welcome email without blocking registration
 * sendEmailAsync({
 *   to: user.email,
 *   subject: 'Welcome!',
 *   body: welcomeEmailTemplate(user)
 * });
 * 
 * // Registration continues immediately
 * return res.status(200).json({ success: true });
 * ```
 */
export function sendEmailAsync(options: EmailOptions): void {
  sendEmail(options)
    .then(result => {
      if (result.success) {
        console.log(`Email sent successfully to ${options.to} at ${result.timestamp.toISOString()}`);
      } else {
        console.error(`Email failed to ${options.to}:`, result.error);
      }
    })
    .catch(error => {
      console.error('Unexpected error in sendEmailAsync:', error);
    });
}

export type { EmailOptions, SendEmailResult };
