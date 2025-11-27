# Date Management & Timestamp Accuracy - Agent Steering

**Priority**: 🚨 **CRITICAL** - Incorrect dates destroy document credibility  
**Status**: ✅ **ACTIVE ENFORCEMENT**  
**Version**: 1.0.0  
**Created**: January 27, 2025  
**Current Date**: **January 27, 2025** (Monday)

---

## 🚨 THE PROBLEM

**CRITICAL ISSUE IDENTIFIED**: Multiple documentation files across the project contain **incorrect future dates** that make no logical sense.

### Examples of Incorrect Dates Found:

```markdown
❌ WRONG: "Last Updated: August 20, 2025" (in AGENTS.md)
✅ CORRECT: "Last Updated: August 20, 2024"

❌ WRONG: "Last Updated: October 8, 2025" (in multiple files)
✅ CORRECT: "Last Updated: October 8, 2024"

❌ WRONG: "Last Updated: November 25, 2025" (in quantum-btc-super-spec)
✅ CORRECT: "Last Updated: November 25, 2024"

❌ WRONG: "Last Updated: November 17, 2025" (in COINGECKO test results)
✅ CORRECT: "Last Updated: November 17, 2024"
```

### Why This Happened:

When documents were created in **2024** (August, October, November), they were incorrectly timestamped with **2025** instead of **2024**. This creates confusion and makes the documentation appear unreliable.

---

## 📅 CURRENT DATE REFERENCE

**ALWAYS USE THIS AS YOUR SOURCE OF TRUTH:**

```
Current Date: January 27, 2025
Current Month: January 2025
Current Year: 2025
Day of Week: Monday
```

**When in doubt, ALWAYS verify the current date from the system context provided at the start of each conversation.**

---

## ✅ DATE FORMATTING RULES

### Rule 1: Use Correct Date Format

**ALWAYS use one of these approved formats:**

```markdown
✅ CORRECT FORMATS:
- "January 27, 2025" (Full month name, day, year)
- "January 2025" (Month and year only)
- "2025-01-27" (ISO 8601 format for technical docs)
- "Jan 27, 2025" (Abbreviated month for space-constrained contexts)
```

**NEVER use these formats:**

```markdown
❌ WRONG:
- "01/27/2025" (Ambiguous - US vs EU format)
- "27/01/2025" (Ambiguous - US vs EU format)
- "1-27-25" (Unclear year)
- "January 27th, 2025" (Unnecessary ordinal)
```

### Rule 2: Verify Year Accuracy

**BEFORE writing ANY date, ask yourself:**

1. **Is this date in the past?**
   - If YES → Use 2024 or earlier
   - Example: "October 8, 2024" (not 2025)

2. **Is this date today or recent?**
   - If YES → Use 2025
   - Example: "January 27, 2025" (correct)

3. **Is this date in the future?**
   - If YES → Double-check if it makes sense
   - Example: "February 15, 2025" (reasonable future date)

### Rule 3: Context-Specific Date Usage

**Different document types require different date precision:**

#### Specification Documents
```markdown
**Last Updated**: January 27, 2025
**Version**: 1.0.0
**Status**: ✅ Complete
```

#### Code Comments
```typescript
// Created: 2025-01-27
// Last Modified: 2025-01-27
// Author: Kiro AI Agent
```

#### Git Commit Messages
```bash
# Use ISO 8601 format
git commit -m "feat: Add date management steering (2025-01-27)"
```

#### User-Facing Documentation
```markdown
**Last Updated**: January 2025
**Version**: 1.0
```

---

## 🔍 DATE VALIDATION CHECKLIST

**BEFORE finalizing ANY document with a date, verify:**

- [ ] **Year is correct** (2024 for past events, 2025 for current/future)
- [ ] **Month is correct** (January = 01, February = 02, etc.)
- [ ] **Day is correct** (1-31 depending on month)
- [ ] **Format is consistent** (use approved formats only)
- [ ] **Date makes logical sense** (not in impossible future)
- [ ] **All dates in document are consistent** (no mixing 2024/2025 incorrectly)

