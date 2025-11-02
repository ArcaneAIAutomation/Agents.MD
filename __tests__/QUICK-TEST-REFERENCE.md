# UCIE Testing - Quick Reference Card

## 🚀 Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

---

## 📁 Test Structure

```
__tests__/
├── lib/ucie/          # Unit tests (60+ tests)
├── api/ucie/          # Integration tests (40+ tests)
├── performance/       # Performance tests (20+ tests)
├── security/          # Security tests (30+ tests)
└── e2e/              # User acceptance tests (20+ tests)
```

---

## 🎯 Run Specific Tests

### By Category
```bash
npm test -- __tests__/lib/ucie/              # Unit tests
npm test -- __tests__/api/ucie/              # Integration tests
npm test -- __tests__/performance/           # Performance tests
npm test -- __tests__/security/              # Security tests
npm test -- __tests__/e2e/                   # E2E tests
```

### By File
```bash
npm test -- tokenValidation.test.ts         # Token validation
npm test -- technicalIndicators.test.ts     # Technical indicators
npm test -- search.test.ts                  # Search API
npm test -- analyze.test.ts                 # Analysis API
npm test -- ucie-load.test.ts              # Load testing
npm test -- ucie-security.test.ts          # Security testing
```

### By Test Name
```bash
npm test -- -t "calculates RSI correctly"
npm test -- -t "handles concurrent requests"
```

---

## 📊 Coverage

### Generate Coverage Report
```bash
npm test -- --coverage
```

### View Coverage in Browser
```bash
npm test -- --coverage
# Open coverage/lcov-report/index.html
```

### Coverage Targets
- Overall: >80%
- Unit tests: >90%
- API endpoints: 100%
- Critical paths: 100%

---

## ⚡ Performance Targets

| Metric | Target | Test |
|--------|--------|------|
| Search | < 100ms | ✅ |
| Market Data | < 2s | ✅ |
| Analysis | < 15s | ✅ |
| Cache Hit Rate | > 80% | ✅ |
| Concurrent Users | 100+ | ✅ |

---

## 🔒 Security Tests

### Attack Vectors Tested
- ✅ SQL Injection (10+ patterns)
- ✅ XSS (5+ vectors)
- ✅ Path Traversal
- ✅ DoS Protection
- ✅ Rate Limiting
- ✅ API Key Security

---

## 👥 User Journeys

1. **First-Time User**: Search → Select → Analyze
2. **Professional Trader**: Analysis → Technical → Risk
3. **Research Analyst**: Research → Verify → Report
4. **Mobile User**: Progressive Loading → Optimized UX

---

## 🐛 Debugging

### Run Single Test
```bash
npm test -- -t "test name"
```

### Verbose Output
```bash
npm test -- --verbose
```

### Debug in VS Code
1. Set breakpoint in test file
2. Press F5
3. Select "Jest Debug"

---

## 📝 Writing New Tests

### Unit Test Template
```typescript
describe('Feature Name', () => {
  test('does something correctly', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### Integration Test Template
```typescript
describe('API Endpoint', () => {
  test('returns expected data', async () => {
    const req = createMockRequest(params);
    const res = createMockResponse();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
```

---

## ✅ Pre-Commit Checklist

- [ ] All tests pass
- [ ] Coverage >80%
- [ ] No console errors
- [ ] Performance tests pass
- [ ] Security tests pass

---

## 🔄 CI/CD

### Automated Tests Run On:
- Every push
- Every pull request
- Scheduled (daily)

### Test Pipeline:
1. Unit tests
2. Integration tests
3. Performance tests
4. Security tests
5. Coverage report

---

## 📚 Documentation

- **Full Guide**: `__tests__/UCIE-TESTING-GUIDE.md`
- **Completion Report**: `UCIE-TESTING-COMPLETE.md`
- **This Card**: `__tests__/QUICK-TEST-REFERENCE.md`

---

## 🆘 Common Issues

### Tests Timeout
```bash
# Increase timeout
jest.setTimeout(30000);
```

### Mock Issues
```bash
# Clear mocks
jest.clearAllMocks();
```

### Cache Issues
```bash
# Clear Jest cache
npm test -- --clearCache
```

---

## 📞 Support

- Check test documentation
- Review existing tests
- Ask in team chat
- Create GitHub issue

---

**Quick Tip**: Run `npm test -- --watch` during development for instant feedback!
