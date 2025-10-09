#!/bin/bash
# Automated Vercel Deployment Script (Unix/Linux/Mac)
# Usage: ./deploy.sh [commit-message]

COMMIT_MESSAGE="${1:-🚀 Automated deployment}"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "\n${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  AUTOMATED VERCEL DEPLOYMENT 🚀       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝\n${NC}"

# Step 1: Check Git Status
echo -e "${YELLOW}📊 Checking Git Status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "  ${GREEN}✅ Changes detected${NC}"
else
    echo -e "  ${YELLOW}⚠️  No changes to deploy${NC}"
    echo -e "\n${GRAY}Exiting...\n${NC}"
    exit 0
fi

# Step 2: Add All Changes
echo -e "\n${YELLOW}📦 Adding Changes...${NC}"
git add .
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ All changes staged${NC}"
else
    echo -e "  ${RED}❌ Failed to stage changes${NC}"
    exit 1
fi

# Step 3: Commit Changes
echo -e "\n${YELLOW}💾 Committing Changes...${NC}"
echo -e "  ${CYAN}Message: $COMMIT_MESSAGE${NC}"
git commit -m "$COMMIT_MESSAGE"
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ Changes committed${NC}"
else
    echo -e "  ${RED}❌ Failed to commit changes${NC}"
    exit 1
fi

# Step 4: Push to GitHub
echo -e "\n${YELLOW}🚀 Pushing to GitHub...${NC}"
git push origin main
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ Pushed to main branch${NC}"
else
    echo -e "  ${RED}❌ Failed to push to GitHub${NC}"
    exit 1
fi

# Step 5: Get Commit Hash
COMMIT_HASH=$(git rev-parse --short HEAD)
echo -e "\n${YELLOW}📝 Deployment Details:${NC}"
echo -e "  ${CYAN}Commit: $COMMIT_HASH${NC}"
echo -e "  ${CYAN}Branch: main${NC}"
echo -e "  ${CYAN}Message: $COMMIT_MESSAGE${NC}"

# Step 6: Vercel Auto-Deploy Info
echo -e "\n${YELLOW}🔄 Vercel Auto-Deploy:${NC}"
echo -e "  ${GREEN}✅ Deployment triggered automatically${NC}"
echo -e "  ${CYAN}⏱️  Build time: ~2-3 minutes${NC}"
echo -e "  ${CYAN}🔗 Dashboard: https://vercel.com/dashboard${NC}"
echo -e "  ${CYAN}🌐 Production: https://agents-md.vercel.app${NC}"

# Step 7: Success Message
echo -e "\n${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  DEPLOYMENT COMPLETE ✅                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝\n${NC}"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  ${WHITE}1. Monitor deployment at https://vercel.com/dashboard${NC}"
echo -e "  ${WHITE}2. Wait 2-3 minutes for build completion${NC}"
echo -e "  ${WHITE}3. Test live site at https://agents-md.vercel.app${NC}"
echo ""
