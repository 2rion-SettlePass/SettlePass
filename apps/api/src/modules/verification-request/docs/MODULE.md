# verification-request Module

## Responsibility
Create and manage landlord verification requests for housing claims.

## Owns
- VerificationRequest
- Verifier

## Does not own
- Consent decision
- Presentation JSON
- Housing Pass credential generation

## Dependency rule
- `domain/` is pure TypeScript and must not import NestJS, Prisma, HTTP clients, CLOVA, OpenAI, OmniOne CX, or chain SDKs.
- `application/` defines use cases and ports.
- `infrastructure/` implements ports.
- `presentation/` calls application use cases only.
- Cross-module access must go through ports or shared contract types.

## Phase 1 note
Phase 1 prioritizes a stable housing-contract demo and must preserve the mock/real boundary.
