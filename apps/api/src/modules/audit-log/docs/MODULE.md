# audit-log Module

## Responsibility
Persist consentHash, verificationHash, reviewHash, and Phase 1 mockTxHash.

## Owns
- AuditLog
- mockTxHash policy

## Does not own
- Actual chain transaction submission in Phase 1
- Hash payload business ownership

## Dependency rule
- `domain/` is pure TypeScript and must not import NestJS, Prisma, HTTP clients, CLOVA, OpenAI, OmniOne CX, or chain SDKs.
- `application/` defines use cases and ports.
- `infrastructure/` implements ports.
- `presentation/` calls application use cases only.
- Cross-module access must go through ports or shared contract types.

## Phase 1 note
Phase 1 prioritizes a stable housing-contract demo and must preserve the mock/real boundary.
