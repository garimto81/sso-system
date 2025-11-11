# SSO System

**버전**: 0.1.0 (기능 완료) 🎉
**통합 인증 시스템 (Single Sign-On)**

모든 애플리케이션을 하나의 인증으로 관리하는 OAuth 2.0 기반 중앙 SSO 시스템

[![GitHub Issues](https://img.shields.io/github/issues/garimto81/sso-system)](https://github.com/garimto81/sso-system/issues)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ 주요 기능

- ✅ **OAuth 2.0 Authorization Code Flow** 완전 구현
- ✅ **Supabase Auth** 기반 중앙 인증
- ✅ **JWT Token** 발급 및 검증
- ✅ **RLS (Row Level Security)** 적용
- ✅ **Multi-App 지원** (도메인 제약 없음)
- ✅ **Email/Password 인증** (Google OAuth 준비됨)
- ⏳ **SDK** (향후 추가 예정)

## 🎯 목적

- VTC_Logger, contents-factory 등 모든 앱에 **한 번 로그인으로 자동 접근**
- 도메인에 관계없이 Token Exchange로 JWT 공유
- 앱 추가 시 OAuth 재설정 불필요 (DB 등록만)

---

## 🏗️ 아키텍처

```
sso-system (이 레포)
    ├── Supabase Auth (중앙 인증)
    ├── User DB (통합 사용자 관리)
    └── SDK (@your-org/sso-sdk)
            ↓
    ┌───────┴────────┐
    ↓                ↓
VTC_Logger    contents-factory
```

---

## 📦 프로젝트 구조

```
sso-system/
├── .github/
│   └── ISSUE_TEMPLATE/     # GitHub Issue 템플릿 (Feature, Bug, Task)
├── server/                 # SSO API 서버 (✅ v0.1.0)
│   ├── src/
│   │   ├── index.js        # Express 서버
│   │   ├── routes/
│   │   │   ├── auth.js     # 인증 (login, signup, logout)
│   │   │   └── api.js      # SSO API (authorize, token/exchange)
│   │   ├── middleware/
│   │   │   └── auth.js     # JWT 검증 미들웨어
│   │   └── utils/
│   │       └── supabase.js # Supabase 클라이언트
│   └── package.json
├── supabase/               # Supabase 설정 (✅ v0.1.0)
│   ├── config.toml
│   ├── migrations/         # DB 마이그레이션
│   │   ├── 20250112000001_initial_schema.sql (profiles, apps)
│   │   ├── 20250112000002_auth_codes_table.sql
│   │   └── 20250112000003_rls_policies.sql
│   └── seed.sql            # 테스트 데이터 (admin + 3 apps)
├── scripts/                # 자동화 스크립트 (✅ v0.1.0)
│   ├── github-issue-dev.sh   # Issue 기반 개발 시작
│   └── setup-github-labels.sh # GitHub 라벨 설정
├── docs/                   # 문서 (✅ v0.1.0)
│   ├── api-reference.md    # API 문서
│   └── architecture/       # 아키텍처 문서
├── tasks/                  # PRD 및 Task List
│   ├── prds/
│   │   └── 0001-prd-sso-central-auth-server.md
│   └── 0001-tasks-supabase-init.md
├── test-sso-flow.sh        # 통합 테스트 스크립트
└── .env.example            # 환경변수 예시
```

---

## 🚀 빠른 시작 (5분 설정)

### 필수 조건
- ✅ Docker Desktop (실행 중이어야 함)
- ✅ Node.js 22+
- ✅ Supabase CLI (`npm install -g supabase` 또는 `npx supabase`)
- ✅ GitHub CLI (선택, Issue 기반 개발 시)

### 1️⃣ 저장소 클론

```bash
git clone https://github.com/garimto81/sso-system.git
cd sso-system
```

### 2️⃣ Supabase 시작

```bash
# Docker Desktop이 실행 중인지 확인
docker ps

# Supabase 로컬 환경 시작
npx supabase start

# 출력된 키들을 메모 (API URL, Anon key, Service Role key)
```

### 3️⃣ 환경변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일을 열어서 Supabase 키들을 입력
# (Step 2에서 출력된 값 사용)
```

### 4️⃣ SSO 서버 시작

```bash
cd server
npm install
npm start

# 서버 실행 확인
# → http://localhost:3000
```

### 5️⃣ 테스트

```bash
# Health check
curl http://localhost:3000/health

# 통합 테스트 (부분 자동)
./test-sso-flow.sh

# Supabase Studio 접속
open http://localhost:54323
```

### ✅ 완료!

이제 SSO 서버가 실행 중입니다:
- 🌐 SSO Server: http://localhost:3000
- 🗄️ Supabase Studio: http://localhost:54323
- 📖 API Docs: [docs/api-reference.md](docs/api-reference.md)

---

## 🔐 보안

- 환경변수로 모든 키 관리
- RLS (Row Level Security) 정책 적용
- HTTPS only
- Rate limiting

---

## 📚 문서

### API 및 개발 가이드
- **[API Reference](docs/api-reference.md)** - 전체 API 문서 (v0.1.0)
- [스크립트 가이드](scripts/README.md) - GitHub 워크플로우 자동화
- [환경변수 가이드](.env.example) - 설정 가이드

### 아키텍처
- [아키텍처 가이드](docs/architecture/README.md) - 전체 문서 맵
- [도메인 전략 가이드](docs/architecture/domain-strategy.md) - 3가지 도메인 시나리오
- [통합 가이드](docs/architecture/integration-guide.md) - 앱 연동 방법

### PRD 및 Task
- [PRD-0001](tasks/prds/0001-prd-sso-central-auth-server.md) - SSO 중앙 인증 서버 설계 (✅ 완료)
- [GitHub Issue #1](https://github.com/garimto81/sso-system/issues/1) - 구현 진행 상황

---

## 🤝 통합 앱

- [VTC_Logger](../VTC_Logger) - 로그 관리 시스템
- [contents-factory](../contents-factory) - 콘텐츠 관리

---

## 📋 릴리스 노트

### v0.1.0 (2025-01-11) - 기능 완료 🎉

**PRD-0001 완료**: SSO 중앙 인증 서버 구축

#### ✅ 완료된 기능
- **DB 스키마**: profiles, apps, auth_codes 테이블 + RLS 정책
- **SSO API 서버**: OAuth 2.0 Authorization Code Flow 완전 구현
  - `POST /auth/login` - Email/Password 로그인
  - `POST /auth/signup` - 회원가입
  - `GET /api/v1/authorize` - Authorization Code 발급
  - `POST /api/v1/token/exchange` - JWT Token 교환
  - `GET /api/v1/apps` - 등록된 앱 목록
- **GitHub 워크플로우**: Issue 템플릿 + 자동화 스크립트
- **문서화**: API Reference + 아키텍처 가이드
- **테스트**: 통합 테스트 스크립트

#### 📊 통계
- **커밋**: 3개
- **코드 라인**: ~4,500줄
- **API Endpoints**: 6개
- **테이블**: 3개 (RLS 적용)

#### 🔜 다음 버전
- **v0.2.0**: SDK 개발 (앱 통합 라이브러리)
- **v0.3.0**: Admin Dashboard (앱 관리 UI)
- **v0.4.0**: Google OAuth 완전 통합

---

**생성일**: 2025-01-12
**기술 스택**: Supabase + Node.js/Express + PostgreSQL
**라이센스**: MIT

## 🙋 기여하기

이슈나 Pull Request를 환영합니다!

1. Fork this repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: Add amazing feature [#issue]'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Made with ❤️ by SSO Team**
