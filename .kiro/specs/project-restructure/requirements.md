# Project Restructure - Requirements Specification

**Version**: 1.0.0  
**Status**: 🚀 In Progress  
**Priority**: HIGH  
**Created**: December 19, 2025  
**Last Updated**: December 19, 2025

---

## Overview

Strategic restructuring of the Agents.MD (Bitcoin Sovereign Technology) cryptocurrency intelligence platform using a hybrid approach combining "Surgical Precision" (fix only what's broken) and "Kiro-Native Evolution" (leverage Kiro's full capabilities).

### Problem Statement

The project has accumulated significant technical debt with:
- 16 specs in `.kiro/specs/` (some outdated, some complete)
- 18 steering files in `.kiro/steering/` (no master index)
- 37 docs in `docs/` folder (no organization)
- 700+ markdown files in root (documentation sprawl)
- UCIE at 85% complete with critical path blocking downstream features

### Critical Path Issue

**UCIE → ATGE → Einstein Dependency Chain:**
- UCIE (85% complete): Data flows through 13 APIs → Cache → Context Aggregator
- **FAILURE POINT**: GPT-5.1 analysis step not receiving properly formatted context
- ATGE: Blocked waiting for UCIE completion
- Einstein: Blocked waiting for ATGE completion

---

## User Stories (EARS Format)

### US-1: Production Feature Documentation

**EARS**: When a developer needs to understand a working production feature, the system shall provide comprehensive documentation in `docs/production-features/` that includes architecture, API endpoints, data flow, and troubleshooting guides.

**Acceptance Criteria**:
- [ ] AC-1.1: `docs/production-features/whale-watch.md` exists with complete documentation
- [ ] AC-1.2: `docs/production-features/news-wire.md` exists with complete documentation
- [ ] AC-1.3: `docs/production-features/btc-eth-analysis.md` exists with complete documentation
- [ ] AC-1.4: `docs/production-features/authentication.md` exists with complete documentation
- [ ] AC-1.5: Each doc includes: Overview, Architecture, API Endpoints, Data Flow, Troubleshooting
- [ ] AC-1.6: Each doc follows Bitcoin Sovereign styling (black, orange, white only)

### US-2: UCIE Context Aggregator Fix

**EARS**: When UCIE collects data from all 13 APIs and stores it in the database cache, the system shall properly format the context for GPT-5.1 analysis using the `formatContextForAI()` function.

**Acceptance Criteria**:
- [ ] AC-2.1: `formatContextForAI()` returns properly structured prompt for GPT-5.1
- [ ] AC-2.2: All 10 data sources are included when available (market, technical, sentiment, news, on-chain, risk, predictions, derivatives, research, gptAnalysis)
- [ ] AC-2.3: Data quality score is calculated correctly (available sources / total sources * 100)
- [ ] AC-2.4: GPT-5.1 analysis auto-starts after Phase 1 data collection completes
- [ ] AC-2.5: Minimum 70% data quality required before AI analysis
- [ ] AC-2.6: Context includes proper JSON structure for each data source

### US-3: Spec Navigation Index

**EARS**: When a developer needs to find relevant specs, the system shall provide a master index at `.kiro/specs/_INDEX.md` that categorizes all specs by status, feature area, and dependencies.

**Acceptance Criteria**:
- [ ] AC-3.1: `_INDEX.md` lists all 16+ specs with status (Complete, In Progress, Blocked, Deprecated)
- [ ] AC-3.2: Specs are categorized by feature area (UCIE, Trading, Authentication, UI, etc.)
- [ ] AC-3.3: Dependencies between specs are documented
- [ ] AC-3.4: Quick links to requirements.md, design.md, tasks.md for each spec
- [ ] AC-3.5: Last updated date for each spec

### US-4: Steering Master Reference

**EARS**: When a developer needs to understand project rules and guidelines, the system shall provide a master steering reference at `.kiro/steering/_MASTER.md` that indexes all steering files by priority and topic.

**Acceptance Criteria**:
- [ ] AC-4.1: `_MASTER.md` lists all 18+ steering files with descriptions
- [ ] AC-4.2: Steering files are categorized by priority (Critical, High, Medium, Low)
- [ ] AC-4.3: Topic-based organization (UCIE, API, Styling, Mobile, etc.)
- [ ] AC-4.4: Quick reference for most common rules
- [ ] AC-4.5: Links to detailed steering files

### US-5: Vercel Preview Deployment

**EARS**: When a developer pushes changes to a feature branch, the system shall automatically create a Vercel preview deployment for testing before production.

**Acceptance Criteria**:
- [ ] AC-5.1: `vercel.json` includes preview deployment configuration
- [ ] AC-5.2: Preview deployments use staging environment variables
- [ ] AC-5.3: Preview URL is generated for each pull request
- [ ] AC-5.4: Preview deployments have 60-second timeout (Vercel Pro)
- [ ] AC-5.5: Production deployments remain protected

### US-6: Knowledge Bank Structure

