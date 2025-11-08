#!/bin/bash

# Fix OpenAI Summary Function
# This script updates the generateOpenAISummary function to use correct data paths

echo "🔧 Fixing OpenAI summary function..."
echo ""

FILE="pages/api/ucie/preview-data/[symbol].ts"

if [ ! -f "$FILE" ]; then
    echo "❌ Error: File not found: $FILE"
    exit 1
fi

echo "✅ File found: $FILE"
echo ""

# Create backup
cp "$FILE" "$FILE.backup"
echo "✅ Backup created: $FILE.backup"
echo ""

# The fix will be applied manually due to complex string replacement
echo "⚠️  Manual fix required:"
echo ""
echo "1. Open: pages/api/ucie/preview-data/[symbol].ts"
echo "2. Find the 'generateOpenAISummary' function (around line 400)"
echo "3. Replace it with the version from: OPENAI-SUMMARY-FIXED-FUNCTION.ts"
echo "4. Find the 'generateFallbackSummary' function (around line 500)"
echo "5. Replace it with the version from: OPENAI-SUMMARY-FIXED-FUNCTION.ts"
echo ""
echo "📚 See complete guide: OPENAI-DATABASE-ACCESS-GUIDE.md"
echo ""
echo "After manual fix:"
echo "  git add pages/api/ucie/preview-data/[symbol].ts"
echo "  git commit -m 'fix(ucie): OpenAI now accesses database and uses correct data paths'"
echo "  git push origin main"
echo ""
