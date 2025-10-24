# 🚀 Sync Quick Reference Card

## Essential Commands

```bash
npm run sync-start    # Start work (pull latest)
npm run sync-end      # End work (commit & push)
npm run sync-quick    # Full sync in one command
npm run sync-status   # Check sync status
```

---

## Daily Workflow

### 🌅 Morning (Home or Office)
```bash
cd Agents.MD
npm run sync-start
npm run dev
```

### 🌙 Evening (Before Leaving)
```bash
npm run sync-end
```

---

## Quick Actions

| Situation | Command |
|-----------|---------|
| Starting work | `npm run sync-start` |
| Ending work | `npm run sync-end` |
| Quick sync | `npm run sync-quick` |
| Check status | `npm run sync-status` |
| Custom message | `npm run sync-quick "Your message"` |

---

## Status Indicators

| Symbol | Meaning | Action |
|--------|---------|--------|
| ✅ | Everything synced | Continue working |
| ⚠️ | Uncommitted changes | Run `sync-end` |
| ⬆️ | Need to push | Run `sync-end` |
| ⬇️ | Need to pull | Run `sync-start` |
| ❌ | Conflict | Resolve manually |

---

## Conflict Resolution

```bash
# If you see conflicts:
1. Open conflicted files
2. Resolve conflicts
3. git add .
4. git rebase --continue
5. npm run sync-quick
```

---

## Emergency Commands

```bash
# See recent commits
npm run log

# See what changed
git status

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all changes (CAREFUL!)
git reset --hard origin/main
```

---

## Remember

- ✅ Always `sync-start` when beginning work
- ✅ Always `sync-end` when finishing work
- ✅ Check `sync-status` if unsure
- ✅ Use `sync-quick` for fast updates
- ❌ Never commit `.env.local` files

---

**Print this and keep it near your computer!**
