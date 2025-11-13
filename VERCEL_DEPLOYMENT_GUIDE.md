# Vercel 배포 가이드 - SSO System v1.0.0

## 🚀 배포 방법 (2가지 옵션)

### Option A: Vercel Dashboard (권장, 5분)

#### 1. GitHub에 푸시 (이미 완료)
```bash
# 현재 상태 확인
git status

# v1.0.0이 이미 푸시되어 있음
git log --oneline -3
```

#### 2. Vercel Dashboard 접속
https://vercel.com/new

#### 3. Repository Import
1. "Import Git Repository" 클릭
2. GitHub 연동 (처음이면 "Add GitHub Account")
3. Repository 선택: `garimto81/sso-system`
4. "Import" 클릭

#### 4. Project Configuration
- **Framework Preset**: Other (자동 감지됨)
- **Root Directory**: `server` ← 중요!
- **Build Command**: (비워두기 - Node.js 자동 감지)
- **Output Directory**: (비워두기)
- **Install Command**: `npm install`

#### 5. Environment Variables 추가
"Environment Variables" 섹션에서 다음 변수들을 추가:

```
SUPABASE_URL=https://dqkghhlnnskjfwntdtor.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxa2doaGxubnNramZ3bnRkdG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0ODE3ODcsImV4cCI6MjA3ODA1Nzc4N30.3dDBfHmU1vJPa4CDkMJYtk89iSBEyKMHGCO28GoXdcs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxa2doaGxubnNramZ3bnRkdG9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ4MTc4NywiZXhwIjoyMDc4MDU3Nzg3fQ.ZWSNCwe2R0hyYl6Z5CQ5p1Jv6Wu8qwyztjUP_DFTbTw
JWT_SECRET=7e8408625e7b06df068ccd2eb7f2d041fbb3d6b20ad9c6ac337ecfa5be6c50da
SESSION_SECRET=229c6697d454ebd3542273809689a59467ea9b94104d505e0fd36f7a9b9d9ed2
JWT_EXPIRES_IN=3600
SESSION_MAX_AGE=3600000
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://dqkghhlnnskjfwntdtor.supabase.co
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

⚠️ **중요**:
- 각 변수마다 "Add" 클릭
- Environment: `Production`, `Preview`, `Development` 모두 체크
- 민감한 키는 절대 외부 노출 금지!

#### 6. Deploy
"Deploy" 버튼 클릭 → 약 2-3분 대기

#### 7. 배포 완료 확인
배포 완료 후 URL 확인:
- 예시: `https://sso-system-server.vercel.app`
- 또는: `https://sso-system-server-<random>.vercel.app`

---

### Option B: Vercel CLI (고급, 10분)

#### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

#### 2. Vercel 로그인
```bash
vercel login
# 브라우저에서 이메일 확인
```

#### 3. 프로젝트 배포
```bash
cd server
vercel --prod

# 대화형 질문 답변:
# - Set up and deploy: Y
# - Which scope: 선택
# - Link to existing project: N
# - Project name: sso-system-server
# - Directory: ./
# - Override settings: N
```

#### 4. 환경 변수 설정 (CLI)
```bash
# .env.production 파일의 각 변수를 추가
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add JWT_SECRET production
vercel env add SESSION_SECRET production
# ... 나머지 변수들

# 또는 Dashboard에서 설정 (더 쉬움)
```

#### 5. 재배포 (환경 변수 적용)
```bash
vercel --prod
```

---

## ✅ 배포 후 검증

### 1. Health Check
배포 완료 후 받은 URL로 테스트:

```bash
# URL 예시: https://sso-system-server.vercel.app
curl https://sso-system-server.vercel.app/health

# 예상 응답:
# {"status":"healthy","timestamp":"2025-01-12T04:00:00.000Z"}
```

### 2. Security Headers 확인
```bash
curl -I https://sso-system-server.vercel.app/health

# 확인 항목:
# ✅ strict-transport-security: max-age=31536000
# ✅ content-security-policy: default-src 'self'
# ✅ x-frame-options: DENY
```

### 3. HTTPS 확인
Vercel은 자동으로 HTTPS를 제공하므로 별도 설정 불필요!

