# 🖨️ PRINT THIS - Sync Quick Guide

**Keep this near your computer for quick reference!**

---

## 🚀 ESSENTIAL COMMANDS

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  START WORK:     npm run sync-start                 │
│                                                     │
│  END WORK:       npm run sync-end                   │
│                                                     │
│  QUICK SYNC:     npm run sync-quick                 │
│                                                     │
│  CHECK STATUS:   npm run sync-status                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📅 DAILY WORKFLOW

### Morning (Home or Office)
```
1. cd Agents.MD
2. npm run sync-start
3. npm run dev
```

### Evening (Before Leaving)
```
1. npm run sync-end
```

---

## 🎯 QUICK ACTIONS

| Need to... | Run this... |
|------------|-------------|
| Start work | `npm run sync-start` |
| End work | `npm run sync-end` |
| Quick sync | `npm run sync-quick` |
| Check status | `npm run sync-status` |
| See commits | `npm run log` |

---

## 📊 STATUS INDICATORS

```
✅  Everything synced - Continue working
⚠️   Uncommitted changes - Run sync-end
⬆️   Need to push - Run sync-end
⬇️   Need to pull - Run sync-start
❌  Conflict - Resolve manually
```

---

## 🚨 IF CONFLICTS OCCUR

```
1. Open conflicted files
2. Resolve conflicts
3. git add .
4. git rebase --continue
5. npm run sync-quick
```

---

## 💡 REMEMBER

- ✅ Always sync-start when beginning work
- ✅ Always sync-end when finishing work
- ✅ Check sync-status if unsure
- ❌ Never commit .env.local files

---

## 🆘 EMERGENCY

```
# See what happened
git log --oneline -10

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Check current status
npm run sync-status
```

---

## 📞 HELP

- Read: SYNC-GUIDE.md
- Check: TROUBLESHOOTING.md
- Status: npm run sync-status

---

**🖨️ PRINT THIS PAGE AND KEEP IT VISIBLE!**

---

## ✂️ CUT HERE - DESK REFERENCE CARD ✂️

```
╔═══════════════════════════════════════════════════════╗
║           AGENTS.MD SYNC QUICK REFERENCE              ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  START WORK:    npm run sync-start                    ║
║  END WORK:      npm run sync-end                      ║
║  QUICK SYNC:    npm run sync-quick                    ║
║  CHECK STATUS:  npm run sync-status                   ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║  DAILY WORKFLOW:                                      ║
║  1. cd Agents.MD                                      ║
║  2. npm run sync-start                                ║
║  3. npm run dev                                       ║
║  4. [work on project]                                 ║
║  5. npm run sync-end                                  ║
╠═══════════════════════════════════════════════════════╣
║  STATUS:                                              ║
║  ✅ Synced    ⚠️ Uncommitted    ⬆️ Push    ⬇️ Pull     ║
╠═══════════════════════════════════════════════════════╣
║  REMEMBER:                                            ║
║  • Sync at start of work                              ║
║  • Sync at end of work                                ║
║  • Check status if unsure                             ║
╚═══════════════════════════════════════════════════════╝
```

---

**Fold along dotted line and keep on desk**

```
┌─────────────────────────────────────────────────────┐
│  🏠 HOME COMPUTER                                    │
│  Location: _________________________________        │
│  Last Sync: _________________________________       │
│  Status: ✅ ⚠️ ⬆️ ⬇️ (circle one)                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  🏢 OFFICE COMPUTER                                  │
│  Location: _________________________________        │
│  Last Sync: _________________________________       │
│  Status: ✅ ⚠️ ⬆️ ⬇️ (circle one)                    │
└─────────────────────────────────────────────────────┘
```

---

## 📱 MOBILE REFERENCE (Take a Photo!)

```
╔════════════════════════════════════╗
║     SYNC COMMANDS CHEAT SHEET     ║
╠════════════════════════════════════╣
║                                    ║
║  START:  npm run sync-start        ║
║  END:    npm run sync-end          ║
║  QUICK:  npm run sync-quick        ║
║  STATUS: npm run sync-status       ║
║                                    ║
║  WORKFLOW:                         ║
║  1. sync-start                     ║
║  2. npm run dev                    ║
║  3. [work]                         ║
║  4. sync-end                       ║
║                                    ║
╚════════════════════════════════════╝
```

**Take a photo of this with your phone for quick reference!**

---

## 🎨 COLOR-CODED WORKFLOW

```
🟢 START WORK
   └─ npm run sync-start

🔵 DO WORK
   └─ npm run dev

🟡 CHECK STATUS (Optional)
   └─ npm run sync-status

🟠 QUICK SYNC (Optional)
   └─ npm run sync-quick

🔴 END WORK
   └─ npm run sync-end
```

---

## 📋 WEEKLY CHECKLIST

```
Monday:    [ ] sync-start  [ ] work  [ ] sync-end
Tuesday:   [ ] sync-start  [ ] work  [ ] sync-end
Wednesday: [ ] sync-start  [ ] work  [ ] sync-end
Thursday:  [ ] sync-start  [ ] work  [ ] sync-end
Friday:    [ ] sync-start  [ ] work  [ ] sync-end
```

---

## 🎯 TROUBLESHOOTING QUICK FIX

```
Problem: Not syncing
Fix: npm run sync-status

Problem: Conflicts
Fix: Resolve → git add . → git rebase --continue

Problem: Forgot to sync
Fix: npm run sync-quick

Problem: Unsure of status
Fix: npm run sync-status
```

---

**🖨️ PRINT THIS ENTIRE PAGE FOR COMPLETE REFERENCE!**

**Or just print the desk reference card section above.**

---

**Last Updated**: October 24, 2025  
**Version**: 1.0.0  
**Project**: Agents.MD Auto-Sync System
