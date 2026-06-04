# SettlePass 현재 상태 & 구현 시작 가이드 (READ FIRST)

> 새로 합류한 사람(또는 AI 코딩 에이전트)이 **지금 무엇이 세팅돼 있고, 무엇부터 어떻게 구현하면 되는지** 가장 먼저 읽는 문서.
> 큰 그림은 `01_Final_Phase1_MVP_Planning_v51.md`(기획) / `02_Phase1_MVP_Technical_v53.md`(기술), 규칙은 `AGENTS.md` / `CLAUDE.md` 참고.

마지막 갱신: 2026-06-03 (Phase 1 주거계약 한 싸이클 구현 + 런타임/E2E 검증 완료)

---

## 1. 지금까지 된 것 / 안 된 것

### ✅ 된 것 (기초 골격 + 초석)
- **모노레포**: Turborepo + pnpm. `apps/web`, `apps/api`, `packages/{shared,api-contracts,ui,tsconfig,eslint-config}`
- **web (Next.js)**: 11개 화면 **와이어프레임 UI 완성** (정적, 동적 값은 비워둠 — 상태관리 연동 대기)
- **api (NestJS)**: 런타임 초석 + **API 명세 스텁 완성**
  - `@nestjs/config` + zod env 검증 (`apps/api/src/config/env.validation.ts`)
  - 전역 `ZodValidationPipe` (nestjs-zod)
  - **11개 엔드포인트 전부**가 컨트롤러+DTO로 선언됨 → 현재는 `NotImplementedException`(501) 반환, 요청은 zod로 검증(400)
- **계약/타입**: `packages/api-contracts`에 요청·응답 타입 28종, `packages/shared/src/fixtures/phase1-demo.ts`에 데모 fixture
- **DB**: Prisma schema(11개 모델) + **초기 마이그레이션 적용 완료** (`prisma/migrations/*_init`)
- **모듈 설계 문서**: 각 모듈 `apps/api/src/modules/*/docs/`에 MODULE/PORTS/USE_CASES/INVARIANTS/TERMS/EVENTS/ERRORS/TEST_POLICY
- **품질 게이트**: `pnpm typecheck` / `lint` / `build` / `test` 모두 green

### ✅ 구현 완료 (Phase 1 한 싸이클 · mock-first · 런타임 검증됨 — 상세는 `IMPLEMENTATION_PLAN.md`)
- **전 도메인 모듈 비즈니스 로직 구현**: identity / users / housing-pass / verification-request / consent / presentation / ocr / ai-review / audit-log — domain·application·infrastructure·presentation 전부 (501 스텁 해소).
- **핵심 플로우 동작**: DID 기반 식별 → Housing Pass VC → 선택공개 동의(consentHash) → 검증결과(verificationHash) → 계약서 OCR(마스킹) → AI 리뷰(체류-계약 WARNING + 법률자문아님 고지) → 최종 확인(reviewHash) → Audit Log. mockTxHash는 `DB_ONLY_PHASE1`.
- **web ↔ api 연동 완료**: 11개 화면이 실 API를 client-side 호출. 브라우저로 auth→dashboard(claims)→…→audit-log(3 해시) 확인됨.
- **테스트 86개**(unit+integration) green + privacy 가드/fallback/풀싸이클 E2E 런타임 검증.
- **런타임 주의**: API는 `tsx`로 실행(워크스페이스 패키지가 raw-TS). NestJS는 명시적 `@Inject` + per-handler `ZodValidationPipe`. 데모 전 `pnpm db:seed` 권장.

### ⏭️ 남은 것 (2차 또는 시연 준비)
- 실연동(OmniOne CX / CLOVA OCR / LLM)은 어댑터 슬롯만 — 키 확보 시 `*_MODE=real`로 토글(실패 시 자동 mock fallback).
- 배포(OQ-05) 및 Playwright 자동 E2E(현재는 API 해피패스 + 수동/preview 브라우저 검증).

---

## 2. 1분 부트스트랩 (로컬 실행)

```bash
# 0) 의존성
pnpm install

# 1) 환경변수 (이미 .env 있으면 생략) — .env 는 gitignore 됨
cp .env.example .env

# 2) DB (Docker Postgres 16) — .env 의 자격증명과 일치
docker run -d --name settlepass-pg \
  -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=settlepass \
  -p 5432:5432 postgres:16
# 재시작 시: docker start settlepass-pg

# 3) Prisma client + 마이그레이션 적용
pnpm prisma generate --schema=prisma/schema.prisma
pnpm prisma migrate dev --schema=prisma/schema.prisma   # 새 마이그레이션 만들 때

# 4) 실행
pnpm --filter @settlepass/api start:dev   # http://localhost:4000/api
pnpm --filter @settlepass/web dev         # http://localhost:3000

# 5) 동작 확인
curl http://localhost:4000/api/health
# {"status":"ok","service":"settlepass-api","phase":"phase1"}
```

품질 게이트: `pnpm typecheck && pnpm lint && pnpm build && pnpm test`

---

## 3. 확립된 패턴 (이 구조를 그대로 따른다)

