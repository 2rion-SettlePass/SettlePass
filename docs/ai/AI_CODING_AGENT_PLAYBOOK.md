# AI 코딩 에이전트 기반 대형 프로젝트 운영 문서화 가이드

작성일: 2026-05-31  
목적: 코딩 에이전트로 대형 프로젝트를 구축할 때 필요한 문서, 폴더 구조, 의사결정 기록, 테스트 전략, 클린 아키텍처 기반 모듈별 결정사항, AI-사람 협업 오케스트레이션을 한 번에 정리한다.

---

## 0. 핵심 결론

대형 프로젝트에서 AI 코딩 에이전트를 잘 쓰는 방식은 단순히 “프롬프트를 길게 써서 코드 생성”하는 방식이 아니다.

핵심은 다음이다.

```text
코딩 에이전트 + 문서화 + 결정 로그 + 테스트 게이트 + 오케스트레이션
```

AI에게 코드를 많이 만들게 하는 것이 목표가 아니다.  
AI가 **임의판단하지 못하게 만드는 구조**를 갖추는 것이 목표다.

따라서 대형 프로젝트의 문서화는 다음을 통제해야 한다.

```text
1. 무엇을 만들 것인가
2. 왜 만들 것인가
3. 어떻게 개발할 것인가
4. 어떤 아키텍처를 따를 것인가
5. 어떤 코딩 컨벤션을 지킬 것인가
6. 도메인별로 어떤 규칙과 결정이 있는가
7. 각 모듈의 책임과 경계는 무엇인가
8. 테스트는 어떻게 작성하고 검증할 것인가
9. 큰 기술 결정은 어떻게 기록할 것인가
10. 사람과 AI의 의사결정은 어떻게 기록할 것인가
11. AI가 어떤 순서로 문서를 읽고 작업해야 하는가
```

---

## 1. 전체 문서 계층

대형 AI 개발 프로젝트의 문서 체계는 다음처럼 계층화하는 것이 좋다.

```text
Level 1. Product Truth
- PRD.md
- ROADMAP.md
- USER_STORIES.md

Level 2. Engineering Truth
- ARCHITECTURE.md
- TECH_STACK.md
- DEVELOPMENT_GUIDE.md
- CODING_CONVENTION.md
- TEST_STRATEGY.md
- SECURITY.md
- REVIEW_GUIDE.md

Level 3. Domain / Module Truth
- MODULE.md
- DOMAIN_MODEL.md
- TERMS.md
- INVARIANTS.md
- USE_CASES.md
- DECISIONS.md
- PORTS.md
- EVENTS.md
- ERRORS.md
- TEST_POLICY.md

Level 4. Feature Truth
- requirements.md
- design.md
- tasks.md
- test-plan.md
- implementation-log.md

Level 5. Decision Truth
- ADR
- decision-log

Level 6. AI Operation Truth
- AGENTS.md
- ORCHESTRATION.md
- PROMPT_PROTOCOL.md
- CONTEXT_LOADING.md
- REVIEW_CHECKLIST.md
- FAILURE_PATTERNS.md

Level 7. Execution Truth
- code
- tests
- CI
- implementation-log
```

핵심 원칙은 다음이다.

```text
PRD는 제품의 진실.
requirements.md는 기능 동작의 진실.
design.md는 구현 설계의 진실.
tasks.md는 에이전트 실행 단위의 진실.
AGENTS.md는 에이전트 행동 규칙의 진실.
ADR은 큰 기술 결정의 진실.
DECISIONS.md는 모듈 내부 결정의 진실.
INVARIANTS.md는 절대 깨면 안 되는 도메인 규칙의 진실.
ORCHESTRATION.md는 AI 작업 흐름의 진실.
코드는 이 문서들의 현재 표현물.
```

---

## 2. 권장 최상위 폴더 구조

대형 웹/API/백엔드 프로젝트 기준 권장 구조다. 프론트엔드, 백엔드, 워커, 공유 패키지, 인프라를 한 저장소에서 관리하는 monorepo 기준이다.

```text
project-root/
├── AGENTS.md
├── README.md
├── CHANGELOG.md
├── .env.example
├── .editorconfig
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
│
├── .github/
│   ├── copilot-instructions.md
│   ├── instructions/
│   │   ├── frontend.instructions.md
│   │   ├── backend.instructions.md
│   │   └── infra.instructions.md
│   └── workflows/
│       ├── ci.yml
│       ├── test.yml
│       └── deploy.yml
│
├── .claude/
│   ├── CLAUDE.md
│   ├── settings.json
│   └── rules/
│       ├── code-style.md
│       ├── testing.md
│       ├── security.md
│       ├── frontend.md
│       └── backend.md
│
├── .gemini/
│   └── settings.json
│
├── .aider.conf.yml
│
├── docs/
│   ├── product/
│   │   ├── PRD.md
│   │   ├── ROADMAP.md
│   │   ├── PERSONAS.md
│   │   ├── USER_STORIES.md
│   │   └── UX_FLOWS.md
│   │
│   ├── engineering/
│   │   ├── DEVELOPMENT_GUIDE.md
│   │   ├── CODING_CONVENTION.md
│   │   ├── ARCHITECTURE.md
│   │   ├── TECH_STACK.md
│   │   ├── DATA_MODEL.md
│   │   ├── API.md
│   │   ├── SECURITY.md
│   │   ├── TEST_STRATEGY.md
│   │   ├── REVIEW_GUIDE.md
│   │   ├── OBSERVABILITY.md
│   │   └── DEPLOYMENT.md
│   │
│   ├── domain/
│   │   ├── auth/
│   │   │   ├── DOMAIN_MODEL.md
│   │   │   ├── DECISIONS.md
│   │   │   ├── TERMS.md
│   │   │   └── INVARIANTS.md
│   │   │
│   │   ├── billing/
│   │   │   ├── DOMAIN_MODEL.md
│   │   │   ├── DECISIONS.md
│   │   │   ├── TERMS.md
│   │   │   └── INVARIANTS.md
│   │   │
│   │   └── order/
│   │       ├── DOMAIN_MODEL.md
│   │       ├── DECISIONS.md
│   │       ├── TERMS.md
│   │       └── INVARIANTS.md
│   │
│   ├── adr/
│   │   ├── 0000-template.md
│   │   ├── 0001-use-monorepo.md
│   │   └── 0002-auth-session-strategy.md
│   │
│   ├── decision-log/
│   │   ├── 2026-05-30.md
│   │   └── 2026-05-31.md
│   │
│   ├── ai/
│   │   ├── AI_COLLABORATION_GUIDE.md
│   │   ├── ORCHESTRATION.md
│   │   ├── PROMPT_PROTOCOL.md
│   │   ├── CONTEXT_LOADING.md
│   │   ├── REVIEW_CHECKLIST.md
│   │   └── FAILURE_PATTERNS.md
│   │
│   └── runbooks/
│       ├── local-dev.md
│       ├── release.md
│       └── incident-response.md
│
├── specs/
│   ├── 000-project-constitution/
│   │   └── constitution.md
│   │
│   ├── 001-authentication/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   ├── tasks.md
│   │   ├── test-plan.md
│   │   ├── implementation-log.md
│   │   ├── research.md
│   │   ├── data-model.md
│   │   ├── quickstart.md
│   │   └── contracts/
│   │       ├── openapi.yaml
│   │       └── events.md
│   │
│   └── 002-billing/
│       ├── requirements.md
│       ├── design.md
│       ├── tasks.md
│       ├── test-plan.md
│       ├── implementation-log.md
│       ├── research.md
│       ├── data-model.md
│       ├── quickstart.md
│       └── contracts/
│
├── apps/
│   ├── web/
│   │   ├── AGENTS.md
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── api/
│   │   ├── AGENTS.md
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── worker/
│       ├── AGENTS.md
│       ├── src/
│       ├── tests/
│       └── package.json
│
├── packages/
│   ├── ui/
│   ├── config/
│   ├── database/
│   ├── auth/
│   ├── shared/
│   └── test-utils/
│
├── infra/
│   ├── docker/
│   ├── terraform/
│   ├── k8s/
│   └── scripts/
│
├── tests/
│   ├── e2e/
│   ├── contract/
│   ├── integration/
│   └── fixtures/
│
├── scripts/
│   ├── bootstrap.sh
│   ├── check.sh
│   ├── seed-db.ts
│   └── reset-local-db.ts
│
└── tools/
    ├── codegen/
    ├── migrations/
    └── evals/
```

