/**
 * Email Test Script
 * 
 * Tests Office 365 email functionality by sending a test email
 * Usage: npx tsx scripts/test-email.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { sendEmail } from '../lib/email/office365';

async function testEmail() {
  console.log('\n🧪 Testing Email Functionality\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check environment variables
  console.log('📋 Checking Configuration:');
  const senderEmail = process.env.SENDER_EMAIL;
  const azureTenantId = process.env.AZURE_TENANT_ID;
  const azureClientId = process.env.AZURE_CLIENT_ID;
  const azureClientSecret = process.env.AZURE_CLIENT_SECRET;

  console.log(`   Sender Email: ${senderEmail ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Azure Tenant ID: ${azureTenantId ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Azure Client ID: ${azureClientId ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Azure Client Secret: ${azureClientSecret ? '✅ Configured' : '❌ Missing'}`);

  if (!senderEmail || !azureTenantId || !azureClientId || !azureClientSecret) {
    console.error('\n❌ Email configuration incomplete. Please check .env.local\n');
    process.exit(1);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test email details
  const testRecipient = 'morgan@arcane.group';
  const testSubject = '🧪 Test Email - Bitcoin Sovereign Technology';
  const testBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email</title>
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
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 2px solid #F7931A;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #F7931A;
      text-shadow: 0 0 20px rgba(247, 147, 26, 0.5);
      margin: 0;
    }
    .content {
      padding: 20px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0 0 20px 0;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.8);
      margin: 0 0 20px 0;
    }
    .info-box {
      background-color: #000000;
      border: 1px solid #F7931A;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-item {
      margin: 10px 0;
      color: rgba(255, 255, 255, 0.8);
    }
    .info-label {
      color: #F7931A;
      font-weight: 700;
    }
    .footer {
      text-align: center;
      padding: 20px;
      border-top: 1px solid rgba(247, 147, 26, 0.2);
      margin-top: 30px;
    }
    .footer-text {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 class="logo">BITCOIN SOVEREIGN TECHNOLOGY</h1>
    </div>
    
    <div class="content">
      <h2 class="title">🧪 Email System Test</h2>
      
      <p class="message">
        This is a test email to verify that the Office 365 email integration is working correctly.
      </p>
      
      <div class="info-box">
        <div class="info-item">
          <span class="info-label">Test Type:</span> Email Functionality Test
        </div>
        <div class="info-item">
          <span class="info-label">Timestamp:</span> ${new Date().toISOString()}
        </div>
        <div class="info-item">
          <span class="info-label">Sender:</span> ${senderEmail}
        </div>
        <div class="info-item">
          <span class="info-label">Recipient:</span> ${testRecipient}
        </div>
        <div class="info-item">
          <span class="info-label">Platform:</span> Bitcoin Sovereign Technology
        </div>
      </div>
      
      <p class="message">
        If you received this email, the email system is configured correctly and working as expected.
      </p>
      
      <p class="message">
        <strong>✅ Email system operational!</strong>
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">
        <strong>Bitcoin Sovereign Technology</strong>
      </p>
      <p class="footer-text">
        Advanced Cryptocurrency Trading Intelligence
      </p>
      <p class="footer-text">
        https://news.arcane.group
      </p>
      <p class="footer-text" style="margin-top: 15px;">
        This is an automated test message.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  console.log('📧 Sending Test Email:');
  console.log(`   To: ${testRecipient}`);
  console.log(`   From: ${senderEmail}`);
  console.log(`   Subject: ${testSubject}`);
  console.log('\n⏳ Sending...\n');

  try {
    const result = await sendEmail({
      to: testRecipient,
      subject: testSubject,
      body: testBody,
      contentType: 'HTML'
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (result.success) {
      console.log('✅ SUCCESS! Email sent successfully!\n');
      console.log('📬 Email Details:');
      console.log(`   Sent at: ${result.timestamp.toISOString()}`);
      console.log(`   Recipient: ${testRecipient}`);
      console.log(`   Status: Delivered to Microsoft Graph API`);
      console.log('\n💡 Check your inbox at morgan@arcane.group\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      process.exit(0);
    } else {
      console.log('❌ FAILED! Email could not be sent.\n');
      console.log('📋 Error Details:');
      console.log(`   Error: ${result.error}`);
      console.log(`   Timestamp: ${result.timestamp.toISOString()}`);
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Verify Azure AD credentials are correct');
      console.log('   2. Check SENDER_EMAIL is a valid Office 365 mailbox');
      console.log('   3. Ensure Azure AD app has Mail.Send permission');
      console.log('   4. Verify network connectivity to Microsoft Graph API');
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      process.exit(1);
    }
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('❌ EXCEPTION! An unexpected error occurred.\n');
    console.log('📋 Error Details:');
    console.error(error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check .env.local file exists and is loaded');
    console.log('   2. Verify all Azure AD credentials are set');
    console.log('   3. Check network connectivity');
    console.log('   4. Review error message above for specific issues');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

// Run test
testEmail();
