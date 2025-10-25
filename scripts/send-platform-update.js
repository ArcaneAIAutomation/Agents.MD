/**
 * Send Platform URL Update Notification
 * 
 * Notifies users about the new platform URL: https://news.arcane.group
 * 
 * Usage: node scripts/send-platform-update.js
 */

require('dotenv').config({ path: '.env.local' });

// Get Azure AD access token
async function getAzureAccessToken() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Azure credentials not configured in .env.local');
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

  const data = await response.json();
  return data.access_token;
}

// Send email via Microsoft Graph API
async function sendEmailViaGraph(accessToken, from, to, subject, body) {
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

// Create platform update email
function createUpdateEmail(recipientName) {
  return `
Dear ${recipientName},

We're writing to inform you of an important update to Bitcoin Sovereign Technology.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM URL UPDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The platform has moved to a new, dedicated domain:

🌐 NEW URL: https://news.arcane.group

Please update your bookmarks and use this URL going forward.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ACCESS CODES (UNCHANGED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your early access codes remain the same and will work on the new domain:

1. BTC-SOVEREIGN-K3QYMQ-01
2. BTC-SOVEREIGN-AKCJRG-02
3. BTC-SOVEREIGN-LMBLRN-03
4. BTC-SOVEREIGN-HZKEI2-04
5. BTC-SOVEREIGN-WVL0HN-05
6. BTC-SOVEREIGN-48YDHG-06
7. BTC-SOVEREIGN-6HSNX0-07
8. BTC-SOVEREIGN-N99A5R-08
9. BTC-SOVEREIGN-DCO2DG-09
10. BTC-SOVEREIGN-BYE9UX-10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO ACCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Visit: https://news.arcane.group
2. Click "Enter Access Code"
3. Enter any of your access codes above
4. Enjoy full access to all features

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT'S NEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Dedicated domain for better branding
✓ Improved performance and reliability
✓ Same great features you know and love
✓ All your access codes continue to work

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM FEATURES (UNCHANGED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Crypto News Wire - Real-time cryptocurrency news
✓ AI Trade Generation Engine - GPT-4o powered signals
✓ Bitcoin Market Report - Comprehensive BTC analysis
✓ Ethereum Market Report - Smart contract insights
✓ Bitcoin Whale Watch - Track large transactions
✓ Regulatory Watch - Monitor regulatory developments

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• The old URL (agents-md.vercel.app) will redirect to the new domain
• Your access codes remain valid and unchanged
• No action required except updating your bookmarks
• All features and functionality remain the same

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you have any questions or encounter any issues with the new domain, please don't hesitate to reach out.

Thank you for being part of our early access program!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
    console.log('📧 Sending Platform URL Update Notifications...\n');
    
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
      console.log(`📧 Sending update notification to ${recipient.email}...`);
      
      const emailBody = createUpdateEmail(recipient.name);
      
      await sendEmailViaGraph(
        accessToken,
        fromEmail,
        recipient.email,
        'Important: Bitcoin Sovereign Technology - New Platform URL',
        emailBody
      );
      
      console.log(`✅ Email sent successfully to ${recipient.email}\n`);
      
      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL UPDATE NOTIFICATIONS SENT SUCCESSFULLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Summary:');
    console.log(`• New URL: https://news.arcane.group`);
    console.log(`• Notified: ${recipients.length} recipients`);
    console.log(`• Status: Complete`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
