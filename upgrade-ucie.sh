#!/bin/bash
# UCIE Async Upgrade - Bash Script
# Automates the complete migration process

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}========================================"
echo -e "  UCIE Async Upgrade Automation"
echo -e "========================================${NC}"
echo ""

# Check if tsx is installed
echo -e "${YELLOW}Checking dependencies...${NC}"
if ! command -v tsx &> /dev/null; then
    echo -e "${RED}❌ tsx not found. Installing...${NC}"
    npm install -g tsx
fi

echo -e "${GREEN}✅ Dependencies OK${NC}"
echo ""

# Run the upgrade script
echo -e "${YELLOW}Running upgrade script...${NC}"
echo ""

npx tsx scripts/upgrade-ucie-async.ts

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}========================================"
    echo -e "  ✅ Upgrade Complete!"
    echo -e "========================================${NC}"
    echo ""
    echo -e "${CYAN}Next: Deploy to Vercel${NC}"
    echo "  git push origin main"
    echo ""
else
    echo -e "${RED}========================================"
    echo -e "  ❌ Upgrade Failed"
    echo -e "========================================${NC}"
    echo ""
    echo -e "${YELLOW}Check error messages above${NC}"
    echo ""
fi

exit $EXIT_CODE