---

## 3. 필수 문서 목록

| 문서 | 위치 | 목적 |
|---|---|---|
| `AGENTS.md` | 루트, 필요 시 하위 폴더 | AI 에이전트 작업 규칙 |
| `PRD.md` | `docs/product/PRD.md` | 제품 목표, 사용자, 범위, 성공 기준 |
| `ARCHITECTURE.md` | `docs/engineering/ARCHITECTURE.md` | 전체 시스템 구조와 설계 원칙 |
| `TECH_STACK.md` | `docs/engineering/TECH_STACK.md` | 런타임, 프레임워크, 패키지 매니저, 버전 정책 |
| `DEVELOPMENT_GUIDE.md` | `docs/engineering/DEVELOPMENT_GUIDE.md` | 개발 방식과 작업 흐름 |
| `CODING_CONVENTION.md` | `docs/engineering/CODING_CONVENTION.md` | 의미적 코드 컨벤션 |
| `TEST_STRATEGY.md` | `docs/engineering/TEST_STRATEGY.md` | 테스트 계층, 정책, 검증 기준 |
| `SECURITY.md` | `docs/engineering/SECURITY.md` | 인증, 권한, 비밀값, 보안 금지사항 |
| `requirements.md` | `specs/<feature>/requirements.md` | 기능별 요구사항 |
| `design.md` | `specs/<feature>/design.md` | 기능별 구현 설계 |
| `tasks.md` | `specs/<feature>/tasks.md` | 에이전트가 수행할 원자적 작업 |
| `ADR` | `docs/adr/` | 큰 기술 결정 기록 |
| `decision-log` | `docs/decision-log/` | 사람-AI 의사결정 기록 |
| `implementation-log.md` | `specs/<feature>/implementation-log.md` | AI 작업 이력 기록 |
| `ORCHESTRATION.md` | `docs/ai/ORCHESTRATION.md` | AI 작업 상태와 흐름 제어 |
| `PROMPT_PROTOCOL.md` | `docs/ai/PROMPT_PROTOCOL.md` | 사람-AI 대화 템플릿 |

---

## 4. `AGENTS.md` 템플릿

`AGENTS.md`는 사람이 읽는 README가 아니다. AI 에이전트가 반복적으로 따라야 하는 작업 규칙, 명령어, 테스트, 보안 제약을 적는 파일이다.

```markdown
# AGENTS.md

## Project summary
이 저장소는 [제품명]의 monorepo다.

주요 구성:
- apps/web: 사용자용 웹 앱
- apps/api: 백엔드 API
- apps/worker: 비동기 작업 처리
- packages/database: DB schema, migrations, query helpers
- packages/ui: 공유 UI 컴포넌트

## Operating principles
- 한 번에 하나의 task만 구현한다.
- 요구사항이 불명확하면 코드를 수정하지 말고 질문을 남긴다.
- 기존 public API를 깨는 변경은 `docs/adr/`에 ADR을 추가한다.
- 새로운 production dependency는 명시적 승인 없이 추가하지 않는다.
- generated file, migration, lockfile 변경은 이유를 PR 설명에 적는다.
- opportunistic refactor를 금지한다.

## Commands
- Install: `pnpm install`
- Dev: `pnpm dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Unit test: `pnpm test`
- E2E test: `pnpm test:e2e`
- Build: `pnpm build`
- Full check: `pnpm check`

## Definition of done
작업 완료 전 반드시 다음을 통과시킨다.

1. `pnpm lint`
2. `pnpm typecheck`
3. 관련 package의 unit/integration test
4. 변경 범위가 UI/API에 걸치면 e2e 또는 contract test
5. 필요한 문서 갱신

## Code style
- TypeScript strict mode를 유지한다.
- public function에는 명시적 return type을 둔다.
- 비즈니스 로직은 route/controller/React component에 직접 두지 않는다.
- shared package에 도메인별 의존성을 역방향으로 넣지 않는다.

## Architecture boundaries
- apps/web은 apps/api 내부 모듈을 직접 import하지 않는다.
- packages/shared는 framework-neutral해야 한다.
- packages/database는 UI 계층을 참조하지 않는다.
- infra 코드는 애플리케이션 런타임 코드에 import하지 않는다.

## Testing policy
- 버그 수정은 regression test를 먼저 추가한다.
- API 변경은 contract test를 갱신한다.
- DB migration 변경은 rollback 가능성 또는 forward-only 정책을 명시한다.

## Security rules
- `.env`, `.env.local`, production secret 파일을 읽거나 출력하지 않는다.
- 비밀값은 `.env.example`에 placeholder로만 문서화한다.
- 인증/권한/결제/개인정보 관련 변경은 `docs/engineering/SECURITY.md`를 확인한다.
- destructive command는 실행 전 사용자 승인을 요구한다.

## PR instructions
- PR 제목: `[scope] short description`
- PR 본문에는 변경 요약, 검증 명령, 관련 spec/task ID를 포함한다.
- 실패한 검증이 있으면 숨기지 말고 원인과 재현 방법을 적는다.
```

---

## 5. `PRD.md` 템플릿

`PRD.md`는 “왜/무엇을/누구를 위해”를 정의한다.

```markdown
# PRD.md

## 1. Product summary
- 제품명:
- 한 문장 설명:
- 핵심 문제:
- 핵심 해결책:

## 2. Target users
| 사용자 | 문제 | 현재 대안 | 성공 경험 |
|---|---|---|---|
| | | | |

## 3. Goals
- G1:
- G2:
- G3:

## 4. Non-goals
- 이번 버전에서 하지 않는 것:
- 의도적으로 제외하는 기능:
- 기술적으로 나중에 미룰 사항:

## 5. MVP scope
### Must have
- 

### Should have
- 

### Could have
- 

### Won't have
- 

## 6. User stories
- As a [user], I want [capability], so that [benefit].

## 7. Functional requirements
| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| | | | |

## 8. Non-functional requirements
- Performance:
- Security:
- Privacy:
- Availability:
- Accessibility:
- Observability:
- Compliance:

## 9. Metrics
- Activation:
- Retention:
- Conversion:
- Latency:
- Error rate:

## 10. Risks and open questions
| ID | Risk / Question | Owner | Decision deadline |
|---|---|---|---|
| | | | |
```

---

## 6. `DEVELOPMENT_GUIDE.md` 템플릿

목적: 사람이든 AI든 “이 프로젝트에서 개발을 어떻게 해야 하는지”를 정의한다.

```markdown
# DEVELOPMENT_GUIDE.md

