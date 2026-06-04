# SettlePass Phase 1 MVP — 마스터 구현 플랜

> **한 싸이클(인증 → reviewHash → Audit Log)을 1인이 단계별로 구현·테스트·검증하며 완주하기 위한 단일 실행 기준 문서.**
> 작성: 2026-06-02 · 대상: Phase 1 MVP(주거계약 데모, mock-first, reviewHash 중심, Sui/모바일앱/실연동 제외)

## 문서 관계 (이 문서의 위치)

| 문서 | 역할 |
|---|---|
| `PRD_SetttlePass_Phase1_MVP_v10.md` | 제품 요구사항 (FR/NFR/성공기준) |
| `settlepass_phase1_implementation_workflow.md` | **WHAT** — 데모 12단계·화면·해피패스 (north-star) |
| **이 문서 (IMPLEMENTATION_PLAN.md)** | **HOW** — Clean-arch 슬라이스 + 슬라이스별 테스트/검증 게이트 + 충돌 해소 반영 |
| `02_Phase1_MVP_Technical_v53.md` | 기술 상세 |

세 문서가 충돌하던 4건은 아래 §1에서 확정 해소했고, 이 문서가 그 단일 source of truth다.

---

## 0. 핵심 원칙

1. **Mock-first.** 전 싸이클을 `CX_MOCK_MODE`/`CLOVA_OCR_MODE=mock`/`AI_REVIEW_MODE=mock`으로 먼저 완주. Real 어댑터는 동일 Port 뒤 교체 슬롯 + 실패 시 fallback (NFR-R-01).
2. **핵심 감사값은 `reviewHash`.** `documentHash` 아님. 계약서 공증 아님.
3. **저장 금지 데이터** (외국인등록번호/주민번호/여권번호/국적/상세주소/체류자격 원문/신분증·계약서 원문) 0건 — 매 슬라이스 privacy 가드 테스트로 검증.
4. **1인 진행 / 풀스택 증분.** 각 백엔드 슬라이스 직후 해당 화면을 바로 연동·브라우저 확인하여 매 Phase가 데모 가능한 증분으로 끝난다.
5. **한 번에 하나의 task.** 미래 task 선구현 금지. 계약/스키마 변경 시 `packages/api-contracts` + `docs/engineering/API.md`(+ schema 변경 시 `DATA_MODEL.md`) 동시 갱신.

---

## 1. 충돌 해소 결정 (확정 — 코드를 이 방향으로 변경)

워크플로우 문서와 현재 스캐폴딩이 어긋난 4건. 사용자 결정에 따라 **코드를 문서 컨벤션에 맞춘다.**

### 1-① DID 기반 API 식별자 (전체 통일)
사용자를 가리키는 모든 요청 파라미터를 DID로:

| 계약 | 변경 |
|---|---|
| `CreateVerificationRequestRequest.targetUserId` | → `targetUserDid` |
| `ConsentToVerificationRequest.userId` | → `userDid` |
| `HousingContractReviewRequest.userId` | → `userDid` |
| `ConfirmReviewRequest.userId` | → `userDid` |
| `AuditLogQueryDto.userId` | → `userDid` |

- 내부 DB는 **uuid PK 유지** → application 레이어가 `User.did`(@unique)로 **DID→userId resolve**.
- **수정 대상:** `packages/api-contracts`, `docs/engineering/API.md`. **불변:** Prisma schema, `DATA_MODEL.md`.
- `IdentityAuthCompleteResponse`는 `userId`+`userDid` 둘 다 반환(인증이 매핑 확립, 이후 호출은 `userDid` 사용).

### 1-② Web 라우트 → `/verifier`·`/consent`
| 현재 폴더 | → 타깃 |
|---|---|
| `app/landlord/requests/new` | `app/verifier/requests/new` |
| `app/landlord/requests/[requestId]` | `app/verifier/requests/[requestId]` (상태+결과 통합) |
| `app/landlord/results/[requestId]` | **제거** (위로 통합) |
| `app/verification/requests/[requestId]` | `app/consent/[requestId]` |
| `app/verification/result/[requestId]` | **제거** (문서에 없음) |

