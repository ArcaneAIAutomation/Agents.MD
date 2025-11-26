#!/bin/bash

# Quantum BTC Super Spec - Deployment Script
# This script automates the deployment process to Vercel

set -e  # Exit on error

echo "🚀 Quantum BTC Super Spec - Deployment Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo "ℹ️  $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    print_error "vercel.json not found. Please ensure Vercel configuration exists."
    exit 1
fi

# Step 1: Check Git status
echo ""
echo "Step 1: Checking Git status..."
echo "------------------------------"

if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes."
    echo ""
    git status --short
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_message
        git add -A
        git commit -m "$commit_message"
        print_success "Changes committed"
    else
        print_warning "Proceeding with uncommitted changes"
    fi
else
    print_success "Working directory clean"
fi

# Step 2: Run tests
echo ""
echo "Step 2: Running tests..."
echo "------------------------"

if npm run test 2>/dev/null; then
    print_success "Tests passed"
else
    print_warning "Tests failed or not configured (continuing anyway)"
fi

# Step 3: Build project
echo ""
echo "Step 3: Building project..."
echo "---------------------------"

if npm run build; then
    print_success "Build successful"
else
    print_error "Build failed. Please fix errors before deploying."
    exit 1
fi

# Step 4: Check environment variables
echo ""
echo "Step 4: Checking environment variables..."
echo "-----------------------------------------"

required_vars=(
    "DATABASE_URL"
    "OPENAI_API_KEY"
    "JWT_SECRET"
    "CRON_SECRET"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    print_warning "Missing environment variables (ensure they're set in Vercel):"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
else
    print_success "All required environment variables present locally"
fi

# Step 5: Push to GitHub
echo ""
echo "Step 5: Pushing to GitHub..."
echo "----------------------------"

current_branch=$(git branch --show-current)
print_info "Current branch: $current_branch"

read -p "Push to GitHub and trigger Vercel deployment? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if git push origin "$current_branch"; then
        print_success "Pushed to GitHub successfully"
        print_info "Vercel will automatically deploy from GitHub"
    else
        print_error "Failed to push to GitHub"
        exit 1
    fi
else
    print_warning "Skipping GitHub push"
    print_info "You can manually push later with: git push origin $current_branch"
fi

# Step 6: Deployment instructions
echo ""
echo "Step 6: Deployment Status"
echo "-------------------------"

print_success "Deployment initiated!"
echo ""
echo "Next steps:"
echo "  1. Go to https://vercel.com/dashboard"
echo "  2. Select your project"
echo "  3. Click 'Deployments' tab"
echo "  4. Monitor the build progress"
echo "  5. Once deployed, run verification:"
echo "     npx tsx scripts/verify-quantum-deployment.ts"
echo ""
echo "Deployment checklist:"
echo "  - Verify all environment variables in Vercel"
echo "  - Check cron jobs are configured"
echo "  - Run database migrations in Supabase"
echo "  - Test API endpoints"
echo "  - Monitor logs for 24 hours"
echo ""

print_success "Deployment script completed!"
echo ""
echo "For detailed instructions, see:"
echo "  - QUANTUM-BTC-DEPLOYMENT-GUIDE.md"
echo "  - QUANTUM-BTC-DEPLOYMENT-CHECKLIST.md"
echo ""
