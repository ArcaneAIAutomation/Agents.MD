# Requirements Document

## Introduction

This specification defines a secure user authentication system for the Bitcoin Sovereign Technology platform (news.arcane.group). The system will replace the current client-side access code validation with a robust, server-side authentication system featuring one-time access code redemption, user account creation, and JWT-based session management.

## Glossary

- **Platform**: The Bitcoin Sovereign Technology web application
- **User**: An individual accessing the Platform
- **Access Code**: A unique, one-time use code for initial registration
- **Authentication System**: The server-side system managing user accounts and sessions
- **Vercel Postgres**: The database system storing user accounts and access codes
- **JWT Token**: JSON Web Token used for secure session management
- **Office 365 Email System**: Microsoft Graph API integration for sending emails
- **Registration Flow**: The process of redeeming an access code and creating an account
- **Login Flow**: The process of authenticating with email and password

## Requirements

### Requirement 1: One-Time Access Code Redemption

**User Story:** As a platform administrator, I want access codes to be single-use only, so that unauthorized sharing is prevented and access is properly controlled.

#### Acceptance Criteria

1. WHEN a User submits a valid Access Code during registration, THE Authentication System SHALL mark the Access Code as redeemed in Vercel Postgres
2. WHEN a User attempts to use an already-redeemed Access Code, THE Authentication System SHALL reject the registration attempt with error message "This access code has already been used"
3. WHEN a User successfully redeems an Access Code, THE Authentication System SHALL record the redemption timestamp and associated email address
4. WHEN an administrator views access code status, THE Platform SHALL display redemption status, timestamp, and associated user email
5. THE Authentication System SHALL store Access Code redemption data permanently for audit purposes

### Requirement 2: Secure User Account Creation

**User Story:** As a new user, I want to create a secure account with my email and password, so that I can access the platform with my own credentials.

#### Acceptance Criteria

1. WHEN a User submits registration form with valid Access Code, email, and password, THE Authentication System SHALL create a new user account in Vercel Postgres
2. WHEN a User provides a password during registration, THE Authentication System SHALL hash the password using bcrypt with minimum 12 salt rounds before storage
3. WHEN a User attempts to register with an email that already exists, THE Authentication System SHALL reject the registration with error message "An account with this email already exists"
4. WHEN a User successfully registers, THE Authentication System SHALL send a welcome email via Office 365 Email System
5. THE Authentication System SHALL validate email format using RFC 5322 standard before account creation

### Requirement 3: Password-Based Login

**User Story:** As a registered user, I want to log in with my email and password, so that I can access the platform securely.

#### Acceptance Criteria

1. WHEN a User submits valid email and password credentials, THE Authentication System SHALL verify credentials against Vercel Postgres
2. WHEN a User submits correct credentials, THE Authentication System SHALL generate a JWT Token with 7-day expiration
3. WHEN a User submits incorrect credentials, THE Authentication System SHALL return error message "Invalid email or password" without revealing which field is incorrect
4. WHEN a User successfully logs in, THE Platform SHALL store the JWT Token in httpOnly secure cookie
5. THE Authentication System SHALL implement rate limiting of 5 failed login attempts per email address per 15-minute window

### Requirement 4: Secure Session Management

**User Story:** As a logged-in user, I want my session to remain active across page refreshes, so that I don't have to log in repeatedly during normal usage.

#### Acceptance Criteria

1. WHEN a User has a valid JWT Token, THE Platform SHALL allow access to protected content without re-authentication
2. WHEN a User's JWT Token expires after 7 days, THE Platform SHALL redirect to login page with message "Your session has expired. Please log in again."
3. WHEN a User logs out, THE Platform SHALL invalidate the JWT Token and clear the httpOnly cookie
4. WHEN a User closes browser and returns within 7 days, THE Platform SHALL maintain authenticated session using stored JWT Token
5. THE Authentication System SHALL validate JWT Token signature on every protected API request

### Requirement 5: Access Gate Integration

**User Story:** As a platform visitor, I want to see a professional access gate that guides me to either register with a code or log in with existing credentials.