## 개발 원칙
- 작은 단위로 변경한다.
- 요구사항 없는 구현을 금지한다.
- public API 변경은 ADR을 남긴다.
- 테스트 없는 버그 수정은 금지한다.
- 도메인 규칙은 코드보다 문서에 먼저 반영한다.
- 코드 변경 후 관련 문서를 갱신한다.

## 작업 흐름
1. 요구사항 확인
2. 관련 도메인 문서 확인
3. 기존 ADR 확인
4. 설계 초안 작성
5. tasks.md 분해
6. 구현
7. 테스트
8. 리뷰
9. decision-log 갱신
10. implementation-log 갱신

## 금지사항
- 임의 dependency 추가
- 임의 아키텍처 변경
- 기존 도메인 용어 변경
- 테스트 우회
- secret 파일 접근
- 지정 task 외 구현
- 불명확한 요구사항을 추측으로 구현

## 변경 단위
- task 하나는 하나의 PR로 끝낼 수 있어야 한다.
- task 하나는 독립적으로 검증 가능해야 한다.
- task 하나는 명확한 acceptance criteria를 가져야 한다.

## 리뷰 기준
- 요구사항 충족 여부
- 아키텍처 경계 위반 여부
- 도메인 불변조건 위반 여부
- 테스트 충분성
- 보안 영향
- 문서 갱신 여부
```

---

## 7. `CODING_CONVENTION.md` 템플릿

목적: formatter/linter가 잡지 못하는 의미적 컨벤션을 통제한다.

```markdown
# CODING_CONVENTION.md

## TypeScript
- `any` 사용 금지. 불가피하면 주석으로 이유를 남긴다.
- public function은 명시적 return type을 가진다.
- domain object는 plain object보다 named type을 우선한다.
- business logic은 controller, route handler, React component 안에 직접 작성하지 않는다.
- nullable value는 명시적으로 처리한다.

## Naming
- React component: PascalCase
- hook: useXxx
- service: XxxService
- repository: XxxRepository
- DTO: XxxRequest, XxxResponse
- domain type: Xxx, XxxStatus, XxxPolicy
- error: XxxError
- event: XxxEvent

## Error handling
- throw raw string 금지
- domain error와 infrastructure error를 구분한다.
- user-facing error message와 internal log message를 분리한다.
- catch 후 무시하지 않는다.

## File structure
- 한 파일에 여러 책임을 넣지 않는다.
- barrel export는 shared package에서만 허용한다.
- circular dependency 금지.
- domain layer에서 infrastructure import 금지.

## Comments
- 코드가 무엇을 하는지 설명하지 않는다.
- 왜 그렇게 했는지, 예외적인 결정만 주석으로 남긴다.

## Dependency policy
- framework 의존성은 presentation 또는 infrastructure layer로 제한한다.
- domain layer는 외부 라이브러리에 의존하지 않는다.
- application layer는 port interface에만 의존한다.
```

---

## 8. `TEST_STRATEGY.md` 템플릿

목적: AI가 테스트를 의미 없이 만들지 못하게 기준을 정한다.

```markdown
# TEST_STRATEGY.md

## 테스트 피라미드
1. Unit test: domain logic, pure functions, policies
2. Integration test: DB, API, external adapter
3. Contract test: API schema, event schema
4. E2E test: critical user journey only

## 테스트 작성 원칙
- 버그 수정은 regression test를 먼저 추가한다.
- domain invariant는 unit test로 고정한다.
- API 변경은 contract test를 갱신한다.
- UI 테스트는 behavior 중심으로 작성한다.
- implementation detail 테스트를 금지한다.

## 테스트 네이밍
`should_[expected_behavior]_when_[condition]`

예:
- `should_reject_signup_when_email_already_exists`
- `should_keep_subscription_active_during_grace_period`

## Mocking policy
- domain test에서는 mock 최소화
- external payment/email provider는 adapter boundary에서 mock
- DB repository는 integration test에서 실제 test DB 사용
- 시간 의존성은 Clock port로 대체한다.

## Coverage policy
- 전체 coverage 숫자를 맹신하지 않는다.
- auth, billing, permission, data-loss 영역은 높은 coverage를 요구한다.
- 단순 UI wrapper는 coverage를 강제하지 않는다.

## AI가 피해야 할 테스트
- 의미 없는 snapshot test
- mock만 가득한 테스트
- 실제 버그를 못 잡는 happy path 테스트
- 실패 케이스 없는 테스트
- DB transaction, race condition, permission edge case를 누락한 테스트
```

---

## 9. 기능별 스펙 구조

대형 프로젝트에서는 루트에 거대한 `SPEC.md` 하나를 두는 방식이 부적절하다.
기능별로 스펙을 나누는 편이 좋다.

```text
specs/001-authentication/
├── requirements.md
├── design.md
├── tasks.md
├── test-plan.md
├── implementation-log.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── openapi.yaml
    └── events.md
```

---

## 10. `requirements.md` 템플릿

요구사항은 단순 기능 목록이 아니라 테스트 가능한 문장이어야 한다.

```markdown
# requirements.md: 001-authentication

## User stories
### US-001: Email sign-up
As a new user, I want to create an account with email and password, so that I can access the service.

## Requirements

### R-001: Sign-up validation
WHEN a user submits an email sign-up form with a valid email and password
THE SYSTEM SHALL create a pending user account and send a verification email.

### R-002: Duplicate email
WHEN a user submits an email that already exists
THE SYSTEM SHALL reject the request with a non-enumerating error message.

### R-003: Password policy
WHEN a user submits a password that does not meet the password policy
THE SYSTEM SHALL return field-level validation errors.

## Acceptance criteria
- AC-001:
- AC-002:
- AC-003:

## Edge cases
- Expired verification token
- Reused verification token
- Email provider failure
- Rate limit exceeded

## Non-goals
- SSO
- Enterprise SAML
- Passkeys
```

나쁜 요구사항 예시:

```markdown
- 회원가입 만들기
- 로그인 만들기
- 이메일 인증 만들기
```

문제:

```text
- AI에게 해석권이 너무 많이 생긴다.
- acceptance criteria가 없다.
- 실패 케이스가 없다.
- 테스트로 변환하기 어렵다.
```

---

## 11. `design.md` 템플릿

```markdown
# design.md: 001-authentication

## 1. Context
이 문서는 `requirements.md`의 R-001~R-003을 구현하기 위한 설계다.

## 2. Architecture
- Web: sign-up form, validation display
- API: auth route, validation, user creation
- DB: users, email_verification_tokens
- Worker: email dispatch

## 3. Data model
### users
- id
- email
- password_hash
- email_verified_at
- created_at
- updated_at

### email_verification_tokens
- id
- user_id
- token_hash
- expires_at
- used_at

## 4. API contracts
- `POST /auth/signup`
- `POST /auth/verify-email`

## 5. Error handling
| Case | Response | Logging | User-facing message |
|---|---|---|---|
| | | | |

## 6. Security considerations
- Password hash algorithm:
- Token storage:
- Rate limiting:
- Email enumeration mitigation:

## 7. Test plan
- Unit:
- Integration:
- Contract:
- E2E:

## 8. Open questions
- 
```

---

## 12. `tasks.md` 템플릿

```markdown
# tasks.md: 001-authentication

## Phase 1: Contracts and tests
- [ ] T-001 [P] Add OpenAPI contract for `POST /auth/signup`
  - Files: `specs/001-authentication/contracts/openapi.yaml`
  - Acceptance: request/response schema includes validation errors
  - Validation: `pnpm test:contract`

