# Agents.MD — AI Agent Guide

This document describes how AI agents (Kiro) interact with this codebase and the conventions they follow.

## Project Overview

**Bitcoin Sovereign Technology** is a cryptocurrency intelligence platform. The codebase uses Kiro specs and steering files to guide AI-assisted development.

## Kiro Steering Files

All steering files live in `.kiro/steering/`. They are automatically loaded by Kiro and define rules for:

| File | Purpose |
|------|---------|
| `KIRO-AGENT-STEERING.md` | Master system guide — read first |
| `ucie-system.md` | UCIE pipeline rules (AI analysis happens last) |
| `UCIE-PIPELINE-GUIDANCE.md` | Authoritative UCIE data flow reference |
| `openai-integration.md` | OpenAI API patterns (`gpt-5-mini`, Responses API) |
| `authentication.md` | Auth system guide |
| `STYLING-SPEC.md` | Bitcoin Sovereign design system |
| `data-quality-enforcement.md` | 99% accuracy rule — no fake/fallback data |
| `structure.md` | Project directory layout |
| `tech.md` | Technology stack |

## Kiro Specs

Feature specs live in `.kiro/specs/{feature-name}/` and contain three files:

- `requirements.md` — what to build
- `design.md` — how to build it
- `tasks.md` — implementation task list with status tracking

## Critical Rules for AI Agents

### UCIE System
1. AI analysis runs **last** — only after all data is cached in Supabase
2. Use `getCachedAnalysis()` / `setCachedAnalysis()` — never in-memory cache
3. Minimum 70% data quality before calling AI
4. Model: `gpt-5-mini` with `reasoning: { effort: 'medium' }`

### Data Quality
- No fallback/mock/placeholder data — show errors instead
- All API responses must be validated before display

### Design System
- Three colors only: `#000000`, `#F7931A`, `#FFFFFF`
- Thin orange borders on black backgrounds
- Mobile-first, 48px minimum touch targets

### Authentication
- Session-only cookies (no persistence)
- 1-hour JWT expiry
- Database verification on every request

## Development Workflow

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

Database scripts are in `scripts/` — all TypeScript, run with `npx tsx scripts/<name>.ts`.

## Git Workflow

All development happens on `main`. Push to main triggers automatic Vercel deployment.

```bash
git pull origin main   # Always pull before starting
git add -A
git commit -m "feat: description"
git push origin main
```
