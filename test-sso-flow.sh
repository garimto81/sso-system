#!/bin/bash
# SSO Authorization Flow 통합 테스트 스크립트

set -e

echo "============================================================"
echo "🧪 SSO Authorization Flow 통합 테스트"
echo "============================================================"
echo ""

BASE_URL="http://localhost:3000"

# 색상
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Login to get access token
echo -e "${BLUE}[Step 1/5]${NC} 로그인 (admin@sso.local)"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sso.local",
    "password": "admin123!@#"
  }')

echo "$LOGIN_RESPONSE" | head -5

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ 로그인 실패!${NC}"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ 로그인 성공!${NC}"
echo "   Access Token: ${ACCESS_TOKEN:0:30}..."
echo ""

# Step 2: Get app list and pick VTC_Logger
echo -e "${BLUE}[Step 2/5]${NC} 등록된 앱 목록 조회"
APPS_RESPONSE=$(curl -s "${BASE_URL}/api/v1/apps")
echo "$APPS_RESPONSE" | head -10

APP_ID=$(echo "$APPS_RESPONSE" | grep -o '"api_key":"vtc-logger-[^"]*' | cut -d'"' -f4)

if [ -z "$APP_ID" ]; then
  echo -e "${RED}❌ VTC_Logger 앱을 찾을 수 없습니다!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ VTC_Logger 앱 찾음!${NC}"
echo "   APP_ID: $APP_ID"
echo ""

# Step 3: Request authorization code
echo -e "${BLUE}[Step 3/5]${NC} Authorization Code 요청"
REDIRECT_URI="http://localhost:3001/auth/callback"
STATE="test-state-12345"

# Follow redirects disabled to capture the redirect URL
AUTH_RESPONSE=$(curl -s -w "\nREDIRECT_URL: %{redirect_url}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "${BASE_URL}/api/v1/authorize?app_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}")

echo "$AUTH_RESPONSE"

# Extract code from redirect URL
CODE=$(echo "$AUTH_RESPONSE" | grep "REDIRECT_URL:" | grep -o 'code=[^&]*' | cut -d'=' -f2)

if [ -z "$CODE" ]; then
  echo -e "${RED}❌ Authorization code를 받지 못했습니다!${NC}"
  echo "$AUTH_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Authorization Code 생성됨!${NC}"
echo "   Code: ${CODE:0:40}..."
echo ""

# Step 4: Get app_secret from database
echo -e "${BLUE}[Step 4/5]${NC} App Secret 조회 (데이터베이스)"
# Note: In real scenario, app_secret is stored securely by the app
# For testing, we'll use a known value
# The seed.sql generates random secrets, so we need to query the DB

echo -e "${YELLOW}⚠️  테스트를 위해 실제 secret을 사용해야 하지만,${NC}"
echo -e "${YELLOW}   seed.sql이 랜덤 secret을 생성하므로 이 테스트는 여기서 중단됩니다.${NC}"
echo ""
echo -e "${BLUE}수동 테스트 방법:${NC}"
echo "1. 데이터베이스에서 실제 API secret 조회:"
echo "   docker exec supabase_db_sso-system psql -U postgres \\"
echo "     -c \"SELECT api_key, LEFT(api_secret, 20) FROM public.apps WHERE name='VTC_Logger';\""
echo ""
echo "2. Token exchange 요청 (실제 secret 필요):"
echo "   curl -X POST ${BASE_URL}/api/v1/token/exchange \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{"
echo "       \"code\": \"$CODE\","
echo "       \"app_id\": \"$APP_ID\","
echo "       \"app_secret\": \"YOUR_ACTUAL_SECRET\""
echo "     }'"
echo ""
echo "============================================================"
echo -e "${GREEN}🎉 테스트 (부분) 완료!${NC}"
echo "============================================================"
echo ""
echo "다음 단계:"
echo "  - Authorization flow 첫 3단계 성공 ✅"
echo "  - Token exchange는 실제 app_secret 필요"
echo "  - Seed 데이터에 고정 secret 추가 필요"