- [ ] T-002 [P] Add DB migration for users and email verification tokens
  - Files: `packages/database/migrations/*`
  - Acceptance: migration applies cleanly on empty DB
  - Validation: `pnpm db:migrate && pnpm db:reset`

## Phase 2: Implementation
- [ ] T-003 Implement sign-up API route
  - Depends on: T-001, T-002
  - Files: `apps/api/src/routes/auth.ts`
  - Acceptance: valid request creates pending user
  - Validation: `pnpm test apps/api`

- [ ] T-004 Implement sign-up UI
  - Depends on: T-003
  - Files: `apps/web/src/features/auth/*`
  - Acceptance: field-level validation errors are shown
  - Validation: `pnpm test apps/web`

## Phase 3: Integration
- [ ] T-005 Add E2E test for sign-up happy path
  - Depends on: T-003, T-004
  - Files: `tests/e2e/auth/signup.spec.ts`
  - Validation: `pnpm test:e2e`
```

`[P]`는 병렬 실행 가능 task를 의미한다.

---

## 13. 클린 아키텍처 기반 백엔드 구조

클린 아키텍처, DDD, 모듈러 모놀리스 방식에서는 단순히 `domain`, `application`, `infrastructure`, `presentation` 계층만 나누면 부족하다.

각 모듈마다 다음을 문서화해야 한다.

```text
1. 이 모듈의 책임
2. 이 모듈이 소유하는 데이터
3. 이 모듈의 도메인 규칙
4. 이 모듈이 외부에 공개하는 인터페이스
5. 다른 모듈과 통신하는 방식
6. 이 모듈에서 허용되는 의존성
7. 테스트 기준
8. 금지된 구현 방식
9. 중요한 기술적 결정
```

권장 구조:

```text
src/
├── modules/
│   ├── auth/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── policies/
│   │   │   ├── events/
│   │   │   └── errors/
│   │   │
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   ├── ports/
│   │   │   └── dto/
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── repositories/
│   │   │   ├── providers/
│   │   │   └── mappers/
│   │   │
│   │   ├── presentation/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   └── validators/
│   │   │
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   │
│   │   └── docs/
│   │       ├── MODULE.md
│   │       ├── TERMS.md
│   │       ├── INVARIANTS.md
│   │       ├── USE_CASES.md
│   │       ├── DECISIONS.md
│   │       ├── PORTS.md
│   │       ├── EVENTS.md
│   │       ├── ERRORS.md
│   │       └── TEST_POLICY.md
│   │
│   ├── user/
│   ├── billing/
│   ├── notification/
│   └── order/
│
├── shared/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── docs/
│       └── SHARED_RULES.md
│
└── main.ts
```

---

## 14. 모듈별 문서 구조

예시: `auth` 모듈

```text
src/modules/auth/docs/
├── MODULE.md
├── TERMS.md
├── INVARIANTS.md
├── USE_CASES.md
├── DECISIONS.md
├── PORTS.md
├── EVENTS.md
├── ERRORS.md
└── TEST_POLICY.md
```

---

## 15. `MODULE.md` 템플릿

모듈의 경계와 책임을 정의한다.

```markdown
# Auth Module

## Responsibility
Auth 모듈은 인증과 세션 생명주기를 책임진다.

## Owns
- Credential
- PasswordHash
- Session
- RefreshToken
- EmailVerificationToken

## Does not own
- User profile
- Billing status
- Organization membership
- Permission policy

## Public use cases
- SignUp
- Login
- Logout
- RefreshSession
- VerifyEmail
- ResetPassword

## External dependencies
- User module
- Email module
- Token provider
- Password hasher
- Clock

## Dependency rule
- domain layer는 외부 모듈을 import하지 않는다.
- application layer는 port interface만 참조한다.
- infrastructure layer만 외부 라이브러리와 DB 구현체를 참조한다.
- presentation layer는 application use case를 호출한다.

## Forbidden
- Auth module에서 User profile field를 직접 수정하지 않는다.
- Auth module에서 Billing status를 직접 조회하지 않는다.
- application layer에서 Prisma, bcrypt, jwt, nodemailer를 직접 import하지 않는다.
```

이 문서가 없으면 AI가 `auth` 모듈 안에서 `user profile`까지 수정하거나, `billing status`를 직접 조회하는 식으로 경계를 깨기 쉽다.

---

## 16. `TERMS.md` 템플릿

모듈 내부 용어를 고정한다.

```markdown
# Auth Terms

## Account
서비스 접근 권한을 가진 인증 주체.

## Credential
로그인에 사용되는 인증 수단.

## Session
사용자가 인증된 상태를 유지하는 기간.

## Access Token
짧은 수명의 API 인증 토큰.

## Refresh Token
Access Token을 재발급하기 위한 긴 수명의 토큰.

## Email Verification Token
이메일 소유권 확인을 위한 일회성 토큰.
```

AI는 `Account`, `User`, `Member`, `Profile`을 쉽게 섞는다. 용어 문서가 있어야 같은 개념을 같은 이름으로 유지한다.

---

## 17. `INVARIANTS.md` 템플릿

절대 깨면 안 되는 도메인 규칙이다.

```markdown
# Auth Invariants

- 비밀번호 원문은 저장하지 않는다.
- Refresh Token은 원문 저장하지 않고 hash로 저장한다.
- 만료된 Refresh Token은 재사용할 수 없다.
- 사용된 EmailVerificationToken은 다시 사용할 수 없다.
- 이메일 인증 여부와 로그인 가능 여부는 분리한다.
- 비밀번호 재설정은 기존 세션을 모두 무효화한다.
- 로그인 실패 횟수는 brute-force 방어 정책에 반영한다.
```

대형 AI 개발에서 가장 위험한 것은 AI가 도메인 불변조건을 깨는 것이다. 이 문서는 코드보다 먼저 작성되어야 한다.

---

## 18. `USE_CASES.md` 템플릿

클린 아키텍처에서는 application layer의 use case를 명시한다.

```markdown
# Auth Use Cases

## SignUp

### Input
- email
- password

### Output
- accountId
- emailVerificationRequired

### Flow
1. email format 검증
2. password policy 검증
3. 중복 credential 확인
4. password hash 생성
5. account 생성
6. verification token 생성
7. email 발송 요청

### Domain rules
- 이미 등록된 이메일은 계정 존재 여부를 노출하지 않는 에러를 반환한다.
- password hash는 infrastructure service를 통해 생성한다.

### Errors
- InvalidEmail
- WeakPassword
- EmailAlreadyUsed
- EmailProviderUnavailable

### Tests
- valid signup
- duplicate email
- weak password
- email provider failure
```

이 문서가 있으면 AI가 use case를 route handler 안에 직접 박아넣지 않는다.

---

## 19. `DECISIONS.md` 템플릿

모듈 내부 결정사항이다. ADR보다 작은 단위다.

```markdown
# Auth Decisions

## D-001: Refresh Token 저장 방식

### Decision
Refresh Token은 DB에 원문 저장하지 않고 SHA-256 hash로 저장한다.

### Reason
DB 유출 시 refresh token 재사용 위험을 줄이기 위해서다.

### Consequence
- token 검증 시 hash 비교가 필요하다.
- token 원문은 최초 발급 시에만 클라이언트에 전달된다.
- token rotation 구현이 필요하다.

---

## D-002: EmailAlreadyUsed 에러 메시지

### Decision
중복 이메일 회원가입 시 구체적인 존재 여부를 노출하지 않는다.

### Reason
이메일 계정 enumeration 공격을 방지하기 위해서다.