---

## 📋 COMMON DATE SCENARIOS

### Scenario 1: Creating a New Document Today

```markdown
✅ CORRECT:
**Created**: January 27, 2025
**Last Updated**: January 27, 2025
**Version**: 1.0.0
```

### Scenario 2: Updating an Existing Document

```markdown
✅ CORRECT:
**Created**: November 15, 2024
**Last Updated**: January 27, 2025
**Version**: 1.2.0
```

### Scenario 3: Referencing Past Events

```markdown
✅ CORRECT:
- Deployed to production: October 8, 2024
- Bug fixed: November 17, 2024
- Feature added: December 3, 2024
- System upgraded: January 15, 2025
```

### Scenario 4: Planning Future Work

```markdown
✅ CORRECT:
**Planned Release**: February 15, 2025
**Target Completion**: March 1, 2025
**Next Review**: February 1, 2025
```

---

## 🛠️ FIXING EXISTING INCORRECT DATES

### Step 1: Identify Incorrect Dates

**Search for these patterns:**

```bash
# Find files with potentially incorrect 2025 dates
grep -r "August.*2025" .
grep -r "September.*2025" .
grep -r "October.*2025" .
grep -r "November.*2025" .
grep -r "December.*2025" .
```

### Step 2: Determine Correct Date

**Ask these questions:**

1. **When was this document actually created?**
   - Check git history: `git log --follow <filename>`
   - Check file creation date: `ls -la <filename>`

2. **Does the content reference events that happened in 2024?**
   - If YES → Date should be 2024

3. **Is this a recent update (January 2025)?**
   - If YES → Date should be 2025

### Step 3: Update the Date

```markdown
❌ BEFORE:
**Last Updated**: October 8, 2025

✅ AFTER:
**Last Updated**: October 8, 2024
```

---

## 🎯 SPECIAL CASES

### Case 1: Specification Documents

**Specs should have THREE dates:**

```markdown
**Created**: November 15, 2024 (when spec was first written)
**Last Updated**: January 27, 2025 (when spec was last modified)
**Version**: 1.2.0 (semantic versioning)
```

### Case 2: Status Reports

**Status reports should have TIMESTAMP precision:**

```markdown
**Report Date**: January 27, 2025
**Report Time**: 14:30 UTC
**Status**: ✅ Operational
```

### Case 3: Deployment Logs

**Deployment logs should use ISO 8601:**

```markdown
**Deployed**: 2025-01-27T14:30:00Z
**Environment**: Production
**Status**: Success
```

### Case 4: Changelog Entries

**Changelogs should be chronological:**

```markdown
## [1.2.0] - 2025-01-27
### Added
- Date management steering file

## [1.1.0] - 2024-12-15
### Fixed
- Authentication bug

## [1.0.0] - 2024-11-01
### Added
- Initial release
```

---

## 🚫 FORBIDDEN PRACTICES

### ❌ NEVER Do This:

1. **Don't guess the year**
   ```markdown
   ❌ "Last Updated: October 2025" (when you're not sure)
   ✅ "Last Updated: January 27, 2025" (verified current date)
   ```

2. **Don't use relative dates in permanent docs**
   ```markdown
   ❌ "Updated yesterday"
   ❌ "Created last week"
   ❌ "Modified 3 days ago"
   ✅ "Last Updated: January 27, 2025"
   ```

3. **Don't mix date formats in same document**
   ```markdown
   ❌ "Created: 01/15/2025" and "Updated: January 27, 2025"
   ✅ "Created: January 15, 2025" and "Updated: January 27, 2025"
   ```

4. **Don't use ambiguous dates**
   ```markdown
   ❌ "Updated: 01/02/2025" (Is this Jan 2 or Feb 1?)
   ✅ "Updated: January 2, 2025" or "Updated: February 1, 2025"
   ```

---

## 📊 DATE ACCURACY MONITORING

### Weekly Date Audit

**Every Monday, run this check:**

