# Security Policy

## Supported Versions

We actively support the following versions of Agents.MD with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in Agents.MD, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by:

1. **Email**: Send details to security@arcane.group
2. **Subject**: Include "SECURITY" in the subject line
3. **Details**: Provide as much information as possible

### What to Include

Please include the following information in your report:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up

### Response Timeline

- **Initial Response**: Within 24 hours
- **Status Update**: Within 72 hours
- **Fix Timeline**: Depends on severity (see below)

## Vulnerability Severity Levels

### Critical (Fix within 24-48 hours)
- Remote code execution
- SQL injection
- Authentication bypass
- API key exposure

### High (Fix within 1 week)
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Privilege escalation
- Data exposure

### Medium (Fix within 2 weeks)
- Information disclosure
- Denial of service
- Insecure direct object references

### Low (Fix within 1 month)
- Security misconfigurations
- Insecure cryptographic storage
- Missing security headers

## Security Best Practices

### For Users

1. **Environment Variables**
   - Never commit `.env.local` files
   - Use strong, unique API keys
   - Rotate API keys regularly
   - Limit API key permissions

2. **Deployment Security**
   - Use HTTPS in production
   - Keep dependencies updated
   - Monitor for security advisories
   - Use secure hosting providers

3. **API Key Management**
   ```bash
   # Good: Use environment variables
   OPENAI_API_KEY=your_secure_key_here
   
   # Bad: Hardcode in source code
   const apiKey = "sk-1234567890abcdef"; // Never do this!
   ```

### For Developers

1. **Code Security**
   - Validate all user inputs
   - Sanitize data before database queries
   - Use parameterized queries
   - Implement proper error handling

2. **API Security**
   - Implement rate limiting
   - Use authentication where appropriate
   - Validate API responses
   - Handle API errors gracefully

3. **Dependencies**
   - Keep npm packages updated
   - Use `npm audit` regularly
   - Review dependency security advisories
   - Use lock files (package-lock.json)

## Security Features

### Current Security Measures

1. **Environment Protection**
   - Comprehensive .gitignore rules
   - Environment variable validation
   - API key protection

2. **API Security**
   - Request timeout limits
   - Error handling without data exposure
   - Rate limiting considerations

3. **Client-Side Security**
   - Input validation
   - XSS prevention
   - Secure API communication

### Planned Security Enhancements

1. **Authentication System** (v1.3.0)
   - User authentication
   - Session management
   - Role-based access control

2. **Enhanced API Security** (v1.2.0)
   - API key rotation
   - Request signing
   - Advanced rate limiting

3. **Security Monitoring** (v1.4.0)
   - Security event logging
   - Anomaly detection
   - Automated security scanning

## Security Checklist for Contributors

Before submitting code:

- [ ] No hardcoded secrets or API keys
- [ ] Input validation implemented
- [ ] Error handling doesn't expose sensitive data
- [ ] Dependencies are up to date
- [ ] Security linting passes
- [ ] No sensitive data in logs

## Responsible Disclosure

We believe in responsible disclosure and will:

1. **Acknowledge** your report within 24 hours
2. **Investigate** the vulnerability thoroughly
3. **Develop** a fix in coordination with you
4. **Test** the fix comprehensively
5. **Deploy** the fix to production
6. **Credit** you in our security advisories (if desired)

## Security Resources

### External Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

### Tools We Recommend
- `npm audit` - Check for known vulnerabilities
- `eslint-plugin-security` - Security linting
- `helmet` - Security headers for Express
- `rate-limiter-flexible` - Rate limiting

## Contact

For security-related questions or concerns:
- **Security Team**: security@arcane.group
- **General Contact**: support@arcane.group
- **GitHub Issues**: For non-security bugs only

## Acknowledgments

We thank the security research community for helping keep Agents.MD secure. Security researchers who responsibly disclose vulnerabilities will be acknowledged in our security advisories.

---

**Last Updated**: September 30, 2025
**Next Review**: December 30, 2025