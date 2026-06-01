# Git Workflow

SettlePass 팀의 브랜치 전략과 협업 규칙이다. 2인 팀 + AI 코딩 에이전트 기준으로 가볍게 운용한다.

## 1. 브랜치 구조

```text
main   ← 최종 컨펌 / 안정 / 시연 가능 상태. 항상 green.
 ▲
 │ (PR, 최종 리뷰 후 머지)
 │
dev    ← 통합 + 테스트 브랜치. 모든 기능이 여기로 모이고 여기서 검증한다.
 ▲
 │ (PR, CI green 후 머지)
 │
feat/* fix/* chore/*  ← 작업 브랜치. 항상 dev에서 분기한다.
```

| 브랜치 | 역할 | 직접 push | 머지 조건 |
|---|---|---|---|
| `main` | 최종 컨펌, 시연/배포 가능 상태 | ❌ 금지 | `dev`에서 통합 테스트 통과 후 PR로만 |
| `dev` | 통합·테스트. 기본 작업 대상 브랜치 | ❌ 금지(PR 권장) | 작업 브랜치 CI green 후 PR |
| `feat/*` 등 | 개별 기능/수정 | ✅ 본인 브랜치 | — |

> 핵심 원칙: **dev에서 모든 걸 테스트하고, 최종 컨펌만 main에서 한다.** `main`은 언제든 시연 가능한 상태를 보장한다.

## 2. 작업 브랜치 네이밍

`<type>/<도메인-또는-범위>-<짧은-설명>` 형식. 도메인은 `apps/api/src/modules/` 모듈명을 따른다.

```text
feat/identity-mock-auth
feat/housing-pass-credential
feat/ai-review-residence-check
fix/consent-hash-nonce
chore/ci-cache
docs/git-workflow
```

`type`: `feat` | `fix` | `chore` | `docs` | `refactor` | `test`

## 3. 기본 흐름

```bash
# 1. 항상 최신 dev에서 시작
git checkout dev
git pull origin dev

# 2. 작업 브랜치 분기
git checkout -b feat/identity-mock-auth

# 3. 작업 + 커밋 (Conventional Commits)
git add .
git commit -m "feat(identity): add mock mobile-id auth use-case"

# 4. push 후 dev로 PR
git push -u origin feat/identity-mock-auth
# → GitHub에서 base: dev 로 PR 생성

# 5. CI(lint+typecheck+test) green + 리뷰 → dev 머지

# 6. dev에서 통합 테스트 (pnpm dev / pnpm test)
#    안정 확인되면 dev → main 으로 PR, 최종 컨펌 후 머지
```

## 4. 커밋 메시지 규칙 (Conventional Commits)

```text
<type>(<scope>): <설명>

# 예시
feat(housing-pass): create VC JSON from normalized claims
fix(ocr): handle CLOVA quota fallback to fixture
test(consent): cover consentHash nonce generation
docs(api): update endpoints in API.md
```

- `type`: feat / fix / chore / docs / refactor / test
- `scope`: 도메인 모듈명 또는 패키지명 (`identity`, `web`, `shared` 등)
- 본문은 한국어/영어 모두 허용. 제목은 명령형, 72자 이내.

## 5. PR 규칙

- **base 브랜치**: 작업 브랜치 → `dev`, 통합 검증 후 `dev` → `main`.
- 머지 전 필수: `pnpm lint`, `pnpm typecheck`, `pnpm test` 통과 (CI가 자동 확인).
- PR 하나는 가능하면 하나의 task(spec의 T-00x) 단위로 작게 유지한다.
- API를 바꾸면 `packages/api-contracts`와 `docs/engineering/API.md`를 같은 PR에서 갱신한다.
- `main` 머지는 양쪽 팀원 합의(최종 컨펌) 후 진행한다.

## 6. 충돌 최소화 (2인 팀)

- 도메인 모듈 경계로 작업을 나눈다. `modules/identity`와 `modules/ai-review`는 서로 독립적이라 충돌이 적다.
- 공용 파일(`app.module.ts`, `prisma/schema.prisma`, `packages/*`)은 변경 전 한 줄 공유 후 작업한다.
- 작업 브랜치는 짧게 유지하고 자주 dev에 머지한다.
