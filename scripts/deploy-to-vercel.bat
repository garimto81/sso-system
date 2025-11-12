@echo off
REM Vercel + Supabase Cloud 자동 배포 스크립트 (Windows)
REM 사용법: scripts\deploy-to-vercel.bat

echo 🚀 SSO System - Vercel + Supabase Cloud 배포
echo ============================================
echo.

REM 1. Prerequisites 확인
echo 📋 Step 1: Prerequisites 확인 중...

where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo Vercel CLI가 설치되지 않았습니다. 설치 중...
    npm install -g vercel
)

where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo Supabase CLI가 설치되지 않았습니다. 설치 중...
    npm install -g supabase
)

echo ✅ Prerequisites 확인 완료
echo.

REM 2. Supabase 프로젝트 링크 확인
echo 📋 Step 2: Supabase 프로젝트 연결 확인 중...

if not exist .supabase\config.toml (
    echo Supabase 프로젝트가 연결되지 않았습니다.
    echo.
    echo 다음 단계를 수행하세요:
    echo 1. https://supabase.com 에서 프로젝트 생성
    echo 2. 프로젝트 Reference ID 복사
    echo 3. npx supabase link --project-ref [YOUR_PROJECT_REF] 실행
    echo.
    exit /b 1
)

echo ✅ Supabase 프로젝트 연결 확인 완료
echo.

REM 3. 데이터베이스 마이그레이션 푸시
echo 📋 Step 3: 데이터베이스 마이그레이션 푸시 중...

set /p push_migrations="Supabase에 마이그레이션을 푸시하시겠습니까? (y/n): "

if /i "%push_migrations%"=="y" (
    npx supabase db push
    echo ✅ 마이그레이션 푸시 완료
) else (
    echo ⚠️ 마이그레이션 푸시 건너뜀
)
echo.

REM 4. Backend 배포
echo 📋 Step 4: Backend 배포 중...

cd server

REM Vercel 로그인 확인
vercel whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo Vercel 로그인이 필요합니다.
    vercel login
)

REM Backend 배포
echo Backend를 Vercel에 배포 중...
vercel --prod

echo ✅ Backend 배포 완료
echo.

REM Backend URL 확인
echo Backend URL을 확인하세요:
vercel ls

set /p backend_url="Backend URL을 입력하세요 (예: https://sso-backend-xxx.vercel.app): "
echo.

REM 5. Frontend 배포
echo 📋 Step 5: Frontend 배포 중...

cd ..\admin-dashboard

REM Frontend 배포
echo Frontend를 Vercel에 배포 중...
vercel --prod

echo ✅ Frontend 배포 완료
echo.

REM Frontend URL 확인
echo Frontend URL을 확인하세요:
vercel ls

set /p frontend_url="Frontend URL을 입력하세요 (예: https://sso-frontend-xxx.vercel.app): "
echo.

REM 6. 환경 변수 가이드 출력
echo 📋 Step 6: 환경 변수 설정 가이드
echo ================================
echo.

echo 다음 환경 변수를 Vercel 대시보드에서 설정하세요:
echo.

echo 🔧 Backend 환경 변수 (sso-backend 프로젝트):
echo -------------------------------------------
echo SUPABASE_URL=[Supabase Project URL]
echo SUPABASE_ANON_KEY=[Supabase anon key]
echo SUPABASE_SERVICE_ROLE_KEY=[Supabase service_role key]
echo SUPABASE_JWT_SECRET=[Supabase JWT Secret]
echo JWT_SECRET=[Random 32+ chars]
echo SESSION_SECRET=[Random 32+ chars]
echo NODE_ENV=production
echo PORT=3000
echo FRONTEND_URL=%frontend_url%
echo ALLOWED_ORIGINS=%frontend_url%
echo LOG_LEVEL=info
echo RATE_LIMIT_AUTH=5
echo RATE_LIMIT_TOKEN=10
echo RATE_LIMIT_API=100
echo.

echo 🔧 Frontend 환경 변수 (sso-frontend 프로젝트):
echo --------------------------------------------
echo NEXT_PUBLIC_API_URL=%backend_url%
echo JWT_SECRET=[Backend와 동일한 값]
echo SUPABASE_JWT_SECRET=[Backend와 동일한 값]
echo NODE_ENV=production
echo.

echo 📝 환경 변수 설정 방법:
echo 1. https://vercel.com 로그인
echo 2. 각 프로젝트 → Settings → Environment Variables
echo 3. 위 변수들을 하나씩 추가
echo 4. 재배포: vercel --prod
echo.

echo ✅ 배포 스크립트 완료!
echo.
echo 다음 단계:
echo 1. Vercel 대시보드에서 환경 변수 설정
echo 2. 각 프로젝트 재배포 (vercel --prod)
echo 3. 브라우저에서 %frontend_url%/login 접속
echo 4. Admin 계정 로그인 (admin@sso.local / Test1234!)
echo.

cd ..