```bash
# HTTP → HTTPS 자동 리다이렉트 확인
curl -I http://sso-system-server.vercel.app/health
# Location: https://...
```

### 4. CORS 테스트
```bash
curl -H "Origin: https://dqkghhlnnskjfwntdtor.supabase.co" \
  -I https://sso-system-server.vercel.app/health

# 확인:
# Access-Control-Allow-Origin: https://dqkghhlnnskjfwntdtor.supabase.co
```

---

## 🔧 배포 후 설정 업데이트

### 1. SSO_URL 환경 변수 업데이트
배포된 URL을 환경 변수에 추가:

Vercel Dashboard → Project Settings → Environment Variables:
```
SSO_URL=https://sso-system-server.vercel.app
```

### 2. ALLOWED_ORIGINS 업데이트
실제 프론트엔드 도메인 추가:

```
ALLOWED_ORIGINS=https://dqkghhlnnskjfwntdtor.supabase.co,https://your-frontend.com
```

### 3. 재배포
환경 변수 변경 후:
- Vercel Dashboard → Deployments → Latest Deployment → "Redeploy"
- 또는 GitHub에 새 커밋 푸시 (자동 재배포)

---

## 📊 모니터링

### Vercel Dashboard
https://vercel.com/dashboard

- **Deployments**: 배포 히스토리 및 로그
- **Analytics**: 트래픽, 성능 지표
- **Logs**: 실시간 서버 로그

### 실시간 로그 확인
```bash
vercel logs sso-system-server --follow
```

---

## 🐛 트러블슈팅

### 문제 1: Build Failed
**원인**: package.json 또는 코드 오류

**해결**:
```bash
# Vercel Dashboard → Deployment → Build Logs 확인
# 로컬에서 테스트:
cd server
npm install
npm start
```

### 문제 2: Environment Variables Not Working
**원인**: 환경 변수 미적용

**해결**:
1. Vercel Dashboard → Settings → Environment Variables 확인
2. Production, Preview, Development 모두 체크했는지 확인
3. 재배포: "Redeploy" 클릭

### 문제 3: 502 Bad Gateway
**원인**: 서버 시작 실패 또는 포트 충돌

**해결**:
- Vercel Logs 확인
- `PORT` 환경 변수가 Vercel이 제공하는 포트와 충돌하지 않는지 확인
- Vercel은 자동으로 포트 할당하므로 `PORT=3000`을 제거하고 재배포

### 문제 4: CORS Error
**원인**: ALLOWED_ORIGINS 미설정

**해결**:
- Environment Variables에 `ALLOWED_ORIGINS` 추가
- 프론트엔드 도메인 정확히 입력 (https:// 포함)

---

## 📚 다음 단계

### 즉시
1. ✅ Health Check 통과 확인
2. ✅ Security Headers 확인
3. ✅ E2E Flow 테스트 (로그인 → 인가 → 토큰 교환)

### 선택 사항
1. 커스텀 도메인 설정
   - Vercel Dashboard → Settings → Domains
   - 예: `sso.yourdomain.com`

2. Monitoring 설정
   - UptimeRobot: https://uptimerobot.com
   - Better Uptime: https://betteruptime.com

3. Database 마이그레이션 완료
   - Supabase Dashboard SQL Editor에서 마이그레이션 파일 실행
   - 가이드: docs/PRODUCTION_DEPLOYMENT_GUIDE.md

---

## ✅ 배포 완료 체크리스트

- [ ] Vercel 프로젝트 생성 완료
- [ ] 모든 환경 변수 설정 완료
- [ ] 배포 성공 (초록색 체크)
- [ ] Health Check 통과 (`/health` 엔드포인트)
- [ ] Security Headers 확인 (Helmet)
- [ ] HTTPS 자동 적용 확인
- [ ] CORS 테스트 통과
- [ ] 실시간 로그 모니터링 설정
- [ ] Database 마이그레이션 완료 (Supabase)
- [ ] E2E Flow 테스트 완료

---

**Production Deployment Ready! 🚀**

배포 완료 후 URL: `https://sso-system-server.vercel.app`
(실제 URL은 Vercel이 할당한 값으로 업데이트하세요)
