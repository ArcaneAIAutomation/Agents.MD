/**
 * Einstein Trade Approval Endpoint
 * 
 * POST /api/einstein/approve-signal
 * 
 * Handles user approval, rejection, or modification of trade signals.
 * This endpoint is called after the user reviews the comprehensive analysis
 * in the preview modal and decides to approve, reject, or modify the signal.
 * 
 * Requirements: 5.3, 11.1
 * Task 50: Create trade approval endpoint
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { approvalWorkflowManager } from '../../../lib/einstein/workflow/approval';
import type { TradeSignal, DatabaseResult } from '../../../lib/einstein/types';

/**
 * Request body interface
 */
interface ApproveSignalRequest {
  signalId: string;
  action: 'APPROVE' | 'REJECT' | 'MODIFY';
  rejectionReason?: string;
  modifications?: Partial<TradeSignal>;
}

/**
 * Approve trade signal endpoint handler
 * 
 * This endpoint:
 * 1. Validates request parameters
 * 2. Calls ApprovalWorkflowManager based on action type
 * 3. Saves to database on approval (Requirement 5.3, 11.1)
 * 4. Returns result with success/error status
 * 
 * Authentication: Required (JWT token in httpOnly cookie)
 * Method: POST
 * 
 * Request Body:
 * {
 *   signalId: string (UUID of the trade signal)
 *   action: "APPROVE" | "REJECT" | "MODIFY"
 *   rejectionReason?: string (required if action is REJECT)
 *   modifications?: Partial<TradeSignal> (required if action is MODIFY)
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   action: string
 *   tradeId?: string (if approved or modified)
 *   message: string
 *   timestamp: string
 *   error?: string
 * }
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  const startTime = Date.now();
  
  try {
    // ========================================================================
    // STEP 1: VALIDATE REQUEST
    // ========================================================================
    
    const { signalId, action, rejectionReason, modifications } = req.body as ApproveSignalRequest;
    
    // Validate required parameters
    if (!signalId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: signalId'
      });
    }
    
    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: action'
      });
    }
    
    // Validate action type
    const validActions = ['APPROVE', 'REJECT', 'MODIFY'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: `Invalid action. Supported actions: ${validActions.join(', ')}`
      });
    }
    
    // Validate rejection reason if action is REJECT
    if (action === 'REJECT' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required when action is REJECT'
      });
    }
    
    // Validate modifications if action is MODIFY
    if (action === 'MODIFY' && !modifications) {
      return res.status(400).json({
        success: false,
        error: 'Modifications are required when action is MODIFY'
      });
    }
    
    // Validate signal ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(signalId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signal ID format. Must be a valid UUID.'
      });
    }
    
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    
    console.log('\n========================================');
    console.log('EINSTEIN TRADE APPROVAL REQUEST');
    console.log('========================================');
    console.log(`User: ${userEmail} (${userId})`);
    console.log(`Signal ID: ${signalId}`);
    console.log(`Action: ${action}`);
    if (action === 'REJECT') {
      console.log(`Rejection Reason: ${rejectionReason}`);
    }
    if (action === 'MODIFY') {
      console.log(`Modifications: ${JSON.stringify(modifications, null, 2)}`);
    }
    console.log('========================================\n');
    
    // ========================================================================
    // STEP 2: HANDLE APPROVAL ACTION
    // ========================================================================
    
    let result: DatabaseResult;
    
    switch (action) {
      case 'APPROVE':
        console.log('Calling ApprovalWorkflowManager.handleApproval()...\n');
        result = await approvalWorkflowManager.handleApproval(signalId, userId);
        break;
        
      case 'REJECT':
        console.log('Calling ApprovalWorkflowManager.handleRejection()...\n');
        await approvalWorkflowManager.handleRejection(signalId, userId, rejectionReason!);
        result = {
          success: true,
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'MODIFY':
        console.log('Calling ApprovalWorkflowManager.handleModification()...\n');
        result = await approvalWorkflowManager.handleModification(
          signalId,
          userId,
          modifications!
        );
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action type'
        });
    }
    
    const totalTime = Date.now() - startTime;
    
    // ========================================================================
    // STEP 3: RETURN RESPONSE
    // ========================================================================
    
    if (!result.success) {
      console.error('\n❌ Trade approval action failed');
      console.error(`Error: ${result.error}`);
      console.error(`Total time: ${totalTime}ms\n`);
      
      return res.status(400).json({
        success: false,
        action,
        error: result.error || 'Trade approval action failed',
        timestamp: result.timestamp
      });
    }
    
    console.log('\n✅ Trade approval action successful');
    console.log(`Action: ${action}`);
    console.log(`Total time: ${totalTime}ms`);
    if (result.tradeId) {
      console.log(`Trade ID: ${result.tradeId}`);
    }
    console.log('========================================\n');
    
    // Return successful result
    const responseMessage = {
      APPROVE: 'Trade signal approved and saved to database',
      REJECT: 'Trade signal rejected and discarded',
      MODIFY: 'Trade signal modified and saved to database'
    }[action];
    
    return res.status(200).json({
      success: true,
      action,
      tradeId: result.tradeId,
      message: responseMessage,
      timestamp: result.timestamp,
      metadata: {
        processedAt: new Date().toISOString(),
        processedBy: userEmail,
        processingTime: totalTime,
        version: '1.0.0'
      }
    });
    
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    
    console.error('\n========================================');
    console.error('❌ ENDPOINT ERROR');
    console.error('========================================');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error(`Total time: ${totalTime}ms\n`);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during trade approval',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Export handler wrapped with authentication middleware
 * 
 * This ensures that only authenticated users can approve trade signals.
 * The withAuth middleware verifies the JWT token and attaches user data to the request.
 */
export default withAuth(handler);
