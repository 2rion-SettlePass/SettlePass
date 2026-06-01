# SettlePass API Contract

Base prefix: `/api`

## Common rules
- All responses are JSON except file upload requests.
- API response types must be exported from `packages/api-contracts`.
- Sensitive raw identity data must not be returned.
- `mockTxHash` is a Phase 1 placeholder and not a real chain transaction.
- API errors must not reveal alien registration number, nationality, full address, passport number, or raw visa status.

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

## 2. Housing Pass

### POST `/housing-passes`

Create a Housing Pass from normalized claims.

Request:

```json
{
  "userId": "user_001"
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

## 3. Verification Request

### POST `/verification-requests`

Create landlord verification request.

Request:

```json
{
  "verifierId": "verifier_landlord_001",
  "targetUserId": "user_001",
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
  "consentUrl": "/verification/requests/vr_001"
}
```

### GET `/verification-requests/:requestId/result`

Return verified claim result for the verifier.

Response:

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
  "userId": "user_001",
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
file: lease-contract.pdf
userId: user_001
```

Response:

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
  "userId": "user_001",
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

### POST `/ai-reviews/:reviewId/confirm`

Request:

```json
{
  "userId": "user_001",
  "confirmations": {
    "summaryChecked": true,
    "riskItemsChecked": true,
    "residenceWarningChecked": true,
    "legalDisclaimerAccepted": true
  }
}
```

Response:

```json
{
  "reviewId": "review_001",
  "status": "CONFIRMED",
  "reviewHash": "0xreview...",
  "mockTxHash": "mocktx_review_20260615_0001"
}
```

## 7. Audit Log

### GET `/audit-logs`

Query:
- `userId`
- optional `logType`

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