### 1-③ OCR 모드
- env `CLOVA_OCR_MODE` = **`mock|real` 2개 유지** (env 스키마 변경 없음).
- 수동 텍스트 입력(FR-OCR-06, Should) = **UI/엔드포인트 fallback** (env 3번째 모드 아님).

### 1-④ 미스텁 GET 엔드포인트 추가
- 추가: `GET /housing-passes/:id`, `GET /verification-requests/:id`, `GET /ai-reviews/:id`, `GET /users/me`
- 보류(선택): `GET /audit-logs/:id` (목록으로 데모 충분)

---

## 2. 한 싸이클 정의 & 데모 12단계 ↔ Phase 매핑

| # | 데모 단계(§16.2 / workflow §2.1) | Web 라우트(최종) | 엔드포인트(최종) | Phase |
|---:|---|---|---|---|
| 1 | Landing 시작 | `/` | — | 기존 |
| 2 | Mock 인증 완료 | `/auth` | `POST /api/identity/auth/start`·`/complete` | P1 |
| 3 | (대시보드 허브) | `/dashboard` | `GET /api/users/me` | P1 |
| 4 | Housing Pass 생성 | `/housing-pass` | `POST /api/housing-passes`·`GET /:id` | P2 |
| 5 | 임대인 검증 요청 | `/verifier/requests/new` | `POST /api/verification-requests` | P3 |
| 6 | 선택적 동의 (consentHash) | `/consent/[requestId]` | `GET /api/verification-requests/:id`·`POST /:id/consent` | P3 |
| 7 | 임대인 결과 확인 (verificationHash) | `/verifier/requests/[requestId]` | `GET /api/verification-requests/:id/result` | P3 |
| 8 | 계약서 업로드 | `/contract-review/upload` | `POST /api/contracts/ocr` | P4 |
| 9 | OCR/AI 리뷰 확인 | `/contract-review/[reviewId]` | `POST /api/ai-reviews/housing-contract`·`GET /:id` | P4→P5 |
| 10 | 체류-계약 정합성 경고 | `/contract-review/[reviewId]` | (P5 응답 내 residencePeriodCheck) | P5 |
| 11 | 고지 확인 + 최종 확인 (reviewHash) | `/contract-review/[reviewId]/confirm` | `POST /api/ai-reviews/:reviewId/confirm` | P6 |
| 12 | Audit Log 3해시 확인 | `/audit-log` | `GET /api/audit-logs` | P6 |

> 모든 엔드포인트는 전역 prefix `/api`. 사용자 식별은 요청 body/쿼리의 `userDid`/`targetUserDid` (§1-①).

---

## 3. 작업 구조 원칙 (모든 슬라이스 공통)

### 3.1 수직 풀스택 슬라이스 루프
```
domain (순수 TS, 외부의존 0)
 → application (use-case + port + command/result dto; DID→userId resolve 포함)
 → infrastructure (mock 어댑터 우선 + real 슬롯, Prisma repository)
 → presentation (501 스텁 → use-case 호출로 교체)
 → {module}.ts (Port 토큰 ↔ Adapter provider 바인딩)
 → web 화면 연동 (해당 라우트)
 → tests (unit → integration) → 검증 게이트 → 다음 슬라이스
```
의존성 방향: `presentation → application → domain`, `infrastructure → application port 구현`. **domain은 아무것도 의존하지 않는다.**

### 3.2 표준 파일 레이아웃 (모듈 `{m}`)
```
apps/api/src/modules/{m}/
  domain/{entities,value-objects}/*.ts · {m}.repository.port.ts
  application/{ports,use-cases,dto,mappers}/*.ts
  infrastructure/{adapters,repositories}/*.ts
  presentation/{controllers,dto}/*.ts      ← controller는 스텁 존재, use-case로 교체
  {m}.module.ts
  tests/{unit,integration}/*.spec.ts
```

