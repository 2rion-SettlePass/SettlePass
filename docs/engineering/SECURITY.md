# SettlePass Security Policy

## 1. Security principle
SettlePass proves minimum-claim trust. It must reduce identity-copy exposure, not create a new sensitive-data store.

## 2. Forbidden storage

Never store:

| Data | Reason |
|---|---|
| alien registration number | high-risk identity identifier |
| resident registration number | high-risk identity identifier |
| passport number | high-risk identity identifier |
| nationality | unnecessary for Phase 1 claim proof |
| full address | unnecessary for landlord minimum claim |
| raw visa status or visa status code | unnecessary and sensitive |
| ID card image | copy exposure risk |
| contract original file | notarization/legal-risk confusion |
| unmasked contract text containing personal data | privacy risk |
| external API secrets | secret leakage risk |

## 3. Allowed storage

Allowed in Phase 1:

| Data | Policy |
|---|---|
| internal user ID | allowed |
| mock DID | allowed |
| `identityVerified` | allowed |
| `ageOver19` | allowed |
| `residenceValid` | allowed |
| `regionLevel1` | allowed |
| `residenceExpiryMonth` | allowed if needed for residence/contract consistency |
| Housing Pass VC JSON | allowed only with public claims |
| Presentation VP JSON | allowed only with consented claims |
| OCR normalized text | allowed only after masking and only when needed |
| AI review result JSON | allowed when it excludes raw sensitive data |
| consentHash / verificationHash / reviewHash | allowed |
| mockTxHash | allowed with Phase 1 warning |

## 4. External integration secrets

Secrets must be environment variables only:

```env
DATABASE_URL=
OMNIONE_CX_BASE_URL=
OMNIONE_CX_API_KEY=
CLOVA_OCR_INVOKE_URL=
CLOVA_OCR_SECRET=
AI_API_KEY=
HASH_SECRET_SALT=
```

Rules:
- do not commit real `.env`
- do not log env values
- do not expose API keys to `NEXT_PUBLIC_*`
- do not place secrets in fixtures
- do not paste secrets into issue/PR comments

## 5. Logging

Logs must not contain:
- raw CX token payload
- alien registration number
- resident registration number
- passport number
- nationality
- full address
- raw visa status
- contract original content
- OCR full raw text before masking
- API secrets

Allowed logs:
- request ID
- internal user ID
- module name
- hash value
- mockTxHash
- non-sensitive status

## 6. Hash policy

All audit hashes must include:
- canonical JSON
- purpose/type
- subject hash
- timestamp
- nonce

`documentHash` must not become the core audit value in Phase 1.

## 7. File upload policy

Allowed:
- PDF
- PNG
- JPG
- JPEG

Rules:
- max size: 10MB unless changed by explicit decision
- upload is temporary
- OCR or fallback processing happens immediately
- original file must be deleted or expire by TTL
- contract original is not a permanent record

## 8. Mock policy

Mock data must:
- be marked `mock`, `fixture`, or `phase1`
- not resemble real personal identifiers
- not include real phone numbers, registration numbers, passport numbers, or real addresses
- make `mockTxHash` visibly non-chain

## 9. Review gates

Human review required for:
- identity/auth changes
- hash logic changes
- storage of any new data category
- OCR persistence changes
- AI review output changes affecting `reviewHash`
- migration changes
- external integration credentials
- any Phase 1 scope expansion
