# AGENTS.md

> 새로 시작한다면 `docs/engineering/PROJECT_STATUS.md`를 가장 먼저 읽어라 — 현재 세팅 상태, 1분 부트스트랩, 실구현 시작법이 정리돼 있다.

## Project summary
SettlePass 1차 MVP는 외국인 주거계약 과정에서 필요한 최소 신원·체류 claim을 선택적으로 공유하고, AI 계약 리뷰 확인 이력을 reviewHash로 남기는 웹앱 데모다.

## Stack
- Monorepo: Turborepo + pnpm
- Frontend: Next.js App Router, React, TypeScript
- Backend: NestJS, Clean Architecture, Domain Modularization
- DB: PostgreSQL + Prisma
- OCR: CLOVA OCR
- AI: structured JSON review output
- Hash: consentHash, verificationHash, reviewHash

## Non-goals
- Sui / Walrus / PTB / zkLogin 구현 금지. 2차 MVP 범위.
- 부동산 공증, 확정일자, 등기부 검증 구현 금지.
- documentHash를 핵심 감사값으로 사용 금지.
- 외국인등록번호, 국적, 상세주소, 체류자격 원문 저장 금지.

## Work rules
- 한 번에 하나의 task만 구현한다.
- 구현 전 관련 spec의 `requirements.md`, `design.md`, `tasks.md`를 읽는다.
- domain layer에서 NestJS, Prisma, CLOVA OCR, OpenAI SDK를 import하지 않는다.
- business logic은 controller나 React component에 직접 작성하지 않는다.
- API 변경 시 `packages/api-contracts`와 `docs/engineering/API.md`를 갱신한다.
- Mock은 명시적으로 `mock`, `fixture`, `phase1` 표기를 포함한다.

## Conventions
- 코딩 컨벤션: `docs/engineering/CODING_CONVENTIONS.md`
- Git 브랜치 전략(dev에서 테스트, main에서 최종 컨펌): `docs/engineering/GIT_WORKFLOW.md`

## Commands
- Install: `pnpm install`
- Dev: `pnpm dev`
- Web: `pnpm --filter @settlepass/web dev`
- API: `pnpm --filter @settlepass/api start:dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Test: `pnpm test`
