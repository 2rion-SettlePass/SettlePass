# Identity Auth Design

## Architecture
Identity Auth is implemented through a port/adapter boundary.

```text
presentation/controller
→ application/use-case
→ MobileIdentityProviderPort
→ infrastructure adapter
```

## Port
`MobileIdentityProviderPort`

Responsibilities:
- start auth session
- complete auth session
- normalize result into `NormalizedIdentityClaims`

## Adapters

### MockMobileIdentityAdapter
Used for Phase 1 stable demo.

Returns:
- `MOBILE_FOREIGNER_ID_MOCK`
- public claims only
- explicit mock source

### OmniOneCxAdapter
Used when test server and credential are available.

Expected flow:
1. provider list if needed
2. token request
3. QR or AppToApp/WebToApp request
4. result request
5. token parsing
6. normalized claim mapping

## Claim mapping

| Source | Output |
|---|---|
| successful CX result | `identityVerified=true` |
| birth or derived age | `ageOver19` |
| `stayexdate` or mock expiry | `residenceValid`, `residenceExpiryMonth` |
| `stayregloc` or mock location | `regionLevel1` |

## Forbidden mapping
Do not map or persist:
- `ihidnum`
- alien registration number
- nationality
- full address
- raw visa status
- ID image
- passport number

## API
- `POST /identity/auth/start`
- `POST /identity/auth/complete`

## Test plan
- unit: mock adapter returns complete normalized claims
- unit: sensitive source fields are dropped
- unit: source label is correct
- contract: start/complete response matches `packages/api-contracts`
