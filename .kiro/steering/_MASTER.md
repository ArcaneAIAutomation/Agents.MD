# Kiro Steering - Master Reference

**Last Updated**: December 19, 2025  
**Status**: Active  
**Purpose**: Central reference for all steering files and development guidelines

---

## Overview

This master reference provides navigation to all steering files in the Bitcoin Sovereign Technology platform. Steering files provide development guidelines, API references, and system rules.

---

## Critical Steering Files

### 🔴 Must Read First

| File | Purpose | Priority |
|------|---------|----------|
| [KIRO-AGENT-STEERING.md](./KIRO-AGENT-STEERING.md) | Complete system guide | CRITICAL |
| [ucie-system.md](./ucie-system.md) | UCIE system rules | CRITICAL |
| [data-quality-enforcement.md](./data-quality-enforcement.md) | 99% accuracy rules | CRITICAL |

### 🟠 Feature-Specific

| File | Purpose | When to Read |
|------|---------|--------------|
| [authentication.md](./authentication.md) | Auth system guide | Working on auth |
| [openai-integration.md](./openai-integration.md) | OpenAI API patterns | Working with AI |
| [lunarcrush-api-guide.md](./lunarcrush-api-guide.md) | LunarCrush integration | Social sentiment |
| [caesar-api-reference.md](./caesar-api-reference.md) | Caesar API usage | Research features |

### 🟡 Design & Development

| File | Purpose | When to Read |
|------|---------|--------------|
| [STYLING-SPEC.md](./STYLING-SPEC.md) | Bitcoin Sovereign design | UI work |
| [bitcoin-sovereign-design.md](./bitcoin-sovereign-design.md) | Design philosophy | UI work |
| [mobile-development.md](./mobile-development.md) | Mobile guidelines | Mobile features |

### 🟢 Infrastructure

| File | Purpose | When to Read |
|------|---------|--------------|
| [api-integration.md](./api-integration.md) | API integration patterns | API work |
| [api-status.md](./api-status.md) | Current API status | Debugging |
| [git-workflow.md](./git-workflow.md) | Git practices | All development |
| [date-management.md](./date-management.md) | Date formatting | Documentation |

### 📁 Project Structure

| File | Purpose | When to Read |
|------|---------|--------------|
| [structure.md](./structure.md) | Project organization | New to project |
| [tech.md](./tech.md) | Technology stack | New to project |
| [product.md](./product.md) | Product overview | New to project |

---

## Key Rules Summary

### UCIE System Rules
1. **AI Analysis Happens LAST** - Only after all data cached
2. **Database is Source of Truth** - No in-memory caching
3. **Use Utility Functions** - `getCachedAnalysis()`, `setCachedAnalysis()`
4. **Check Data Quality** - Minimum 70% before AI

### Data Quality Rules
1. **99% Accuracy or Nothing** - No fallback/mock data
2. **No Placeholder Data** - Show errors, not fake data
3. **Validate All Responses** - Check before displaying

### Design Rules
1. **Black, Orange, White Only** - No other colors
2. **Thin Orange Borders** - 1-2px on black backgrounds
3. **Mobile-First** - 320px to 1920px+ responsive
4. **48px Touch Targets** - Minimum for accessibility

### Authentication Rules
1. **Session-Only** - No persistent authentication
2. **1-Hour Tokens** - Short-lived for security
3. **Database Verification** - Every request verified

---

## Quick Reference

### Color Palette
```css
--bitcoin-black: #000000
--bitcoin-orange: #F7931A
--bitcoin-white: #FFFFFF
```

### Font Stack
```css
/* UI & Headlines */
font-family: 'Inter', system-ui, sans-serif;

/* Data & Technical */
font-family: 'Roboto Mono', monospace;
```

### API Models
| Feature | Model | API |
|---------|-------|-----|
| UCIE Analysis | `gpt-5-mini` | Responses API |
| Whale Watch | `gpt-5-mini` | Responses API |
| Code Editing | `gpt-5.1-codex-max` | Responses API |

---

## Steering File Categories

### By Feature
- **UCIE**: `ucie-system.md`, `openai-integration.md`
- **Whale Watch**: `KIRO-AGENT-STEERING.md`
- **Authentication**: `authentication.md`
- **Social**: `lunarcrush-api-guide.md`
- **Research**: `caesar-api-reference.md`

### By Task Type
- **UI Development**: `STYLING-SPEC.md`, `bitcoin-sovereign-design.md`, `mobile-development.md`
- **API Work**: `api-integration.md`, `api-status.md`
- **AI Integration**: `openai-integration.md`, `ucie-system.md`
- **Documentation**: `date-management.md`, `AGENTS.md`

---

## Related Resources

### Specs
- [Spec Index](../specs/_INDEX.md)
- [Project Restructure](../specs/project-restructure/)

### Documentation
- [Production Features](../../docs/production-features/)
- [README](../../README.md)

### Knowledge Bank
- [Patterns](../knowledge/patterns/)
- [Decisions](../knowledge/decisions/)
- [Flows](../knowledge/flows/)

---

## Maintenance

### When to Update Steering Files
- New feature deployed
- API patterns change
- Rules are modified
- Issues discovered

### Review Cycle
- **Critical files**: Weekly review
- **Feature files**: When feature changes
- **Infrastructure**: Monthly review

---

## Creating New Steering Files

1. Create file in `.kiro/steering/`
2. Use consistent header format
3. Include "Last Updated" date
4. Add to this master reference
5. Cross-reference related files

### Template

```markdown
# [Topic] - Steering Guide

**Last Updated**: [Date]
**Status**: Active
**Priority**: [CRITICAL/HIGH/MEDIUM/LOW]

---

## Overview
[Brief description]

## Rules
[Key rules and guidelines]

## Implementation
[Code examples and patterns]

## Related Documentation
[Links to related files]
```

---

**Owner**: Development Team  
**Review Cycle**: Weekly
