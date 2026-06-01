# Identity Auth Requirements

## Scope
Identity Auth handles OmniOne CX-compatible authentication for Phase 1 and returns normalized, privacy-preserving claims.

## Requirements

### R-001: Start auth session
WHEN the user starts identity authentication
THE SYSTEM SHALL create an auth session using either `CX_REAL_MODE` or `CX_MOCK_MODE`.

### R-002: Complete auth session
WHEN an auth session is completed
THE SYSTEM SHALL return `NormalizedIdentityClaims`.

### R-003: Foreigner claim mock
WHEN a real foreigner residence credential is unavailable
THE SYSTEM SHALL inject Phase 1 mock foreigner claims.

### R-004: Sensitive data exclusion
WHEN identity claims are normalized
THE SYSTEM SHALL exclude alien registration number, resident registration number, passport number, nationality, full address, raw visa status, and ID images.

### R-005: Mock labeling
WHEN mock authentication is used
THE SYSTEM SHALL mark the source as `CX_MOCK_WITH_FOREIGNER_CLAIM_MOCK`.

### R-006: Real pipeline labeling
WHEN OmniOne CX real pipeline is used with foreigner claim mock
THE SYSTEM SHALL mark the source as `CX_REAL_WITH_FOREIGNER_CLAIM_MOCK`.

## Acceptance criteria
- `POST /identity/auth/start` returns an auth session.
- `POST /identity/auth/complete` returns a userId, userDid, and normalized claims.
- forbidden raw identity fields never appear in response, DB schema, fixtures, or logs.
- mock mode can complete the demo flow without external credentials.
- API types are exported from `packages/api-contracts`.

## Non-goals
- real foreigner residence card guarantee
- OpenDID real issuer/verifier integration
- Sui, Walrus, PTB, zkLogin
