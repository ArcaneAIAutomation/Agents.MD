#!/bin/bash
# Einstein Trade Engine - Deployment Script
# Version: 2.0.0
# Platform: Vercel + Supabase

echo "🚀 Einstein Trade Engine - Deployment Script"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
  exit 1
fi

echo "📋 Pre-Deployment Checklist"
echo "----------------------------"
echo ""

# Check Node.js version
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅${NC} Node.js version: $NODE_VERSION"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  Installing dependencies...${NC}"
  npm install
fi

echo -e "${GREEN}✅${NC} Dependencies installed"

# Run TypeScript type check
echo ""
echo "🔍 Running TypeScript type check..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅${NC} TypeScript type check passed"
else
  echo -e "${RED}❌${NC} TypeScript type check failed"
  echo "Fix type errors before deploying"
  exit 1
fi

# Run linting
echo ""
echo "🔍 Running ESLint..."
npm run lint
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅${NC} Linting passed"
else
  echo -e "${YELLOW}⚠️  Linting warnings found (non-blocking)${NC}"
fi

# Build the project
echo ""
echo "🏗️  Building project..."
npm run build
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅${NC} Build successful"
else
  echo -e "${RED}❌${NC} Build failed"
  exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo ""
  echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
  npm install -g vercel
fi

echo ""
echo "=============================================="
echo "🎯 Ready to Deploy!"
echo "=============================================="
echo ""
echo "Choose deployment target:"
echo "  1) Preview (testing)"
echo "  2) Production (live)"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
  1)
    echo ""
    echo "🚀 Deploying to Preview..."
    vercel
    ;;
  2)
    echo ""
    echo "⚠️  WARNING: This will deploy to PRODUCTION!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      echo ""
      echo "🚀 Deploying to Production..."
      vercel --prod
    else
      echo "Deployment cancelled"
      exit 0
    fi
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "=============================================="
echo "✅ Deployment Complete!"
echo "=============================================="
echo ""
echo "📊 Next Steps:"
echo "  1. Test the deployment URL"
echo "  2. Verify Einstein signal generation works"
echo "  3. Check Vercel function logs"
echo "  4. Monitor for errors"
echo ""
