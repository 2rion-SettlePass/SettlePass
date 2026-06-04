# SettlePass API Contract

Base prefix: `/api`

## Common rules
- All responses are JSON except file upload requests.
- API response types must be exported from `packages/api-contracts`.
- Sensitive raw identity data must not be returned.
- `mockTxHash` is a Phase 1 placeholder and not a real chain transaction.
- API errors must not reveal alien registration number, nationality, full address, passport number, or raw visa status.
- **User identification:** every request that references a user does so by **DID** (`userDid` / `targetUserDid`). The internal uuid `userId` is never accepted as an API input; the application layer resolves DID → internal user (see `docs/engineering/IMPLEMENTATION_PLAN.md` §1-①). `POST /identity/auth/complete` is the one place that returns both `userId` and `userDid` (it establishes the mapping).

## 1. Identity

### POST `/identity/auth/start`

Start mobile identity authentication.

Request:

```json
{
  "mode": "CX_MOCK_MODE",
  "credentialType": "MOBILE_FOREIGNER_ID_MOCK"
}
```

Response:

```json
{
  "authSessionId": "auth_001",
  "mode": "CX_MOCK_MODE",
  "status": "READY",
  "authUrl": null,
  "qrBase64": null,
  "provider": "coresidence_v1.5"
}
```

### POST `/identity/auth/complete`

Complete authentication and return normalized claims.

Request:

```json
{
  "authSessionId": "auth_001",
  "mockProfile": "DEFAULT_FOREIGNER_STUDENT"
}
```

Response:

```json
{
  "userId": "user_001",
  "userDid": "did:settlepass:user:mock-001",
  "claims": {
    "identityVerified": true,
    "credentialType": "MOBILE_FOREIGNER_ID_MOCK",
    "userDid": "did:settlepass:user:mock-001",
    "ageOver19": true,
    "residenceValid": true,
    "residenceExpiryMonth": "2026-12",
    "regionLevel1": "Seoul",
    "regionLevel2": "Yeongdeungpo-gu",
    "source": "CX_MOCK_WITH_FOREIGNER_CLAIM_MOCK",
    "verifiedAt": "2026-06-15T09:00:00+09:00"
  }
}
```

### GET `/users/me?userDid=...`

Return the current user's normalized claims (dashboard hub). User scoped by `userDid`.

## 2. Housing Pass

### POST `/housing-passes`

Create a Housing Pass from normalized claims.

Request:

```json
{
  "userDid": "did:settlepass:user:mock-001"
}
```

Response:

```json
{
  "housingPassId": "hp_001",
  "status": "ACTIVE",
  "credential": {
    "id": "urn:uuid:hp_001",
    "type": ["VerifiableCredential", "HousingPassCredential"],
    "issuer": "did:settlepass:issuer:housing",
    "credentialSubject": {
      "id": "did:settlepass:user:mock-001",
      "identityVerified": true,
      "ageOver19": true,
      "residenceValid": true,
      "regionLevel1": "Seoul",
      "residenceExpiryMonth": "2026-12"
    }
  }
}
```

### GET `/housing-passes/:id`

Return a previously created Housing Pass (same shape as the create response).

## 3. Verification Request

### POST `/verification-requests`

Create landlord verification request. `targetUserDid` identifies the user whose Housing Pass is requested.

Request:

```json
{
  "verifierId": "verifier_landlord_001",
  "targetUserDid": "did:settlepass:user:mock-001",
  "purpose": "HOUSING_CONTRACT",
  "requestedClaims": [
    "identityVerified",
    "ageOver19",
    "residenceValid",
    "regionLevel1"
  ]
}
```

Response:

```json
{
  "requestId": "vr_001",
  "status": "CREATED",
  "consentUrl": "/consent/vr_001"
}
```

### GET `/verification-requests/:requestId`

Return request detail for the consent screen (`VerificationRequestDetailResponse`). `verifierName` comes from the Verifier row; `hiddenClaims` is the full list of private claim keys that can never be requested or shared. `verifiedClaims` is **not** included here (results are exposed only by the `/result` endpoint).

Response:

```json
{
  "requestId": "vr_001",
  "verifierId": "verifier_landlord_001",
  "verifierName": "김민수 임대인",
  "purpose": "HOUSING_CONTRACT",
  "requestedClaims": [
    "identityVerified",
    "ageOver19",
    "residenceValid",
    "regionLevel1"
  ],
  "hiddenClaims": [
    "alienRegistrationNumber",
    "residentRegistrationNumber",
    "passportNumber",
    "nationality",
    "fullAddress",
    "visaStatusRaw",
    "idCardImage"
  ],
  "status": "CREATED"
}
```

### GET `/verification-requests/:requestId/result`

Return verified claim result for the verifier. Returns `PENDING` (no claims) until the user has consented.

```json
{
  "requestId": "vr_001",
  "status": "VERIFIED",
  "verifiedClaims": {
    "identityVerified": true,
    "ageOver19": true,
    "residenceValid": true,
    "regionLevel1": "Seoul"
  },
  "hiddenClaims": [
    "alienRegistrationNumber",
    "nationality",
    "passportNumber",
    "fullAddress",
    "visaStatusRaw"
  ],
  "verificationHash": "0xverification...",
  "mockTxHash": "mocktx_verification_20260615_0001"
}
```

## 4. Consent

### POST `/verification-requests/:requestId/consent`

Request:

