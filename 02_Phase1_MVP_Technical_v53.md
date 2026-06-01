---
title: SettlePass 1차 MVP 기술문서
project: SettlePass
team: 이리온
version: v5.3
phase: Phase 1 MVP
document_type: Internal Technical Document
document_purpose: 팀원 구현 범위·기술 구조·API·데이터 모델 정렬
source_planning: "[[01_Final_Phase1_MVP_Planning_v51]]"
domain: Housing
platform: Web App
repository_strategy: Turborepo Monorepo
backend_framework: NestJS
backend_architecture: Clean Architecture + Domain Modularization
ocr_provider: CLOVA OCR
sui_integration: false
identity_strategy: Korean Mobile ID real pipeline + Foreigner Residence Card claim mock
open_did_strategy: VC/VP data model simulation in Phase 1, real issuance/verification in Phase 2
chain_strategy: DB hash log + mockTxHash in Phase 1, OmniOne Chain txHash in Phase 2
primary_hash: reviewHash
tags:
  - SettlePass
  - MVP1
  - technical
  - housing
  - webapp
  - reviewHash
  - Turborepo
  - NestJS
  - CleanArchitecture
  - CLOVAOCR
  - OmniOneCX
  - OpenDID
  - OmniOneChain
  - AIReview
aliases:
  - 1차 MVP 기술문서
  - Housing Pass Technical Spec
  - SettlePass Phase 1 Technical
related:
  - "[[01_Final_Phase1_MVP_Planning_v51]]"
  - "[[02_Final_Phase2_MVP_Planning]]"
  - "[[SettlePass Design Spec]]"
---

# SettlePass 1차 MVP 기술문서 v5.3

> 본 문서는 제출용 문서가 아니다.  
> 팀원이 1차 MVP를 같은 구조로 구현하기 위한 내부 기술 명세서다.  
> 1차 MVP는 **주거 도메인에 집중한 웹앱 데모**이며, Sui·Walrus·PTB·zkLogin은 포함하지 않는다.

---

## 0. 이번 버전 변경사항

v5.3에서 기술 스택과 백엔드 구조를 다음과 같이 확정한다.

| 항목 | v5.2 | v5.3 확정 |
|---|---|---|
| 레포 구조 | Next.js 단일 프로젝트 또는 단순 분리 가능 | **Turborepo 기반 모노레포** |
| 백엔드 프레임워크 | Next.js Route Handler 또는 NestJS 선택 | **NestJS 확정** |
| 백엔드 아키텍처 | API 서비스 중심 | **Clean Architecture + 도메인 모듈 분리** |
| OCR | PDF parser 또는 OCR fallback | **CLOVA OCR 확정** |
| AI 입력 | 계약서 텍스트 입력 가능 | **CLOVA OCR → 정규화 텍스트 → AI Review** |
| 모듈 경계 | 기능 단위 서비스 | Identity, Housing Pass, Verification, Consent, OCR, AI Review, Audit Log 등 도메인 모듈 |

핵심 변경 의도는 다음과 같다.

1. 2인 팀이 빠르게 개발하되, 결선 진출 시 2차 MVP로 확장 가능한 구조를 만든다.
2. 프론트·백엔드·공용 타입·UI·API 계약을 모노레포에서 함께 관리한다.
3. 백엔드는 NestJS로 고정하고, 컨트롤러·유스케이스·도메인·인프라를 분리한다.
4. 계약서 분석의 입력 품질을 높이기 위해 CLOVA OCR을 1차 MVP의 기본 OCR 엔진으로 사용한다.
5. `reviewHash`는 계약서 원문 공증이 아니라, 사용자가 AI 계약 리뷰 결과를 확인했다는 이력으로 유지한다.

---

## 1. 기술문서 작성 기준

이 기술문서는 [[01_Final_Phase1_MVP_Planning_v51]]을 구현 가능한 기술 구조로 변환한 문서다.

1차 MVP의 구현 목표는 다음 플로우를 웹앱에서 끝까지 동작시키는 것이다.

```text
사용자 인증
→ Housing Pass 생성
→ 임대인 검증 요청
→ 선택적 정보공개 동의
→ 검증 결과 확인
→ 월세계약서 업로드
→ CLOVA OCR 텍스트 추출
→ AI 계약 리뷰
→ 사용자 리뷰 최종 확인
→ consentHash / verificationHash / reviewHash 기록
```

1차 MVP는 실제 서비스 운영 버전이 아니다. 예선 전까지 팀이 구현 가능한 수준에서 **문제-솔루션-기술 흐름을 증명하는 데모형 MVP**다.

---

## 2. 1차 MVP 기술 원칙

## 2.1 범위 원칙

| 구분 | 1차 MVP 방침 |
|---|---|
| 도메인 | 주거계약만 구현 |
| 플랫폼 | 웹앱 |
| 레포 구조 | Turborepo 모노레포 |
| 백엔드 | NestJS |
| 백엔드 구조 | Clean Architecture + 도메인 모듈 분리 |
| OCR | CLOVA OCR |
| 모바일앱 | 제외 |
| Sui / Walrus / PTB / zkLogin | 제외. 2차 MVP 범위 |
| 외국인등록증 실연동 | 제외. 구조만 실연동 교체 가능하게 설계 |
| 모바일 신분증 인증 | 가능하면 OmniOne CX 파이프라인 실연동, 불가 시 Mock |
| 외국인 claim | Mock Data |
| OpenDID | VC/VP 데이터 모델 기반 JSON 시뮬레이션 |
| OmniOne Chain | 1차에서는 직접 온체인 기록하지 않음 |
| 감사 이력 | DB hash log + mockTxHash |
| 핵심 해시 | reviewHash |
| 계약서 원문 공증 | 제외 |
| documentHash | 핵심 감사값으로 사용하지 않음 |

## 2.2 아키텍처 원칙

1. 모든 외부 연동은 Adapter로 감싼다.
2. 1차에서 Mock으로 동작해도 2차에서 실연동으로 교체 가능해야 한다.
3. 백엔드는 NestJS를 사용하고, 도메인별 Clean Architecture를 적용한다.
4. 도메인 계층은 NestJS, Prisma, CLOVA OCR, OpenAI, HTTP SDK에 의존하지 않는다.
5. 애플리케이션 계층은 유스케이스를 담당하고, 외부 의존성은 Port interface로만 접근한다.
6. 인프라 계층은 Prisma, CLOVA OCR, LLM, OmniOne CX, Hash 구현체를 담당한다.
7. 개인정보 원문은 저장하지 않는다.
8. 1차에서는 체인 대신 DB에 해시와 mockTxHash를 저장한다.
9. 계약서 원문 무결성이 아니라 **AI 리뷰 확인 이력**을 기록한다.
10. AI 결과는 법률 자문이 아니라 이해 보조다.
11. 화면 플로우 완성을 우선하고, 외부 연동은 단계적으로 붙인다.

## 2.3 핵심 설계 결정