### Consequence
- 내부 로그에는 duplicate email을 남긴다.
- 사용자 응답은 일반화된 메시지로 반환한다.
```

모듈 내부 결정사항의 예시는 다음이다.

```text
- token 저장 방식
- session 만료 정책
- 비밀번호 정책
- 중복 이메일 처리 방식
- soft delete 여부
- 상태 머신
- 외부 모듈 호출 방식
- 이벤트 발행 여부
- transaction boundary
- retry 정책
- idempotency 정책
```

---

## 20. `PORTS.md` 템플릿

클린 아키텍처에서 핵심 문서다. application layer가 어떤 port를 통해 외부와 통신하는지 정한다.

```markdown
# Auth Ports

## Repositories

### AccountRepository
Responsibilities:
- account 생성
- account 조회
- credential 조회

Methods:
- findByEmail(email)
- save(account)
- existsByEmail(email)

### SessionRepository
Responsibilities:
- session 생성
- session 무효화
- refresh token 조회

Methods:
- save(session)
- findByRefreshTokenHash(hash)
- revoke(sessionId)

## External Services

### PasswordHasher
Methods:
- hash(rawPassword)
- compare(rawPassword, hash)

### TokenGenerator
Methods:
- generateAccessToken(payload)
- generateRefreshToken()

### EmailVerificationSender
Methods:
- sendVerificationEmail(email, token)

### Clock
Methods:
- now()
```

나쁜 구조:

```text
application/usecase -> bcrypt
application/usecase -> prisma
application/usecase -> jwt
application/usecase -> nodemailer
```

좋은 구조:

```text
application/usecase -> PasswordHasher port
infrastructure -> BcryptPasswordHasher

application/usecase -> AccountRepository port
infrastructure -> PrismaAccountRepository

application/usecase -> TokenGenerator port
infrastructure -> JwtTokenGenerator

application/usecase -> EmailVerificationSender port
infrastructure -> NodemailerEmailVerificationSender
```

---

## 21. `EVENTS.md` 템플릿

모듈이 발행하거나 구독하는 이벤트를 정의한다.

```markdown
# Auth Events

## Published Events

### UserSignedUp
When:
- 회원가입이 완료되었을 때

Payload:
- accountId
- email
- occurredAt

Consumers:
- notification
- analytics

### EmailVerified
When:
- 이메일 인증이 완료되었을 때

Payload:
- accountId
- verifiedAt

Consumers:
- user
- onboarding

## Subscribed Events
없음
```

대형 프로젝트에서는 모듈 간 직접 호출보다 이벤트를 쓰는 경우가 많다. AI가 임의로 모듈 간 직접 import를 만들지 않게 하려면 이벤트 계약이 필요하다.

---

## 22. `ERRORS.md` 템플릿

모듈별 에러 정책이다.

```markdown
# Auth Errors

## Domain Errors
- InvalidEmail
- WeakPassword
- EmailAlreadyUsed
- InvalidCredential
- SessionExpired
- RefreshTokenReused

## Mapping

| Error | HTTP Status | User Message | Log Level |
|---|---:|---|---|
| InvalidEmail | 400 | Invalid input | warn |
| WeakPassword | 400 | Invalid input | warn |
| EmailAlreadyUsed | 400 | Check your email | info |
| InvalidCredential | 401 | Invalid credentials | warn |
| SessionExpired | 401 | Session expired | info |
| RefreshTokenReused | 401 | Session expired | critical |
```

이 문서가 없으면 AI가 어떤 에러는 `throw new Error`, 어떤 에러는 HTTP exception, 어떤 에러는 string으로 처리한다.

---

## 23. `TEST_POLICY.md` 템플릿

모듈별 테스트 기준이다.

```markdown
# Auth Test Policy

## Unit tests
Required for:
- password policy
- token expiry policy
- session state transition
- email verification token validation

## Integration tests
Required for:
- signup use case with DB
- login use case with DB
- refresh token rotation
- duplicate email handling

## E2E tests
Required for:
- signup happy path
- login happy path
- refresh expired session

## Security tests
Required for:
- email enumeration prevention
- refresh token reuse detection
- brute-force lockout policy
```

모듈마다 테스트 포인트가 다르다. `billing`, `auth`, `permission`은 테스트를 더 강하게 걸어야 한다.

---

## 24. 모듈별 결정사항과 ADR의 차이

```text
ADR:
프로젝트 전체에 영향이 큰 아키텍처 결정

모듈별 DECISIONS.md:
특정 도메인/모듈 내부의 설계·정책 결정
```

ADR로 남길 것:

```text
- 클린 아키텍처를 채택한다
- PostgreSQL을 사용한다
- 모듈러 모놀리스를 사용한다
- REST API를 사용한다
- Prisma를 사용한다
- Redis Queue를 사용한다
- 배포 구조를 정한다
- 인증 provider를 정한다
```

Auth `DECISIONS.md`에 남길 것:

```text
- refresh token은 hash로 저장한다
- session은 30일 유지한다
- email enumeration을 방지한다
- password reset 시 기존 세션을 무효화한다
```

Billing `DECISIONS.md`에 남길 것:

```text
- invoice amount는 immutable이다
- subscription은 past_due grace period를 가진다
- refund는 payment 삭제가 아니라 별도 record로 남긴다
```

---

## 25. Billing 모듈 결정사항 예시

```markdown
# Billing Decisions

## D-001: Subscription 상태 모델

### Decision
Subscription은 다음 상태만 가진다.

- trialing
- active
- past_due
- canceled
- expired

### Reason
결제 실패, 사용자 취소, 기간 만료를 구분해야 한다.

### Consequence
- 권한 체크는 subscription 존재 여부가 아니라 status를 기준으로 한다.
- `past_due` 상태는 grace period 동안 사용 가능하다.

---

## D-002: 결제 실패 처리

### Decision
결제 실패 시 Subscription을 즉시 canceled로 변경하지 않는다.
먼저 `past_due`로 변경하고 grace period를 적용한다.

### Reason
카드 만료, 일시적 결제 실패가 흔하기 때문이다.

### Consequence
- grace period 만료 job이 필요하다.
- 권한 체크에서 `past_due`를 일부 허용해야 한다.

---

## D-003: Invoice amount 불변성

### Decision
발행된 Invoice의 amount는 변경하지 않는다.
수정이 필요하면 Credit Note 또는 Adjustment record를 생성한다.

### Reason
회계 추적성과 감사 가능성을 보장하기 위해서다.

### Consequence
- invoice update API에서 amount 변경을 금지한다.
- refund와 adjustment를 별도 모델로 관리한다.
```

---

## 26. User 모듈 결정사항 예시

```markdown
# User Decisions

## D-001: User와 Account 분리

### Decision
Auth의 Account와 User profile을 분리한다.

### Reason
인증 주체와 서비스 프로필은 수명주기가 다르다.

### Consequence
- Auth module은 User profile field를 소유하지 않는다.
- User module은 password, session, refresh token을 알지 못한다.

---

## D-002: User 삭제 방식

### Decision
User는 hard delete하지 않고 soft delete한다.

### Reason
주문, 결제, 감사 로그와 연결될 수 있기 때문이다.

### Consequence
- unique email 정책은 Auth module에서 처리한다.
- deleted user는 profile 조회에서 제외한다.
- 복구 정책이 필요하다.
```

---

## 27. Order 모듈 결정사항 예시

```markdown
# Order Decisions

## D-001: Order 상태 전이

### Decision
Order 상태는 다음 순서로만 전이된다.

created -> paid -> fulfilled -> completed
created -> canceled
paid -> refunded

