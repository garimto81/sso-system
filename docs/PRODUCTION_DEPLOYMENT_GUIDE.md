# SSO System v1.0.0 - Production Deployment Guide

**버전**: 1.0.0
**업데이트**: 2025-01-12
**대상**: DevOps, System Administrators

---

## 📋 목차

1. [사전 요구사항](#사전-요구사항)
2. [배포 옵션](#배포-옵션)
3. [Option A: Supabase Cloud + Vercel](#option-a-supabase-cloud--vercel-권장)
4. [Option B: Self-Hosted (Docker)](#option-b-self-hosted-docker)
5. [환경 변수 설정](#환경-변수-설정)
6. [데이터베이스 마이그레이션](#데이터베이스-마이그레이션)
7. [배포 후 검증](#배포-후-검증)
8. [모니터링 & 운영](#모니터링--운영)
9. [트러블슈팅](#트러블슈팅)

---

## 🎯 사전 요구사항

### 필수
- ✅ Node.js 18+ 또는 20+
- ✅ PostgreSQL 15+ (Supabase Cloud 사용 시 불필요)
- ✅ Git
- ✅ SSL/TLS 인증서 (HTTPS 필수)
- ✅ 도메인 (예: `sso.yourdomain.com`)

### 권장
- Docker & Docker Compose (self-hosted 시)
- GitHub 계정 (CI/CD 자동화)
- Vercel/Netlify/Railway 계정 (서버리스 배포 시)

---

## 🚀 배포 옵션

| 옵션 | 난이도 | 비용 | 확장성 | 권장 대상 |
|------|--------|------|--------|-----------|
| **A. Supabase Cloud + Vercel** | ⭐ 쉬움 | 💰 무료~$25/월 | 🚀 Auto | 스타트업, MVP |
| **B. Self-Hosted (Docker)** | ⭐⭐⭐ 어려움 | 💰💰 $10~$100/월 | 📈 수동 | 엔터프라이즈 |

---

## Option A: Supabase Cloud + Vercel (권장)

**소요 시간**: 30분
**비용**: Free tier 가능 (월 500MB DB, 50MB Storage)

### 1. Supabase Cloud 프로젝트 생성

```bash
# 1. Supabase 계정 생성
# https://supabase.com/dashboard 접속 → Sign Up

# 2. 새 프로젝트 생성
# Organization: 선택 또는 생성
# Project Name: sso-system
# Database Password: 강력한 비밀번호 입력 (저장 필수!)
# Region: Northeast Asia (ap-northeast-1) - 서울 인접

# 3. 프로젝트 생성 완료까지 대기 (약 2분)
```

### 2. 로컬 환경 연결 (마이그레이션 준비)

```bash
# 1. Supabase CLI 로그인
npx supabase login

# 2. 프로젝트 연결
npx supabase link --project-ref <YOUR_PROJECT_REF>
# Project Ref: Supabase Dashboard → Settings → General → Reference ID

# 3. 원격 DB 연결 확인
npx supabase db remote list
```

### 3. 데이터베이스 마이그레이션 적용

```bash
# v1.0.0 마이그레이션 푸시
npx supabase db push

# 마이그레이션 확인
npx supabase migration list

# 출력 예시:
#   20250111000001_initial_schema.sql [Applied]
#   20250111000002_seed_test_data.sql [Applied]
#   20250112000004_performance_security_fixes.sql [Applied] ← v1.0.0
```

### 4. 환경 변수 가져오기

```bash
# Supabase Dashboard → Settings → API 에서 확인:
# - Project URL: https://<project-ref>.supabase.co
# - Anon Key: eyJhbG...
# - Service Role Key: eyJhbG... (비밀!)

# .env.production 파일 생성
cat > .env.production << 'EOF'
NODE_ENV=production
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
JWT_SECRET=<generate-new-secret>
SESSION_SECRET=<generate-new-secret>
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
PORT=3000
EOF

# JWT/Session Secret 생성
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Vercel에 SSO Server 배포

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. Vercel 로그인
vercel login

# 3. 프로젝트 배포 (server 디렉토리)
cd server
vercel --prod

# 대화형 설정:
# - Set up and deploy: Y
# - Which scope: 선택
# - Link to existing project: N
# - Project name: sso-system-server
# - Directory: ./
# - Override settings: Y
#   - Build Command: (비워두기 - Node.js 자동 감지)
#   - Output Directory: (비워두기)
#   - Development Command: npm start

# 4. 환경 변수 설정 (Vercel Dashboard)
# https://vercel.com/dashboard → sso-system-server → Settings → Environment Variables
# .env.production 내용을 모두 추가
```

### 6. 커스텀 도메인 설정 (선택)

```bash
# Vercel Dashboard → Domains → Add Domain
# 예시: sso.yourdomain.com

# DNS 레코드 추가 (도메인 제공업체):
# Type: CNAME
# Name: sso
# Value: cname.vercel-dns.com
# TTL: 3600
```

### 7. 배포 검증

```bash
# Health Check
curl https://sso.yourdomain.com/health

# 출력 예시:
# {"status":"healthy","timestamp":"2025-01-12T03:40:00.000Z"}

# Security Headers 확인
curl -I https://sso.yourdomain.com/health | grep -i "strict-transport\|content-security"

# 출력 예시:
# strict-transport-security: max-age=31536000; includeSubDomains; preload
# content-security-policy: default-src 'self';...
```

---

## Option B: Self-Hosted (Docker)

**소요 시간**: 2-3시간
**비용**: VPS $10~$100/월 (예: DigitalOcean Droplet, AWS EC2)

### 1. VPS 준비

```bash
# 최소 사양 (프로덕션):
# - CPU: 2 vCore
# - RAM: 4GB
# - Storage: 50GB SSD
# - OS: Ubuntu 22.04 LTS

# 권장 사양:
# - CPU: 4 vCore
# - RAM: 8GB
# - Storage: 100GB SSD

# SSH 접속
ssh root@your-server-ip
```

### 2. Docker & Docker Compose 설치

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 확인
docker --version
docker-compose --version
```

### 3. Supabase Self-Hosted 설정

```bash
# Supabase 레포지토리 클론
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# 환경 변수 설정
cp .env.example .env
nano .env

# 중요 변수 수정:
# POSTGRES_PASSWORD=<강력한-비밀번호>
# JWT_SECRET=<32자-랜덤-문자열>
# ANON_KEY=<생성된-anon-jwt>
# SERVICE_ROLE_KEY=<생성된-service-role-jwt>
# SITE_URL=https://sso.yourdomain.com

# Supabase 시작
docker-compose up -d

# 상태 확인
docker-compose ps
```

### 4. SSO System 배포

```bash
# 1. 레포지토리 클론
cd /opt
git clone https://github.com/garimto81/sso-system.git
cd sso-system

# 2. v1.0.0 체크아웃
git checkout v1.0.0

# 3. 환경 변수 설정
cp .env.example .env.production
nano .env.production

# 4. 마이그레이션 적용
npx supabase db push --db-url postgresql://postgres:<password>@localhost:5432/postgres

# 5. 서버 의존성 설치
cd server
npm install --production

# 6. PM2로 프로세스 관리
npm install -g pm2
pm2 start src/index.js --name sso-server --env production
pm2 save
pm2 startup  # 부팅 시 자동 시작
```

### 5. Nginx 리버스 프록시 & SSL 설정

```bash
# Nginx 설치
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/sso-system

# 내용:
server {
    listen 80;
    server_name sso.yourdomain.com;

    # Rate Limiting (추가 보호)
    limit_req_zone $binary_remote_addr zone=sso_limit:10m rate=10r/s;
    limit_req zone=sso_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/sso-system /etc/nginx/sites-enabled/

# Nginx 테스트 및 재시작
sudo nginx -t
sudo systemctl restart nginx

# Let's Encrypt SSL 인증서 발급
sudo certbot --nginx -d sso.yourdomain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

### 6. 방화벽 설정

```bash
# UFW 활성화
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# 상태 확인
sudo ufw status
```

---

## 🔐 환경 변수 설정

### 필수 환경 변수

```bash
# Supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # 절대 클라이언트 노출 금지!

# JWT
JWT_SECRET=<32-byte-hex>  # crypto.randomBytes(32).toString('hex')
JWT_EXPIRES_IN=3600  # 1시간 (초 단위)

# Session
SESSION_SECRET=<32-byte-hex>
SESSION_MAX_AGE=3600000  # 1시간 (밀리초)

# Server
NODE_ENV=production
PORT=3000
SSO_URL=https://sso.yourdomain.com

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### 선택 환경 변수

```bash
# Google OAuth (선택)
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>

# Rate Limiting 커스터마이징 (기본값 사용 권장)
RATE_LIMIT_MAX=100  # 분당 최대 요청
RATE_LIMIT_WINDOW_MS=60000  # 1분

# Cookie Domain (shared cookie 사용 시)
COOKIE_DOMAIN=.yourdomain.com
```

---

## 📊 데이터베이스 마이그레이션

### v0.1.0 → v1.0.0 마이그레이션

```bash
# 1. 마이그레이션 파일 확인
ls -la supabase/migrations/

# 출력:
# 20250111000001_initial_schema.sql
# 20250111000002_seed_test_data.sql  (개발 전용)
# 20250112000004_performance_security_fixes.sql  ← v1.0.0

# 2. 프로덕션 마이그레이션 (seed 제외)
npx supabase db push

# 또는 직접 실행 (self-hosted):
psql $DATABASE_URL < supabase/migrations/20250112000004_performance_security_fixes.sql

# 3. 마이그레이션 검증
npx supabase migration list
```

### 마이그레이션 롤백 (문제 발생 시)

```bash
# ⚠️ 주의: 프로덕션 데이터 손실 가능

# 1. 백업 생성
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 특정 마이그레이션 롤백
npx supabase db reset --db-url $DATABASE_URL

# 3. 이전 버전 재적용
git checkout v0.1.0
npx supabase db push
```

---

## ✅ 배포 후 검증

### 1. Health Check

```bash
# 서버 상태 확인
curl https://sso.yourdomain.com/health

# 예상 응답:
# {
#   "status": "healthy",
#   "timestamp": "2025-01-12T03:40:00.000Z"
# }
```

### 2. Security Headers 확인

```bash
# Helmet 보안 헤더 검증
curl -I https://sso.yourdomain.com/health

# 확인 항목:
# ✅ strict-transport-security: max-age=31536000; includeSubDomains; preload
# ✅ content-security-policy: default-src 'self';...
# ✅ x-frame-options: DENY
# ✅ x-content-type-options: nosniff
# ✅ x-xss-protection: 0 (modern browsers use CSP)
```

### 3. HTTPS 강제 확인

```bash
# HTTP → HTTPS 리다이렉트 테스트
curl -I http://sso.yourdomain.com/health

# 예상 응답:
# HTTP/1.1 301 Moved Permanently
# Location: https://sso.yourdomain.com/health
```

### 4. Rate Limiting 테스트

```bash
# 5초 내 10회 요청 (인증 엔드포인트 제한: 15분에 5회)
for i in {1..10}; do
  curl -X POST https://sso.yourdomain.com/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 0.5
done

# 예상: 6번째 요청부터 429 Too Many Requests
```

### 5. Database 검증

```bash
# Composite Indexes 확인
docker exec supabase_db_sso-system psql -U postgres -c "\d+ public.auth_codes" | grep -i index

# 예상 출력:
# idx_auth_codes_validation (code, app_id, expires_at)
# idx_auth_codes_user_app (user_id, app_id, expires_at)

# Rate Limiting Trigger 확인
docker exec supabase_db_sso-system psql -U postgres -c "SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'auth_code_rate_limit';"

# 예상 출력:
# auth_code_rate_limit

# Monitoring Views 확인
docker exec supabase_db_sso-system psql -U postgres -c "SELECT * FROM public.auth_code_stats;"

# 예상 출력:
# total_codes | active_codes | expired_codes | last_generated
# 0           | 0            | 0             | (null)
```

### 6. E2E Flow 테스트

```bash
# 1. Admin 사용자 생성 (Supabase Dashboard 또는 SQL)
# 2. 앱 등록
# 3. Authorization Flow 테스트

# test-sso-flow.sh 스크립트 수정 (프로덕션 URL 사용)
sed -i 's|http://localhost:3000|https://sso.yourdomain.com|g' test-sso-flow.sh

# 실행
bash test-sso-flow.sh
```

---

## 📈 모니터링 & 운영

### 1. 로그 모니터링

**Vercel (Option A)**:
```bash
# 실시간 로그
vercel logs sso-system-server --follow

# 에러 로그만
vercel logs sso-system-server --follow | grep -i error
```

**Self-Hosted (Option B)**:
```bash
# PM2 로그
pm2 logs sso-server --lines 100

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. 성능 모니터링

```bash
# Database 통계 조회
psql $DATABASE_URL -c "SELECT * FROM public.app_usage_stats ORDER BY total_auth_codes DESC LIMIT 10;"

# 인증 코드 통계
psql $DATABASE_URL -c "SELECT * FROM public.auth_code_stats;"

# Slow Query 분석 (PostgreSQL)
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### 3. Uptime Monitoring (권장)

**무료 서비스**:
- [UptimeRobot](https://uptimerobot.com/) - 5분 간격 체크
- [Better Uptime](https://betteruptime.com/) - Status page 포함
- [Freshping](https://www.freshworks.com/website-monitoring/) - 무제한 체크

**설정 예시 (UptimeRobot)**:
```
Monitor Type: HTTPS
URL: https://sso.yourdomain.com/health
Interval: 5 minutes
Alert Contacts: your-email@example.com
```

### 4. 알림 설정

**Slack Webhook**:
```javascript
// server/src/utils/alert.js (선택 사항)
import fetch from 'node-fetch';

export async function sendSlackAlert(message) {
  if (!process.env.SLACK_WEBHOOK_URL) return;

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `[SSO Alert] ${message}` }),
  });
}
```

---

## 🔧 트러블슈팅

### 문제 1: 502 Bad Gateway (Nginx)

**증상**: `curl https://sso.yourdomain.com/health` → 502

**원인**: SSO 서버가 시작되지 않음

**해결**:
```bash
# PM2 상태 확인
pm2 status

# 로그 확인
pm2 logs sso-server --err --lines 50

# 서버 재시작
pm2 restart sso-server
```

---

### 문제 2: CORS Error (클라이언트)

**증상**: 브라우저 콘솔에 `Access-Control-Allow-Origin` 에러

**원인**: `ALLOWED_ORIGINS`에 클라이언트 도메인 미등록

**해결**:
```bash
# .env.production 수정
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com,https://new-app.yourdomain.com

# Vercel: Environment Variables 업데이트 후 재배포
# Self-Hosted: PM2 재시작
pm2 restart sso-server
```

---

### 문제 3: Rate Limiting 과도하게 발동

**증상**: 정상 사용자가 429 에러

**원인**: Rate Limit 임계값 너무 낮음

**해결**:
```bash
# server/src/middleware/rateLimiter.js 수정
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,  // 5 → 10으로 증가
});

# 재배포
git add server/src/middleware/rateLimiter.js
git commit -m "fix: Increase auth rate limit to 10"
git push
```

---

### 문제 4: Database Migration 실패

**증상**: `npx supabase db push` 에러

**원인**: 기존 객체 충돌 또는 권한 문제

**해결**:
```bash
# 1. 현재 마이그레이션 상태 확인
npx supabase migration list

# 2. 충돌하는 객체 수동 삭제 (주의!)
psql $DATABASE_URL -c "DROP INDEX IF EXISTS idx_auth_codes_validation;"

# 3. 재시도
npx supabase db push

# 4. 실패 시 마이그레이션 파일 수동 실행
psql $DATABASE_URL < supabase/migrations/20250112000004_performance_security_fixes.sql
```

---

### 문제 5: JWT Token Invalid

**증상**: 토큰 검증 실패 에러

**원인**: `JWT_SECRET` 불일치 또는 만료

**해결**:
```bash
# 1. Supabase JWT Secret 확인
# Dashboard → Settings → API → JWT Settings → JWT Secret

# 2. .env.production의 JWT_SECRET과 일치하는지 확인

# 3. 불일치 시 환경 변수 업데이트 후 재배포
```

---

## 📚 추가 자료

- [CHANGELOG.md](../CHANGELOG.md) - v1.0.0 전체 변경 사항
- [README.md](../README.md) - 프로젝트 개요
- [REFACTORING_PLAN_V1.0.md](REFACTORING_PLAN_V1.0.md) - 향후 개선 계획
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Vercel Deployment Docs](https://vercel.com/docs/deployments/overview)

---

## ✅ 배포 완료 체크리스트

- [ ] Supabase 프로젝트 생성 (Cloud 또는 Self-Hosted)
- [ ] 데이터베이스 마이그레이션 적용 (`20250112000004_performance_security_fixes.sql`)
- [ ] 환경 변수 설정 (JWT_SECRET, SESSION_SECRET, ALLOWED_ORIGINS)
- [ ] SSO Server 배포 (Vercel 또는 PM2)
- [ ] HTTPS 설정 (Vercel 자동 또는 Let's Encrypt)
- [ ] Health Check 통과 (`/health` 엔드포인트)
- [ ] Security Headers 확인 (Helmet)
- [ ] Rate Limiting 테스트
- [ ] Database Indexes 확인
- [ ] E2E Flow 테스트 (로그인 → 인가 → 토큰 교환)
- [ ] Monitoring 설정 (UptimeRobot 등)
- [ ] 알림 설정 (Slack Webhook 등)
- [ ] DNS 레코드 설정 (커스텀 도메인 사용 시)
- [ ] 백업 전략 수립 (Database 자동 백업)

---

**배포 완료 후 이슈 발생 시**:
GitHub Issues → https://github.com/garimto81/sso-system/issues

**긴급 문의**:
프로덕션 장애 시 [트러블슈팅](#트러블슈팅) 섹션 참조

---

*Production Ready! 🚀*
