# presentation Module

## Responsibility
Build VP-compatible JSON containing only consented Housing Pass claims.

## Owns
- Presentation
- HousingPassPresentation

## Does not own
- Consent collection
- Housing Pass issuance
- Verifier request creation

## Dependency rule
- `domain/` is pure TypeScript and must not import NestJS, Prisma, HTTP clients, CLOVA, OpenAI, OmniOne CX, or chain SDKs.
- `application/` defines use cases and ports.
- `infrastructure/` implements ports.
- `presentation/` calls application use cases only.
- Cross-module access must go through ports or shared contract types.

## Phase 1 note
Phase 1 prioritizes a stable housing-contract demo and must preserve the mock/real boundary.
