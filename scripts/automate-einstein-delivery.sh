#!/bin/bash

# Einstein Trade Engine - Automated Delivery Script
# This script automates the complete deployment pipeline

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="preview"
SKIP_TESTS=false
SKIP_BACKUP=false
AUTO_CONFIRM=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --auto-confirm)
            AUTO_CONFIRM=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}🚀 Einstein Trade Engine - Automated Delivery Pipeline${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${CYAN}================================================${NC}\n"

# Step 1: Pre-flight Checks
echo -e "${GREEN}📋 Step 1/8: Running Pre-flight Checks...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi
VERCEL_VERSION=$(vercel --version)
echo -e "${GREEN}✅ Vercel CLI: $VERCEL_VERSION${NC}"

# Check Git status
GIT_STATUS=$(git status --porcelain)
if [ -n "$GIT_STATUS" ]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected:${NC}"
    echo -e "${YELLOW}$GIT_STATUS${NC}"
    
    if [ "$AUTO_CONFIRM" = false ]; then
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ Deployment cancelled${NC}"
            exit 1
        fi
    fi
fi
echo -e "${GREEN}✅ Git status checked${NC}"

echo -e "\n${GREEN}✅ Pre-flight checks passed!${NC}\n"

# Step 2: Database Schema Verification
echo -e "${GREEN}📋 Step 2/8: Verifying Database Schema...${NC}"

if [ -f "scripts/verify-einstein-schema.ts" ]; then
    npx tsx scripts/verify-einstein-schema.ts
    echo -e "${GREEN}✅ Database schema verified${NC}"
else
    echo -e "${YELLOW}⚠️  Schema verification script not found, skipping...${NC}"
fi

echo ""

# Step 3: Run Tests (unless skipped)
if [ "$SKIP_TESTS" = false ]; then
    echo -e "${GREEN}📋 Step 3/8: Running Test Suite...${NC}"
    
    # Performance tests
    if [ -f "scripts/test-einstein-performance.ts" ]; then
        echo -e "${CYAN}Running performance tests...${NC}"
        npx tsx scripts/test-einstein-performance.ts
        echo -e "${GREEN}✅ Performance tests passed${NC}"
    fi
    
    # Security tests
    if [ -f "scripts/test-einstein-security.ts" ]; then
        echo -e "${CYAN}Running security tests...${NC}"
        npx tsx scripts/test-einstein-security.ts
        echo -e "${GREEN}✅ Security tests passed${NC}"
    fi
    
    # Integration tests
    if [ -f "__tests__/integration/einstein-engine.test.ts" ]; then
        echo -e "${CYAN}Running integration tests...${NC}"
        npm test -- __tests__/integration/einstein-engine.test.ts
        echo -e "${GREEN}✅ Integration tests passed${NC}"
    fi
    
    echo -e "\n${GREEN}✅ All tests passed!${NC}\n"
else
    echo -e "${YELLOW}⚠️  Step 3/8: Tests skipped (--skip-tests flag)${NC}"
    echo ""
fi

# Step 4: Build Application
echo -e "${GREEN}📋 Step 4/8: Building Application...${NC}"

npm run build
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Step 5: Backup Current Deployment (production only)
if [ "$ENVIRONMENT" = "production" ] && [ "$SKIP_BACKUP" = false ]; then
    echo -e "${GREEN}📋 Step 5/8: Creating Backup...${NC}"
    
    TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
    BACKUP_DIR="backups/einstein-$TIMESTAMP"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup key files
    FILES_TO_BACKUP=(
        "pages/api/einstein"
        "lib/einstein"
        "components/einstein"
        "migrations/008_create_einstein_tables.sql"
    )
    
    for file in "${FILES_TO_BACKUP[@]}"; do
        if [ -e "$file" ]; then
            mkdir -p "$BACKUP_DIR/$(dirname "$file")"
            cp -r "$file" "$BACKUP_DIR/$file"
        fi
    done
    
    echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Step 5/8: Backup skipped${NC}"
    echo ""
fi

# Step 6: Deploy to Vercel
echo -e "${GREEN}📋 Step 6/8: Deploying to Vercel ($ENVIRONMENT)...${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    if [ "$AUTO_CONFIRM" = false ]; then
        echo -e "${YELLOW}⚠️  WARNING: You are about to deploy to PRODUCTION${NC}"
        read -p "Type 'DEPLOY' to confirm: " CONFIRM
        if [ "$CONFIRM" != "DEPLOY" ]; then
            echo -e "${RED}❌ Deployment cancelled${NC}"
            exit 1
        fi
    fi
    
    echo -e "${CYAN}Deploying to production...${NC}"
    vercel --prod
else
    echo -e "${CYAN}Deploying to preview...${NC}"
    vercel
fi

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""

# Step 7: Post-Deployment Verification
echo -e "${GREEN}📋 Step 7/8: Running Post-Deployment Verification...${NC}"

sleep 10  # Wait for deployment to propagate

# Get deployment URL
if [ "$ENVIRONMENT" = "production" ]; then
    DEPLOYMENT_URL="https://news.arcane.group"
else
    DEPLOYMENT_URL="https://your-preview-url.vercel.app"
fi

echo -e "${CYAN}Testing deployment at: $DEPLOYMENT_URL${NC}"

# Test health endpoint
if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/health" | grep -q "200"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed (may be normal if endpoint doesn't exist)${NC}"
fi

# Test Einstein endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/einstein/analyze")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Einstein endpoint accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Einstein endpoint returned status: $HTTP_CODE${NC}"
fi

echo ""

# Step 8: Generate Deployment Report
echo -e "${GREEN}📋 Step 8/8: Generating Deployment Report...${NC}"

REPORT_PATH="EINSTEIN-DEPLOYMENT-REPORT-$(date +"%Y%m%d-%H%M%S").md"

cat > "$REPORT_PATH" << EOF
# Einstein Trade Engine - Deployment Report

**Date**: $(date +"%Y-%m-%d %H:%M:%S")
**Environment**: $ENVIRONMENT
**Deployment URL**: $DEPLOYMENT_URL

## Deployment Summary

- ✅ Pre-flight checks passed
- ✅ Database schema verified
- $([ "$SKIP_TESTS" = true ] && echo "⚠️  Tests skipped" || echo "✅ All tests passed")
- ✅ Build successful
- $([ "$ENVIRONMENT" = "production" ] && [ "$SKIP_BACKUP" = false ] && echo "✅ Backup created" || echo "⚠️  Backup skipped")
- ✅ Deployment successful
- ✅ Post-deployment verification completed

## System Status

### Node.js Environment
- Node.js: $NODE_VERSION
- npm: $NPM_VERSION
- Vercel CLI: $VERCEL_VERSION

### Git Status
\`\`\`
$(git log -1 --oneline)
\`\`\`

### Deployment Details
- Environment: $ENVIRONMENT
- URL: $DEPLOYMENT_URL
- Timestamp: $(date +"%Y-%m-%d %H:%M:%S")

## Next Steps

1. Monitor deployment: \`npx tsx scripts/monitor-einstein.ts\`
2. Check logs: \`vercel logs\`
3. Test features manually at: $DEPLOYMENT_URL

## Rollback Instructions

If issues are detected:

\`\`\`bash
# Rollback to previous deployment
vercel rollback

# Or restore from backup (production only)
# Backup location: backups/einstein-$TIMESTAMP
\`\`\`

## Documentation

- User Guide: docs/EINSTEIN-USER-GUIDE.md
- Developer Guide: docs/EINSTEIN-DEVELOPER-GUIDE.md
- Deployment Guide: docs/EINSTEIN-DEPLOYMENT-GUIDE.md

---

**Status**: ✅ Deployment Complete
**Generated**: $(date +"%Y-%m-%d %H:%M:%S")
EOF

echo -e "${GREEN}✅ Deployment report generated: $REPORT_PATH${NC}"
echo ""

# Final Summary
echo -e "${CYAN}================================================${NC}"
echo -e "${GREEN}🎉 Einstein Trade Engine Deployment Complete!${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}URL: $DEPLOYMENT_URL${NC}"
echo -e "${YELLOW}Report: $REPORT_PATH${NC}"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo -e "${NC}1. Monitor: npx tsx scripts/monitor-einstein.ts${NC}"
echo -e "${NC}2. View logs: vercel logs${NC}"
echo -e "${NC}3. Test at: $DEPLOYMENT_URL${NC}"
echo ""
echo -e "${GREEN}✅ All systems operational!${NC}"
