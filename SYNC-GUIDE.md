# 🔄 Auto-Sync Guide - Work & Home Synchronization

## Overview

This guide explains how to automatically sync your work between home and office computers using the automated sync scripts.

---

## 🚀 Quick Start

### Starting Work (Home or Office)
```bash
npm run sync-start
```
This will:
- Pull latest changes from GitHub
- Check for conflicts
- Prepare your workspace

### Ending Work (Home or Office)
```bash
npm run sync-end
```
This will:
- Commit your changes
- Push to GitHub
- Sync with remote

### Quick Sync (One Command)
```bash
npm run sync-quick
# or with custom message
npm run sync-quick "Added new feature"
```
This will:
- Commit local changes
- Pull latest from remote
- Push your changes
- All in one command!

### Check Sync Status
```bash
npm run sync-status
```
This will show:
- Uncommitted changes
- Commits ahead/behind remote
- Recent commit history
- Recommendations

---

## 📋 Complete Workflow

### Morning at Home
```bash
cd Agents.MD
npm run sync-start        # Pull latest changes
npm run dev               # Start working
```

### Evening at Home (Before Leaving)
```bash
npm run sync-end          # Commit and push changes
```

### Morning at Office
```bash
cd Agents.MD
npm run sync-start        # Pull changes from home
npm run dev               # Continue working
```

### Evening at Office (Before Leaving)
```bash
npm run sync-end          # Commit and push changes
```

### Back Home
```bash
npm run sync-start        # Pull changes from office
# Continue the cycle...
```

---

## 🎯 Available Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run sync-start` | Pull latest changes | Start of work session |
| `npm run sync-end` | Commit and push changes | End of work session |
| `npm run sync-status` | Check sync status | Anytime to check status |
| `npm run sync-quick` | Full sync in one command | Quick sync anytime |
| `npm run sync` | Alias for sync-quick | Quick sync anytime |

---

## 💡 Best Practices

### 1. Always Start with Sync
```bash
# First thing when you sit down to work
npm run sync-start
```

### 2. Sync Before Leaving
```bash
# Last thing before leaving computer
npm run sync-end
```

### 3. Check Status Regularly
```bash
# Check if you're in sync
npm run sync-status
```

### 4. Use Quick Sync for Fast Updates
```bash
# When you need to sync quickly
npm run sync-quick
```

### 5. Commit Messages
The scripts will auto-generate commit messages, but you can provide custom ones:
```bash
# Custom commit message
npm run sync-quick "Fixed mobile responsive issues"
```

---

## 🔧 How It Works

### Sync Start Script
1. Checks for uncommitted changes
2. Offers to commit them before pulling
3. Fetches latest from remote
4. Pulls with rebase (avoids merge commits)
5. Handles conflicts gracefully

### Sync End Script
1. Detects uncommitted changes
2. Asks for commit message (or auto-generates)
3. Stages all changes
4. Commits with message
5. Pushes to remote

### Sync Quick Script
1. Commits any local changes
2. Pulls latest with rebase
3. Pushes to remote
4. All in one command!

### Sync Status Script
1. Shows uncommitted changes
2. Shows commits ahead/behind
3. Shows recent commit history
4. Provides recommendations

---

## 🚨 Handling Conflicts

### If Sync Start Shows Conflicts
```bash
# The script will stop and show:
❌ Merge conflict detected!
Please resolve conflicts manually and run:
  git rebase --continue

# Steps to resolve:
1. Open conflicted files in editor
2. Resolve conflicts (choose which changes to keep)
3. Save files
4. Run: git add .
5. Run: git rebase --continue
6. Run: npm run sync-quick
```

### If Sync End Fails
```bash
# Usually means remote has new changes
# Solution:
npm run sync-start        # Pull latest first
npm run sync-end          # Then push your changes
```

---

## 🎨 Workflow Examples

### Example 1: Normal Day
```bash
# Morning at home
npm run sync-start
npm run dev
# ... work on features ...
npm run sync-end

# Evening at office
npm run sync-start
npm run dev
# ... continue work ...
npm run sync-end
```

### Example 2: Quick Fix
```bash
# Make quick change
# ... edit files ...
npm run sync-quick "Quick fix for header"
# Done! Changes synced immediately
```

### Example 3: Check Before Meeting
```bash
# Before important meeting
npm run sync-status
# See if everything is synced
npm run sync-quick
# Ensure latest changes are pushed
```

