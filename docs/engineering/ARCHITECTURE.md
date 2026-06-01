# SettlePass Architecture

## 1. System goal
SettlePass Phase 1 proves one housing-contract trust flow:

```text
Identity verification
→ Housing Pass creation
→ Landlord verification request
→ Selective disclosure consent
→ AI housing contract review
→ User review confirmation
→ consentHash / verificationHash / reviewHash audit log
```

Phase 1 is a Web App demo. It is not a legal notarization system and it does not implement Sui, Walrus, PTB, or zkLogin.

## 2. Phase 1 architecture decisions

| Area | Decision |
|---|---|
| Repository | Turborepo monorepo |
| Frontend | Next.js App Router |
| Backend | NestJS |
| Backend style | Clean Architecture + domain modularization |
| DB | PostgreSQL + Prisma |
| Identity | OmniOne CX adapter structure + mock fallback |
| Foreigner credential | foreigner-specific claim mock in Phase 1 |
| OpenDID | VC/VP-compatible JSON simulation |
| Chain | DB audit log + `mockTxHash` |
| OCR | CLOVA OCR adapter with mock fallback |
| AI review | structured JSON review result |
| Primary audit value | `reviewHash` |
| Forbidden audit value | `documentHash` as core value |

## 3. Applications and packages

```text
apps/web
  Next.js user app and landlord portal

apps/api
  NestJS API with Clean Architecture modules

packages/shared
  constants, fixture data, framework-neutral utilities

packages/api-contracts
  request/response types shared between web and api

packages/ui
  reusable UI components when extracted from web

prisma
  schema and migrations
```

## 4. Backend layer rules

```text
presentation → application → domain
infrastructure implements application ports
domain depends on nothing external
```

| Layer | Contains | Must not contain |
|---|---|---|
| domain | entities, value objects, policies, domain errors | NestJS decorators, Prisma, HTTP clients, CLOVA/OpenAI/CX/chain SDK |
| application | use cases, commands, ports, transaction boundaries | direct Prisma calls, direct SDK calls |
| infrastructure | Prisma repositories, CX/CLOVA/AI/hash adapters | domain rule changes |
| presentation | controllers, request DTOs, presenters | business logic |

## 5. Domain modules

| Module | Responsibility |
|---|---|
| `identity` | CX auth session, mock identity, normalized claims |
| `users` | internal user and preference identity |
| `housing-pass` | Housing Pass VC JSON from normalized claims |
| `verification-request` | landlord request lifecycle |
| `consent` | user claim disclosure consent and `consentHash` |
| `presentation` | VP JSON containing only consented claims |
| `ocr` | upload validation, CLOVA OCR, OCR text normalization |
| `ai-review` | contract review, residence/contract consistency, confirmation |
| `audit-log` | hash persistence and `mockTxHash` |
| `files` | temporary file policy |
| `common` | cross-cutting utilities only |

## 6. Module dependency matrix

| From | May depend on | Must not depend on |
|---|---|---|
| identity | users through port, audit-log through application event/port | housing-pass internals |
| housing-pass | identity claim DTO, users through port | CX adapter, OCR, AI review |
| verification-request | users/verifier IDs, shared claim constants | identity raw data |
| consent | verification-request through port, audit-log through port | presentation persistence internals |
| presentation | housing-pass through port, consented claim set | private claims |
| ocr | files port, OCR provider port | ai-review logic |
| ai-review | ocr text reader port, housing-pass read port, audit-log writer port | raw contract file storage |
| audit-log | hash port, repository | external chain direct call in Phase 1 |

## 7. Identity integration

Phase 1 has two modes:

| Mode | Meaning |
|---|---|
| `CX_REAL_MODE` | use OmniOne CX pipeline when test server/credential is available |
| `CX_MOCK_MODE` | simulate CX output for stable demo |
| `FOREIGNER_CLAIM_MOCK` | inject residence-card-specific claims when real credential is unavailable |

Normalized output:

```ts
{
  identityVerified: true,
  credentialType: "MOBILE_FOREIGNER_ID_MOCK",
  userDid: "did:settlepass:user:mock-001",
  ageOver19: true,
  residenceValid: true,
  residenceExpiryMonth: "2026-12",
  regionLevel1: "Seoul"
}
```

The raw foreigner registration number, nationality, full address, raw visa status, ID images, and passport number must never be stored.

## 8. OpenDID VC/VP simulation

Phase 1 creates JSON compatible with VC/VP concepts.

```text
NormalizedIdentityClaims
→ HousingPassCredential
→ VerificationRequest
→ Consent
→ HousingPassPresentation
→ VerificationResult
```

Only consented claims are included in presentation.

## 9. OCR and AI review

```text
Contract upload
→ temporary file validation
→ CLOVA OCR or OCR fixture
→ normalized/masked text
→ AI review JSON
→ user confirmation
→ reviewHash
```

The contract original is temporary input only. It is not long-term storage and not the core audit object.

## 10. Hash strategy

All hashes must be generated from canonical JSON plus nonce.

| Hash | Meaning |
|---|---|
| `consentHash` | user consented to disclose selected claims |
| `verificationHash` | verifier viewed/verified disclosed claims |
| `reviewHash` | user confirmed AI review result |
| `mockTxHash` | Phase 1 DB-only placeholder, not a real chain transaction |

## 11. Persistence strategy

Phase 1 stores:
- normalized public claims
- Housing Pass credential JSON
- verification requests
- consent records
- OCR normalized text after masking
- structured AI review JSON
- hash logs
- mock tx identifiers

Phase 1 must not store:
- alien registration number
- resident registration number
- passport number
- nationality
- full address
- raw visa status
- ID image
- contract original
- unmasked contract text when it contains sensitive data

## 12. Phase 2 extension points

| Phase 1 | Phase 2 |
|---|---|
| CX mock fallback | real foreigner credential + fallback |
| VC/VP JSON simulation | OpenDID issuer/verifier integration |
| DB audit log + mockTxHash | OmniOne Chain txHash |
| simple AI review | agentic workflow |
| Web App | mobile app |
| no Sui | optional Sui proof layer after core MVP |
