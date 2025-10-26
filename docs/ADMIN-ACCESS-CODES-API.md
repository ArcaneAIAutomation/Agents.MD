# Admin Access Codes API Documentation

## Overview

The Admin Access Codes endpoint provides administrators with visibility into all access codes and their redemption status. This is useful for monitoring access code usage, tracking user registrations, and auditing the authentication system.

## Endpoint

```
GET /api/admin/access-codes
```

## Authentication

**Required:** Valid JWT token in httpOnly cookie

The endpoint requires authentication via the `withAuth` middleware. Users must be logged in to access this endpoint.

**Future Enhancement:** Admin role check will be added to restrict access to administrators only.

## Request

### Method
`GET`

### Headers
- Cookie: `auth_token=<jwt_token>` (automatically sent by browser)

### Query Parameters
None

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "codes": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "BITCOIN1",
      "redeemed": true,
      "redeemedBy": "123e4567-e89b-12d3-a456-426614174000",
      "redeemedByEmail": "user@example.com",
      "redeemedAt": "2025-01-26T10:30:00.000Z",
      "createdAt": "2025-01-20T08:00:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "code": "BITCOIN2",
      "redeemed": false,
      "redeemedBy": null,
      "redeemedByEmail": null,
      "redeemedAt": null,
      "createdAt": "2025-01-20T08:00:00.000Z"
    }
  ],
  "total": 2
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `codes` | array | List of access code objects |
| `total` | number | Total number of access codes |

### Access Code Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier for the access code |
| `code` | string | The access code itself (e.g., "BITCOIN1") |
| `redeemed` | boolean | Whether the code has been used |
| `redeemedBy` | string \| null | User ID who redeemed the code (null if not redeemed) |
| `redeemedByEmail` | string \| null | Email of user who redeemed the code (null if not redeemed) |
| `redeemedAt` | string \| null | ISO 8601 timestamp of redemption (null if not redeemed) |
| `createdAt` | string | ISO 8601 timestamp when code was created |

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authenticated. Please log in."
}
```

**Cause:** No valid JWT token in cookie or token is expired/invalid.

#### 405 Method Not Allowed
```json
{
  "success": false,
  "message": "Method not allowed. Use GET."
}
```

**Cause:** Request used a method other than GET (e.g., POST, PUT, DELETE).

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Database error. Please try again later."
}
```

**Cause:** Database connection failed or query error occurred.

## Usage Examples

### JavaScript/TypeScript (Browser)

```typescript
// Fetch all access codes
async function getAccessCodes() {
  try {
    const response = await fetch('/api/admin/access-codes', {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log(`Total codes: ${data.total}`);
      console.log('Access codes:', data.codes);
      
      // Filter redeemed codes
      const redeemedCodes = data.codes.filter(code => code.redeemed);
      console.log(`Redeemed: ${redeemedCodes.length}/${data.total}`);
      
      // Filter unredeemed codes
      const unredeemedCodes = data.codes.filter(code => !code.redeemed);
      console.log(`Available: ${unredeemedCodes.length}/${data.total}`);
      
      return data.codes;
    } else {
      console.error('Failed to fetch access codes:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching access codes:', error);
    return null;
  }
}

// Usage
const codes = await getAccessCodes();
```

### React Component Example