```bash
# Find all "Last Updated" dates
grep -r "Last Updated" . --include="*.md" | grep -E "202[45]"

# Verify each date makes sense
# Flag any dates that seem incorrect
```

### Monthly Date Review

**First day of each month:**

1. Review all specification documents
2. Update "Last Updated" dates for modified files
3. Verify version numbers are incremented
4. Check changelog is up to date

---

## 🎓 TRAINING EXAMPLES

### Example 1: Creating a New Spec (Today)

```markdown
# My New Feature Specification

**Version**: 1.0.0
**Status**: 🚀 Draft
**Priority**: HIGH
**Created**: January 27, 2025
**Last Updated**: January 27, 2025

---

## Overview
This specification defines...
```

### Example 2: Updating an Old Spec

```markdown
# Existing Feature Specification

**Version**: 1.3.0 (was 1.2.0)
**Status**: ✅ Complete
**Priority**: HIGH
**Created**: August 15, 2024 (unchanged)
**Last Updated**: January 27, 2025 (updated from November 20, 2024)

---

## Changelog
- **v1.3.0** (2025-01-27): Added new requirements
- **v1.2.0** (2024-11-20): Fixed validation rules
- **v1.1.0** (2024-09-10): Initial draft
```

### Example 3: Status Report

```markdown
# System Status Report

**Report Date**: January 27, 2025
**Report Time**: 14:45 UTC
**Reporting Period**: January 20-27, 2025
**Status**: 🟢 All Systems Operational

---

## Recent Events
- **2025-01-26**: Database backup completed
- **2025-01-25**: Security patch applied
- **2025-01-24**: Performance optimization deployed
- **2024-12-31**: Year-end maintenance completed
```

---

## 🔧 IMPLEMENTATION CHECKLIST

**For Kiro AI Agents:**

When creating or updating ANY document:

- [ ] Check current date from system context
- [ ] Use approved date format (Month Day, Year)
- [ ] Verify year is correct (2024 for past, 2025 for current)
- [ ] Include "Last Updated" field in document header
- [ ] Update version number if content changed
- [ ] Add changelog entry if significant changes
- [ ] Verify all dates in document are consistent
- [ ] Double-check no future dates unless intentional
- [ ] Confirm date makes logical sense in context

---

## 📚 QUICK REFERENCE

### Current Date Information

```
Today: January 27, 2025 (Monday)
This Week: January 20-26, 2025
This Month: January 2025
This Quarter: Q1 2025
This Year: 2025
Last Year: 2024
```

### Date Format Templates

```markdown
# Full Date
January 27, 2025

# Month/Year Only
January 2025

# ISO 8601 (Technical)
2025-01-27

# ISO 8601 with Time
2025-01-27T14:30:00Z

# Abbreviated
Jan 27, 2025
```

### Common Mistakes to Avoid

```markdown
❌ "Last Updated: October 8, 2025" (impossible past date)
✅ "Last Updated: October 8, 2024"

❌ "Created: 11/15/2025" (ambiguous format)
✅ "Created: November 15, 2024"

❌ "Updated yesterday" (relative date)
✅ "Updated: January 26, 2025"
```

---

## 🎯 SUCCESS CRITERIA

This date management system is successful when:

- ✅ **100% of new documents** have correct dates
- ✅ **Zero incorrect future dates** in documentation
- ✅ **Consistent date formats** across all files
- ✅ **Clear version history** with accurate timestamps
- ✅ **Reliable changelog** with chronological entries
- ✅ **Trustworthy documentation** that users can rely on

---

## 📞 SUPPORT

**If you're unsure about a date:**

1. Check the system context at the start of the conversation
2. Verify the current date: **January 27, 2025**
3. Use git history to check file creation dates
4. When in doubt, use today's date for "Last Updated"
5. Ask for clarification if the date is critical

---

**Status**: 🟢 **ACTIVE ENFORCEMENT**  
**Priority**: **CRITICAL**  
**Compliance**: **MANDATORY**

**Remember**: Incorrect dates destroy credibility. Always verify before writing!

---

*This steering file was created on January 27, 2025 to address systematic date accuracy issues across the project.*