| 결정 | 내용 | 이유 |
|---|---|---|
| 레포 | Turborepo 모노레포 | web, api, shared packages를 한 저장소에서 관리 |
| 백엔드 | NestJS | 모듈화, DI, controller/provider 구조, 테스트 용이성 |
| 아키텍처 | Clean Architecture | 2차 실연동 확장 시 외부 의존성 교체 가능 |
| OCR | CLOVA OCR | 한국어 계약서 OCR 품질과 국내 클라우드 서비스 활용 |
| 인증 | `CX_REAL_MODE` + `CX_MOCK_MODE` | 실연동 실패 시에도 데모 안정성 유지 |
| 외국인 claim | `FOREIGNER_CLAIM_MOCK` | 외국인등록증 테스트 credential 불확실 |
| DID | `did:settlepass:user:{id}` 형식의 Mock DID | OpenDID 실서버 없이 VC/VP 모델 시연 |
| VC/VP | JSON 기반 HousingPassCredential / HousingPassPresentation | 선택적 정보공개 개념 검증 |
| Chain | DB Audit Log + mockTxHash | 2차 OmniOne Chain txHash로 확장 가능 |
| Hash | Canonical JSON 기반 keccak256-compatible hash | 2차 EVM 계열 체인 연동 고려 |
| AI | Structured JSON output | 화면·검증·reviewHash 생성에 안정적 |
| 문서 파일 | 업로드 후 즉시 OCR 처리, 장기 저장 금지 | 부동산 공증 오해 및 개인정보 리스크 방지 |
| reviewHash | AI 리뷰 최종 확인 이력 | 서비스 목적에 부합 |

---

## 3. 시스템 전체 구조

## 3.1 전체 아키텍처

```mermaid
flowchart TB
    subgraph Client[Client Layer]
        U[외국인 사용자 Web]
        V[임대인 Verifier Portal]
    end

    subgraph Web[apps/web - Next.js]
        LP[Landing / Auth UI]
        DASH[User Dashboard]
        PASSUI[Housing Pass UI]
        CONSENTUI[Consent UI]
        UPLOADUI[Contract Upload UI]
        REVIEWUI[AI Review UI]
        VPORTAL[Verifier Portal UI]
    end

    subgraph API[apps/api - NestJS]
        AUTHC[AuthController]
        PASSC[HousingPassController]
        VRC[VerificationRequestController]
        CONSENTC[ConsentController]
        OCRC[OcrController]
        REVIEWC[AiReviewController]
        AUDITC[AuditLogController]
    end

    subgraph App[Application Use Cases]
        AUTHUC[AuthenticateWithMobileIdUseCase]
        PASSUC[CreateHousingPassUseCase]
        VRUC[CreateVerificationRequestUseCase]
        CONSENTUC[ConsentToClaimDisclosureUseCase]
        OCRUC[ExtractContractTextUseCase]
        REVIEWUC[ReviewHousingContractUseCase]
        CONFIRMUC[ConfirmAiReviewUseCase]
        AUDITUC[RecordAuditLogUseCase]
    end

    subgraph Domain[Domain Layer]
        USER[User]
        HP[HousingPass]
        VR[VerificationRequest]
        CONSENT[Consent]
        OCRDOC[OcrDocument]
        REVIEW[ContractReview]
        AUDIT[AuditLog]
    end

    subgraph Infra[Infrastructure Adapters]
        CXA[OmniOneCxAdapter / MockIdentityAdapter]
        CLOVA[CLOVA OCR Adapter]
        LLM[LLM Review Adapter]
        PRISMA[Prisma Repositories]
        HASH[Hash Adapter]
        FILE[Temporary File Storage]
    end

    subgraph Storage[Storage]
        DB[(PostgreSQL)]
        TMP[(Temp File Storage)]
    end

    U --> LP
    U --> DASH
    U --> PASSUI
    U --> CONSENTUI
    U --> UPLOADUI
    U --> REVIEWUI
    V --> VPORTAL

    LP --> AUTHC
    PASSUI --> PASSC
    VPORTAL --> VRC
    CONSENTUI --> CONSENTC
    UPLOADUI --> OCRC
    REVIEWUI --> REVIEWC
    REVIEWUI --> AUDITC

    AUTHC --> AUTHUC
    PASSC --> PASSUC
    VRC --> VRUC
    CONSENTC --> CONSENTUC
    OCRC --> OCRUC
    REVIEWC --> REVIEWUC
    REVIEWC --> CONFIRMUC
    AUDITC --> AUDITUC

    AUTHUC --> CXA
    PASSUC --> HP
    VRUC --> VR
    CONSENTUC --> CONSENT
    OCRUC --> CLOVA
    REVIEWUC --> LLM
    CONFIRMUC --> HASH
    AUDITUC --> HASH

    PRISMA --> DB
    FILE --> TMP
    CLOVA --> FILE
```

## 3.2 계층별 책임

| 계층 | 책임 | 금지사항 |
|---|---|---|
| Presentation | HTTP 요청/응답, DTO validation, auth guard | 비즈니스 규칙 직접 구현 금지 |
| Application | 유스케이스, 트랜잭션 경계, Port 호출 | Prisma 직접 사용 금지 |
| Domain | Entity, Value Object, Domain Rule | NestJS decorator, DB, 외부 SDK 의존 금지 |
| Infrastructure | Prisma repository, OCR adapter, AI adapter, CX adapter, Hash adapter | 도메인 규칙 임의 변경 금지 |
| Shared Packages | 공용 타입, zod schema, constants | 도메인 핵심 로직 과다 포함 금지 |

## 3.3 1차 MVP 도메인 모듈

| 도메인 모듈 | 책임 |
|---|---|
| `identity` | CX 실연동/Mock 인증, 외국인 claim Mock, 내부 사용자 DID 생성 |
| `users` | 사용자 프로필, 선호 언어, 내부 userId 관리 |
| `housing-pass` | Housing Pass claim 구성, VC JSON 생성 |
| `verification-request` | 임대인 요청 생성, 요청 상태 관리 |
| `consent` | 사용자 claim 공개 동의·거절 |
| `presentation` | VP JSON 생성, 선택 공개 claim 구성 |
| `ocr` | 계약서 업로드, CLOVA OCR 호출, OCR 텍스트 정규화 |
| `ai-review` | AI 계약 리뷰 생성, 위험조항·정합성 경고 |
| `audit-log` | consentHash, verificationHash, reviewHash, mockTxHash 저장 |
| `files` | 임시 파일 저장, 삭제 정책 |
| `common` | 예외, 로깅, config, util |

---

## 4. Turborepo 모노레포 구조

## 4.1 레포 구조 원칙

Turborepo는 JavaScript/TypeScript 코드베이스를 위한 고성능 빌드 시스템이며, 모노레포에서 앱과 패키지의 태스크를 캐싱·병렬화하는 데 적합하다.

SettlePass는 1차 MVP부터 모노레포로 간다. 이유는 다음과 같다.