### Reason
임의 상태 변경을 막고 재고, 결제, 배송의 일관성을 유지하기 위해서다.

### Consequence
- Order entity 내부에서만 상태 변경을 허용한다.
- application service는 직접 status를 set하지 않는다.
- 모든 상태 변경은 domain method를 통해 수행한다.
```

---

## 28. ADR 템플릿

ADR은 되돌리기 어려운 기술적 결정에 쓴다.

```markdown
# ADR-0000: [결정 제목]

## Status
Proposed | Accepted | Deprecated | Superseded

## Date
YYYY-MM-DD

## Context
어떤 문제가 있었는가?
어떤 제약이 있었는가?
왜 지금 결정해야 하는가?

## Decision
무엇을 결정했는가?

## Options considered
### Option A
장점:
- 

단점:
- 

### Option B
장점:
- 

단점:
- 

### Option C
장점:
- 

단점:
- 

## Consequences
긍정적 결과:
- 

부정적 결과:
- 

Trade-off:
- 

## Impact
영향받는 영역:
- 코드:
- 데이터:
- API:
- 배포:
- 운영:
- 보안:

## Follow-up
- [ ] 
- [ ] 

## Supersedes
없음

## Superseded by
없음
```

ADR을 남겨야 하는 경우:

```text
- 프레임워크 선택
- DB 선택
- 인증 방식 선택
- monorepo/polyrepo 선택
- API 방식 REST/GraphQL/RPC 선택
- queue/message broker 선택
- 배포 구조 선택
- payment provider 선택
- multi-tenant 모델 선택
- migration 전략 선택
```

ADR까지 필요 없는 경우:

```text
- 함수 이름 변경
- 작은 리팩터링
- CSS 스타일 수정
- 단순 버그 수정
```

---

## 29. 의사결정 로그 템플릿

ADR보다 가벼운 기록이다. AI와 사람이 논의한 내용을 남긴다.

```text
docs/decision-log/
├── 2026-05-30.md
├── 2026-05-31.md
└── 2026-06-01.md
```

```markdown
# Decision Log: 2026-05-30

## DL-001: 로그인 세션 만료 정책

### Participants
- Human:
- AI:

### Question
로그인 세션을 얼마나 유지할 것인가?

### Context
- B2C 서비스
- 보안보다 사용 편의성이 더 중요
- 결제 기능 있음

### Options
1. 1일
2. 7일
3. 30일
4. refresh token 기반 연장

### Decision
refresh token 기반 30일 연장을 사용한다.

### Rationale
- 사용성 손실을 줄인다.
- access token은 짧게 유지할 수 있다.
- refresh token rotation으로 탈취 리스크를 낮춘다.

### Resulting changes
- `docs/engineering/SECURITY.md` 갱신 필요
- `specs/001-authentication/design.md` 갱신 필요
- `tasks.md`에 refresh token rotation task 추가

### Open questions
- device별 세션 관리를 MVP에 포함할지 결정 필요
```

의사결정 로그가 있으면 나중에 AI가 “왜 이렇게 했는지” 다시 추론하지 않아도 된다.

---

## 30. AI-사람 협업 로그 템플릿

decision-log는 결정 결과 중심이고, implementation-log는 작업 흐름과 AI의 판단 이력을 남긴다.

```text
specs/001-authentication/
├── implementation-log.md
```

```markdown
# Implementation Log: 001-authentication

## 2026-05-30

### Task
T-003: Implement sign-up API route

### Context loaded
- AGENTS.md
- docs/product/PRD.md
- docs/domain/auth/INVARIANTS.md
- specs/001-authentication/requirements.md
- specs/001-authentication/design.md
- specs/001-authentication/tasks.md

### Human instruction
T-003만 구현. T-004는 구현하지 않음.

### AI plan
1. OpenAPI contract 확인
2. DB schema 확인
3. route handler 추가
4. service layer 추가
5. integration test 추가

### Files changed
- `apps/api/src/routes/auth.ts`
- `apps/api/src/services/auth/signup.ts`
- `apps/api/src/errors/auth-errors.ts`
- `apps/api/tests/auth/signup.test.ts`

### Validation
- `pnpm test apps/api`: passed
- `pnpm typecheck`: passed
- `pnpm lint`: passed

### Deviations
없음

### Follow-up
- 이메일 발송 worker는 T-006에서 구현
```

이 문서는 장기 프로젝트에서 특히 유용하다. 대화창이 길어져도 프로젝트 히스토리가 코드베이스 안에 남는다.

---

## 31. `ORCHESTRATION.md` 템플릿

문서가 많아도 AI가 언제 무엇을 읽고, 어떤 순서로 일하고, 어떤 경우 멈춰야 하는지가 없으면 통제가 어렵다.

```markdown
# ORCHESTRATION.md

## 기본 원칙
AI는 코드를 수정하기 전에 관련 문서를 먼저 읽는다.
AI는 하나의 task만 처리한다.
AI는 요구사항이 불명확하면 구현하지 않는다.
AI는 검증 없이 완료를 선언하지 않는다.

## 작업 상태
모든 작업은 다음 상태 중 하나다.

1. DISCOVERY
2. REQUIREMENTS
3. DESIGN
4. TASKING
5. IMPLEMENTATION
6. VERIFICATION
7. REVIEW
8. DOCUMENTATION
9. DONE

## 상태별 규칙

### DISCOVERY
목적:
- 문제 이해
- 관련 문서 탐색
- 기존 코드 구조 파악

필수 입력:
- PRD.md
- ARCHITECTURE.md
- 관련 domain/module 문서

출력:
- 관련 문서 목록
- 불명확한 질문
- 영향 범위

코드 수정:
- 금지

### REQUIREMENTS
목적:
- 요구사항을 테스트 가능한 문장으로 확정

필수 출력:
- requirements.md
- acceptance criteria
- non-goals

코드 수정:
- 금지

### DESIGN
목적:
- 구현 전략 결정

필수 출력:
- design.md
- API contract
- data model
- test plan

코드 수정:
- 금지

### TASKING
목적:
- 구현 작업을 작은 단위로 쪼갬

필수 출력:
- tasks.md

규칙:
- task 하나는 하나의 PR로 끝날 수 있어야 한다.
- 각 task는 validation command를 가진다.

### IMPLEMENTATION
목적:
- task 하나만 구현

필수 입력:
- requirements.md
- design.md
- tasks.md
- 관련 domain/module 문서

규칙:
- 지정된 task 외 구현 금지
- opportunistic refactor 금지
- dependency 추가 금지
- architecture boundary 위반 금지

### VERIFICATION
목적:
- 구현 검증

필수 실행:
- lint
- typecheck
- 관련 test
- build

실패 시:
- 원인 분석
- 수정 가능하면 수정
- 불가능하면 blocker 기록

### REVIEW
목적:
- 코드 품질 확인

체크 항목:
- 요구사항 충족
- 도메인 invariant 위반 없음
- 테스트 충분
- 보안 문제 없음
- public API 변경 기록됨

### DOCUMENTATION
목적:
- 변경사항을 문서에 반영

필수 갱신:
- tasks.md
- implementation-log.md
- decision-log
- ADR, 필요 시
- domain/module docs, 필요 시

### DONE
조건:
- task 완료
- 검증 통과
- 문서 갱신
- 남은 이슈 기록
```

---

## 32. `PROMPT_PROTOCOL.md` 템플릿

사람이 AI에게 주는 작업 요청도 표준화해야 한다.

```markdown
# PROMPT_PROTOCOL.md