---

## 🔐 Security Notes

### API Keys & Secrets
- **Never commit** `.env.local` file
- API keys stay local on each computer
- Each computer needs its own `.env.local`

### Git Ignore
The following are automatically ignored:
- `.env.local`
- `node_modules/`
- `.next/`
- Build artifacts

---

## 📊 Sync Status Indicators

### ✅ Everything Synced
```
✅ No uncommitted changes
✅ No commits to push
✅ Up to date with remote
```

### ⚠️ Need to Commit
```
⚠️  Uncommitted changes:
  M components/Header.tsx
  M styles/globals.css
```
**Action**: Run `npm run sync-end`

### ⬆️ Need to Push
```
⬆️  2 commit(s) ahead of remote (need to push)
```
**Action**: Run `npm run sync-end`

### ⬇️ Need to Pull
```
⬇️  3 commit(s) behind remote (need to pull)
```
**Action**: Run `npm run sync-start`

---

## 🎓 Advanced Usage

### Custom Commit Messages
```bash
# Sync with specific message
npm run sync-quick "feat: Added whale watch dashboard"
npm run sync-quick "fix: Mobile responsive issues"
npm run sync-quick "docs: Updated README"
```

### Check Specific Status
```bash
# See what changed
git status

# See recent commits
npm run log

# See detailed diff
git diff
```

### Manual Sync (If Scripts Fail)
```bash
# Pull changes
git pull origin main --rebase

# Commit changes
git add .
git commit -m "Your message"

# Push changes
git push origin main
```

---

## 🐛 Troubleshooting

### Problem: "Not in a git repository"
**Solution**: Make sure you're in the `Agents.MD` directory
```bash
cd Agents.MD
npm run sync-start
```

### Problem: "Push failed"
**Solution**: Remote has new changes, pull first
```bash
npm run sync-start
npm run sync-end
```

### Problem: "Merge conflict"
**Solution**: Resolve conflicts manually
```bash
# 1. Open conflicted files
# 2. Resolve conflicts
# 3. Continue:
git add .
git rebase --continue
npm run sync-quick
```

### Problem: Script won't run
**Solution**: Check PowerShell execution policy
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📱 Mobile/Remote Access

### Using GitHub Web Interface
If you need to check status remotely:
1. Go to https://github.com/ArcaneAIAutomation/Agents.MD
2. View recent commits
3. Check file changes
4. See sync status

### Using GitHub Mobile App
- View commits on the go
- Check sync status
- Review code changes
- Get notifications

---

## ✅ Daily Checklist

### Starting Work
- [ ] `cd Agents.MD`
- [ ] `npm run sync-start`
- [ ] `npm run dev`
- [ ] Start coding!

### During Work
- [ ] Save files frequently
- [ ] Check `npm run sync-status` periodically
- [ ] Commit logical chunks of work

### Ending Work
- [ ] Save all files
- [ ] `npm run sync-end`
- [ ] Verify push succeeded
- [ ] Close terminal

---

## 🎉 Benefits

### ✅ Automatic Synchronization
- No manual git commands needed
- Intelligent conflict detection
- Auto-generated commit messages

### ✅ Work Anywhere
- Seamless home/office switching
- Always have latest code
- Never lose work

### ✅ Safety Features
- Checks before overwriting
- Handles conflicts gracefully
- Shows clear status

### ✅ Time Saving
- One command to sync
- No complex git workflows
- Focus on coding, not syncing

---

## 📞 Support

### Need Help?
- Check `TROUBLESHOOTING.md` for common issues
- Review git status: `git status`
- Check sync status: `npm run sync-status`

### Emergency Recovery
If something goes wrong:
```bash
# See what happened
git log --oneline -10

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes (CAREFUL!)
git reset --hard origin/main
```

---

## 🔄 Sync Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    START WORK SESSION                    │
│                   npm run sync-start                     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Pull Latest Changes from GitHub             │
│              (Rebase to avoid merge commits)             │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    WORK ON PROJECT                       │
│                   (Edit files, code)                     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    END WORK SESSION                      │
│                    npm run sync-end                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Commit Changes & Push to GitHub             │
│              (Available on other computer)               │
└─────────────────────────────────────────────────────────┘
```

---

**Status**: ✅ Auto-Sync System Ready  
**Last Updated**: October 24, 2025  
**Version**: 1.0.0