```json
{
  "userDid": "did:settlepass:user:mock-001",
  "consent": true,
  "consentedClaims": [
    "identityVerified",
    "ageOver19",
    "residenceValid",
    "regionLevel1"
  ]
}
```

Response:

```json
{
  "requestId": "vr_001",
  "status": "CONSENTED",
  "consentHash": "0xconsent...",
  "mockTxHash": "mocktx_consent_20260615_0001"
}
```

## 5. Contract OCR

### POST `/contracts/ocr`

Request:
`multipart/form-data`

```text
file: lease-contract.pdf        # optional — pdf/png/jpg/jpeg, ≤ 10MB
userDid: did:settlepass:user:mock-001
manualText: ...                 # optional — FR-OCR-06 OCR 대체 텍스트
```

- `userDid` 는 필수. `userDid` 누락 시 400.
- `file` 의 MIME 이 pdf/png/jpg/jpeg 가 아니면 400, 10MB 초과 시 400.
- `manualText` 가 있으면 OCR 호출 없이 그대로 사용(provider=`FIXTURE_OCR`).
- `file`/`manualText` 모두 없으면 데모 편의상 fixture 샘플로 진행(provider=`FIXTURE_OCR`).
- OCR provider 실패 시 fixture 로 fallback 하며 사용자에게 오류를 던지지 않는다(R-03/NFR-R-01).

PRIVACY: 업로드 원본 파일은 메모리에서만 처리하고 절대 영속하지 않는다.
저장되는 `normalizedText`/`textPreview` 는 마스킹된 텍스트이며(이름/전화/상세주소 마스킹,
금액·날짜 유지), `maskedFields` 는 마스킹된 카테고리 목록이다.

Response (200):

```json
{
  "ocrDocumentId": "ocr_001",
  "provider": "CLOVA_OCR",
  "status": "COMPLETED",
  "textPreview": "임대차계약서 ... 보증금 ... 월세 ...",
  "maskedFields": ["tenantName", "landlordName", "phoneNumber", "fullAddress"]
}
```

## 6. AI Review

### POST `/ai-reviews/housing-contract`

Request:

```json
{
  "userDid": "did:settlepass:user:mock-001",
  "housingPassId": "hp_001",
  "ocrDocumentId": "ocr_001",
  "preferredLanguage": "ko"
}
```

Response:

```json
{
  "reviewId": "review_001",
  "summary": {
    "deposit": "5000000",
    "monthlyRent": "600000",
    "maintenanceFee": "100000",
    "contractStartDate": "2026-08-01",
    "contractEndDate": "2027-07-31",
    "addressSummary": "서울시 영등포구 소재 원룸"
  },
  "riskItems": [
    {
      "level": "MEDIUM",
      "category": "EARLY_TERMINATION",
      "reason": "중도해지 시 보증금 반환 조건이 명확하지 않습니다.",
      "evidenceText": "계약서 원문 근거 문장 일부",
      "recommendedQuestion": "중도해지 시 보증금 반환 기준을 계약서에 명확히 적을 수 있나요?"
    }
  ],
  "residencePeriodCheck": {
    "status": "WARNING",
    "residenceExpiryMonth": "2026-12",
    "contractEndMonth": "2027-07",
    "reason": "계약 종료일이 체류 만료월보다 늦습니다."
  },
  "translatedSummary": {
    "ko": "계약 핵심 요약",
    "en": "Contract summary"
  },
  "disclaimer": "이 분석은 계약 이해를 돕기 위한 참고 정보이며 법률 자문이 아닙니다."
}
```

### GET `/ai-reviews/:reviewId`

Return a previously generated AI review (same shape as the create response).

### POST `/ai-reviews/:reviewId/confirm`

Request:

```json
{
  "userDid": "did:settlepass:user:mock-001",
  "confirmations": {
    "summaryChecked": true,
    "riskItemsChecked": true,
    "residenceWarningChecked": true,
    "legalDisclaimerAccepted": true
  }
}
```

Response (`200`):

```json
{
  "reviewId": "review_001",
  "status": "CONFIRMED",
  "reviewHash": "0xreview...",
  "mockTxHash": "mocktx_review_20260615_0001"
}
```

Behavior:
- All four confirmations must be `true` (FR-RH-02). If any is `false` → `400` and no `reviewHash` / audit log is produced.
- Idempotent: confirming an already-`CONFIRMED` review returns the existing `reviewHash` / `mockTxHash` without rehashing or writing another audit log.
- Authorization: the review must belong to the resolved `userDid`, otherwise `403`. Unknown `userDid` / `reviewId` → `404`.
- On first confirm a `REVIEW` audit log is written with `payloadHash = reviewHash` (the primary audit value).

## 7. Audit Log

### GET `/audit-logs`

Query:
- `userDid` (required, user scoped)
- optional `logType` (`CONSENT` | `VERIFICATION` | `REVIEW`)

Behavior:
- Returns only the resolved user's own audit logs (NFR-S-05); never another user's. Unknown `userDid` → `404`.
- Ordered by `createdAt` ascending (demo order: `CONSENT` → `VERIFICATION` → `REVIEW`).

Response:

```json
{
  "items": [
    {
      "id": "log_001",
      "logType": "CONSENT",
      "payloadHash": "0xconsent...",
      "mockTxHash": "mocktx_consent_20260615_0001",
      "storage": "DB_ONLY_PHASE1",
      "createdAt": "2026-06-15T09:30:00+09:00"
    }
  ]
}
```
