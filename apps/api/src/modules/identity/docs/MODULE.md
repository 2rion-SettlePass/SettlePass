# identity Module

## Responsibility
OmniOne CX-compatible authentication, Phase 1 mock identity flow, and normalized public identity claims.

## Owns
- IdentitySession
- IdentityClaim
- NormalizedIdentityClaims

## Does not own
- User profile fields
- Housing Pass credential
- AuditLog persistence
- AI review

## Dependency rule
- `domain/` is pure TypeScript and must not import NestJS, Prisma, HTTP clients, CLOVA, OpenAI, OmniOne CX, or chain SDKs.
- `application/` defines use cases and ports.
- `infrastructure/` implements ports.
- `presentation/` calls application use cases only.
- Cross-module access must go through ports or shared contract types.

## Phase 1 note
Phase 1 prioritizes a stable housing-contract demo and must preserve the mock/real boundary.
