#!/bin/bash

# API Routes Test Script
# Tests all API endpoints for basic functionality

BASE_URL="${1:-http://localhost:3000}"

echo "🧪 Testing API Routes"
echo "Base URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Health Check
echo "Testing Health Check..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} GET /api/health - Status: $HTTP_CODE"
    echo "   Response: $(echo $BODY | jq -c '.status, .checks.database.status' 2>/dev/null || echo $BODY)"
else
    echo -e "${RED}✗${NC} GET /api/health - Status: $HTTP_CODE"
fi
echo ""

# Test Tasks API (will fail without auth, but proves route exists)
echo "Testing Tasks API..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/tasks")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓${NC} GET /api/tasks - Status: $HTTP_CODE (Unauthorized, as expected)"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} GET /api/tasks - Status: $HTTP_CODE (Authenticated)"
else
    echo -e "${RED}✗${NC} GET /api/tasks - Status: $HTTP_CODE"
fi
echo ""

# Test Labels API
echo "Testing Labels API..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/labels")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓${NC} GET /api/labels - Status: $HTTP_CODE (Unauthorized, as expected)"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} GET /api/labels - Status: $HTTP_CODE (Authenticated)"
else
    echo -e "${RED}✗${NC} GET /api/labels - Status: $HTTP_CODE"
fi
echo ""

# Test Checklist Items API
echo "Testing Checklist Items API..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/checklist-items?taskId=test")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓${NC} GET /api/checklist-items - Status: $HTTP_CODE (Unauthorized, as expected)"
elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✓${NC} GET /api/checklist-items - Status: $HTTP_CODE"
else
    echo -e "${RED}✗${NC} GET /api/checklist-items - Status: $HTTP_CODE"
fi
echo ""

echo "---"
echo "Summary:"
echo "- Health check should return 200"
echo "- All other endpoints should return 401 (Unauthorized) without auth"
echo "- Use the docs/API_ROUTES.md for full testing with authentication"