#### Acceptance Criteria

1. WHEN an unauthenticated User visits the Platform, THE Platform SHALL display the Access Gate component before any content
2. WHEN a User clicks "I have an access code", THE Platform SHALL display registration form with fields for access code, email, and password
3. WHEN a User clicks "I already have an account", THE Platform SHALL display login form with fields for email and password
4. WHEN a User successfully authenticates, THE Platform SHALL hide the Access Gate and display full platform content
5. THE Access Gate SHALL follow Bitcoin Sovereign Technology design system with black background, orange accents, and thin orange borders

### Requirement 6: Email Confirmation System

**User Story:** As a new user, I want to receive a confirmation email after registration, so that I know my account was created successfully and have my login details.

#### Acceptance Criteria

1. WHEN a User successfully registers, THE Authentication System SHALL send welcome email via Office 365 Email System within 30 seconds
2. WHEN sending welcome email, THE Authentication System SHALL include user's registered email address and platform URL
3. WHEN email sending fails, THE Authentication System SHALL log error but still complete registration process
4. WHEN a User requests password reset, THE Authentication System SHALL send reset link via Office 365 Email System
5. THE Authentication System SHALL use professional email templates with Bitcoin Sovereign Technology branding

### Requirement 7: Database Schema and Data Integrity

**User Story:** As a platform administrator, I want all user data stored securely in a relational database, so that data integrity is maintained and queries are efficient.

#### Acceptance Criteria

1. THE Authentication System SHALL create users table in Vercel Postgres with columns: id, email, password_hash, created_at, updated_at
2. THE Authentication System SHALL create access_codes table in Vercel Postgres with columns: id, code, redeemed, redeemed_by, redeemed_at, created_at
3. WHEN storing user data, THE Authentication System SHALL enforce unique constraint on email column
4. WHEN storing access codes, THE Authentication System SHALL enforce unique constraint on code column
5. THE Authentication System SHALL create database indexes on email and code columns for query performance

### Requirement 8: Security and Audit Trail

**User Story:** As a platform administrator, I want comprehensive logging of authentication events, so that I can monitor security and troubleshoot issues.

#### Acceptance Criteria

1. WHEN a User attempts login, THE Authentication System SHALL log attempt with timestamp, email, IP address, and success/failure status
2. WHEN a User redeems an Access Code, THE Authentication System SHALL log redemption with timestamp, code, email, and IP address
3. WHEN a User logs out, THE Authentication System SHALL log logout event with timestamp and user identifier
4. WHEN suspicious activity is detected (5+ failed logins), THE Authentication System SHALL log security alert
5. THE Authentication System SHALL retain audit logs for minimum 90 days

### Requirement 9: API Endpoint Security

**User Story:** As a platform administrator, I want all authentication API endpoints protected against common attacks, so that the system remains secure.

#### Acceptance Criteria

1. THE Authentication System SHALL implement CSRF protection on all state-changing endpoints
2. THE Authentication System SHALL validate and sanitize all user input before database queries
3. THE Authentication System SHALL return generic error messages that do not reveal system internals
4. THE Authentication System SHALL implement rate limiting on all authentication endpoints
5. THE Authentication System SHALL use HTTPS-only cookies with Secure and HttpOnly flags

### Requirement 10: Migration from Current System

**User Story:** As a platform administrator, I want existing access codes to work in the new system, so that users with codes can still register.

#### Acceptance Criteria

1. WHEN migrating to new system, THE Authentication System SHALL import all 11 existing Access Codes into Vercel Postgres
2. WHEN importing codes, THE Authentication System SHALL mark codes as unredeemed initially
3. WHEN new system launches, THE Platform SHALL immediately use database-backed authentication instead of client-side validation
4. WHEN migration completes, THE Platform SHALL remove ACCESS_CODE environment variable from client-side code
5. THE Authentication System SHALL maintain backward compatibility with existing sessionStorage for 24-hour grace period

---

**Status**: ✅ Requirements Complete
**Version**: 1.0.0
**Last Updated**: January 26, 2025
**Next Step**: Design Document
