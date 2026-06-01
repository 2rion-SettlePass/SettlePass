# SettlePass Data Model

## 1. Overview

Phase 1 data model supports:

```text
User
→ IdentitySession / IdentityClaim
→ HousingPass
→ VerificationRequest
→ Consent
→ Presentation
→ OcrDocument
→ ContractReview
→ AuditLog
```

## 2. Model ownership

| Model | Owner module | Purpose |
|---|---|---|
| `User` | users | internal user identity and language |
| `IdentitySession` | identity | CX/mock auth session |
| `IdentityClaim` | identity | normalized public claims only |
| `HousingPass` | housing-pass | VC-compatible Housing Pass JSON |
| `Verifier` | verification-request | landlord/verifier actor |
| `VerificationRequest` | verification-request | claim request lifecycle |
| `Consent` | consent | selected claim disclosure and consentHash |
| `Presentation` | presentation | VP-compatible JSON with consented claims |
| `OcrDocument` | ocr | masked normalized OCR text |
| `ContractReview` | ai-review | structured AI review result and confirmation |
| `AuditLog` | audit-log | hash record and mockTxHash |

## 3. Sensitive data boundary

Do not add fields for:
- alien registration number
- resident registration number
- passport number
- nationality
- full address
- raw visa status
- ID card image
- contract original binary
- raw unmasked OCR text

## 4. Lifecycle

### Identity

```text
IdentitySession.CREATED
→ IdentitySession.COMPLETED
→ IdentityClaim created
```

### Housing Pass

```text
IdentityClaim
→ HousingPass.ACTIVE
```

### Verification request

```text
CREATED
→ SENT
→ VIEWED
→ CONSENTED
→ PRESENTED
→ VERIFIED
```

Alternative terminal states:
- `REJECTED`
- `EXPIRED`

### AI review

```text
OcrDocument.COMPLETED
→ ContractReview.CREATED
→ ContractReview.CONFIRMED
→ AuditLog.REVIEW created
```

## 5. Hash fields

| Field | Model | Meaning |
|---|---|---|
| `consentHash` | Consent | selected disclosure consent |
| `verificationHash` | Presentation | verifier result confirmation |
| `reviewHash` | ContractReview | user AI review confirmation |
| `payloadHash` | AuditLog | normalized hash for any audit event |
| `mockTxHash` | Consent / Presentation / ContractReview / AuditLog | Phase 1 DB-only placeholder |

## 6. Migration policy

- Do not generate migration files without human confirmation.
- Schema changes must update this document and `docs/engineering/API.md` when API-visible.
- Sensitive fields require security review before adding.
