#!/bin/bash

# =============================================================================
# Agents.MD V2.0 - Vercel Deployment Script
# =============================================================================

echo "🚀 Starting Agents.MD V2.0 deployment preparation..."

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Warning: Not on main branch. Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes."
    read -p "Commit changes first? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Pre-deployment commit - V2.0 updates"
        git push origin main
    fi
fi

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check Node.js version
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

# Check if required files exist
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found!"
    exit 1
fi

if [ ! -f ".env.example" ]; then
    echo "❌ .env.example not found!"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run type check
echo "🔍 Running TypeScript check..."
npm run type-check

# Run build test
echo "🏗️  Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

# Clean up build artifacts
npm run clean

echo "🎉 Pre-deployment checks complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Import GitHub repository: ArcaneAIAutomation/Agents.MD"
echo "3. Add environment variables from .env.example"
echo "4. Deploy!"
echo ""
echo "Or use Vercel CLI:"
echo "  vercel --prod"