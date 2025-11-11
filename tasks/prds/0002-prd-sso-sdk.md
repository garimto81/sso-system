# PRD-0002: SSO SDK 개발

**작성일**: 2025-01-11
**최종 수정**: 2025-01-11
**상태**: Draft v1.0
**작성자**: Development Team
**우선순위**: P1 (High)
**예상 공수**: 2일
**의존성**: PRD-0001 (완료)

---

## 📌 요약 (Executive Summary)

앱에서 **3줄 코드**로 SSO 통합이 가능한 JavaScript/TypeScript SDK를 개발합니다. NPM 패키지로 배포하여 VTC_Logger, contents-factory 등 모든 앱에서 쉽게 사용할 수 있도록 합니다.

### 핵심 가치
- ✅ **3줄 코드 통합**: SDK 초기화 → authorize() → 완료
- ✅ **TypeScript 지원**: 완전한 타입 정의
- ✅ **프레임워크 독립적**: React, Vue, Next.js, Node.js 모두 지원
- ✅ **자동 토큰 관리**: 저장, 갱신, 만료 처리

---

## 🎯 목표 (Objectives)

### 주요 목표
1. ✅ **SSOClient 클래스 구현** (OAuth 2.0 클라이언트)
2. ✅ **Authorization Code Flow 자동화**
3. ✅ **토큰 관리** (저장, 갱신, 검증)
4. ✅ **NPM 패키지 배포** (@sso-system/sdk)
5. ✅ **완전한 TypeScript 지원**

### 비즈니스 가치
- **개발자 경험 개선**: 복잡한 OAuth 플로우를 SDK가 자동 처리
- **개발 시간 단축**: 3줄 코드로 SSO 통합 (vs 수백 줄 직접 구현)
- **유지보수 용이**: SDK 업데이트만으로 모든 앱에 반영
- **일관성**: 모든 앱에서 동일한 인증 경험

---

## 📊 범위 (Scope)

### ✅ In Scope (이번 PRD에 포함)

#### 1. Core SDK 기능
```typescript
// 사용 예시
import { SSOClient } from '@sso-system/sdk';

const sso = new SSOClient({
  ssoUrl: 'http://localhost:3000',
  appId: 'vtc-logger-xxx',
  appSecret: 'your-secret',
  redirectUri: 'http://localhost:3001/auth/callback'
});

// 로그인 시작 (사용자를 SSO 서버로 리다이렉트)
await sso.authorize();

// 콜백 처리 (authorization code → access token)
const { user, token } = await sso.handleCallback();

// 사용자 정보 가져오기
const user = await sso.getUser();

// 로그아웃
await sso.logout();
```

#### 2. 구현할 메서드

##### `constructor(config)`
```typescript
interface SSOConfig {
  ssoUrl: string;           // SSO 서버 URL
  appId: string;            // App API Key
  appSecret: string;        // App Secret (서버 사이드만)
  redirectUri: string;      // 콜백 URL
  storage?: 'localStorage' | 'sessionStorage' | 'cookie' | 'memory';
  autoRefresh?: boolean;    // 자동 토큰 갱신 (기본: true)
}
```

##### `authorize(options?)`
- 사용자를 SSO 서버로 리다이렉트
- State 생성 (CSRF 방지)
- Authorization Code 요청

##### `handleCallback()`
- URL에서 code와 state 추출
- State 검증
- Token exchange 실행
- 토큰 저장
- 사용자 정보 반환

##### `getUser()`
- 저장된 토큰으로 사용자 정보 조회
- 토큰 만료 시 자동 갱신

##### `getAccessToken()`
- 저장된 access token 반환
- 만료 시 자동 갱신

##### `refreshToken()`
- Refresh token으로 새 access token 발급

##### `logout()`
- 로컬 토큰 삭제
- SSO 서버 로그아웃 호출 (선택)

##### `isAuthenticated()`
- 로그인 상태 확인
- 토큰 유효성 검증

#### 3. 토큰 저장소 (Storage)

**지원하는 저장 방식**:
- `localStorage` (기본, 브라우저)
- `sessionStorage` (세션 기반)
- `cookie` (httpOnly 권장)
- `memory` (메모리, 서버 사이드)

