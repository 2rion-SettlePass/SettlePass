# Coding Conventions

SettlePass 코드베이스 공통 규칙이다. AGENTS.md의 Work rules를 코드 레벨로 구체화한다.

## 1. 공통 (TypeScript)

- 언어: **TypeScript only**. `any` 금지(불가피하면 `unknown` + 좁히기). `strict: true` 유지.
- 들여쓰기 2 spaces, 세미콜론 사용, 문자열은 큰따옴표(`"`)로 통일(prettier 기본).
- 포매팅/린트는 도구에 위임한다: `pnpm format`, `pnpm lint`. 수동 정렬 금지.
- import 순서: ① Node/외부 패키지 → ② 워크스페이스 패키지(`@settlepass/*`) → ③ 상대경로. 그룹 사이 빈 줄.
- 워크스페이스 공용 타입/상수는 재정의하지 말고 `@settlepass/shared`, `@settlepass/api-contracts`에서 import한다.
- 매직 값(클레임 키, 상태 문자열 등)은 `@settlepass/shared/constants`에 상수로 둔다.

## 2. 네이밍

| 대상 | 규칙 | 예시 |
|---|---|---|
| 파일 (TS, 백엔드) | kebab-case + 역할 suffix | `review-housing-contract.use-case.ts` |
| 파일 (React 컴포넌트) | PascalCase | `HousingPassCard.tsx` |
| 클래스 / 타입 / 인터페이스 | PascalCase | `ContractReview`, `OcrProviderPort` |
| 변수 / 함수 | camelCase | `normalizedText`, `createMockTxHash` |
| 상수 | UPPER_SNAKE_CASE | `PUBLIC_HOUSING_CLAIMS` |
| Port 인터페이스 | `*Port` suffix | `MobileIdentityProviderPort` |
| Adapter 구현 | `*Adapter` suffix | `MockMobileIdentityAdapter` |
| UseCase | `*UseCase` suffix | `CreateHousingPassUseCase` |

백엔드 파일 suffix 컨벤션: `.use-case.ts`, `.command.ts`, `.entity.ts`, `.vo.ts`, `.repository.port.ts`, `.controller.ts`, `.module.ts`, `.adapter.ts`, `.mapper.ts`, `.dto.ts`, `.spec.ts`.

## 3. NestJS / Clean Architecture (apps/api)

의존성 방향: **Presentation → Application → Domain**, Infrastructure는 Application Port를 구현한다. (상세: `docs/engineering/ARCHITECTURE.md`)

레이어별 금지 규칙(위반 시 PR 반려):

| 레이어 | 허용 | 금지 |
|---|---|---|
| `domain/` | 순수 TS, Entity, VO, 도메인 규칙 | NestJS 데코레이터, Prisma, CLOVA/OpenAI/HTTP SDK import |
| `application/` | UseCase, Port 인터페이스 정의, 트랜잭션 경계 | Prisma 직접 사용, 외부 SDK 직접 호출 |
| `infrastructure/` | Prisma repo, OCR/AI/CX/Hash adapter (Port 구현) | 도메인 규칙 임의 변경 |
| `presentation/` | Controller, DTO validation, Guard | 비즈니스 로직 직접 구현 |

- 모든 외부 연동은 **Adapter로 감싼다.** Mock과 Real 구현은 같은 Port를 구현해 교체 가능해야 한다.
- 비즈니스 로직을 controller / React 컴포넌트에 직접 쓰지 않는다 → UseCase로 분리.
- 새 모듈 와이어링: 도메인 `*.module.ts`의 `controllers`/`providers`에 등록 → `app.module.ts` `imports`에 추가.
- Mock 구현체/픽스처는 이름에 `Mock`/`Fixture`/`Phase1`을 명시한다.

## 4. Next.js (apps/web)

- App Router 사용. 라우트는 `src/app/`, 화면 조립 컴포넌트는 `src/components/`, 도메인 로직/API 호출은 `src/features/<domain>/`.
- `features/<domain>/`: `api.ts`(fetch wrapper), `hooks.ts`, `components/`로 구성.
- API 응답은 화면 컴포넌트에 바로 넘기지 말고 feature hook에서 정리한다.
- API 호출 타입은 `@settlepass/api-contracts`를 사용한다(중복 타입 정의 금지).
- 서버/클라이언트 컴포넌트 구분 명확히 — 상태/이벤트 필요 시에만 `"use client"`.

## 5. 개인정보 / 보안 (필수)

- 저장 금지: 외국인등록번호·주민번호·여권번호·국적·상세주소·체류자격 원문·신분증/계약서 원문. (AGENTS.md Non-goals)
- 해시 생성 시 항상 `nonce` 포함. `documentHash`를 핵심 감사값으로 쓰지 않는다.
- 로그·에러 메시지에 민감정보를 출력하지 않는다.
- `mockTxHash`는 실제 txHash로 오인되지 않게 표기한다.

## 6. 테스트

- 단위 테스트는 대상과 같은 모듈의 `tests/unit/`, 통합은 `tests/integration/`. 파일명 `*.spec.ts`.
- 도메인 규칙·해시 생성·상태 전이·정합성 체크는 단위 테스트로 커버한다.
- 러너는 `vitest`. PR 전 `pnpm test` 통과 필수.

## 7. API 변경 시

API를 추가/변경하면 같은 PR에서 함께 갱신한다:
1. `packages/api-contracts` (DTO/타입)
2. `docs/engineering/API.md`
3. 해당 spec의 `contracts/openapi.yaml`

## 8. 커밋 / 브랜치

Conventional Commits + dev/main 브랜치 전략을 따른다. 상세는 `docs/engineering/GIT_WORKFLOW.md`.
