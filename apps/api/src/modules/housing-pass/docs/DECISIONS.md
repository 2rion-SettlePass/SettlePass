# housing-pass Decisions

## D-001: Phase 1 uses VC-compatible JSON simulation

### Decision
OpenDID real issuer integration is Phase 2; Phase 1 models the credential shape.

### Consequence
Claude must preserve this rule unless a later ADR or module decision supersedes it.

## D-002: Region granularity is level 1 by default

### Decision
Full address is forbidden; `regionLevel1` is sufficient for landlord pre-check.

### Consequence
Claude must preserve this rule unless a later ADR or module decision supersedes it.

## D-003: `residenceExpiryMonth` is optional but allowed

### Decision
It supports residence/contract consistency warnings without storing raw visa status.

### Consequence
Claude must preserve this rule unless a later ADR or module decision supersedes it.