#### 4. 에러 처리

```typescript
class SSOError extends Error {
  code: string;
  details?: any;
}

// 에러 타입
- 'invalid_config' - 설정 오류
- 'invalid_state' - CSRF 검증 실패
- 'invalid_code' - Authorization code 무효
- 'token_expired' - 토큰 만료
- 'network_error' - 네트워크 오류
```

#### 5. TypeScript 타입 정의

```typescript
export interface User {
  id: string;
  email: string;
  display_name?: string;
  role: 'user' | 'app_owner' | 'admin';
}

export interface AuthResult {
  user: User;
  token: TokenSet;
}

export interface TokenSet {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}
```

#### 6. 패키지 구조

```
sdk/
├── src/
│   ├── index.ts              # Entry point
│   ├── SSOClient.ts          # Main class
│   ├── storage/
│   │   ├── StorageAdapter.ts # Abstract storage
│   │   ├── LocalStorage.ts
│   │   ├── SessionStorage.ts
│   │   ├── CookieStorage.ts
│   │   └── MemoryStorage.ts
│   ├── utils/
│   │   ├── crypto.ts         # State 생성, PKCE (선택)
│   │   ├── url.ts            # URL 파싱
│   │   └── validation.ts     # 검증 함수
│   ├── errors.ts             # SSOError 클래스
│   └── types.ts              # TypeScript 타입
├── tests/
│   ├── SSOClient.test.ts
│   └── storage.test.ts
├── package.json
├── tsconfig.json
├── README.md
└── .npmignore
```

#### 7. NPM 패키지

**패키지 이름**: `@sso-system/sdk`
**버전**: 0.1.0
**의존성**:
- 없음 (Zero dependency!)

### ❌ Out of Scope (이번 PRD에 포함 안함)

- ❌ React 전용 Hooks (별도 패키지 `@sso-system/react`)
- ❌ Vue 플러그인 (별도 패키지)
- ❌ PKCE 지원 (v0.2.0)
- ❌ Popup 기반 인증 (v0.3.0)
- ❌ Multi-tab synchronization
- ❌ Offline 지원

---

## 🔧 기술 스택

| 항목 | 기술 | 버전 |
|------|------|------|
| **언어** | TypeScript | 5.x |
| **빌드** | Rollup | 최신 |
| **테스트** | Jest | 29.x |
| **포맷** | Prettier | 최신 |
| **린트** | ESLint | 최신 |
| **번들 크기** | < 10KB | gzip |

---

## 📋 상세 작업 목록 (Tasks)

### Task 1: 프로젝트 초기화
- [ ] `sdk/` 폴더 생성
- [ ] `package.json` 설정
- [ ] TypeScript 설정 (`tsconfig.json`)
- [ ] Rollup 빌드 설정
- [ ] `.npmignore` 설정

### Task 2: 타입 정의
- [ ] `types.ts` 작성
- [ ] `User`, `TokenSet`, `SSOConfig` 인터페이스
- [ ] `SSOError` 클래스

### Task 3: Storage 구현
- [ ] `StorageAdapter` 추상 클래스
- [ ] `LocalStorage` 구현
- [ ] `SessionStorage` 구현
- [ ] `CookieStorage` 구현
- [ ] `MemoryStorage` 구현

### Task 4: Util 함수
- [ ] `crypto.ts` - state 생성 함수
- [ ] `url.ts` - URL 파싱 함수
- [ ] `validation.ts` - 검증 함수

### Task 5: SSOClient 구현
- [ ] `constructor()` - 초기화
- [ ] `authorize()` - 인증 시작
- [ ] `handleCallback()` - 콜백 처리
- [ ] `getUser()` - 사용자 정보
- [ ] `getAccessToken()` - 토큰 조회
- [ ] `refreshToken()` - 토큰 갱신
- [ ] `logout()` - 로그아웃
- [ ] `isAuthenticated()` - 인증 상태

### Task 6: 테스트
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] Coverage > 80%

### Task 7: 문서화
- [ ] README.md (사용 가이드)
- [ ] API Documentation
- [ ] Examples (React, Node.js)

### Task 8: NPM 배포
- [ ] NPM 계정 설정
- [ ] 패키지 빌드 테스트
- [ ] `npm publish` (scoped package)

