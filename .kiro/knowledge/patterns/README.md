# Knowledge Bank - Patterns

**Last Updated**: December 19, 2025  
**Purpose**: Reusable patterns and best practices

---

## Overview

This directory contains documented patterns that have proven successful in the Bitcoin Sovereign Technology platform. Use these patterns when implementing similar functionality.

---

## Available Patterns

### API Patterns
- [Database Caching Pattern](./database-caching.md) - Cache API responses in Supabase
- [Fallback Chain Pattern](./fallback-chain.md) - Multi-source data with fallbacks
- [Polling Pattern](./polling-pattern.md) - Long-running job status polling

### UI Patterns
- [Bitcoin Block Pattern](./bitcoin-block.md) - Standard card component
- [Loading States Pattern](./loading-states.md) - Skeleton and progress indicators
- [Error States Pattern](./error-states.md) - User-friendly error handling

### AI Patterns
- [Modular Analysis Pattern](./modular-analysis.md) - Break AI calls into modules
- [Context Aggregation Pattern](./context-aggregation.md) - Combine data for AI

---

## Pattern Template

```markdown
# [Pattern Name]

## Problem
[What problem does this solve?]

## Solution
[How does this pattern solve it?]

## Implementation
[Code example]

## When to Use
[Appropriate use cases]

## When NOT to Use
[Anti-patterns and exceptions]

## Related Patterns
[Links to related patterns]
```

---

## Contributing

1. Identify a successful pattern in the codebase
2. Document using the template above
3. Add to this README
4. Cross-reference in related steering files
