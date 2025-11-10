# SSO System

**버전**: 0.1.0
**통합 인증 시스템 (Single Sign-On)**

모든 애플리케이션을 하나의 인증으로 관리하는 중앙 SSO 시스템

---

## 🎯 목적

- VTC_Logger, contents-factory 등 모든 앱에 단일 로그인 제공
- Supabase Auth 기반 중앙 인증
- SDK를 통한 쉬운 통합

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

## 📦 구조

```
sso-system/
├── supabase/              # Supabase 설정
│   ├── config.toml
│   ├── migrations/        # DB 마이그레이션 (✅ v0.1.0)
│   │   ├── 20250112000001_initial_schema.sql
│   │   ├── 20250112000002_auth_codes_table.sql
│   │   └── 20250112000003_rls_policies.sql
│   └── seed.sql          # 초기 데이터
├── docs/                  # 문서 (✅ v0.1.0)
│   └── architecture/
│       ├── README.md
│       ├── domain-strategy.md
│       └── integration-guide.md
├── tasks/                 # PRD 및 Task List (✅ v0.1.0)
│   ├── prds/
│   │   └── 0001-prd-supabase-init.md
│   └── 0001-tasks-supabase-init.md
└── .env.example
```

---

## 🚀 시작하기

### 필수 조건
- Docker Desktop
- Node.js 22+
- Supabase CLI

### 로컬 개발 환경

```bash
# 1. Supabase 초기화
supabase init

# 2. 로컬 Supabase 시작
supabase start

# 3. 환경변수 설정
cp .env.example .env

# 4. SDK 설치
cd sdk
npm install
```

---

## 🔐 보안

- 환경변수로 모든 키 관리
- RLS (Row Level Security) 정책 적용
- HTTPS only
- Rate limiting

---

## 📚 문서

- [아키텍처 가이드](docs/architecture/README.md) - 전체 문서 맵
- [도메인 전략 가이드](docs/architecture/domain-strategy.md) - 3가지 도메인 시나리오
- [통합 가이드](docs/architecture/integration-guide.md) - 앱 연동 방법 (A/B/C 사용자 경험)
- [PRD-0001](tasks/prds/0001-prd-supabase-init.md) - SSO 중앙 인증 서버 설계

---

## 🤝 통합 앱

- [VTC_Logger](../VTC_Logger) - 로그 관리 시스템
- [contents-factory](../contents-factory) - 콘텐츠 관리

---

## 📋 릴리스 노트

### v0.1.0 (2025-01-12)
- ✅ PRD-0001: SSO 중앙 인증 서버 설계 완료
- ✅ DB 스키마 마이그레이션 (profiles, apps, auth_codes)
- ✅ RLS 정책 적용
- ✅ 도메인 전략 가이드 (3가지 시나리오)
- ✅ 통합 가이드 (A/B/C 사용자 경험)
- ✅ Token Exchange 메커니즘 설계

---

**생성일**: 2025-01-12
**프레임워크**: Supabase + React + TypeScript
**라이센스**: MIT
