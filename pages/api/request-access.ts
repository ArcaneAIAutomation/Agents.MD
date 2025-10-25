import type { NextApiRequest, NextApiResponse } from 'next';

interface AccessRequest {
  email: string;
  telegram: string;
  twitter: string;
  message?: string;
}

interface AzureTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Get Azure AD access token for Microsoft Graph API
async function getAzureAccessToken(): Promise<string> {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Azure credentials not configured');
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Azure access token: ${error}`);
  }

  const data: AzureTokenResponse = await response.json();
  return data.access_token;
}

// Send email using Microsoft Graph API
async function sendEmailViaGraph(
  accessToken: string,
  from: string,
  to: string,
  subject: string,
  body: string,
  replyTo?: string
): Promise<void> {
  const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${from}/sendMail`;
  
  const message = {
    message: {
      subject: subject,
      body: {
        contentType: 'Text',
        content: body
      },
      toRecipients: [
        {
          emailAddress: {
            address: to
          }
        }
      ],
      ...(replyTo && {
        replyTo: [
          {
            emailAddress: {
              address: replyTo
            }
          }
        ]
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
    throw new Error(`Failed to send email via Graph API: ${error}`);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, telegram, twitter, message }: AccessRequest = req.body;

    // Validate required fields
    if (!email || !telegram || !twitter) {
      return res.status(400).json({ 
        message: 'Email, Telegram, and Twitter/X account are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email address format' 
      });
    }

    // Validate Telegram format
    if (!telegram.startsWith('@')) {
      return res.status(400).json({ 
        message: 'Telegram handle must start with @' 
      });
    }

    // Validate Twitter format
    if (!twitter.startsWith('@')) {
      return res.status(400).json({ 
        message: 'Twitter/X handle must start with @' 
      });
    }

    // Get Azure access token
    const accessToken = await getAzureAccessToken();
    
    // Email sender (must be a valid Office 365 mailbox)
    const fromEmail = process.env.SENDER_EMAIL || 'no-reply@arcane.group';
    
    // Create admin notification email content
    const adminEmailContent = `
New Early Access Request - Bitcoin Sovereign Technology

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPLICANT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email Address: ${email}
Telegram: ${telegram}
Twitter/X: ${twitter}

${message ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE FROM APPLICANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${message}

` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBMISSION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Timestamp: ${new Date().toISOString()}
IP Address: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown'}
User Agent: ${req.headers['user-agent'] || 'Unknown'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated message from Bitcoin Sovereign Technology Early Access System.
    `.trim();

    // Create confirmation email content
    const confirmationEmailContent = `
Hello,

Thank you for your interest in Bitcoin Sovereign Technology!

We've received your early access application and will review it shortly. Our team will get back to you via email with further instructions.

Your Application Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: ${email}
Telegram: ${telegram}
Twitter/X: ${twitter}
Submitted: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What happens next?
1. Our team will review your application
2. You'll receive an access code via email (typically within 24-48 hours)
3. Use the access code to unlock the platform

In the meantime, feel free to follow us on Twitter/X for updates and announcements.

Best regards,
Bitcoin Sovereign Technology Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message. Please do not reply to this email.
For support, contact us through our official channels.
    `.trim();

    // Send admin notification email via Microsoft Graph API
    await sendEmailViaGraph(
      accessToken,
      fromEmail,
      'no-reply@arcane.group',
      `Early Access Request - ${email}`,
      adminEmailContent,
      email // Reply-to applicant
    );

    // Send confirmation email to applicant via Microsoft Graph API
    await sendEmailViaGraph(
      accessToken,
      fromEmail,
      email,
      'Early Access Application Received - Bitcoin Sovereign Technology',
      confirmationEmailContent
    );

    // Log the request (in production, store in database)
    console.log('Early access request received:', {
      email,
      telegram,
      twitter,
      hasMessage: !!message,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ 
      success: true,
      message: 'Application submitted successfully' 
    });

  } catch (error) {
    console.error('Error processing access request:', error);
    
    // Don't expose internal errors to client
    return res.status(500).json({ 
      message: 'Failed to process your request. Please try again later.' 
    });
  }
}
