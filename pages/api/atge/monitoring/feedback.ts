import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../../../middleware/auth';
import { logUserFeedback } from '../../../../lib/atge/monitoring';

/**
 * POST /api/atge/monitoring/feedback
 * 
 * Submit user feedback for ATGE
 * 
 * Body:
 * - feedbackType: 'trade_accuracy' | 'ui_experience' | 'performance' | 'feature_request' | 'bug_report'
 * - rating: 1-5 (optional)
 * - comment: string (optional)
 * - tradeSignalId: UUID (optional)
 * - metadata: object (optional)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Get request body
    const { feedbackType, rating, comment, tradeSignalId, metadata } = req.body;

    // 3. Validate input
    const validFeedbackTypes = ['trade_accuracy', 'ui_experience', 'performance', 'feature_request', 'bug_report'];
    if (!feedbackType || !validFeedbackTypes.includes(feedbackType)) {
      return res.status(400).json({ 
        error: 'Invalid feedback type',
        validOptions: validFeedbackTypes
      });
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5'
      });
    }

    // 4. Log feedback
    await logUserFeedback({
      timestamp: new Date(),
      userId: authResult.user!.id,
      feedbackType,
      rating,
      comment,
      tradeSignalId,
      metadata
    });

    // 5. Return success
    return res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    return res.status(500).json({ 
      error: 'Failed to submit feedback',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}
