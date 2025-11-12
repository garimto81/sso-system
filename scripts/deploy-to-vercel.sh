#!/bin/bash

# Vercel + Supabase Cloud 자동 배포 스크립트
# 사용법: bash scripts/deploy-to-vercel.sh

set -e

echo "🚀 SSO System - Vercel + Supabase Cloud 배포"
echo "============================================"
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Prerequisites 확인
echo "📋 Step 1: Prerequisites 확인 중..."

# Vercel CLI 설치 확인
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI가 설치되지 않았습니다. 설치 중...${NC}"
    npm install -g vercel
fi

# Supabase CLI 확인
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Supabase CLI가 설치되지 않았습니다. 설치 중...${NC}"
    npm install -g supabase
fi

echo -e "${GREEN}✅ Prerequisites 확인 완료${NC}"
echo ""

# 2. Supabase 프로젝트 링크 확인
echo "📋 Step 2: Supabase 프로젝트 연결 확인 중..."

if [ ! -f .supabase/config.toml ]; then
    echo -e "${YELLOW}Supabase 프로젝트가 연결되지 않았습니다.${NC}"
    echo ""
    echo "다음 단계를 수행하세요:"
    echo "1. https://supabase.com 에서 프로젝트 생성"
    echo "2. 프로젝트 Reference ID 복사"
    echo "3. npx supabase link --project-ref [YOUR_PROJECT_REF] 실행"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Supabase 프로젝트 연결 확인 완료${NC}"
echo ""

# 3. 데이터베이스 마이그레이션 푸시
echo "📋 Step 3: 데이터베이스 마이그레이션 푸시 중..."

read -p "Supabase에 마이그레이션을 푸시하시겠습니까? (y/n): " push_migrations

if [ "$push_migrations" = "y" ]; then
    npx supabase db push
    echo -e "${GREEN}✅ 마이그레이션 푸시 완료${NC}"
else
    echo -e "${YELLOW}⚠️ 마이그레이션 푸시 건너뜀${NC}"
fi
echo ""

# 4. Backend 배포
echo "📋 Step 4: Backend 배포 중..."

cd server

# Vercel 로그인 확인
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Vercel 로그인이 필요합니다.${NC}"
    vercel login
fi

# Backend 배포
echo "Backend를 Vercel에 배포 중..."
vercel --prod

echo -e "${GREEN}✅ Backend 배포 완료${NC}"
echo ""

# Backend URL 확인
echo "Backend URL을 확인하세요:"
vercel ls

read -p "Backend URL을 입력하세요 (예: https://sso-backend-xxx.vercel.app): " backend_url

echo ""

# 5. Frontend 배포
echo "📋 Step 5: Frontend 배포 중..."

cd ../admin-dashboard

# Frontend 배포
echo "Frontend를 Vercel에 배포 중..."
vercel --prod

echo -e "${GREEN}✅ Frontend 배포 완료${NC}"
echo ""

# Frontend URL 확인
echo "Frontend URL을 확인하세요:"
vercel ls

read -p "Frontend URL을 입력하세요 (예: https://sso-frontend-xxx.vercel.app): " frontend_url

echo ""

# 6. 환경 변수 가이드 출력
echo "📋 Step 6: 환경 변수 설정 가이드"
echo "================================"
echo ""

echo -e "${YELLOW}다음 환경 변수를 Vercel 대시보드에서 설정하세요:${NC}"
echo ""

echo "🔧 Backend 환경 변수 (sso-backend 프로젝트):"
echo "-------------------------------------------"
echo "SUPABASE_URL=[Supabase Project URL]"
echo "SUPABASE_ANON_KEY=[Supabase anon key]"
echo "SUPABASE_SERVICE_ROLE_KEY=[Supabase service_role key]"
echo "SUPABASE_JWT_SECRET=[Supabase JWT Secret]"
echo "JWT_SECRET=[Random 32+ chars]"
echo "SESSION_SECRET=[Random 32+ chars]"
echo "NODE_ENV=production"
echo "PORT=3000"
echo "FRONTEND_URL=$frontend_url"
echo "ALLOWED_ORIGINS=$frontend_url"
echo "LOG_LEVEL=info"
echo "RATE_LIMIT_AUTH=5"
echo "RATE_LIMIT_TOKEN=10"
echo "RATE_LIMIT_API=100"
echo ""

echo "🔧 Frontend 환경 변수 (sso-frontend 프로젝트):"
echo "--------------------------------------------"
echo "NEXT_PUBLIC_API_URL=$backend_url"
echo "JWT_SECRET=[Backend와 동일한 값]"
echo "SUPABASE_JWT_SECRET=[Backend와 동일한 값]"
echo "NODE_ENV=production"
echo ""

echo "📝 환경 변수 설정 방법:"
echo "1. https://vercel.com 로그인"
echo "2. 각 프로젝트 → Settings → Environment Variables"
echo "3. 위 변수들을 하나씩 추가"
echo "4. 재배포: vercel --prod"
echo ""

echo -e "${GREEN}✅ 배포 스크립트 완료!${NC}"
echo ""
echo "다음 단계:"
echo "1. Vercel 대시보드에서 환경 변수 설정"
echo "2. 각 프로젝트 재배포 (vercel --prod)"
echo "3. 브라우저에서 $frontend_url/login 접속"
echo "4. Admin 계정 로그인 (admin@sso.local / Test1234!)"
echo ""