### 3.3 테스트 피라미드
| 계층 | 도구 | 대상 | DB |
|---|---|---|---|
| Domain unit | vitest | 엔티티 불변식·VO·해시 결정성·claim 필터·정합성 계산 | ✗ |
| Application use-case | vitest + in-memory mock port | 오케스트레이션·상태전이·DID resolve·금지데이터 미노출 | ✗ |
| Infra adapter | vitest | mock 어댑터 source 라벨·normalizer/masker·fallback | ✗ |
| Integration(API) | vitest + supertest(Nest app) | 응답이 api-contracts 형태와 일치·400/403 | ✓ test DB |
| Privacy guard | 공용 헬퍼 | 영속 row+응답에 PrivateClaimKey·원문 0건 | ✓ |
| E2E | API 해피패스 스크립트 + Playwright | 데모 12단계 완주 | ✓ |

### 3.4 검증 게이트 (매 슬라이스 종료 조건)
`pnpm typecheck && pnpm lint && pnpm test` green **+** 해당 슬라이스 curl/브라우저 수동 확인 **+** privacy 가드 통과 **+** 계약/스키마 변경 시 문서 갱신 완료.

---

## 4. Phase 상세

### Phase 0 — 공통 기반 (cross-cutting)
> 기능 엔드포인트 미변경. 이후 모든 슬라이스가 쓰는 공유 인프라 확립.
- **Prisma 배선:** `apps/api/src/infra/prisma/{prisma.service.ts,prisma.module.ts}` (전역, onModuleInit connect) → `app.module.ts` 등록.
- **Hash 인프라:** `HashPort` + `Sha256HashAdapter` — `HASH_SECRET_SALT`+**nonce**(NFR-S-03), `{hash,nonce}` 반환. `mockTxHash` 생성기는 이름에 `mock` 포함(실제 txHash 오인 금지). 전역 `HashModule`.
- **Audit 기록:** `AuditLogWriterPort` + Prisma 어댑터 (consent/verification/review가 호출).
- **DID resolve:** `UserRepositoryPort.findByDid(did)` — 각 use-case 앞단에서 DID→userId 변환(§1-①).
- **VC/VP 헬퍼:** `packages/shared` 순수함수 `buildHousingPassCredential()`, `buildPresentationVp(consentedClaims)`. issuer DID 상수 고정(`did:settlepass:issuer:housing`).
- **어댑터 모드 factory:** `IDENTITY_MODE`/`CLOVA_OCR_MODE`/`AI_REVIEW_MODE`로 mock↔real provider 선택 컨벤션 1회 확립.
- **Test harness:** `vitest.config.ts`(api/web), unit/integration 분리(`test`=no-DB, `test:integration`=test DB), `.env.test`.
- **Seed:** `prisma/seed.ts`를 `phase1-demo.ts` fixture로 구현 (DEMO_USER, DEMO_VERIFIER) — NFR-R-02, S-03.
- **Privacy 가드 유틸:** 객체/row에 PrivateClaimKey·원문 패턴 0건 단언 헬퍼(전 슬라이스 재사용).
- **테스트:** Hash 결정성+nonce 유일성+mockTxHash 라벨(unit); PrismaService 연결+seed 멱등(integration).
- **게이트:** typecheck/lint/build green · `GET /api/health` 정상 · seed 적재 · Hash unit 통과.

### Phase 1 — Identity (+ Users)
**FR:** ID-01~05 / US-01 · **엔드포인트:** `POST /api/identity/auth/start`·`/complete`, `GET /api/users/me` · **라우트:** `/auth`, `/dashboard`
- domain: `IdentitySession`, `NormalizedIdentityClaims` VO(금지필드 불포함 보장), `User`. ports: 세션/유저/claim repository.
- application ports: `MobileIdentityProviderPort`, `ForeignerClaimMockPort`. use-cases: `StartAuth`, `CompleteAuth`(User+userDid+IdentityClaim 생성, claims 반환), `GetMe`.
- infra: `MockCxIdentityAdapter`(source=`CX_MOCK_WITH_FOREIGNER_CLAIM_MOCK`), `ForeignerClaimMockAdapter`, `RealCxAdapter` 스텁(미설정 시 mock fallback — R-02). Prisma repos.
- 테스트: claims VO 금지필드 거부(unit) · complete 멱등 User 생성(use-case) · start→complete가 claims 반환 + DB에 원문 미적재 + 400 on invalid mode(integration) + privacy 가드.
- 게이트: curl start→complete + DB inspect(금지필드 0) + `/auth`·`/dashboard` 브라우저 확인.