---

## ✅ 성공 기준 (Definition of Done)

### 기능적 성공 기준
1. ✅ 3줄 코드로 VTC_Logger에 SSO 통합 가능
2. ✅ Authorization Code Flow 완전 자동화
3. ✅ 토큰 자동 저장 및 갱신
4. ✅ TypeScript 타입 완전 지원
5. ✅ NPM에 배포 완료
6. ✅ 번들 크기 < 10KB (gzip)
7. ✅ 테스트 커버리지 > 80%

### 기술적 성공 기준
1. ✅ Zero dependency (외부 의존성 없음)
2. ✅ ESM + CommonJS 모두 지원
3. ✅ TypeScript declaration files (.d.ts) 포함
4. ✅ Tree-shakable
5. ✅ 문서화 완료 (README + API Docs)

---

## 🧪 테스트 시나리오

### Scenario 1: VTC_Logger 통합
```typescript
// VTC_Logger에서 SDK 사용
import { SSOClient } from '@sso-system/sdk';

const sso = new SSOClient({
  ssoUrl: 'http://localhost:3000',
  appId: 'vtc-logger-xxx',
  appSecret: process.env.SSO_APP_SECRET,
  redirectUri: 'http://localhost:3001/auth/callback'
});

// 로그인 버튼 클릭
button.onclick = () => sso.authorize();

// 콜백 라우트
app.get('/auth/callback', async (req, res) => {
  const { user, token } = await sso.handleCallback();
  req.session.user = user;
  res.redirect('/dashboard');
});
```

### Scenario 2: 보호된 페이지
```typescript
// Middleware
app.use(async (req, res, next) => {
  if (!await sso.isAuthenticated()) {
    return res.redirect('/login');
  }
  req.user = await sso.getUser();
  next();
});
```

### Scenario 3: 토큰 자동 갱신
```typescript
// 만료된 토큰 자동 갱신
const token = await sso.getAccessToken(); // 자동으로 refresh 수행
```

---

## 🚨 리스크 및 완화 전략

### 리스크 1: 토큰 보안 (XSS)
**완화**:
- httpOnly cookie 사용 권장
- 문서에 보안 가이드 포함
- CSP 헤더 권장

### 리스크 2: CSRF 공격
**완화**:
- State 파라미터 필수 사용
- State 검증 자동화

### 리스크 3: 브라우저 호환성
**완화**:
- Polyfill 포함 (fetch, Promise)
- IE11은 지원 안 함 (문서 명시)

---

## 📚 참고 자료

### 라이브러리 참고
- [Auth0 SDK](https://github.com/auth0/auth0-spa-js)
- [NextAuth.js](https://github.com/nextauthjs/next-auth)
- [Supabase Auth Helpers](https://github.com/supabase/auth-helpers)

### OAuth 2.0 표준
- [RFC 6749 - OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

---

## 📊 예상 일정

| Phase | 작업 | 예상 시간 |
|-------|------|----------|
| **Setup** | 프로젝트 초기화 | 1시간 |
| **Core** | SSOClient 구현 | 4시간 |
| **Storage** | Storage adapters | 2시간 |
| **Testing** | 테스트 작성 | 3시간 |
| **Docs** | 문서화 | 2시간 |
| **NPM** | 패키지 배포 | 1시간 |
| **Total** | | **13시간 (약 2일)** |

---

## 🔄 다음 단계 (Next Steps)

이 PRD 완료 후:
1. **PRD-0003**: Admin Dashboard (앱 관리 UI)
2. **PRD-0004**: VTC_Logger SDK 통합 (실제 앱에 적용)
3. **PRD-0005**: React Hooks 패키지 (`@sso-system/react`)

---

## 📝 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|----------|--------|
| 2025-01-11 | 초안 작성 | Development Team |

---

## ✍️ 승인

- [ ] Product Owner: _________________
- [ ] Tech Lead: _________________
- [ ] Security Review: _________________

---

**상태**: ⏳ 승인 대기 중

> 이 PRD는 MINIMAL 가이드를 따라 작성되었습니다.
> PRD-0001 (SSO 서버)이 완료되어야 시작 가능합니다.
