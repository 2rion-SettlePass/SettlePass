# consent Module

## Responsibility
Record user consent or rejection for selective claim disclosure.

## Owns
- Consent
- consentHash input object

## Does not own
- Verifier request creation
- VP generation
- Verification result rendering

## Dependency rule
- `domain/` is pure TypeScript and must not import NestJS, Prisma, HTTP clients, CLOVA, OpenAI, OmniOne CX, or chain SDKs.
- `application/` defines use cases and ports.
- `infrastructure/` implements ports.
- `presentation/` calls application use cases only.
- Cross-module access must go through ports or shared contract types.

## Phase 1 note
Phase 1 prioritizes a stable housing-contract demo and must preserve the mock/real boundary.