1. 웹앱과 백엔드가 동일한 타입과 API 계약을 공유해야 한다.
2. 2차 MVP에서 모바일앱, Sui 패키지, OpenDID 실연동 패키지가 추가될 가능성이 높다.
3. `@settlepass/shared`, `@settlepass/api-contracts`, `@settlepass/ui`를 재사용해야 한다.
4. 프론트와 백엔드의 변경을 한 커밋에서 원자적으로 관리해야 한다.

## 4.2 디렉터리 구조

```text
settlepass/
  apps/
    web/
      src/
        app/
        components/
        features/
          auth/
          dashboard/
          housing-pass/
          verification/
          consent/
          contract-review/
          audit-log/
        lib/
        styles/
      package.json
      next.config.ts

    api/
      src/
        main.ts
        app.module.ts
        modules/
          identity/
            domain/
            application/
            infrastructure/
            presentation/
            identity.module.ts
          users/
          housing-pass/
          verification-request/
          consent/
          presentation/
          ocr/
          ai-review/
          audit-log/
          files/
          common/
        config/
        prisma/
      test/
      package.json
      nest-cli.json

  packages/
    shared/
      src/
        constants/
        errors/
        utils/
      package.json

    api-contracts/
      src/
        schemas/
        dto/
        api-types/
      package.json

    ui/
      src/
        components/
        tokens/
      package.json

    tsconfig/
      base.json
      nextjs.json
      nestjs.json
      package.json

    eslint-config/
      base.js
      next.js
      nest.js
      package.json

  prisma/
    schema.prisma
    migrations/
    seed.ts

  docs/
    01_Final_Phase1_MVP_Planning_v51.md
    02_Phase1_MVP_Technical_v53.md

  turbo.json
  package.json
  pnpm-workspace.yaml
  .env.example
  README.md
```

## 4.3 패키지 책임

| 패키지 | 책임 |
|---|---|
| `apps/web` | 사용자 웹앱, 임대인 포털, 데모 UI |
| `apps/api` | NestJS 백엔드 API |
| `packages/shared` | 공용 상수, 에러 코드, pure util |
| `packages/api-contracts` | request/response DTO, zod schema, API 타입 |
| `packages/ui` | 공용 UI 컴포넌트. 1차에서는 최소 사용 가능 |
| `packages/tsconfig` | 공용 TypeScript 설정 |
| `packages/eslint-config` | 공용 lint 설정 |
| `prisma` | DB schema와 migration |
| `docs` | Obsidian용 문서 |

## 4.4 pnpm workspace

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## 4.5 루트 package.json 예시

```json
{
  "name": "settlepass",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "typecheck": "turbo typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "db:migrate": "pnpm --filter @settlepass/api prisma:migrate",
    "db:seed": "pnpm --filter @settlepass/api prisma:seed"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "latest",
    "prettier": "latest"
  }
}
```

## 4.6 turbo.json 예시

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

## 4.7 개발 실행 명령

```bash
# install
pnpm install

# 전체 dev
pnpm dev

# 웹만 실행
pnpm --filter @settlepass/web dev

# API만 실행
pnpm --filter @settlepass/api start:dev

# 타입 검사
pnpm typecheck

# lint
pnpm lint
```

---

## 5. NestJS 백엔드 Clean Architecture

## 5.1 NestJS 적용 원칙

NestJS는 controller, provider, module 구조를 가진 Node.js 서버 프레임워크다. SettlePass에서는 NestJS의 DI와 module 시스템을 사용하되, 비즈니스 로직이 controller/service에 퍼지지 않도록 Clean Architecture를 적용한다.

## 5.2 Clean Architecture 의존성 방향

```mermaid
flowchart TB
    P[Presentation Layer<br/>Controller / DTO / Guard]
    A[Application Layer<br/>Use Case / Port / Command]
    D[Domain Layer<br/>Entity / Value Object / Domain Rule]
    I[Infrastructure Layer<br/>Prisma / CLOVA / LLM / CX / Hash]

    P --> A
    A --> D
    A -->|Port Interface| I
    I -->|implements| A
```

원칙:

```text
Presentation → Application → Domain
Infrastructure → Application Port 구현
Domain은 아무 계층에도 의존하지 않는다.
```

## 5.3 모듈 내부 표준 구조

모든 도메인 모듈은 가능하면 아래 구조를 따른다.

```text
modules/{domain}/
  domain/
    entities/
    value-objects/
    events/
    repositories/
      *.repository.port.ts
    services/
    errors/

  application/
    use-cases/
    commands/
    queries/
    ports/
    dto/
    mappers/

  infrastructure/
    persistence/
      prisma-*.repository.ts
    adapters/
    external/

  presentation/
    *.controller.ts
    dto/
    presenters/

  {domain}.module.ts
```

## 5.4 예시: `ai-review` 모듈 구조

```text
modules/ai-review/
  domain/
    entities/
      contract-review.entity.ts
    value-objects/
      review-risk-level.vo.ts
      contract-period.vo.ts
      residence-consistency.vo.ts
    repositories/
      contract-review.repository.port.ts
    services/
      review-hash-policy.service.ts
    errors/
      ai-review-domain.error.ts

  application/
    use-cases/
      review-housing-contract.use-case.ts
      confirm-ai-review.use-case.ts
    commands/
      review-housing-contract.command.ts
      confirm-ai-review.command.ts
    ports/
      ai-review-model.port.ts
      ocr-text-reader.port.ts
      audit-log-writer.port.ts
    dto/
      ai-review-result.dto.ts
    mappers/
      ai-review.mapper.ts

  infrastructure/
    adapters/
      openai-ai-review.adapter.ts
    persistence/
      prisma-contract-review.repository.ts

  presentation/
    ai-review.controller.ts
    dto/
      review-housing-contract.request.ts
      confirm-ai-review.request.ts
      ai-review.response.ts

  ai-review.module.ts
```

## 5.5 도메인별 모듈 설계

### 5.5.1 `identity` module

책임:

- OmniOne CX 실연동 또는 Mock 인증 수행
- 외국인등록증 claim Mock 주입
- 내부 사용자 DID 생성
- 인증 세션 상태 관리

핵심 유스케이스:

| Use Case | 설명 |
|---|---|
| `StartMobileIdAuthUseCase` | CX 인증 세션 시작 또는 Mock 세션 생성 |
| `CompleteMobileIdAuthUseCase` | CX token 파싱 또는 Mock claim 확정 |
| `IssueMockForeignerClaimsUseCase` | 체류자격·체류만료일·거주지역 Mock claim 생성 |

Port:

```ts
export interface MobileIdentityProviderPort {
  startAuth(command: StartMobileIdAuthCommand): Promise<MobileIdAuthSession>;
  completeAuth(command: CompleteMobileIdAuthCommand): Promise<NormalizedIdentityClaims>;
}
```

Adapter:

```text
OmniOneCxAdapter implements MobileIdentityProviderPort
MockMobileIdentityAdapter implements MobileIdentityProviderPort
```

### 5.5.2 `housing-pass` module

책임:

- Normalized Identity Claim 기반 Housing Pass 생성
- OpenDID VC 데이터 모델 기반 JSON credential 생성
- Housing Pass 상태 관리