### Phase 2 — Housing Pass
**FR:** HP-01~04 / US-02 · **엔드포인트:** `POST /api/housing-passes`, `GET /api/housing-passes/:id` · **라우트:** `/housing-pass`
- domain: `HousingPass` 엔티티 + VC 빌더(public claim만). application: `CreateHousingPass`(유저 최신 IdentityClaim→VC JSON→영속), `GetHousingPass`.
- 커버: VC 필드(type/issuer/credentialSubject/issuanceDate/expirationDate), credentialSubject = `identityVerified/ageOver19/residenceValid/regionLevel1` + optional `residenceExpiryMonth`만, 공개/비공개 UI.
- 테스트: VC 빌더 private claim 제외+expiration(unit) · status ACTIVE(use-case) · create→get 라운드트립+`HousingPassCredential` 형태(integration).
- 게이트: curl create→get(private key 0) + `/housing-pass` 공개/비공개 표시 확인.

### Phase 3 — Verification Request + Consent + Presentation (3a/3b/3c 분할)
**FR:** VR-01~04, CO-01~05 / US-03,04,09,10 · **라우트:** `/verifier/requests/new`, `/consent/[requestId]`, `/verifier/requests/[requestId]`
- **3a 검증요청:** `POST /api/verification-requests`(body `targetUserDid`), `GET /:id`. 상태머신 `CREATED→SENT→CONSENTED→VERIFIED`(+REJECTED/EXPIRED). FR-VR-01/02/03 + **VR-04 게이트(동의 전 result 미노출)**.
- **3b 동의:** `POST /:id/consent`(body `userDid`,consent,consentedClaims) → `HashPort`로 **consentHash(+mockTxHash)** → 상태전이 → `AuditLog(CONSENT)`. 동의 claim만 VP. FR-CO-01/02/03.
- **3c 결과:** `GET /:id/result` → VP(동의 claim만) → verifiedClaims(Yes/No)+hiddenClaims → **verificationHash(+mockTxHash)** → `AuditLog(VERIFICATION)`. FR-CO-04/05.
- 테스트: 상태전이 적법성+VP 비동의 claim 제외+hiddenClaims=PRIVATE_CLAIMS(unit) · consent=false→REJECTED·동의 전 result 차단(use-case) · 풀 시퀀스+동의 전 result 빈값+verificationHash 존재(integration) · privacy 가드(VP/result에 private 값 0).
- 게이트: curl 시퀀스(동의 전 result PENDING/차단, 동의 후 public만) + 3개 화면 확인.

### Phase 4 — OCR
**FR:** OCR-01~06 / US-05 · **엔드포인트:** `POST /api/contracts/ocr`(multipart) · **라우트:** `/contract-review/upload`
- 파일 처리: Nest `FileInterceptor`(memory) — 타입(pdf/png/jpg/jpeg)·크기(10MB) 검증.
- domain: `OcrDocument`, normalizedText VO, 마스킹 규칙(이름/주소/전화). application: `ProcessOcr`(OcrProviderPort→정규화→마스킹→영속).
- infra: `MockOcrAdapter`(`FIXTURE_OCR`, 샘플 텍스트) + `RealClovaOcrAdapter`(`CLOVA_OCR_MODE=real`, 실패 시 mock fallback — R-03). Normalizer(금액/날짜/공백)+Masker. Prisma repo(deletedAt/TTL — NFR-S-02, `FILE_TEMP_TTL_SECONDS`). **수동 텍스트 입력 = UI fallback(§1-③).**
- 테스트: normalizer/masker+크기·타입 거부(unit) · provider 실패→fallback(use-case) · multipart 업로드가 `OcrContractResponse`+마스킹 저장+**원문 미영속**(integration).
- 게이트: `curl -F` 샘플 업로드(maskedFields 채움, 원문 0) + 업로드 화면 확인.

