#!/bin/bash

# Script to revert all UCIE API endpoints from withAuth to withOptionalAuth
# This allows internal API calls to work without authentication forwarding
# while still tracking user information when available

echo "🔄 Reverting UCIE API endpoints to withOptionalAuth..."

# List of files to update
files=(
  "pages/api/ucie/sentiment/[symbol].ts"
  "pages/api/ucie/technical/[symbol].ts"
  "pages/api/ucie/on-chain/[symbol].ts"
  "pages/api/ucie/market-data/[symbol].ts"
  "pages/api/ucie/risk/[symbol].ts"
  "pages/api/ucie/predictions/[symbol].ts"
  "pages/api/ucie/derivatives/[symbol].ts"
  "pages/api/ucie/defi/[symbol].ts"
  "pages/api/ucie/preview-data/[symbol].ts"
  "pages/api/ucie/research/[symbol].ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  Updating $file..."
    
    # Replace withAuth import with withOptionalAuth
    sed -i 's/import { withAuth,/import { withOptionalAuth,/g' "$file"
    
    # Replace export statement
    sed -i 's/export default withAuth(handler);/export default withOptionalAuth(handler);/g' "$file"
    
    # Replace comment
    sed -i 's/\/\/ Export with required authentication middleware/\/\/ Export with optional authentication middleware (for user tracking)/g' "$file"
    
    # Replace user extraction (guaranteed to optional)
    sed -i 's/const userId = req\.user!\.id;/const userId = req.user?.id || '\''anonymous'\'';/g' "$file"
    sed -i 's/const userEmail = req\.user!\.email;/const userEmail = req.user?.email;/g' "$file"
    
    # Replace comment about user info
    sed -i 's/\/\/ Get user info (guaranteed by withAuth middleware)/\/\/ Get user info if authenticated (for database tracking)/g' "$file"
    
    echo "  ✅ Updated $file"
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo ""
echo "✅ All files updated!"
echo ""
echo "Summary:"
echo "- Changed withAuth to withOptionalAuth"
echo "- API endpoints can now be called internally without auth"
echo "- User tracking still works when user is authenticated"
echo "- AccessGate at page level ensures users must login to access features"
