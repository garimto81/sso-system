# SSO System

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
│   ├── migrations/        # DB 마이그레이션
│   └── seed.sql          # 초기 데이터
├── sdk/                   # SSO SDK
│   ├── src/
│   └── package.json
├── docs/                  # 문서
│   ├── architecture.md
│   └── integration-guide.md
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

- [아키텍처 설계](docs/architecture.md)
- [통합 가이드](docs/integration-guide.md)
- [API 레퍼런스](docs/api-reference.md)

---

## 🤝 통합 앱

- [VTC_Logger](../VTC_Logger) - 로그 관리 시스템
- [contents-factory](../contents-factory) - 콘텐츠 관리

---

**생성일**: 2025-01-12
**프레임워크**: Supabase + React + TypeScript
**라이센스**: MIT