```tsx
import { useState, useEffect } from 'react';

interface AccessCode {
  id: string;
  code: string;
  redeemed: boolean;
  redeemedBy: string | null;
  redeemedByEmail: string | null;
  redeemedAt: string | null;
  createdAt: string;
}

export function AdminAccessCodesPanel() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCodes() {
      try {
        const response = await fetch('/api/admin/access-codes', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch access codes');
        }

        const data = await response.json();
        
        if (data.success) {
          setCodes(data.codes);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchCodes();
  }, []);

  if (loading) return <div>Loading access codes...</div>;
  if (error) return <div>Error: {error}</div>;

  const redeemedCount = codes.filter(c => c.redeemed).length;
  const availableCount = codes.filter(c => !c.redeemed).length;

  return (
    <div className="admin-panel">
      <h2>Access Codes Management</h2>
      
      <div className="stats">
        <div>Total: {codes.length}</div>
        <div>Redeemed: {redeemedCount}</div>
        <div>Available: {availableCount}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Status</th>
            <th>Redeemed By</th>
            <th>Redeemed At</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {codes.map(code => (
            <tr key={code.id}>
              <td>{code.code}</td>
              <td>{code.redeemed ? '✅ Redeemed' : '⏳ Available'}</td>
              <td>{code.redeemedByEmail || '-'}</td>
              <td>
                {code.redeemedAt 
                  ? new Date(code.redeemedAt).toLocaleString()
                  : '-'
                }
              </td>
              <td>{new Date(code.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### cURL Example

```bash
# Fetch access codes (requires authentication cookie)
curl -X GET http://localhost:3000/api/admin/access-codes \
  -H "Content-Type: application/json" \
  -b "auth_token=your_jwt_token_here"
```

## Database Query

The endpoint executes the following SQL query:

```sql
SELECT 
  ac.id,
  ac.code,
  ac.redeemed,
  ac.redeemed_by,
  ac.redeemed_at,
  ac.created_at,
  u.email as redeemed_by_email
FROM access_codes ac
LEFT JOIN users u ON ac.redeemed_by = u.id
ORDER BY ac.created_at DESC
```

This query:
- Fetches all access codes from the `access_codes` table
- Joins with the `users` table to get the email of the user who redeemed each code
- Orders results by creation date (newest first)
- Uses LEFT JOIN so unredeemed codes (with no associated user) are still included

## Security Considerations

### Current Implementation
- ✅ Requires authentication (JWT token)
- ✅ Uses parameterized queries (SQL injection protection)
- ✅ Returns generic error messages (no system details exposed)
- ✅ Logs errors server-side for debugging

### Future Enhancements
- 🔜 **Admin Role Check**: Add role-based access control to restrict endpoint to administrators only
- 🔜 **Pagination**: Add pagination for large numbers of access codes
- 🔜 **Filtering**: Add query parameters to filter by status (redeemed/unredeemed)
- 🔜 **Sorting**: Add query parameters to sort by different fields
- 🔜 **Audit Logging**: Log all access to this endpoint for security auditing

## Related Endpoints

- `POST /api/auth/register` - Register new user with access code
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/logout` - Logout and invalidate session

## Requirements Reference

This endpoint satisfies **Requirement 1.4** from the authentication system specification:

> **Requirement 1.4**: WHEN an administrator views access code status, THE Platform SHALL display redemption status, timestamp, and associated user email

## Implementation Details

- **File**: `pages/api/admin/access-codes.ts`
- **Middleware**: `withAuth` (JWT authentication)
- **Database**: Vercel Postgres
- **Tables**: `access_codes`, `users`
- **Response Format**: JSON
- **HTTP Methods**: GET only

## Testing

To test this endpoint:

1. **Setup**: Ensure database is configured with access codes
2. **Authenticate**: Login to get a valid JWT token
3. **Request**: Make GET request to `/api/admin/access-codes`
4. **Verify**: Check response contains all access codes with correct data

Example test cases:
- ✅ Returns 401 when not authenticated
- ✅ Returns 405 for non-GET methods
- ✅ Returns all access codes when authenticated
- ✅ Includes user email for redeemed codes
- ✅ Shows null values for unredeemed codes
- ✅ Orders codes by creation date (newest first)

## Changelog

### Version 1.0.0 (January 26, 2025)
- Initial implementation
- Basic authentication with JWT
- Query all access codes with redemption status
- Join with users table to get redeemer email
- Order by creation date descending

### Future Versions
- v1.1.0: Add admin role check
- v1.2.0: Add pagination support
- v1.3.0: Add filtering and sorting options
- v1.4.0: Add audit logging

---

**Status**: ✅ Implemented
**Version**: 1.0.0
**Last Updated**: January 26, 2025
