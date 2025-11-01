/**
 * Test Email Endpoint
 * Tests Office 365 email sending
 * GET /api/test-email?to=email@example.com
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '../../lib/email/office365';
import { generateVerificationEmail } from '../../lib/email/templates/verification';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to } = req.query;

  if (!to || typeof to !== 'string') {
    return res.status(400).json({ error: 'Email address required in query: ?to=email@example.com' });
  }

  try {
    // Check environment variables
    const envCheck = {
      SENDER_EMAIL: !!process.env.SENDER_EMAIL,
      AZURE_TENANT_ID: !!process.env.AZURE_TENANT_ID,
      AZURE_CLIENT_ID: !!process.env.AZURE_CLIENT_ID,
      AZURE_CLIENT_SECRET: !!process.env.AZURE_CLIENT_SECRET,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    };

    console.log('Environment check:', envCheck);

    if (!envCheck.SENDER_EMAIL || !envCheck.AZURE_TENANT_ID || !envCheck.AZURE_CLIENT_ID || !envCheck.AZURE_CLIENT_SECRET) {
      return res.status(500).json({
        error: 'Email configuration incomplete',
        envCheck,
      });
    }

    // Generate test verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://news.arcane.group'}/verify-email?token=TEST_TOKEN_123`;
    const emailHtml = generateVerificationEmail({
      email: to,
      verificationUrl,
      expiresInHours: 24,
    });

    console.log(`Attempting to send test email to: ${to}`);
    console.log(`From: ${process.env.SENDER_EMAIL}`);

    // Send email
    const result = await sendEmail({
      to,
      subject: 'Test Email - Bitcoin Sovereign Technology',
      body: emailHtml,
      contentType: 'HTML',
    });

    console.log('Email send result:', result);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        to,
        from: process.env.SENDER_EMAIL,
        timestamp: result.timestamp,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
        to,
        from: process.env.SENDER_EMAIL,
      });
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}
