# 병렬 Agent 실행 가이드

**버전**: 1.0.0
**작성일**: 2025-01-12
**대상**: Frontend Phase 2 개발 (PRD-0003)

---

## 📋 목차

1. [개요](#개요)
2. [Phase별 최대 병렬 조합](#phase별-최대-병렬-조합)
3. [실전 예제](#실전-예제)
4. [주의사항](#주의사항)
5. [트러블슈팅](#트러블슈팅)

---

## 개요

### 병렬 실행이란?

독립적인 작업을 여러 Agent가 **동시에** 수행하여 개발 시간을 극적으로 단축하는 전략입니다.

**핵심 원칙**:
- ✅ **독립적 작업**: 파일 충돌 없음 → 병렬 실행
- ❌ **의존성 있음**: 순차 실행 필수

### 효과

| 구분 | 순차 실행 | 병렬 실행 | 단축율 |
|------|----------|----------|--------|
| Phase 0 (검증) | 30분 | 15분 | 50% |
| Phase 1 (구현) | 180분 | 30분 | 83% |
| Phase 2 (테스트) | 150분 | 30분 | 80% |
| Phase 5 (검증) | 120분 | 30분 | 75% |
| **합계** | **480분** | **105분** | **78%** |

**결론**: 8시간 → 1.75시간 (거의 하루 → 반나절)

---

## Phase별 최대 병렬 조합

### Phase 0: 기술 검증 (최대 2개)

```bash
context7-engineer + ui-ux-designer
```

**역할**:
- `context7-engineer`: Next.js 14, shadcn/ui, React Query v5 최신 문서 확인
- `ui-ux-designer`: Tailwind v4, 접근성 가이드, 디자인 토큰 검증

**출력**:
- context7: 최신 API 변경사항, breaking changes 리포트
- ui-ux: 디자인 시스템 권장사항, 컬러 팔레트

**소요 시간**: ~15분

---

### Phase 1: 구현 (최대 6개!) ⚡

#### 1단계: 프로젝트 초기화 (순차)

```bash
frontend-developer
```

**작업**:
- Next.js 14 프로젝트 생성
- shadcn/ui 설치 및 초기 설정
- 폴더 구조 생성
- 기본 Layout 컴포넌트

**소요 시간**: ~10분

#### 2단계: 병렬 개발 (6개 동시)

```bash
frontend-developer
+ typescript-expert
+ ui-ux-designer
+ backend-architect
+ performance-engineer
+ database-architect
```

**파일 분리 (충돌 방지)**:

| Agent | 담당 파일 | 주요 작업 |
|-------|----------|----------|
| `frontend-developer` | `app/**/*.tsx` | Dashboard, Apps List, Create Form |
| `typescript-expert` | `types/**/*.ts`, `schemas/` | API 타입, Zod 스키마 |
| `ui-ux-designer` | `tailwind.config.ts`, `app/globals.css` | 디자인 토큰, CSS 변수 |
| `backend-architect` | `lib/api/**/*.ts`, `hooks/` | React Query, API 클라이언트 |
| `performance-engineer` | `next.config.js`, `public/` | 번들 최적화, 이미지 처리 |
| `database-architect` | `lib/cache/**/*.ts` | 캐싱 전략, Optimistic updates |

**소요 시간**: ~30분

---

### Phase 2: 테스트 (최대 5개!) ⚡

```bash
playwright-engineer
+ test-automator
+ security-auditor
+ typescript-expert
+ performance-engineer
```

**테스트 분리**:

| Agent | 테스트 유형 | 출력 위치 |
|-------|------------|----------|
| `playwright-engineer` | E2E 테스트 | `tests/e2e/*.spec.ts` |
| `test-automator` | 단위/통합 테스트 | `**/__tests__/*.test.tsx` |
| `security-auditor` | 보안 테스트 | `tests/security/*.test.ts` |
| `typescript-expert` | 타입 테스트 | `tests/types/*.test-d.ts` |
| `performance-engineer` | 성능 테스트 | `.lighthouserc.json`, `tests/perf/` |

**검증 기준**:
- Playwright: 모든 E2E 시나리오 통과
- Test Automator: 커버리지 >80%
- Security Auditor: 취약점 0개
- TypeScript Expert: 타입 에러 0개
- Performance Engineer: Lighthouse >90

**소요 시간**: ~30분

---

### Phase 5: 최종 검증 (최대 4개)

```bash
playwright-engineer
+ security-auditor
+ performance-engineer
+ code-reviewer
```

**검증 항목**:

| Agent | 검증 내용 | 통과 기준 |
|-------|----------|----------|
| `playwright-engineer` | 전체 플로우 테스트 | 0 failures |
| `security-auditor` | OWASP Top 10 체크 | 치명적 취약점 0개 |
| `performance-engineer` | Core Web Vitals | Lighthouse >90 |
| `code-reviewer` | 코드 품질 | SOLID 원칙 준수 |

**소요 시간**: ~30분

---

## 실전 예제

### 예제 1: Dashboard 구현 (Phase 1)

**명령**:
```
다음 에이전트들을 병렬로 실행:

1. frontend-developer
   작업: Dashboard 페이지 구현
   파일:
   - app/admin/page.tsx (메인 대시보드)
   - components/dashboard/StatsCard.tsx
   - components/dashboard/RecentActivity.tsx

2. typescript-expert
   작업: 타입 정의
   파일:
   - types/api.ts (Dashboard API 응답 타입)
   - types/dashboard.ts (StatsCard Props 등)

3. ui-ux-designer
   작업: 디자인 시스템 설정
   파일:
   - tailwind.config.ts (컬러 팔레트, 폰트)
   - app/globals.css (CSS 변수, 유틸리티)

4. backend-architect
   작업: React Query 설정
   파일:
   - lib/query-client.ts (QueryClient 설정)
   - hooks/useDashboardStats.ts (Dashboard 데이터 훅)

5. performance-engineer
   작업: Next.js 최적화
   파일:
   - next.config.js (이미지 최적화, 번들 분석)

6. database-architect
   작업: 캐싱 전략
   파일:
   - lib/cache/dashboard.ts (Dashboard 캐시 설정)
```

**예상 결과**:
- 30분 내 Dashboard 페이지 완성
- 타입 안전성 확보
- 최적화된 성능 설정
- 캐싱 전략 적용

---

### 예제 2: E2E 테스트 작성 (Phase 2)

**명령**:
```
다음 에이전트들을 병렬로 실행:

1. playwright-engineer
   작업: E2E 테스트 시나리오
   - tests/e2e/login.spec.ts (로그인 플로우)
   - tests/e2e/app-crud.spec.ts (앱 생성→수정→삭제)
   - tests/e2e/analytics.spec.ts (Analytics 페이지)

2. test-automator
   작업: 컴포넌트 단위 테스트
   - components/__tests__/StatsCard.test.tsx
   - hooks/__tests__/useApps.test.ts
   - lib/__tests__/api-client.test.ts

3. security-auditor
   작업: 보안 테스트
   - JWT 저장소 검증 (localStorage 사용 금지)
   - CSP 헤더 확인
   - XSS 방지 테스트

4. typescript-expert
   작업: 타입 체크
   - npm run type-check 실행
   - 타입 커버리지 측정

5. performance-engineer
   작업: Lighthouse CI 설정
   - .lighthouserc.json 생성
   - Core Web Vitals 임계값 설정
```

**예상 결과**:
- 30분 내 전체 테스트 스위트 완성
- 커버리지 >80% 달성
- 보안 취약점 0개 확인
- 성능 기준 충족

---

### 예제 3: 최종 배포 전 검증 (Phase 5)

**명령**:
```
다음 에이전트들을 병렬로 실행:

1. playwright-engineer
   작업: 프로덕션 시나리오 테스트
   - 전체 E2E 플로우 실행
   - 크로스 브라우저 테스트 (Chrome, Firefox, Safari)

2. security-auditor
   작업: 프로덕션 보안 스캔
   - OWASP Top 10 체크
   - 의존성 취약점 스캔 (npm audit)
   - CSP 헤더 최종 검증

3. performance-engineer
   작업: 성능 측정
   - Lighthouse 프로덕션 빌드 실행
   - 번들 사이즈 분석 (next-bundle-analyzer)
   - Core Web Vitals 측정

4. code-reviewer
   작업: 코드 품질 리뷰
   - SOLID 원칙 준수 확인
   - 중복 코드 검출
   - 주석 및 문서화 검토
```

**예상 결과**:
- 30분 내 배포 준비 완료
- 모든 품질 기준 충족 확인
- 배포 체크리스트 완성

---

## 주의사항

### ✅ 병렬 가능한 경우

**조건**: 서로 다른 파일을 수정

```bash
# Good: 파일 충돌 없음
frontend-developer  → app/admin/page.tsx
typescript-expert   → types/api.ts
ui-ux-designer      → tailwind.config.ts
```

### ❌ 병렬 불가능한 경우

**조건 1: 같은 파일 수정**
```bash
# Bad: 충돌 발생!
frontend-developer  → components/Button.tsx
code-reviewer       → components/Button.tsx (수정 제안)
```

**조건 2: 의존성 존재**
```bash
# Bad: 순차 실행 필수
database-architect  → DB 스키마 설계
backend-architect   → API 구현 (스키마 참조)
```

### 충돌 해결 방법

1. **파일 분리**: Agent별 명확한 파일 영역 할당
2. **순차 실행**: 의존성 있는 작업은 단계별 진행
3. **코드 리뷰는 나중에**: 구현 완료 후 별도로 실행

---

## 트러블슈팅

### Q1: Agent 6개 동시 실행했는데 일부만 완료되었어요

**원인**: 일부 Agent가 실패하거나 시간 초과

**해결**:
1. 실패한 Agent의 에러 로그 확인
2. 해당 Agent만 재실행
3. 다른 Agent 결과물과 병합

```bash
# 실패한 Agent만 재실행
frontend-developer (재실행)
```

---

### Q2: 파일 충돌이 발생했어요

**원인**: 여러 Agent가 같은 파일 수정

**해결**:
1. 파일별 책임 명확히 분리
2. 공통 파일은 첫 번째 Agent만 수정
3. 나머지 Agent는 다른 파일 작업

```bash
# 충돌 방지: 파일 영역 명확화
frontend-developer  → app/**/*.tsx (UI만)
typescript-expert   → types/**/*.ts (타입만)
```

---

### Q3: 병렬 실행 중 일부 Agent가 대기 중이에요

**원인**: Claude Code의 동시 실행 제한

**해결**:
1. 최대 6개까지만 병렬 실행
2. 7개 이상 필요하면 2번에 나눠서 실행

```bash
# 1차: 6개 병렬
frontend-developer + typescript-expert + ui-ux-designer
+ backend-architect + performance-engineer + database-architect

# 2차: 나머지
security-auditor + code-reviewer
```

---

### Q4: 순차 실행보다 느린 것 같아요

**원인**: Agent 간 중복 작업 또는 통신 오버헤드

**해결**:
1. Agent별 작업 범위 재정의
2. 중복 작업 제거
3. 독립성 낮은 작업은 순차 실행

---

## Best Practices

### 1. Phase 0 검증 먼저

```bash
# 항상 context7로 기술 검증부터
context7-engineer (Next.js 14, shadcn/ui 최신 문서)
```

### 2. 파일 책임 명확화

```bash
# Agent별 파일 영역 사전 정의
frontend-developer  → app/**/*.tsx
typescript-expert   → types/**, schemas/**
ui-ux-designer      → *.css, tailwind.config.ts
```

### 3. 테스트는 구현 후

```bash
# Phase 1 완료 → Phase 2 시작
Phase 1 (구현) → Phase 2 (테스트)
# 병렬 실행 X
```

### 4. 리뷰는 마지막

```bash
# Phase 5에서 code-reviewer 실행
playwright-engineer + security-auditor + code-reviewer
```

---

## 체크리스트

**병렬 실행 전**:
- [ ] 파일 충돌 가능성 확인
- [ ] Agent별 작업 범위 명확화
- [ ] 의존성 없음 확인

**병렬 실행 중**:
- [ ] Agent 진행 상황 모니터링
- [ ] 에러 발생 시 즉시 대응
- [ ] 중간 결과물 검토

**병렬 실행 후**:
- [ ] 모든 Agent 완료 확인
- [ ] 파일 통합 확인
- [ ] 테스트 실행하여 검증

---

## 참조

- [CLAUDE.md](../../CLAUDE.md) - 전체 워크플로우
- [PRD-0003](../tasks/prds/0003-prd-sso-admin-dashboard.md) - 프로젝트 요구사항
- [AGENTS_REFERENCE.md](AGENTS_REFERENCE.md) - 33개 Agent 전체 가이드

---

**버전**: 1.0.0
**마지막 업데이트**: 2025-01-12
