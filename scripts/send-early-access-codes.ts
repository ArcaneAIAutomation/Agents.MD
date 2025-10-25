/**
 * Send Early Access Codes via Office 365
 * 
 * This script generates unique access codes and sends professional
 * welcome emails to approved early access users.
 */

interface AzureTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Generate unique access codes
function generateAccessCodes(count: number): string[] {
  const codes: string[] = [];
  const prefix = 'BTC-SOVEREIGN-';
  
  for (let i = 1; i <= count; i++) {
    // Generate random alphanumeric string
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${prefix}${randomPart}-${i.toString().padStart(2, '0')}`;
    codes.push(code);
  }
  
  return codes;
}

// Get Azure AD access token
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

// Send email via Microsoft Graph API
async function sendEmailViaGraph(
  accessToken: string,
  from: string,
  to: string,
  subject: string,
  body: string
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
      ]
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

// Create professional welcome email
function createWelcomeEmail(recipientName: string, accessCodes: string[]): string {
  return `
Dear ${recipientName},

Congratulations! Your application for early access to Bitcoin Sovereign Technology has been approved.

We're excited to welcome you to our exclusive early access program. As a valued early adopter, you'll be among the first to experience our advanced cryptocurrency trading intelligence platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR EARLY ACCESS CODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You have been granted ${accessCodes.length} unique access codes. Each code can be used to grant access to the platform:

${accessCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO ACCESS THE PLATFORM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Visit: https://agents-md.vercel.app
2. Click "Enter Access Code"
3. Enter any of your access codes above
4. Enjoy full access to all features

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Crypto News Wire - Real-time cryptocurrency news aggregation
✓ AI Trade Generation Engine - GPT-4o powered trading signals
✓ Bitcoin Market Report - Comprehensive BTC analysis
✓ Ethereum Market Report - Smart contract platform insights
✓ Bitcoin Whale Watch - Track large BTC transactions with Caesar AI
✓ Regulatory Watch - Monitor crypto regulatory developments

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Access codes are case-insensitive
• Each code can be used multiple times
• Share codes with trusted colleagues if desired
• Access persists during your browser session
• Platform is optimized for mobile and desktop

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPPORT & FEEDBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We value your feedback as an early access user. If you encounter any issues or have suggestions for improvement, please don't hesitate to reach out.

Your insights will help shape the future of Bitcoin Sovereign Technology.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for being part of our early access program. We look forward to your feedback and hope you find the platform valuable for your cryptocurrency trading and analysis needs.

Best regards,

Bitcoin Sovereign Technology Team
Arcane Group

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message from Bitcoin Sovereign Technology.
For support, please contact: support@arcane.group
  `.trim();
}

// Main execution
async function main() {
  try {
    console.log('🔐 Generating Early Access Codes...\n');
    
    // Generate 10 unique access codes
    const accessCodes = generateAccessCodes(10);
    
    console.log('Generated Access Codes:');
    accessCodes.forEach((code, index) => {
      console.log(`${index + 1}. ${code}`);
    });
    console.log('');
    
    // Get Azure access token
    console.log('🔑 Authenticating with Azure AD...');
    const accessToken = await getAzureAccessToken();
    console.log('✅ Authentication successful\n');
    
    // Email configuration
    const fromEmail = process.env.SENDER_EMAIL || 'no-reply@arcane.group';
    const recipients = [
      { email: 'morgan@arcane.group', name: 'Morgan' },
      { email: 'murray@arcane.group', name: 'Murray' }
    ];
    
    // Send emails to each recipient
    for (const recipient of recipients) {
      console.log(`📧 Sending welcome email to ${recipient.email}...`);
      
      const emailBody = createWelcomeEmail(recipient.name, accessCodes);
      
      await sendEmailViaGraph(
        accessToken,
        fromEmail,
        recipient.email,
        'Welcome to Bitcoin Sovereign Technology - Early Access Approved',
        emailBody
      );
      
      console.log(`✅ Email sent successfully to ${recipient.email}\n`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL EMAILS SENT SUCCESSFULLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Summary:');
    console.log(`• Generated: ${accessCodes.length} access codes`);
    console.log(`• Sent to: ${recipients.length} recipients`);
    console.log(`• Status: Complete`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
