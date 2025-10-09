# 🚀 Deployment Quick Reference

## One-Command Deployment

### Windows
```powershell
npm run deploy
```

### Mac/Linux
```bash
npm run deploy:unix
```

### Any Platform (Ultra-Fast)
```bash
npm run quick-deploy
```

---

## Custom Commit Messages

### Windows
```powershell
.\deploy.ps1 "✨ Your commit message here"
```

### Mac/Linux
```bash
./deploy.sh "✨ Your commit message here"
```

---

## Common Deployment Commands

| What | Command |
|------|---------|
| **Deploy with default message** | `npm run deploy` |
| **Deploy with custom message** | `.\deploy.ps1 "message"` |
| **Quick deploy** | `npm run quick-deploy` |
| **Check status** | `npm run status` |
| **View commits** | `npm run log` |

---

## Commit Message Templates

```bash
# Task completion
.\deploy.ps1 "✅ Task 12.7: Validate glow effects"

# Bug fix
.\deploy.ps1 "🐛 fix: Fix mobile button glow"

# New feature
.\deploy.ps1 "✨ feat: Add Bitcoin block components"

# Styling update
.\deploy.ps1 "🎨 style: Update Bitcoin Sovereign colors"

# Documentation
.\deploy.ps1 "📝 docs: Update deployment guide"
```

---

## Deployment Workflow

1. **Make changes** to your code
2. **Test locally**: `npm run dev`
3. **Deploy**: `npm run deploy`
4. **Monitor**: Check Vercel dashboard
5. **Verify**: Test live site

---

## URLs

- **Production:** https://agents-md.vercel.app
- **Dashboard:** https://vercel.com/dashboard
- **GitHub:** https://github.com/ArcaneAIAutomation/Agents.MD

---

## Troubleshooting

### Script won't run (Windows)
```powershell
Set-ExecutionPolicy RemoteSigned
```

### Script won't run (Mac/Linux)
```bash
chmod +x deploy.sh
```

### No changes to deploy
```bash
git status  # Check for changes
```

### Push failed
```bash
git pull origin main  # Pull first, then deploy
```

---

## What Happens When You Deploy

1. ✅ Stages all changes
2. ✅ Commits with your message
3. ✅ Pushes to GitHub main branch
4. ✅ Triggers Vercel auto-deployment
5. ✅ Builds in ~2-3 minutes
6. ✅ Deploys to production

---

**Need Help?** See `DEPLOYMENT-AUTOMATION-GUIDE.md` for full documentation.
