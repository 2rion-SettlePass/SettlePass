# Identity Auth Tasks

## Phase 1: Contract and fixtures
- [ ] T-001 Define identity API contract
  - Files:
    - `packages/api-contracts/src/types.ts`
    - `docs/engineering/API.md`
  - Acceptance:
    - start/complete request and response types exist
    - forbidden fields are not part of public response types
  - Validation:
    - `pnpm typecheck`

- [ ] T-002 Define Phase 1 identity demo fixture
  - Files:
    - `packages/shared/src/fixtures/phase1-demo.ts`
  - Acceptance:
    - fixture contains `NormalizedIdentityClaims`
    - fixture explicitly marks mock source
  - Validation:
    - `pnpm typecheck`

## Phase 2: Module design
- [ ] T-003 Fill identity module docs
  - Files:
    - `apps/api/src/modules/identity/docs/MODULE.md`
    - `apps/api/src/modules/identity/docs/INVARIANTS.md`
    - `apps/api/src/modules/identity/docs/DECISIONS.md`
    - `apps/api/src/modules/identity/docs/PORTS.md`
  - Acceptance:
    - module responsibility, invariants, decisions, and ports are explicit
  - Validation:
    - docs review

## Phase 3: Implementation
- [ ] T-004 Implement `MobileIdentityProviderPort`
  - Files:
    - `apps/api/src/modules/identity/application/ports/*`
  - Acceptance:
    - port supports start and complete operations
  - Validation:
    - `pnpm --filter @settlepass/api typecheck`

- [ ] T-005 Implement `MockMobileIdentityAdapter`
  - Depends on: T-004
  - Files:
    - `apps/api/src/modules/identity/infrastructure/adapters/*`
  - Acceptance:
    - returns fixture-backed normalized claims
    - never returns forbidden raw data
  - Validation:
    - `pnpm --filter @settlepass/api test`

- [ ] T-006 Implement identity controller
  - Depends on: T-005
  - Files:
    - `apps/api/src/modules/identity/presentation/*`
    - `apps/api/src/modules/identity/identity.module.ts`
  - Acceptance:
    - `/identity/auth/start` and `/identity/auth/complete` work in mock mode
  - Validation:
    - `pnpm lint`
    - `pnpm typecheck`
    - `pnpm test`