핵심 Entity:

```ts
class HousingPass {
  id: HousingPassId;
  userDid: Did;
  identityVerified: boolean;
  ageOver19: boolean;
  residenceValid: boolean;
  regionLevel1: string;
  residenceExpiryMonth?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  issuedAt: Date;
  expiresAt: Date;
}
```

### 5.5.3 `verification-request` module

책임:

- 임대인이 필요한 claim을 선택해 요청 생성
- 요청 상태 관리
- 사용자의 동의 전까지 검증 결과를 노출하지 않음

상태:

```text
CREATED → SENT → VIEWED → CONSENTED → PRESENTED → VERIFIED
                    ↘ REJECTED
                    ↘ EXPIRED
```

### 5.5.4 `consent` module

책임:

- 사용자가 어떤 claim 공개에 동의했는지 관리
- consentHash 생성 요청
- 동의 철회 구조의 초안 제공

공개 가능 claim:

```ts
type HousingClaimKey =
  | 'identityVerified'
  | 'ageOver19'
  | 'residenceValid'
  | 'regionLevel1'
  | 'residenceExpiryMonth';
```

### 5.5.5 `presentation` module

책임:

- Housing Pass에서 사용자가 동의한 claim만 추출
- VP JSON 생성
- 임대인에게 Yes/No 검증 결과 제공

1차 MVP에서는 OpenDID 실서버 연동 없이 JSON 시뮬레이션으로 구현한다.

### 5.5.6 `ocr` module

책임:

- 월세계약서 파일 업로드 수신
- 파일 검증
- 이미지 변환 또는 OCR 호출 준비
- CLOVA OCR 호출
- OCR 결과 정규화
- 원문 파일 삭제 또는 TTL 만료 처리

### 5.5.7 `ai-review` module

책임:

- OCR 결과를 기반으로 계약 리뷰 생성
- 핵심조건·위험조항·다국어 요약 생성
- 체류만료월과 계약 종료일 정합성 체크
- 사용자 최종 확인 처리
- reviewHash 생성 요청

### 5.5.8 `audit-log` module

책임:

- consentHash, verificationHash, reviewHash 저장
- mockTxHash 생성
- 2차 OmniOne Chain txHash로 교체 가능한 구조 유지

---

## 6. CLOVA OCR 설계

## 6.1 CLOVA OCR 적용 이유

1차 MVP의 계약서 분석 품질은 OCR 입력 품질에 크게 좌우된다. 단순 PDF parser는 스캔본·이미지 기반 계약서에서 실패할 수 있다. 따라서 1차 MVP의 OCR 엔진은 **CLOVA OCR**로 확정한다.

CLOVA OCR은 전송한 문서나 이미지를 인식해 텍스트와 데이터를 추출하는 NAVER Cloud Platform 서비스이며, RESTful 형태의 OCR API를 제공한다. General OCR은 이미지 내 모든 영역의 텍스트를 인식하고 추출하는 API다.

## 6.2 OCR 처리 전략

1차 MVP에서는 계약서 양식이 다양하므로 Template OCR이 아니라 **General OCR 우선**으로 구현한다.

| 방식 | 1차 MVP 채택 여부 | 이유 |
|---|---:|---|
| General OCR | 채택 | 월세계약서 양식이 다양하고 빠른 구현 가능 |
| Template OCR | 제외 | 템플릿 정의 시간이 필요. 2차에서 샘플 누적 후 적용 가능 |
| Document OCR 특화 API | 선택 | PDF/이미지 처리 난이도에 따라 후순위 |
| Local OCR | 제외 | 한국어 계약서 품질·운영 안정성 낮음 |

## 6.3 OCR 플로우

```mermaid
sequenceDiagram
    actor U as 사용자
    participant Web as Web App
    participant API as NestJS API
    participant File as Temp File Storage
    participant OCR as CLOVA OCR Adapter
    participant Norm as OCR Text Normalizer
    participant AI as AI Review UseCase

    U->>Web: 월세계약서 업로드
    Web->>API: POST /contracts/ocr
    API->>API: 파일 타입·크기 검증
    API->>File: 임시 저장
    API->>OCR: CLOVA OCR 요청
    OCR-->>API: OCR raw result
    API->>Norm: 텍스트 정규화
    Norm-->>API: normalizedText
    API->>File: 원본 파일 삭제 또는 TTL 설정
    API-->>Web: ocrDocumentId + 추출 텍스트 요약
    Web->>API: AI 리뷰 요청
    API->>AI: normalizedText 전달
```

## 6.4 파일 처리 정책

| 항목 | 정책 |
|---|---|
| 허용 포맷 | PDF, PNG, JPG, JPEG |
| 최대 용량 | 10MB 이하. 필요 시 조정 |
| PDF 처리 | 가능하면 이미지 변환 후 OCR. 텍스트 PDF는 parser fallback 가능 |
| 저장 방식 | 임시 저장 후 OCR 완료 시 삭제 |
| 장기 저장 | 금지 |
| 원문 파일 해시 | 핵심 감사값으로 사용하지 않음 |
| OCR 원문 텍스트 | 마스킹 후 제한 저장 |
| 민감정보 마스킹 | 이름, 상세주소, 연락처 등 탐지 시 마스킹 |

## 6.5 CLOVA OCR Adapter Interface

```ts
export interface OcrProviderPort {
  extractText(input: OcrInput): Promise<OcrResult>;
}

export interface OcrInput {
  fileId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  languageHint?: 'ko' | 'en';
}

export interface OcrResult {
  provider: 'CLOVA_OCR';
  rawText: string;
  normalizedText: string;
  pages: OcrPage[];
  confidence?: number;
  processedAt: Date;
}

export interface OcrPage {
  pageNumber: number;
  text: string;
  fields?: OcrField[];
}

export interface OcrField {
  text: string;
  confidence?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

## 6.6 CLOVA OCR 요청 구조

CLOVA OCR은 Domain 생성 후 API Gateway Invoke URL과 `X-OCR-SECRET` 기반으로 호출한다. 1차 MVP에서는 URL과 Secret을 환경변수로 관리한다.

환경변수:

```env
CLOVA_OCR_INVOKE_URL=https://your-api-gateway-url/general
CLOVA_OCR_SECRET=your-secret
CLOVA_OCR_MODE=real
```

요청 헤더 예시:

```http
POST /general
Content-Type: application/json
X-OCR-SECRET: ${CLOVA_OCR_SECRET}
```

요청 바디는 NAVER Cloud 문서 기준에 맞춰 Adapter에서 구성한다. Adapter 외부의 application/domain 계층은 CLOVA 요청 포맷을 알면 안 된다.

## 6.7 OCR 결과 정규화

CLOVA OCR raw result는 AI 입력 전에 정규화한다.

정규화 작업:

1. 페이지별 텍스트 병합
2. 불필요한 공백·줄바꿈 정리
3. 금액 패턴 정규화
4. 날짜 패턴 정규화
5. 계약 당사자 이름 마스킹
6. 상세주소 마스킹
7. 전화번호 마스킹
8. OCR confidence 낮은 영역 표시

정규화 결과 예시:

```json
{
  "ocrDocumentId": "ocr_001",
  "normalizedText": "임대차계약서 ... 보증금 5,000,000원 ... 월세 600,000원 ... 계약기간 2026.08.01부터 2027.07.31까지 ...",
  "maskedFields": ["tenantName", "landlordName", "phoneNumber"],
  "lowConfidenceWarnings": []
}
```

## 6.8 OCR 실패 처리

| 실패 | 대응 |
|---|---|
| OCR API 실패 | 사용자가 직접 텍스트 붙여넣기 fallback |
| 이미지 품질 낮음 | 재업로드 요청 |
| PDF 변환 실패 | 텍스트 입력 fallback |
| 한글 깨짐 | 원문 이미지 재업로드 안내 |
| 네트워크 오류 | 재시도 1회 후 fallback |
| CLOVA quota 초과 | 데모용 샘플 계약서 텍스트 fixture 사용 |

---

## 7. 인증 / Identity Adapter 설계

## 7.1 인증 전략 요약

1차 MVP의 인증 전략은 다음과 같다.

```text
가능하면:
한국 모바일 신분증 → OmniOne CX 실연동 → 공통 인증 파이프라인 검증