### Phase 5 — AI Review
**FR:** AI-01~06 / US-06,07 · **엔드포인트:** `POST /api/ai-reviews/housing-contract`(body `userDid`), `GET /api/ai-reviews/:id` · **라우트:** `/contract-review/[reviewId]`
- domain: `ContractReview`, `RiskItem` VO, `ResidencePeriodCheck` VO(`residenceExpiryMonth` vs `contractEndDate` → OK/WARNING/UNKNOWN).
- application: `GenerateReview`(ocr+housingPass+lang → AiReviewPort → 구조화 JSON → 정합성 계산 → 영속). **disclaimer 항상 포함**(FR-AI-06).
- infra: `MockAiReviewAdapter`(`DEMO_CONTRACT_REVIEW` 형태) + `RealLlmAdapter`(OpenAI-compatible, `AI_REVIEW_MODE=real`, 실패/타임아웃 시 fixture fallback — NFR-P-04). LLM 출력 JSON 스키마 검증.
- 커버: summary(보증금/월세/관리비/시작·종료일), riskItems(level/category/reason/evidence/question), **정합성 경고(종료월>만료월 → WARNING)**, translatedSummary ko+en(en=Should, zh/vi 보류 — OQ-04), disclaimer.
- 테스트: 정합성 계산(end>expiry→WARNING, 결측→UNKNOWN)+risk 매핑(unit) · LLM 출력 스키마 검증+fixture fallback(use-case) · `HousingContractReviewResponse`+disclaimer+데모데이터 WARNING(integration).
- 게이트: DEMO ocrDocumentId curl → WARNING+disclaimer+summary 확인 + 결과 화면 확인.

### Phase 6 — Review Confirm + reviewHash + Audit Log (← 싸이클 닫힘)
**FR:** RH-01~06 / US-08,11,12 · **엔드포인트:** `POST /api/ai-reviews/:reviewId/confirm`(body `userDid`,confirmations), `GET /api/audit-logs?userDid=` · **라우트:** `/contract-review/[reviewId]/confirm`, `/audit-log`
- **6a Confirm:** 체크 4종(summary/risk/residence/legal) 전부 true여야 진행(FR-RH-02), 아니면 차단 → **reviewHash(+mockTxHash)** → CONFIRMED → `AuditLog(REVIEW)`. RH-01/02/03.
- **6b Audit 읽기:** `ListAuditLogs`/`GetAuditLog` — **userDid-scoped**(NFR-S-05), consent/verification/reviewHash + `DB_ONLY_PHASE1`+mockTxHash 라벨. RH-04/05/06.
- 테스트: 체크 미완료 차단+reviewHash 결정성/nonce(unit) · 타유저 audit 접근 거부(use-case) · 부분체크→차단/전체→reviewHash + audit-logs 3종(CONSENT/VERIFICATION/REVIEW)+cross-user 차단(integration).
- 게이트: 부분 confirm 차단·전체 reviewHash + `/audit-log` 3해시+`DB_ONLY_PHASE1` 확인. **→ KPI-06 reviewHash 100%, 백엔드 싸이클 완성.**

### Phase 7 (각 Phase에 흡수) — Web 연동 공통 작업
> 별도 단계가 아니라 각 슬라이스 안에서 처리. 여기 모은 건 공통 인프라.
- API 클라이언트: `apps/web/src/lib/api-client.ts`를 `@settlepass/api-contracts` 타입 기반 메서드로 확장(S-05) + 에러 처리 + **mock/real 모드 배지**(S-04).
- 플로우 상태: userDid/housingPassId/requestId/reviewId 단계 전달(경량, 무거운 store 금지).
- 명확성 UI: 공개/비공개(FR-HP-04), 미요청 민감정보(FR-VR-03), Yes/No 결과(FR-CO-04), disclaimer 2화면(FR-AI-06), DB_ONLY_PHASE1/mockTxHash 라벨(FR-RH-06), NFR-U-01/02.
- **라우트 rename 작업(§1-②) 선행.**

