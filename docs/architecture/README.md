# SSO System - 아키텍처 문서

**버전**: 1.0.0
**최종 업데이트**: 2025-01-12

---

## 📚 문서 구조

### 1. [도메인 전략 가이드](./domain-strategy.md)
**읽어야 할 사람**: 모든 개발자
**내용**:
- 3가지 도메인 시나리오 (같은 도메인 / 다른 도메인 / 혼합)
- Shared Cookie vs Token Exchange
- 하이브리드 전략 (권장)
- 의사결정 가이드

---

### 2. [통합 가이드](./integration-guide.md)
**읽어야 할 사람**: 앱 개발자 (VTC_Logger, contents-factory 등)
**내용**:
- 3가지 사용자 경험 (A/B/C)
- SDK 설치 및 사용법
- Express, Next.js, React, Vue 통합 예제
- 문제 해결 (CORS, 쿠키, JWT)

---

### 3. PRD-0001 (SSO 중앙 인증 서버)
**읽어야 할 사람**: SSO 서버 개발자
**내용**:
- Supabase 설정
- DB 스키마 (profiles, apps, auth_codes)
- API Endpoints (/authorize, /token/exchange)
- 보안 정책 (RLS)

**위치**: [tasks/prds/0001-prd-supabase-init.md](../../tasks/prds/0001-prd-supabase-init.md)

---

## 🎯 빠른 시작

### 당신이 SSO 서버 개발자라면
1. [PRD-0001](../../tasks/prds/0001-prd-supabase-init.md) 읽기
2. Supabase 설정
3. DB 마이그레이션 실행
4. API 개발

### 당신이 앱 개발자라면
1. [통합 가이드](./integration-guide.md) 읽기
2. SDK 설치
3. 환경변수 설정
4. 미들웨어 적용

---

## 🔑 핵심 개념

### SSO (Single Sign-On)란?
> 하나의 로그인으로 여러 앱에 접근하는 인증 시스템

### 이 프로젝트의 접근 방식
- **중앙 인증 서버**: Supabase Auth 기반
- **유연한 도메인 지원**: 같은 도메인, 다른 도메인 모두 OK
- **OAuth는 한 곳만**: Google Console 설정은 SSO 서버 하나만
- **SDK 자동화**: 앱 개발자는 복잡한 로직 신경 안 씀

---

## 📊 아키텍처 다이어그램

```
                [SSO Central Server]
                sso.yourdomain.com
                        ↓
           ┌────────────┴────────────┐
           ↓                         ↓
    Supabase Auth              SSO API
    (Google OAuth)        (/authorize, /token)
           ↓                         ↓
       DB (PostgreSQL)        JWT 발급
                        ↓
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
   VTC_Logger    contents-factory    AppN
   (SDK 통합)      (SDK 통합)     (SDK 통합)
```

---

## 🔐 보안 모델

### 3-Tier 보안
1. **인증 (Authentication)**: Supabase Auth
2. **인가 (Authorization)**: RLS 정책
3. **앱 검증**: API Key + Secret

### Token Lifecycle
```
1. 사용자 로그인 → JWT 발급 (1시간)
2. 앱이 JWT 검증
3. JWT 만료 → 자동 갱신 (Refresh Token)
4. 로그아웃 → JWT 무효화
```

---

## 🚀 배포 전략

### 로컬 개발
```
localhost:3000  → SSO 서버
localhost:3001  → VTC_Logger
localhost:3002  → contents-factory
```
- Token Exchange 방식 사용

### 프로덕션
```
sso.yourdomain.com     → SSO 서버
logger.yourdomain.com  → VTC_Logger
factory.yourdomain.com → contents-factory
```
- Shared Cookie 방식 사용 (더 빠름)

---

## 📖 용어 사전

| 용어 | 설명 |
|------|------|
| **SSO** | Single Sign-On, 단일 로그인 시스템 |
| **JWT** | JSON Web Token, 인증 토큰 |
| **OAuth** | Open Authorization, 외부 로그인 (Google 등) |
| **Token Exchange** | 코드 → JWT 변환 과정 |
| **Shared Cookie** | 도메인 간 쿠키 공유 방식 |
| **RLS** | Row Level Security, Supabase 보안 정책 |
| **API Key** | 앱 식별 키 (공개 가능) |
| **API Secret** | 앱 검증 키 (비밀) |

---

## 🔗 외부 참고 자료

### Supabase
- [Auth 공식 문서](https://supabase.com/docs/guides/auth)
- [RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)

### OAuth 2.0
- [RFC 6749](https://tools.ietf.org/html/rfc6749) - OAuth 2.0 스펙
- [Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)

### JWT
- [jwt.io](https://jwt.io) - JWT 디버거
- [RFC 7519](https://tools.ietf.org/html/rfc7519) - JWT 스펙

---

## 💬 지원

### 질문이 있다면
1. 이슈 트래커 확인
2. 내부 문서 검색
3. 팀 채널에서 질문

### 기여하기
- 문서 오타 수정: PR 환영
- 새로운 가이드 작성: 템플릿 사용
- 아키텍처 제안: RFC 작성

---

**다음 읽을 문서**:
- 처음이라면: [도메인 전략 가이드](./domain-strategy.md)
- 앱 개발자라면: [통합 가이드](./integration-guide.md)
- SSO 개발자라면: [PRD-0001](../../tasks/prds/0001-prd-supabase-init.md)
