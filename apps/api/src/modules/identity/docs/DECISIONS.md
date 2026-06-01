# identity Decisions

## D-001: Real pipeline and foreigner claim mock are separated

### Decision
Use `CX_REAL_MODE` for the authentication pipeline and `FOREIGNER_CLAIM_MOCK` for residence-card-specific claims when test credentials are unavailable.

### Consequence
Claude must preserve this rule unless a later ADR or module decision supersedes it.

## D-002: Store normalized claims only

### Decision
Persist only minimum public claims needed for Housing Pass.

### Consequence
Claude must preserve this rule unless a later ADR or module decision supersedes it.

## D-003: Keep identity module independent from Housing Pass

### Decision
Identity returns claims. Housing Pass decides credential structure.

### Consequence
Claude must preserve this rule unless a later ADR or module decision supersedes it.
