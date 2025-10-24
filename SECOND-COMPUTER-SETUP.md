# 🖥️ Second Computer Setup Guide

## Setting Up Agents.MD on Your Second Computer

This guide helps you set up the Agents.MD project on your second computer (home or office) so you can sync seamlessly.

---

## 📋 Prerequisites

- [ ] Git installed
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] GitHub account access
- [ ] API keys ready (OpenAI, CoinMarketCap, NewsAPI, Caesar)

---

## 🚀 Setup Steps

### Step 1: Clone the Repository

```bash
# Navigate to where you want the project
cd C:\Users\YourName\Projects
# or
cd ~/Projects

# Clone from GitHub
git clone https://github.com/ArcaneAIAutomation/Agents.MD.git

# Enter the directory
cd Agents.MD
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages (Next.js, React, TypeScript, etc.)

### Step 3: Create Environment File

```bash
# Copy the example file
copy .env.example .env.local
# or on Mac/Linux
cp .env.example .env.local
```

### Step 4: Add Your API Keys

Open `.env.local` in your editor and add:

```env
# Required API Keys
OPENAI_API_KEY=sk-your-openai-key-here
COINMARKETCAP_API_KEY=your-cmc-key-here
NEWS_API_KEY=your-newsapi-key-here
CAESAR_API_KEY=your-caesar-key-here

# Optional API Keys
COINGECKO_API_KEY=your-coingecko-key-here
```

**Important**: Use the SAME API keys as your first computer!

### Step 5: Test the Setup

```bash
# Pull latest changes (should already be up to date)
npm run sync-start

# Start development server
npm run dev
```

Open http://localhost:3000 to verify it works.

### Step 6: Verify Sync System

```bash
# Check sync status
npm run sync-status
```

You should see:
```
✅ No uncommitted changes
✅ No commits to push
✅ Up to date with remote
```

---

## ✅ Setup Complete!

Your second computer is now ready. You can now work seamlessly between computers.

---

## 🔄 First Sync Test

### On First Computer (Where You Just Worked)
```bash
# Make a small change (e.g., add a comment to a file)
# Then sync
npm run sync-end
```

### On Second Computer (New Setup)
```bash
# Pull the change
npm run sync-start

# Verify the change appears
# You should see the comment you added!
```

**If you see the change, sync is working! 🎉**

---

## 📝 Daily Workflow (Second Computer)

### Starting Work
```bash
cd Agents.MD
npm run sync-start    # Pull changes from first computer
npm run dev           # Start working
```

### Ending Work
```bash
npm run sync-end      # Push changes to GitHub
```

---

## 🔧 Troubleshooting

### Problem: "Git not found"
**Solution**: Install Git
- Windows: https://git-scm.com/download/win
- Mac: `brew install git`
- Linux: `sudo apt install git`

### Problem: "Node not found"
**Solution**: Install Node.js
- Download from: https://nodejs.org/
- Install version 18 or higher

### Problem: "npm not found"
**Solution**: npm comes with Node.js
- Reinstall Node.js
- Restart terminal

### Problem: "Permission denied"
**Solution**: Check folder permissions
```bash
# Windows (run as Administrator)
# Mac/Linux
sudo chown -R $USER:$USER ~/Projects/Agents.MD
```

### Problem: "API keys not working"
**Solution**: Check `.env.local`
- Make sure file is named exactly `.env.local`
- Check for typos in API keys
- Ensure no extra spaces
- Restart dev server after changes

### Problem: "Sync not working"
**Solution**: Check git configuration
```bash
# Set your git identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Check remote
git remote -v
# Should show: origin https://github.com/ArcaneAIAutomation/Agents.MD.git
```

---

## 🔐 Security Checklist

- [ ] `.env.local` created (NOT committed to git)
- [ ] API keys added to `.env.local`
- [ ] `.env.local` in `.gitignore` (already done)
- [ ] Never commit API keys to repository
- [ ] Keep API keys secure

---

## 📊 Verify Everything Works

### Checklist
- [ ] Repository cloned successfully
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created with API keys
- [ ] Dev server starts (`npm run dev`)
- [ ] Website loads at http://localhost:3000
- [ ] Sync status shows clean (`npm run sync-status`)
- [ ] Can pull changes (`npm run sync-start`)
- [ ] Can push changes (`npm run sync-end`)

---

## 🎓 Next Steps

### Learn the Sync Commands
```bash
npm run sync-start    # Start work
npm run sync-end      # End work
npm run sync-quick    # Quick sync
npm run sync-status   # Check status
```

### Read the Documentation
- **SYNC-GUIDE.md** - Complete sync guide
- **SYNC-QUICK-REFERENCE.md** - Quick reference
- **SYNC-WORKFLOW-DIAGRAM.md** - Visual diagrams

### Test the Workflow
1. Make a change on first computer
2. Run `npm run sync-end`
3. On second computer, run `npm run sync-start`
4. Verify change appears
5. Make a change on second computer
6. Run `npm run sync-end`
7. On first computer, run `npm run sync-start`
8. Verify change appears

**If all steps work, you're ready! 🎉**

---

## 💡 Tips for Success

### DO
- ✅ Always run `sync-start` when beginning work
- ✅ Always run `sync-end` when finishing work
- ✅ Check `sync-status` if unsure
- ✅ Keep both computers synced regularly
- ✅ Commit logical chunks of work

### DON'T
- ❌ Don't work without syncing first
- ❌ Don't commit `.env.local` files
- ❌ Don't force push (scripts prevent this)
- ❌ Don't leave work without syncing

---

## 🆘 Getting Help

### Quick Help
```bash
# Check what's happening
npm run sync-status

# See recent commits
npm run log

# See git status
git status
```

### Documentation
- Read `SYNC-GUIDE.md` for detailed help
- Check `TROUBLESHOOTING.md` for common issues
- Review `README.md` for project overview

### Community
- GitHub Issues: Report problems
- GitHub Discussions: Ask questions

---

## 🎉 You're Ready!

Your second computer is now set up and ready to sync with your first computer. You can work seamlessly between locations!

### Remember
- **Start work**: `npm run sync-start`
- **End work**: `npm run sync-end`
- **Quick sync**: `npm run sync-quick`
- **Check status**: `npm run sync-status`

---

**Happy coding from your second computer! 🚀**

---

**Setup Date**: _______________  
**Computer Name**: _______________  
**Location**: 🏠 Home / 🏢 Office  
**Status**: ✅ Ready to Sync