**EARS**: When a developer needs to understand patterns, decisions, or data flows, the system shall provide a Knowledge Bank at `.kiro/knowledge/` with organized documentation.

**Acceptance Criteria**:
- [ ] AC-6.1: `.kiro/knowledge/patterns/` contains reusable code patterns
- [ ] AC-6.2: `.kiro/knowledge/decisions/` contains ADRs (Architecture Decision Records)
- [ ] AC-6.3: `.kiro/knowledge/flows/` contains data flow diagrams
- [ ] AC-6.4: Each knowledge file follows consistent template
- [ ] AC-6.5: Knowledge files are cross-referenced with specs

### US-7: Feature Registry

**EARS**: When a developer needs to understand the status of all features, the system shall provide a Feature Registry at `.kiro/registry/features.json` with real-time status tracking.

**Acceptance Criteria**:
- [ ] AC-7.1: `features.json` lists all features with status (Working, In Progress, Blocked, Deprecated)
- [ ] AC-7.2: Each feature includes: name, status, dependencies, spec link, last updated
- [ ] AC-7.3: Dependencies are tracked (UCIE → ATGE → Einstein)
- [ ] AC-7.4: Blocked features show blocking reason
- [ ] AC-7.5: Registry can be queried programmatically

---

## Technical Requirements

### TR-1: Database Requirements

- **TR-1.1**: All UCIE data MUST be stored in Supabase PostgreSQL
- **TR-1.2**: Use `getCachedAnalysis()` and `setCachedAnalysis()` from `lib/ucie/cacheUtils.ts`
- **TR-1.3**: No in-memory caching (serverless functions restart frequently)
- **TR-1.4**: Cache TTL: 5 minutes for market data, 24 hours for research

### TR-2: AI Integration Requirements

- **TR-2.1**: AI analysis happens LAST, only after all data is cached
- **TR-2.2**: Use `chatgpt-4o-latest` for UCIE analysis (Chat Completions API)
- **TR-2.3**: Use `gpt-5.1` for Whale Watch deep dive (Responses API)
- **TR-2.4**: Minimum 70% data quality before AI analysis
- **TR-2.5**: Use `extractResponseText()` and `validateResponseText()` utilities

### TR-3: Styling Requirements

- **TR-3.1**: Bitcoin Sovereign aesthetic: black (#000000), orange (#F7931A), white (#FFFFFF) only
- **TR-3.2**: Thin orange borders (1-2px) on black backgrounds
- **TR-3.3**: Inter font for UI, Roboto Mono for data
- **TR-3.4**: Mobile-first responsive design (320px to 1920px+)
- **TR-3.5**: WCAG 2.1 AA compliance

### TR-4: API Requirements

- **TR-4.1**: 13/14 APIs working (92.9% uptime)
- **TR-4.2**: CoinGlass requires paid upgrade (derivatives data)
- **TR-4.3**: Vercel Pro timeout: 60 seconds for standard, 300 seconds for Caesar
- **TR-4.4**: Rate limiting implemented for all external APIs

---

## Dependencies

### Upstream Dependencies
- Supabase PostgreSQL database (operational)
- Vercel Pro deployment (operational)
- OpenAI API (operational)
- 13 external data APIs (operational)

### Downstream Dependencies
- **ATGE**: Blocked by UCIE completion
- **Einstein**: Blocked by ATGE completion
- **Quantum BTC**: Independent (operational)

---

## Success Criteria

### Phase 1: Documentation (2 hours)
- [ ] 4 production feature docs created
- [ ] Spec index created
- [ ] Steering master reference created

### Phase 2: UCIE Fix (4 hours)
- [ ] `formatContextForAI()` verified working
- [ ] GPT-5.1 analysis auto-starts correctly
- [ ] End-to-end UCIE flow tested

### Phase 3: Infrastructure (2 hours)
- [ ] Vercel preview deployment configured
- [ ] Knowledge Bank structure created
- [ ] Feature Registry created

### Overall Success
- [ ] UCIE reaches 100% completion
- [ ] ATGE unblocked
- [ ] Einstein unblocked
- [ ] Documentation sprawl reduced by 50%

---

## Risk Assessment

### High Risk
- **UCIE Fix Complexity**: May require deeper investigation of GPT-5.1 integration
- **Mitigation**: Start with logging to identify exact failure point

### Medium Risk
- **Documentation Effort**: 700+ files to organize
- **Mitigation**: Focus on critical path first, defer cleanup

### Low Risk
- **Vercel Configuration**: Well-documented process
- **Mitigation**: Use existing vercel.json as base

---

## References

- `.kiro/steering/ucie-system.md` - UCIE system rules
- `.kiro/steering/KIRO-AGENT-STEERING.md` - Complete system guide
- `lib/ucie/contextAggregator.ts` - Context aggregation code
- `lib/ucie/cacheUtils.ts` - Cache utilities
- `.kiro/steering/openai-integration.md` - GPT-5.1 integration patterns
