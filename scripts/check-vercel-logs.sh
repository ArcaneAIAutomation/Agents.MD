#!/bin/bash
# ATGE Vercel Logs Checker
# 
# This script helps you check Vercel logs for the ATGE system
# Run this script to view recent logs and identify issues

echo "🔍 ATGE Vercel Logs Checker"
echo "============================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed"
    echo "📦 Install it with: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI is installed"
echo ""

# Check authentication
echo "🔐 Checking Vercel authentication..."
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Vercel"
    echo "🔑 Run: vercel login"
    exit 1
fi

echo "✅ Authenticated with Vercel"
echo ""

# Get project info
echo "📊 Project Information:"
vercel project ls | grep -i "agents-md"
echo ""

# Check recent deployments
echo "🚀 Recent Deployments:"
vercel ls --limit 5
echo ""

# Check cron job logs
echo "⏰ Checking Cron Job Logs (last 100 lines)..."
echo "Looking for: /api/cron/atge-verify-trades"
echo ""
vercel logs --limit 100 | grep -i "atge-verify-trades" || echo "No cron job logs found in last 100 lines"
echo ""

# Check API errors
echo "❌ Checking for API Errors (last 100 lines)..."
vercel logs --limit 100 | grep -i "error" | grep -i "atge" || echo "No ATGE errors found in last 100 lines"
echo ""

# Check OpenAI API calls
echo "🤖 Checking OpenAI API Calls (last 100 lines)..."
vercel logs --limit 100 | grep -i "openai" | grep -i "atge" || echo "No OpenAI logs found in last 100 lines"
echo ""

echo "============================"
echo "💡 Tips:"
echo "   - View full logs: vercel logs"
echo "   - Follow logs: vercel logs --follow"
echo "   - Filter by function: vercel logs --filter=/api/atge/verify-trades"
echo "   - View specific deployment: vercel logs [deployment-url]"
echo "============================"
