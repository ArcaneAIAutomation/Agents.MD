import { NextApiRequest, NextApiResponse } from 'next';
import { getCsrfTokenHandler } from '../../../middleware/csrf';

/**
 * GET /api/auth/csrf-token
 * 
 * Returns a CSRF token for the current session.
 * This token must be included in all state-changing requests (POST, PUT, DELETE).
 * 
 * Response:
 * {
 *   success: true,
 *   csrfToken: "abc123..."
 * }
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return getCsrfTokenHandler(req, res);
}