### 3.1 NestJS Clean Architecture (모듈당)
```
apps/api/src/modules/{domain}/
  domain/          엔티티·VO·도메인 규칙·repository.port  (외부 의존 0: Nest/Prisma/SDK import 금지)
  application/     use-case·command·port·dto·mapper       (Prisma 직접 사용 금지, Port로만 외부 접근)
  infrastructure/  adapter(CX/CLOVA/LLM/Hash)·prisma repository 구현
  presentation/    controller·dto                          ← 지금 여기까지 스텁 완성
  {domain}.module.ts
```
의존성 방향: `presentation → application → domain`, `infrastructure → application의 port 구현`. **domain은 아무것도 의존하지 않는다.**

### 3.2 API 명세 스텁 패턴 (현재 상태)
- 요청 DTO: `presentation/dto/*.dto.ts` — zod 스키마 + `createZodDto()` (nestjs-zod). 응답 타입은 `@settlepass/api-contracts`에서 import.
- 컨트롤러: `presentation/controllers/*.controller.ts` — 라우트만 선언하고 `throw new NotImplementedException(...)`.
- 예시: `apps/api/src/modules/identity/presentation/` 참고.

### 3.3 환경변수
- 스키마/검증: `apps/api/src/config/env.validation.ts` (zod). 새 env 추가 시 여기에 등록.
- `ConfigModule`은 `envFilePath: [".env", "../../.env"]` — 루트 `.env` 로딩(+ apps/api/.env override 가능).

---

## 4. 실구현 시작법 — 501 스텁을 수직 슬라이스로 채우기

한 모듈을 **끝까지(아래→위)** 완성해 패턴을 고정한 뒤 다음 모듈로 복제한다.

1. `docs/`(해당 모듈) + `02_..._Technical_v53.md`의 해당 절 + `specs/`를 읽는다.
2. **domain**: 엔티티/VO + `*.repository.port.ts` 인터페이스 정의.
3. **application**: `*.port.ts`(외부 연동 인터페이스), `*.use-case.ts` 작성. 입력은 command, 출력은 dto.
4. **infrastructure**: Port를 구현하는 Adapter (1차는 Mock 우선 → 실연동 옵션). Prisma repository 구현.
5. **presentation**: 컨트롤러의 `NotImplementedException`을 use-case 호출로 교체.
6. **module.ts**: Port 토큰 ↔ Adapter 바인딩(provider) 등록.
7. **tests**: `tests/unit`, `tests/integration` 작성.
8. 변경이 계약/스키마/모듈규칙에 닿으면 `packages/api-contracts`, `docs/engineering/API.md`, `docs/engineering/DATA_MODEL.md`, 모듈 `docs/` 갱신.

### 권장 구현 순서 (기술문서 §16)
`identity → users → housing-pass → verification-request + consent → presentation → audit-log + Hash Service → ocr(mock→CLOVA) → ai-review(mock→LLM) → reviewHash → web 연동`

### API 엔드포인트 ↔ 모듈 (전부 스텁)
| 엔드포인트 | 모듈 |
|---|---|
| `POST /api/identity/auth/start`, `/complete` | identity |
| `POST /api/housing-passes` | housing-pass |
| `POST /api/verification-requests`, `GET /:id/result` | verification-request |
| `POST /api/verification-requests/:id/consent` | consent |
| `POST /api/contracts/ocr` (multipart) | ocr |
| `POST /api/ai-reviews/housing-contract`, `POST /:id/confirm` | ai-review |
| `GET /api/audit-logs` | audit-log |

---

## 5. 절대 룰 (위반 금지 — 상세는 `AGENTS.md` / `CLAUDE.md`)
- 핵심 감사값은 **`reviewHash`** (계약서 `documentHash` 아님). 계약서 공증 서비스가 아니다.
- **저장 금지**: 외국인등록번호·주민번호·여권번호·국적·상세주소·체류자격 원문·신분증 이미지·계약서 원문.
- `domain/`에 Prisma·NestJS·CLOVA·OpenAI·HTTP·체인 클라이언트 import 금지. 비즈니스 로직을 컨트롤러/React 컴포넌트에 직접 작성 금지.
- 외부 연동은 전부 application Port + infrastructure Adapter 뒤에.
- Mock 값에는 `mock`/`fixture`/`phase1` 표기. `mockTxHash`는 실제 체인 txHash가 아님.
- 범위 외(2차): Sui/Walrus/PTB/zkLogin, 외국인등록증 실연동, OpenDID 실발급, 온체인 기록.
- 한 번에 하나의 task. API 변경 시 `packages/api-contracts` + `docs/engineering/API.md` 동시 갱신.

---

## 6. 참고 문서
- 기획: `01_Final_Phase1_MVP_Planning_v51.md` / 기술: `02_Phase1_MVP_Technical_v53.md`
- 규칙: `AGENTS.md`, `CLAUDE.md`
- API 계약: `docs/engineering/API.md` · 데이터 모델: `docs/engineering/DATA_MODEL.md` · 아키텍처: `docs/engineering/ARCHITECTURE.md` · 보안: `docs/engineering/SECURITY.md`
- 모듈별 설계: `apps/api/src/modules/{module}/docs/`
- 스펙: `specs/{001..007}/`