## 구현 요청 템플릿

You are working on this repository.

Read first:
- AGENTS.md
- docs/ai/ORCHESTRATION.md
- docs/engineering/DEVELOPMENT_GUIDE.md
- docs/engineering/CODING_CONVENTION.md
- docs/engineering/TEST_STRATEGY.md
- src/modules/[module]/docs/MODULE.md
- src/modules/[module]/docs/TERMS.md
- src/modules/[module]/docs/INVARIANTS.md
- src/modules/[module]/docs/DECISIONS.md
- src/modules/[module]/docs/PORTS.md
- src/modules/[module]/docs/TEST_POLICY.md
- specs/[feature]/requirements.md
- specs/[feature]/design.md
- specs/[feature]/tasks.md

Task:
- Implement only [TASK-ID].

Rules:
- Do not implement future tasks.
- Do not change public API unless required by the spec.
- Do not add dependencies without approval.
- Do not violate module invariants.
- Do not import infrastructure code into domain or application layer.
- Before editing, summarize affected files.
- After editing, run the validation commands listed in tasks.md.
- Update implementation-log.md.
```

클린 아키텍처 모듈 작업 요청 예시:

```text
Read first:
- AGENTS.md
- docs/engineering/ARCHITECTURE.md
- docs/engineering/CODING_CONVENTION.md
- src/modules/auth/docs/MODULE.md
- src/modules/auth/docs/TERMS.md
- src/modules/auth/docs/INVARIANTS.md
- src/modules/auth/docs/DECISIONS.md
- src/modules/auth/docs/PORTS.md
- src/modules/auth/docs/TEST_POLICY.md
- specs/001-authentication/requirements.md
- specs/001-authentication/design.md
- specs/001-authentication/tasks.md

Task:
Implement T-003 only.

Rules:
- Do not import infrastructure code into domain or application layer.
- Do not modify User module.
- Do not create new public API unless required by design.md.
- Do not violate Auth invariants.
- Add tests according to TEST_POLICY.md.
```

---

## 33. AI 작업 워크플로우

### Phase 0. 프로젝트 기준 확정

1. 제품 아이디어를 `docs/product/PRD.md`로 정리한다.
2. MVP 범위와 non-goals를 명확히 한다.
3. 핵심 기술 스택과 배포 방식을 `TECH_STACK.md`, `DEPLOYMENT.md`에 적는다.
4. 인증, 결제, 개인정보, 외부 API 같은 고위험 영역을 표시한다.

### Phase 1. 에이전트 컨텍스트 작성

1. 루트 `AGENTS.md`를 만든다.
2. 앱별 명령어가 다르면 `apps/web/AGENTS.md`, `apps/api/AGENTS.md`를 추가한다.
3. Claude 사용 시 `.claude/rules/testing.md`, `.claude/rules/security.md`처럼 주제별 규칙을 분리한다.
4. GitHub Copilot 사용 시 `.github/copilot-instructions.md`를 추가한다.
5. 실제 빌드·테스트 명령을 한 번 실행해 문서의 명령어가 거짓이 아닌지 확인한다.

### Phase 2. 도메인/모듈 문서 작성

각 모듈마다 다음을 작성한다.

```text
src/modules/<module>/docs/MODULE.md
src/modules/<module>/docs/TERMS.md
src/modules/<module>/docs/INVARIANTS.md
src/modules/<module>/docs/USE_CASES.md
src/modules/<module>/docs/DECISIONS.md
src/modules/<module>/docs/PORTS.md
src/modules/<module>/docs/EVENTS.md
src/modules/<module>/docs/ERRORS.md
src/modules/<module>/docs/TEST_POLICY.md
```

### Phase 3. 기능별 스펙 작성

기능 하나당 다음 구조를 만든다.

```text
specs/001-feature-name/
├── requirements.md
├── design.md
├── tasks.md
├── test-plan.md
├── implementation-log.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Phase 4. 에이전트에게 하나의 task만 부여

좋은 프롬프트:

```text
Read:
- AGENTS.md
- docs/product/PRD.md
- docs/engineering/ARCHITECTURE.md
- docs/engineering/CODING_CONVENTION.md
- src/modules/auth/docs/MODULE.md
- src/modules/auth/docs/INVARIANTS.md
- specs/001-authentication/requirements.md
- specs/001-authentication/design.md
- specs/001-authentication/tasks.md

Implement only T-003.
Do not implement T-004 or later tasks.
Before editing, summarize the files you will touch.
After editing, run the validation commands listed in T-003.
If validation fails, fix the issue or report the exact blocker.
Update implementation-log.md.
```

나쁜 프롬프트:

```text
이 PRD 보고 전체 프로젝트 다 만들어줘.
```

문제:

```text
- 작업 범위가 무제한이다.
- acceptance criteria가 불명확하다.
- 검증 명령이 없다.
- 에이전트가 임의 설계를 추가할 가능성이 높다.
```

### Phase 5. 검증 후 문서 갱신

작업 완료 후 다음을 갱신한다.

```text
- tasks.md: 완료 여부, 실패한 task, deferred task
- design.md: 구현 중 바뀐 설계
- API.md 또는 contracts/: 실제 계약 변경
- DATA_MODEL.md: schema 변경
- docs/adr/: 되돌리기 어려운 의사결정
- docs/decision-log/: 사람-AI 결정 기록
- implementation-log.md: AI 작업 이력
- module docs: 도메인 규칙 또는 port 변경 시 갱신
- AGENTS.md: 에이전트가 반복 실수한 규칙
```

---

## 34. 문서 간 우선순위 규칙

문서가 많아지면 충돌이 생긴다. 반드시 우선순위를 정해야 한다.

권장 우선순위:

```text
1. 사용자 최신 명시 지시
2. 보안·권한 강제 설정: sandbox, permissions, hooks, CI policy
3. AGENTS.md / CLAUDE.md / copilot-instructions.md
4. 해당 하위 디렉터리의 AGENTS.md 또는 path-specific rule
5. specs/<feature>/requirements.md
6. specs/<feature>/design.md
7. specs/<feature>/tasks.md
8. src/modules/<module>/docs/INVARIANTS.md
9. src/modules/<module>/docs/DECISIONS.md
10. src/modules/<module>/docs/PORTS.md
11. docs/engineering/*
12. docs/product/*
13. README.md
```

요구사항과 구현 설계가 충돌하면 코드를 수정하기 전에 `[NEEDS CLARIFICATION]`을 남긴다.

---

## 35. 보안·권한·샌드박스 준비

대형 프로젝트에서 에이전트에게 전체 권한을 주는 것은 위험하다.

권장 보안 설정:

```text
1. 실제 secret 파일은 에이전트 작업 범위에서 제외
2. `.env.example`만 문서화
3. production DB, production API key 접근 금지
4. migration, destructive command, dependency install은 승인 필요
5. network access는 allowlist 기반
6. 결제·인증·권한 코드는 human review 필수
7. agent가 실행 가능한 명령 목록을 `AGENTS.md`와 tool permission에 함께 반영
8. CI 통과 전 merge 금지
9. 코드 생성 결과를 사람이 검토
10. 권한 변경, 데이터 삭제, 결제 로직 변경은 별도 review gate 적용
```

`SECURITY.md`에 포함할 항목:

