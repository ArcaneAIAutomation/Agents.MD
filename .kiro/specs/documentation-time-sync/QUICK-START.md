# Documentation Time Sync - Quick Start Guide

**For**: When you're ready to execute the documentation sync  
**Time Required**: 5-10 minutes (after implementation)  
**Risk Level**: Low (full rollback capability)

---

## Pre-Execution Checklist

Before running the sync, verify:

- [ ] All code changes are committed to git
- [ ] You have a recent backup of the repository
- [ ] You understand which files will be updated vs. preserved
- [ ] You have reviewed the spec files (requirements.md, design.md)

---

## Execution Steps

### Step 1: Dry Run (Preview Changes)

```bash
# See what will change without applying
npm run doc-sync --dry-run

# Review the preview report
cat DOCUMENTATION-SYNC-PREVIEW-*.md
```

**What to Check**:
- ✅ Steering files marked for update
- ✅ Historical files marked as preserved
- ✅ No unexpected files in the change list
- ✅ Dates look correct

### Step 2: Create Backup

```bash
# Backup is automatic, but you can create manual backup
npm run doc-sync backup

# Verify backup created
ls -la .kiro/backups/
```

**Expected Output**:
```
.kiro/backups/documentation-sync-2025-11-23-183000/
  - manifest.json
  - files/
    - KIRO-AGENT-STEERING.md
    - ucie-system.md
    - ... (all files to be modified)
```

### Step 3: Execute Sync

```bash
# Run the actual sync
npm run doc-sync

# Or with specific options
npm run doc-sync --update-steering --create-status --verify-system
```

**What Happens**:
1. Creates backup automatically
2. Classifies all documentation files
3. Updates steering files to current date
4. Preserves historical completion dates
5. Creates current status report
6. Generates documentation policy
7. Creates change report

**Expected Duration**: 2-5 minutes

### Step 4: Review Results

```bash
# Read the change report
cat DOCUMENTATION-SYNC-REPORT-*.md

# Check the new status report
cat SYSTEM-STATUS-NOVEMBER-2025.md

# Review the policy document
cat .kiro/DOCUMENTATION-POLICY.md
```

**What to Verify**:
- ✅ All steering files show November 23, 2025
- ✅ Historical files still show January 27, 2025
- ✅ Status report looks accurate
- ✅ Policy document is clear and complete

### Step 5: Test the System (Optional)

```bash
# Verify APIs still work
npm run test:apis

# Check authentication
npm run test:auth

# Verify ATGE system
npm run test:atge
```

### Step 6: Commit Changes

```bash
# Review git diff
git diff

# Stage changes
git add -A

# Commit with descriptive message
git commit -m "docs: Sync documentation timestamps to November 2025

- Updated steering files to current date
- Preserved historical completion dates
- Created current status report
- Established documentation policy

Spec: .kiro/specs/documentation-time-sync/"

# Push to remote
git push origin main
```

---

## If Something Goes Wrong

### Rollback to Previous State

```bash
# List available backups
npm run doc-sync list-backups

# Rollback to specific backup
npm run doc-sync rollback <backup-id>

# Or rollback to most recent
npm run doc-sync rollback latest
```

**Rollback Process**:
1. Restores all files from backup
2. Verifies checksums
3. Reports any issues
4. Leaves you in pre-sync state

### Common Issues

#### Issue 1: "Backup failed - insufficient disk space"
**Solution**: Free up disk space and try again

#### Issue 2: "File locked - cannot update"
**Solution**: Close any editors with documentation files open

#### Issue 3: "Verification failed - API not responding"
**Solution**: Run sync without verification flag: `npm run doc-sync --no-verify`

#### Issue 4: "Git conflict detected"
**Solution**: Commit or stash changes before running sync

---

## Post-Execution Tasks

### 1. Deploy Automation (Recommended)

```bash
# Install git hooks for automatic updates
npm run doc-sync install-hooks

# Set up scheduled stale detection
npm run doc-sync setup-automation

# Test the hooks
echo "test" >> .kiro/steering/test.md
git add .kiro/steering/test.md
git commit -m "test: Verify git hook updates timestamp"
# Should see "Last Updated" automatically updated
```

### 2. Update README

Add a note to the main README.md:

```markdown
## Documentation

This project uses automated documentation timestamp management. 

- **Living Documentation**: Steering files and guides are automatically updated
- **Historical Records**: Completion reports preserve their original dates
- **Policy**: See `.kiro/DOCUMENTATION-POLICY.md` for details
```

### 3. Notify Team

Send a message to your team:

```
📚 Documentation Update

We've synchronized all documentation timestamps to November 2025.

What changed:
- Steering files now show current dates
- Historical completion reports preserved
- New current status report created
- Documentation policy established

What this means:
- Documentation now appears current and maintained
- Clear distinction between current and historical info
- Automatic updates going forward (git hooks installed)

Questions? See .kiro/specs/documentation-time-sync/
```

---

## Verification Checklist

After execution, verify:

- [ ] Steering files show November 23, 2025
- [ ] Historical files still show January 27, 2025
- [ ] New status report exists and is accurate
- [ ] Policy document exists and is clear
- [ ] Change report lists all modifications
- [ ] Git hooks are installed (if automation deployed)
- [ ] No broken links in documentation
- [ ] All referenced files still exist
- [ ] System still functions correctly

---

## Success Criteria

You'll know the sync was successful when:

✅ **Credibility Restored**: Documentation appears current  
✅ **Clarity Achieved**: Clear distinction between current and historical  
✅ **Automation Active**: Future updates happen automatically  
✅ **Safety Maintained**: Full rollback capability available  
✅ **Quality Verified**: System claims match actual state  

---

## Maintenance

### Weekly
- Review stale documentation alerts
- Check automation logs

### Monthly
- Run verification to update "Last Verified" timestamps
- Review documentation health metrics

### Quarterly
- Audit documentation policy effectiveness
- Update classification rules if needed

---

## Support

If you encounter issues:

1. **Check the logs**: `cat .kiro/logs/doc-sync-*.log`
2. **Review the spec**: `.kiro/specs/documentation-time-sync/`
3. **Rollback if needed**: `npm run doc-sync rollback latest`
4. **Ask for help**: Include error logs and change report

---

**Ready to Execute?**

1. ✅ Read this guide
2. ✅ Review the spec
3. ✅ Run dry-run
4. ✅ Execute sync
5. ✅ Verify results
6. ✅ Commit changes
7. ✅ Deploy automation

**Good luck! The documentation will thank you.** 📚✨