항상:
외국인등록증 고유 claim → Mock Data

데모 안정성:
CX_MOCK_MODE 준비
```

## 7.2 OmniOne CX 연동 흐름

OmniOne CX API 매뉴얼상 연동 흐름은 토큰 생성, 인증 요청, 검증 요청, 토큰 파싱 순서로 구성된다. 매뉴얼은 `/provider/list`, `/trans`, `/authen/qr/request`, `/authen/app/request`, `/authen/qr/result`, `/authen/app/result`, `/trans/token` API를 제공한다.

1차 MVP Adapter 흐름:

```mermaid
sequenceDiagram
    participant Web as Web App
    participant API as NestJS API
    participant ID as Identity Module
    participant CX as OmniOne CX
    participant Claim as Foreigner Claim Mock

    Web->>API: POST /identity/auth/start
    API->>ID: StartMobileIdAuthUseCase
    ID->>CX: token 생성 / 인증 요청
    CX-->>ID: QR 또는 WebToApp URL
    ID-->>API: authSession 반환
    API-->>Web: authUrl 또는 qr 표시

    Web->>API: POST /identity/auth/complete
    API->>ID: CompleteMobileIdAuthUseCase
    ID->>CX: 검증 결과 요청 / token 파싱
    CX-->>ID: mobileId claims
    ID->>Claim: 외국인등록증 mock claim 주입
    Claim-->>ID: normalized claims
    ID-->>API: user + claims
    API-->>Web: 인증 완료
```

## 7.3 인증 결과 정규화

```ts
export interface NormalizedIdentityClaims {
  identityVerified: boolean;
  credentialType: 'KOREAN_MOBILE_ID_REAL' | 'MOBILE_FOREIGNER_ID_MOCK';
  userDid: string;
  ageOver19: boolean;
  residenceValid: boolean;
  residenceExpiryMonth: string;
  regionLevel1: string;
  regionLevel2?: string;
  source: 'CX_REAL_WITH_FOREIGNER_CLAIM_MOCK' | 'CX_MOCK_WITH_FOREIGNER_CLAIM_MOCK';
  verifiedAt: Date;
}
```

## 7.4 저장 금지 claim

| 원천 데이터 | 처리 |
|---|---|
| 외국인등록번호 | 저장 금지 |
| 주민등록번호 | 저장 금지 |
| 여권번호 | 저장 금지 |
| 국적 | 저장 금지 |
| 신분증 이미지 | 저장 금지 |
| 상세주소 | 저장 금지 |
| 체류자격 원문 | 1차에서는 저장 금지 |

---

## 8. OpenDID VC/VP 시뮬레이션 설계

## 8.1 1차 MVP 적용 범위

1차 MVP는 OpenDID 실서버를 반드시 운영하지 않는다. 대신 OpenDID와 W3C VC/VP 모델에 맞춘 JSON 구조로 Housing Pass 발급·제출·검증 흐름을 시뮬레이션한다.

```text
NormalizedIdentityClaims
→ HousingPassCredential
→ VerificationRequest
→ User Consent
→ HousingPassPresentation
→ Verification Result
```

## 8.2 Housing Pass Credential

```json
{
  "id": "urn:uuid:hp_001",
  "type": ["VerifiableCredential", "HousingPassCredential"],
  "issuer": "did:settlepass:issuer:housing",
  "issuanceDate": "2026-06-15T09:00:00+09:00",
  "expirationDate": "2026-12-31T23:59:59+09:00",
  "credentialSubject": {
    "id": "did:settlepass:user:mock-001",
    "identityVerified": true,
    "ageOver19": true,
    "residenceValid": true,
    "regionLevel1": "Seoul",
    "residenceExpiryMonth": "2026-12"
  },
  "evidence": {
    "source": "CX_REAL_WITH_FOREIGNER_CLAIM_MOCK",
    "verifiedAt": "2026-06-15T08:59:00+09:00"
  }
}
```

## 8.3 Housing Pass Presentation

사용자가 동의한 claim만 포함한다.

```json
{
  "id": "urn:uuid:vp_001",
  "type": ["VerifiablePresentation"],
  "holder": "did:settlepass:user:mock-001",
  "verifiableCredential": [
    {
      "type": ["HousingPassCredential"],
      "credentialSubject": {
        "identityVerified": true,
        "ageOver19": true,
        "residenceValid": true,
        "regionLevel1": "Seoul"
      }
    }
  ],
  "presentationPurpose": "HOUSING_CONTRACT_VERIFICATION"
}
```

## 8.4 검증 결과

```json
{
  "requestId": "vr_001",
  "status": "VERIFIED",
  "verifiedClaims": {
    "identityVerified": true,
    "ageOver19": true,
    "residenceValid": true,
    "regionLevel1": "Seoul"
  },
  "hiddenClaims": [
    "alienRegistrationNumber",
    "nationality",
    "passportNumber",
    "fullAddress",
    "visaStatusRaw"
  ]
}
```

---

## 9. AI 계약 리뷰 설계

## 9.1 AI Review 입력

AI Review는 계약서 파일을 직접 분석하지 않는다. 입력은 `OCR normalizedText`다.

```text
Contract File
→ CLOVA OCR
→ OCR Normalizer
→ normalizedText
→ AI Review Model
→ Structured Review JSON
→ User Confirmation
→ reviewHash
```

## 9.2 AI Review Use Case

```ts
export class ReviewHousingContractCommand {
  constructor(
    public readonly userId: string,
    public readonly ocrDocumentId: string,
    public readonly housingPassId: string,
    public readonly preferredLanguage: 'ko' | 'en' | 'zh' | 'vi',
  ) {}
}
```

## 9.3 AI Review 출력 스키마

```json
{
  "reviewType": "HOUSING_CONTRACT_REVIEW",
  "summary": {
    "deposit": "5000000",
    "monthlyRent": "600000",
    "maintenanceFee": "100000",
    "contractStartDate": "2026-08-01",
    "contractEndDate": "2027-07-31",
    "addressSummary": "서울시 영등포구 소재 원룸"
  },
  "riskItems": [
    {
      "level": "MEDIUM",
      "category": "EARLY_TERMINATION",
      "reason": "중도해지 시 보증금 반환 조건이 명확하지 않습니다.",
      "evidenceText": "중도해지 관련 조항 원문 일부",
      "recommendedQuestion": "중도해지 시 보증금 반환 기준을 계약서에 명확히 적을 수 있나요?"
    }
  ],
  "residencePeriodCheck": {
    "status": "WARNING",
    "residenceExpiryMonth": "2026-12",
    "contractEndMonth": "2027-07",
    "reason": "계약 종료일이 체류 만료월보다 늦습니다. 체류 연장 가능성과 중도해지 조건을 확인해야 합니다."
  },
  "translatedSummary": {
    "ko": "계약 핵심 요약",
    "en": "Contract summary"
  },
  "disclaimer": "이 분석은 계약 이해를 돕기 위한 참고 정보이며 법률 자문이 아닙니다."
}
```

## 9.4 체류기간-계약기간 정합성 규칙

AI만으로 판단하지 않고 rule 기반으로 1차 판정을 한다.

```ts
type ConsistencyStatus = 'OK' | 'WARNING' | 'UNKNOWN';