```markdown
# SECURITY.md

## Secret policy
- `.env` 파일을 읽지 않는다.
- production secret을 출력하지 않는다.
- `.env.example`에는 placeholder만 둔다.

## Permission policy
- Auth, Billing, Permission 변경은 human review가 필요하다.
- destructive command는 승인 없이는 실행하지 않는다.

## Data policy
- production DB 접근 금지
- 개인정보가 포함된 fixture 금지
- 로그에 token, password, secret 출력 금지

## Dependency policy
- crypto, auth, payment 관련 dependency 추가는 ADR 필요
```

---

## 36. 시작 전 체크리스트

```markdown
## Product
- [ ] `docs/product/PRD.md` 작성
- [ ] MVP scope와 non-goals 확정
- [ ] 핵심 사용자 흐름 정의
- [ ] 성공 지표 정의

## Engineering
- [ ] `docs/engineering/ARCHITECTURE.md` 작성
- [ ] `docs/engineering/TECH_STACK.md` 작성
- [ ] `docs/engineering/DEVELOPMENT_GUIDE.md` 작성
- [ ] `docs/engineering/CODING_CONVENTION.md` 작성
- [ ] `docs/engineering/DATA_MODEL.md` 초안 작성
- [ ] `docs/engineering/API.md` 또는 `contracts/` 작성
- [ ] `docs/engineering/SECURITY.md` 작성
- [ ] `docs/engineering/TEST_STRATEGY.md` 작성

## AI operation
- [ ] 루트 `AGENTS.md` 작성
- [ ] 하위 앱별 `AGENTS.md` 필요 여부 결정
- [ ] `docs/ai/ORCHESTRATION.md` 작성
- [ ] `docs/ai/PROMPT_PROTOCOL.md` 작성
- [ ] `docs/ai/REVIEW_CHECKLIST.md` 작성
- [ ] Claude 사용 시 `.claude/rules/` 작성
- [ ] Copilot 사용 시 `.github/copilot-instructions.md` 작성
- [ ] Aider/Gemini 사용 시 context 파일 로드 설정

## Module docs
- [ ] `src/modules/<module>/docs/MODULE.md`
- [ ] `src/modules/<module>/docs/TERMS.md`
- [ ] `src/modules/<module>/docs/INVARIANTS.md`
- [ ] `src/modules/<module>/docs/USE_CASES.md`
- [ ] `src/modules/<module>/docs/DECISIONS.md`
- [ ] `src/modules/<module>/docs/PORTS.md`
- [ ] `src/modules/<module>/docs/EVENTS.md`
- [ ] `src/modules/<module>/docs/ERRORS.md`
- [ ] `src/modules/<module>/docs/TEST_POLICY.md`

## Feature specs
- [ ] `specs/001-core-feature/requirements.md`
- [ ] `specs/001-core-feature/design.md`
- [ ] `specs/001-core-feature/tasks.md`
- [ ] `specs/001-core-feature/test-plan.md`
- [ ] task별 acceptance criteria와 validation command 명시

## Decision system
- [ ] `docs/adr/0000-template.md`
- [ ] `docs/decision-log/` 생성
- [ ] ADR 작성 기준 정의
- [ ] 모듈별 DECISIONS.md 작성 기준 정의

## Automation
- [ ] `pnpm lint` 또는 동등한 lint 명령
- [ ] `pnpm typecheck` 또는 동등한 typecheck 명령
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] CI workflow
- [ ] `.env.example`
- [ ] seed/reset script

## Safety
- [ ] secret 파일 gitignore 확인
- [ ] destructive command 승인 규칙
- [ ] network access 정책
- [ ] production resource 접근 차단
- [ ] migration/release human review 규칙
```

---

## 37. 피해야 할 구조

나쁜 구조:

```text
BAD/
├── PRD.md       # 2,000줄
├── SPEC.md      # 5,000줄
├── TODO.md      # 800개 항목
└── src/
```

문제:

```text
- 에이전트가 관련 없는 컨텍스트까지 읽는다.
- 기능별 변경 이력 추적이 어렵다.
- acceptance criteria와 task가 섞인다.
- 병렬 작업이 어렵다.
- 오래된 요구사항과 최신 요구사항이 충돌한다.
- 도메인/모듈 경계가 흐려진다.
```

좋은 구조:

```text
GOOD/
├── AGENTS.md
├── docs/
│   ├── product/PRD.md
│   ├── engineering/ARCHITECTURE.md
│   ├── engineering/CODING_CONVENTION.md
│   ├── engineering/TEST_STRATEGY.md
│   ├── adr/
│   ├── decision-log/
│   └── ai/ORCHESTRATION.md
├── specs/
│   ├── 001-authentication/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   ├── tasks.md
│   │   └── implementation-log.md
│   └── 002-billing/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
└── src/modules/
    ├── auth/docs/
    ├── billing/docs/
    └── user/docs/
```

---

## 38. 최종 권장안

대형 AI 개발 프로젝트의 표준 시작 구조는 다음 조합이 가장 안정적이다.

```text
1. 루트 AGENTS.md
2. docs/product/PRD.md
3. docs/engineering/ARCHITECTURE.md
4. docs/engineering/TECH_STACK.md
5. docs/engineering/DEVELOPMENT_GUIDE.md
6. docs/engineering/CODING_CONVENTION.md
7. docs/engineering/DATA_MODEL.md
8. docs/engineering/API.md
9. docs/engineering/SECURITY.md
10. docs/engineering/TEST_STRATEGY.md
11. docs/ai/ORCHESTRATION.md
12. docs/ai/PROMPT_PROTOCOL.md
13. docs/adr/0000-template.md
14. docs/decision-log/
15. specs/<feature>/requirements.md
16. specs/<feature>/design.md
17. specs/<feature>/tasks.md
18. specs/<feature>/implementation-log.md
19. src/modules/<module>/docs/MODULE.md
20. src/modules/<module>/docs/TERMS.md
21. src/modules/<module>/docs/INVARIANTS.md
22. src/modules/<module>/docs/USE_CASES.md
23. src/modules/<module>/docs/DECISIONS.md
24. src/modules/<module>/docs/PORTS.md
25. src/modules/<module>/docs/EVENTS.md
26. src/modules/<module>/docs/ERRORS.md
27. src/modules/<module>/docs/TEST_POLICY.md
28. 앱별 하위 AGENTS.md
29. CI와 검증 명령
30. sandbox/permission/hook 기반 안전장치
```

최종 원칙:

```text
문서가 없는 바이브코딩은 속도는 빠르지만 누적될수록 통제 불가능해진다.
문서화된 바이브코딩은 느려 보이지만, 큰 프로젝트에서는 더 빠르고 안정적이다.

AI를 잘 쓰는 팀은 코딩 에이전트에게 “코드를 짜라”고 하지 않는다.
각 모듈의 책임, 경계, 불변조건, 의존성 규칙, 테스트 기준을 먼저 문서화한 뒤,
그 문서 안에서만 코드를 짜게 한다.
```

---

## 39. 외부 참고 문서

- OpenAI Codex: `AGENTS.md` 가이드  
  https://developers.openai.com/codex/guides/agents-md

- AGENTS.md convention  
  https://agents.md/

- GitHub Copilot custom instructions  
  https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot

- Claude Code memory / `CLAUDE.md`  
  https://docs.anthropic.com/en/docs/claude-code/memory

- Claude Code permissions  
  https://code.claude.com/docs/en/permissions

- Kiro Specs  
  https://kiro.dev/docs/specs/feature-specs/

- Kiro Quick Plan  
  https://kiro.dev/docs/specs/quick-plan/

- Kiro Specs Best Practices  
  https://kiro.dev/docs/specs/best-practices/

- GitHub Spec Kit  
  https://github.com/github/spec-kit/blob/main/spec-driven.md