### Phase 8 — E2E + 시연 안정화
**M7 / S-03,06 / NFR-R / §16**
- E2E: API 해피패스 자동 테스트(auth→reviewHash, S-06) + Playwright web E2E(데모 12단계).
- Seed/fixture: Linh/Mr. Kim/샘플 계약서 확정(S-03), 샘플 계약 선택기(C-05, 선택).
- Fallback 하드닝: CX/CLOVA/LLM 강제 실패 → mock/fixture 완주(NFR-R-01, R-02/03/04).
- Privacy 스윕: 전 테이블+로그 스캔 자동 가드(NFR-S-01/04, KPI-07 0건).
- Perf: OCR+AI 30~90s, 초과 시 fixture(NFR-P-04).
- Release criteria §16.1 17항목 + 배포(OQ-05: Vercel+Render/Railway 또는 로컬).
- 게이트: §16.2 데모 <8분(NFR-U-04, KPI-08≥90%) + 17항목 충족 + 시연 영상.

---

## 5. 최소 완성 기준 (workflow §6 — 하나라도 빠지면 흐름 끊김)
1. Mock 인증 → 2. NormalizedIdentityClaims → 3. Housing Pass VC JSON → 4. 임대인 검증요청 → 5. 요청 claim 동의 → 6. 동의 claim만 VP → 7. 임대인 Yes/No 결과 → 8. OCR/Mock 텍스트 → 9. AI 리뷰 정합성 경고 → 10. reviewHash 생성.

§16.1 release criteria 17항목은 P8에서 일괄 체크.

---

## 6. 구현하지 말 것 (범위 폭발 방지)
Sui · Walrus · PTB · zkLogin · 모바일앱 · OpenDID 실서버 · OmniOne Chain 실제 txHash · 외국인등록증 실연동 · Work/Finance/Telecom Pass · 계약서 공증 · 전자계약 · 등기부/확정일자/보증보험 · `documentHash` 핵심 감사값화.

---

## 7. 결정/가정 & 미해결(OQ)
**확정:** mock-first / Hash는 P0 / integration·E2E는 test DB / E2E=API+Playwright / zh·vi 보류 / DID 기반 API(§1-①) / `/verifier`·`/consent`(§1-②) / P3 분할.
**미해결(기본값으로 진행, 필요 시 갱신):** OQ-01 CX credential(없으면 mock) · OQ-02 CLOVA key(없으면 mock) · OQ-03 AI 모델(OpenAI-compatible) · OQ-05 배포 타깃(P8) · OQ-06 임대인 로그인(mock verifier 선택).

---

## 8. 진행 체크리스트

- [x] **P0** Prisma 배선 · Hash/Audit/DID-resolve/VC·VP 헬퍼 · test harness · seed · privacy 가드 — 검증 완료
- [x] **P1** Identity(+Users) → `/auth`·`/dashboard` — 런타임 검증 완료
- [x] **P2** Housing Pass → `/housing-pass` — 런타임 검증 완료
- [x] **P3** Verification+Consent+Presentation → `/verifier/requests/new`·`/consent/[id]`·`/verifier/requests/[id]` — 런타임 검증 완료
- [x] **P4** OCR → `/contract-review/upload` — 런타임 검증 완료
- [x] **P5** AI Review → `/contract-review/[reviewId]` — 런타임 검증 완료(WARNING/disclaimer)
- [x] **P6** Confirm+reviewHash+Audit Log → `/contract-review/[reviewId]/confirm`·`/audit-log` — 풀싸이클 검증 완료
- [~] **P8** E2E · 시연 안정화 · release criteria 17 · 배포 — 진행 중(privacy sweep/fallback 통과, web+api 동시 실행 확인 중)

> 진행 메모: API 런타임은 **tsx**(`apps/api` dev/start:dev). 워크스페이스 패키지가 raw-TS라 `nest start`/`node dist`로는 부팅 불가 — `tsx`로 실행. NestJS 핸들러는 esbuild/tsx 메타데이터 미방출 때문에 명시적 `@Inject` + per-handler `ZodValidationPipe` + POST `@HttpCode(200)` 사용. 데모 데이터는 동일 DEMO 사용자로 누적되므로 시연 전 `pnpm db:seed`/리셋 권장.