function checkResidencePeriod(
  residenceExpiryMonth: string,
  contractEndDate: string,
): ConsistencyStatus {
  if (!residenceExpiryMonth || !contractEndDate) return 'UNKNOWN';
  const residenceExpiry = toLastDayOfMonth(residenceExpiryMonth);
  const contractEnd = new Date(contractEndDate);
  return contractEnd <= residenceExpiry ? 'OK' : 'WARNING';
}
```

## 9.5 AI 리뷰 확인 정책

사용자가 AI 리뷰 확인 버튼을 누르기 전에는 `reviewHash`를 생성하지 않는다.

확인 체크박스:

```text
[ ] 계약 핵심조건을 확인했습니다.
[ ] 위험조항 요약을 확인했습니다.
[ ] 체류기간-계약기간 정합성 경고를 확인했습니다.
[ ] 이 분석은 법률 자문이 아니라 참고용임을 이해했습니다.
```

---

## 10. reviewHash / Audit Log 설계

## 10.1 reviewHash 정의

```text
reviewHash = hash(canonicalJson({
  reviewId,
  userDidHash,
  verifierDidHash,
  housingPassId,
  aiReviewResultHash,
  residenceConsistencyHash,
  userConfirmed: true,
  confirmedAt,
  legalDisclaimerAccepted: true,
  nonce
}))
```

## 10.2 consentHash 정의

```text
consentHash = hash(canonicalJson({
  requestId,
  userDidHash,
  verifierDidHash,
  requestedClaims,
  consentedClaims,
  consentedAt,
  nonce
}))
```

## 10.3 verificationHash 정의

```text
verificationHash = hash(canonicalJson({
  requestId,
  verifierDidHash,
  presentedClaims,
  verificationResult,
  verifiedAt,
  nonce
}))
```

## 10.4 mockTxHash 생성

1차 MVP에서는 실제 체인 트랜잭션이 없다. UI에는 다음처럼 표시한다.

```ts
function createMockTxHash(logType: string, timestamp: Date, sequence: number): string {
  return `mocktx_${logType.toLowerCase()}_${timestamp.toISOString().slice(0, 10).replace(/-/g, '')}_${sequence.toString().padStart(4, '0')}`;
}
```

예시:

```json
{
  "logType": "REVIEW",
  "reviewHash": "0x8fa1...",
  "mockTxHash": "mocktx_review_20260615_0001",
  "storage": "DB_ONLY_PHASE1",
  "phase2Target": "OMNIONE_CHAIN_TX"
}
```

---

## 11. API 명세

## 11.1 Identity API

### POST `/identity/auth/start`

인증 세션 시작.

Request:

```json
{
  "mode": "CX_MOCK_MODE",
  "credentialType": "MOBILE_FOREIGNER_ID_MOCK"
}
```

Response:

```json
{
  "authSessionId": "auth_001",
  "mode": "CX_MOCK_MODE",
  "status": "READY",
  "authUrl": null,
  "qrBase64": null
}
```

### POST `/identity/auth/complete`

인증 완료.

Request:

```json
{
  "authSessionId": "auth_001",
  "mockProfile": "DEFAULT_FOREIGNER_STUDENT"
}
```

Response:

```json
{
  "userId": "user_001",
  "userDid": "did:settlepass:user:mock-001",
  "claims": {
    "identityVerified": true,
    "credentialType": "MOBILE_FOREIGNER_ID_MOCK",
    "ageOver19": true,
    "residenceValid": true,
    "residenceExpiryMonth": "2026-12",
    "regionLevel1": "Seoul"
  }
}
```

## 11.2 Housing Pass API

### POST `/housing-passes`

Request:

```json
{
  "userId": "user_001"
}
```

Response:

```json
{
  "housingPassId": "hp_001",
  "credential": {
    "type": ["VerifiableCredential", "HousingPassCredential"],
    "credentialSubject": {
      "identityVerified": true,
      "ageOver19": true,
      "residenceValid": true,
      "regionLevel1": "Seoul"
    }
  }
}
```

## 11.3 Verification Request API

### POST `/verification-requests`

임대인 검증 요청 생성.

Request:

```json
{
  "verifierId": "verifier_landlord_001",
  "targetUserDid": "did:settlepass:user:mock-001",
  "purpose": "HOUSING_CONTRACT",
  "requestedClaims": [
    "identityVerified",
    "ageOver19",
    "residenceValid",
    "regionLevel1"
  ]
}
```

Response:

```json
{
  "requestId": "vr_001",
  "status": "CREATED",
  "consentUrl": "/consent/vr_001"
}
```

## 11.4 Consent API

### POST `/verification-requests/:requestId/consent`

Request:

```json
{
  "userId": "user_001",
  "consentedClaims": [
    "identityVerified",
    "ageOver19",
    "residenceValid",
    "regionLevel1"
  ],
  "consent": true
}
```

Response:

```json
{
  "requestId": "vr_001",
  "status": "CONSENTED",
  "consentHash": "0xconsent...",
  "mockTxHash": "mocktx_consent_20260615_0001"
}
```

## 11.5 OCR API

### POST `/contracts/ocr`

계약서 파일 OCR 처리.

Request:

```text
multipart/form-data
file: lease-contract.pdf
userId: user_001
```

Response:

```json
{
  "ocrDocumentId": "ocr_001",
  "provider": "CLOVA_OCR",
  "status": "COMPLETED",
  "textPreview": "임대차계약서 ... 보증금 ... 월세 ...",
  "maskedFields": ["phoneNumber", "name"]
}
```

## 11.6 AI Review API

### POST `/ai-reviews/housing-contract`

Request:

```json
{
  "userId": "user_001",
  "housingPassId": "hp_001",
  "ocrDocumentId": "ocr_001",
  "preferredLanguage": "en"
}
```

Response:

```json
{
  "reviewId": "review_001",
  "summary": {
    "deposit": "5000000",
    "monthlyRent": "600000",
    "contractEndDate": "2027-07-31"
  },
  "riskItems": [],
  "residencePeriodCheck": {
    "status": "WARNING",
    "reason": "계약 종료일이 체류 만료월보다 늦습니다."
  },
  "disclaimer": "이 분석은 법률 자문이 아닙니다."
}
```

### POST `/ai-reviews/:reviewId/confirm`

Request:

```json
{
  "userId": "user_001",
  "confirmations": {
    "summaryChecked": true,
    "riskItemsChecked": true,
    "residenceWarningChecked": true,
    "legalDisclaimerAccepted": true
  }
}
```

Response:

```json
{
  "reviewId": "review_001",
  "status": "CONFIRMED",
  "reviewHash": "0xreview...",
  "mockTxHash": "mocktx_review_20260615_0001"
}
```

---

## 12. DB 설계

## 12.1 주요 테이블

```mermaid
erDiagram
    users ||--o{ identity_sessions : has
    users ||--o{ identity_claims : has
    users ||--o{ housing_passes : has
    users ||--o{ verification_requests : target
    users ||--o{ ocr_documents : uploads
    users ||--o{ contract_reviews : owns
    users ||--o{ audit_logs : has

    verifiers ||--o{ verification_requests : creates
    verification_requests ||--o{ consents : has
    verification_requests ||--o{ presentations : has
    ocr_documents ||--o{ contract_reviews : produces
    contract_reviews ||--o{ audit_logs : logs
```

## 12.2 Prisma schema 초안

```prisma
model User {
  id                String   @id @default(uuid())
  did               String   @unique
  preferredLanguage String   @default("ko")
  createdAt         DateTime @default(now())

  identitySessions  IdentitySession[]
  identityClaims    IdentityClaim[]
  housingPasses     HousingPass[]
  ocrDocuments      OcrDocument[]
  contractReviews   ContractReview[]
  auditLogs         AuditLog[]
}

model IdentitySession {
  id        String   @id @default(uuid())
  userId    String?
  mode      String
  status    String
  provider  String?
  createdAt DateTime @default(now())
  completedAt DateTime?

  user User? @relation(fields: [userId], references: [id])
}

model IdentityClaim {
  id                     String   @id @default(uuid())
  userId                 String
  identityVerified        Boolean
  credentialType          String
  ageOver19               Boolean
  residenceValid          Boolean
  residenceExpiryMonth    String?
  regionLevel1            String?
  regionLevel2            String?
  source                  String
  verifiedAt              DateTime

  user User @relation(fields: [userId], references: [id])
}

model HousingPass {
  id          String   @id @default(uuid())
  userId      String
  credential  Json
  status      String
  issuedAt    DateTime @default(now())
  expiresAt   DateTime?

  user User @relation(fields: [userId], references: [id])
}

model Verifier {
  id        String   @id @default(uuid())
  name      String
  type      String
  did       String?
  createdAt DateTime @default(now())

  requests VerificationRequest[]
}

model VerificationRequest {
  id              String   @id @default(uuid())
  verifierId      String
  targetUserId     String
  purpose          String
  requestedClaims  Json
  status           String
  createdAt        DateTime @default(now())
  expiresAt        DateTime?

  verifier Verifier @relation(fields: [verifierId], references: [id])
  targetUser User @relation(fields: [targetUserId], references: [id])
  consents Consent[]
  presentations Presentation[]
}

model Consent {
  id                String   @id @default(uuid())
  requestId          String
  userId             String
  consentedClaims    Json
  consentHash        String
  mockTxHash         String?
  status             String
  consentedAt        DateTime @default(now())

  request VerificationRequest @relation(fields: [requestId], references: [id])
}

model Presentation {
  id                String   @id @default(uuid())
  requestId          String
  housingPassId      String
  presentationJson   Json
  verificationHash   String?
  mockTxHash         String?
  createdAt          DateTime @default(now())

  request VerificationRequest @relation(fields: [requestId], references: [id])
}

model OcrDocument {
  id              String   @id @default(uuid())
  userId          String
  provider        String
  status          String
  normalizedText  String
  maskedFields    Json?
  createdAt       DateTime @default(now())
  deletedAt       DateTime?

  user User @relation(fields: [userId], references: [id])
  reviews ContractReview[]
}

model ContractReview {
  id                         String   @id @default(uuid())
  userId                     String
  ocrDocumentId               String
  housingPassId               String
  reviewResult                Json
  residenceConsistencyStatus  String
  status                      String
  reviewHash                  String?
  mockTxHash                  String?
  createdAt                   DateTime @default(now())
  confirmedAt                 DateTime?

  user User @relation(fields: [userId], references: [id])
  ocrDocument OcrDocument @relation(fields: [ocrDocumentId], references: [id])
}

model AuditLog {
  id          String   @id @default(uuid())
  userId      String?
  logType     String
  payloadHash String
  mockTxHash  String?
  storage     String
  createdAt   DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])
}
```

---

## 13. 프론트엔드 화면 및 API 연동

## 13.1 Next.js 라우트 구조

```text
apps/web/src/app/
  page.tsx                         # 랜딩
  auth/page.tsx                    # 인증 시작/완료
  dashboard/page.tsx               # 사용자 대시보드
  housing-pass/page.tsx            # Housing Pass 생성/조회
  consent/[requestId]/page.tsx     # 정보공개 동의
  contract-review/upload/page.tsx  # 계약서 업로드
  contract-review/[reviewId]/page.tsx # AI 리뷰 결과
  verifier/page.tsx                # 임대인 포털 홈
  verifier/requests/new/page.tsx   # 검증 요청 생성
  verifier/requests/[id]/page.tsx  # 검증 결과
```

## 13.2 Feature 단위 구조

```text
features/
  auth/
    api.ts
    components/
    hooks.ts
  housing-pass/
  verification/
  consent/
  contract-review/
  audit-log/
```

## 13.3 API Client 규칙

- `packages/api-contracts`의 타입을 사용한다.
- `fetch` wrapper는 공통 error handling을 가진다.
- API response는 화면 컴포넌트에 직접 넘기기 전에 feature hook에서 정리한다.

---

## 14. 환경변수

## 14.1 apps/api `.env`

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/settlepass

IDENTITY_MODE=CX_MOCK_MODE
FOREIGNER_CLAIM_MODE=MOCK

OMNIONE_CX_BASE_URL=https://example-oacx-server
OMNIONE_CX_PROVIDER_ID=comdl_v1.5
OMNIONE_CX_FOREIGNER_PROVIDER_ID=coresidence_v1.5

CLOVA_OCR_MODE=mock
CLOVA_OCR_INVOKE_URL=https://example.invoke.url/general
CLOVA_OCR_SECRET=replace-me

AI_REVIEW_MODE=mock
AI_API_KEY=replace-me
AI_MODEL=gpt-4.1-mini

HASH_SECRET_SALT=replace-me
FILE_TEMP_TTL_SECONDS=3600
```

## 14.2 apps/web `.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_DEMO_MODE=true
```

---

## 15. 테스트 전략

## 15.1 단위 테스트

| 모듈 | 테스트 |
|---|---|
| identity | Mock claim 생성, CX 응답 정규화 |
| housing-pass | credential 생성, 비공개 claim 제외 |
| verification-request | 요청 상태 전이 |
| consent | consentHash 생성 입력 검증 |
| ocr | CLOVA raw result 정규화, fallback 처리 |
| ai-review | JSON schema validation, 정합성 경고 |
| audit-log | hash 생성, mockTxHash 생성 |

## 15.2 통합 테스트

| 시나리오 | 성공 조건 |
|---|---|
| 인증 → Housing Pass | 사용자 DID와 claim 기반 pass 생성 |
| 임대인 요청 → 동의 | 동의 후 consentHash 생성 |
| 동의 → VP 제출 | 동의한 claim만 presentation에 포함 |
| OCR → AI 리뷰 | OCR 텍스트 기반 review JSON 생성 |
| AI 리뷰 확인 | reviewHash 생성 |
| 전체 데모 플로우 | 사용자·임대인 화면에서 끝까지 진행 |

## 15.3 보안 테스트

| 항목 | 기준 |
|---|---|
| 로그 검사 | 외국인등록번호, 주민번호, 여권번호, 상세주소 미노출 |
| API 권한 | 다른 사용자의 request 조회 불가 |
| 파일 처리 | 허용 포맷 외 업로드 차단 |
| OCR 텍스트 | 마스킹 후 저장 |
| Hash 생성 | nonce 포함 |
| mockTxHash | 실제 txHash로 오인되지 않게 표시 |

---

## 16. 개발 우선순위

1. Turborepo 초기화
2. NestJS API 앱 생성
3. Next.js Web 앱 생성
4. Prisma schema 작성
5. Identity module Mock 구현
6. Housing Pass module 구현
7. Verification Request + Consent module 구현
8. Audit Log + Hash Service 구현
9. CLOVA OCR Adapter mock 구현
10. CLOVA OCR 실제 호출 옵션 추가
11. AI Review mock 구현
12. AI Review 실제 LLM 호출 옵션 추가
13. reviewHash 생성
14. 사용자·임대인 화면 연결
15. 통합 데모 리허설

---

## 17. 2차 MVP 확장 포인트

| 1차 구조 | 2차 확장 |
|---|---|
| `CX_MOCK_MODE` | 외국인등록증 실연동 + Mock fallback |
| VC/VP JSON simulation | OpenDID Issuer/Verifier 실연동 |
| DB hash + mockTxHash | OmniOne Chain txHash |
| CLOVA OCR General OCR | Template OCR 또는 문서 유형별 OCR 최적화 |
| AI Review 단일 agent | Agentic AI workflow |
| reviewHash | Sui Proof Capsule 포함 |
| Web App | Mobile App 확장 |
| Housing only | Work/Finance/Telecom 도메인 추가 |

---

## 18. 기술 리스크 및 대응

| 리스크 | 설명 | 대응 |
|---|---|---|
| CLOVA OCR 계정/API Gateway 설정 지연 | Invoke URL, Secret 발급 필요 | OCR mock adapter와 샘플 OCR fixture 준비 |
| OCR 품질 낮음 | 스캔본 품질에 따라 텍스트 깨짐 | 텍스트 직접 입력 fallback 제공 |
| NestJS Clean Architecture 과설계 | 2인 팀 개발 속도 저하 | 도메인별 최소 구조만 적용, 복잡한 CQRS 제외 |
| Turborepo 설정 시간 소모 | 초기 세팅 오류 가능 | pnpm workspace + 최소 turbo.json으로 시작 |
| CX 실연동 지연 | 서버 URL, credential 접근 불확실 | `CX_MOCK_MODE` 우선 개발 |
| OpenDID 실서버 미구현 | 1차 범위 초과 | VC/VP JSON 모델로 시연 |
| Chain txHash 부재 | 1차에서는 온체인 기록 안 함 | mockTxHash로 화면 표시, 2차에서 교체 |
| 개인정보 노출 | 계약서·신분증 정보 민감 | 마스킹, 원문 저장 금지, 로그 검사 |
| AI 오답 | 계약 해석 오류 가능 | 근거 문장 표시, 법률 자문 아님 고지 |

---

## 19. 최종 구현 기준

1차 MVP 완료 기준은 다음이다.

```text
1. Turborepo 모노레포가 동작한다.
2. apps/web과 apps/api를 동시에 실행할 수 있다.
3. NestJS 백엔드가 도메인 모듈 기반으로 분리되어 있다.
4. 인증 Mock 또는 CX 실연동 Adapter가 NormalizedIdentityClaims를 반환한다.
5. Housing Pass가 VC JSON 형태로 생성된다.
6. 임대인 검증 요청을 생성할 수 있다.
7. 사용자가 claim 공개에 동의할 수 있다.
8. 동의한 claim만 VP JSON으로 제출된다.
9. 월세계약서 파일을 업로드하고 CLOVA OCR 또는 OCR mock으로 텍스트를 추출한다.
10. AI 계약 리뷰 결과가 구조화 JSON으로 생성된다.
11. 체류기간-계약기간 정합성 경고가 표시된다.
12. 사용자가 AI 리뷰를 최종 확인하면 reviewHash가 생성된다.
13. consentHash, verificationHash, reviewHash가 DB에 기록된다.
14. UI에 mockTxHash 또는 hashId가 표시된다.
15. 외국인등록번호·국적·상세주소·계약서 원문은 저장하지 않는다.
```

---

## 20. 참고 링크

| 구분 | 링크 |
|---|---|
| Turborepo Docs | https://turbo.build/repo/docs |
| Turborepo Tasks | https://turbo.build/repo/docs/crafting-your-repository/running-tasks |
| NestJS Docs | https://docs.nestjs.com |
| NestJS Modules | https://docs.nestjs.com/modules |
| NestJS Controllers | https://docs.nestjs.com/controllers |
| NAVER Cloud CLOVA OCR Overview | https://api.ncloud-docs.com/docs/ai-application-service-ocr |
| CLOVA OCR General OCR | https://api.ncloud-docs.com/docs/ai-application-service-ocr-ocr |
| CLOVA OCR Text OCR API Call | https://guide.ncloud-docs.com/docs/clovaocr-example01 |
| OmniOne CX API Manual | `/mnt/data/2025_블록체인_AI_해커톤_OmniOne_CX-VC-Verifier_v1.0_API_매뉴얼.pdf` |
| 2026 해커톤 가이드북 | `/mnt/data/2026 블록체인 & AI 해커톤 가이드북.pdf` |
