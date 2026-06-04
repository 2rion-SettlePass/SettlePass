export type IdentityMode = "CX_REAL_MODE" | "CX_MOCK_MODE";
export type CredentialType = "KOREAN_MOBILE_ID_REAL" | "MOBILE_FOREIGNER_ID_MOCK";
export type IdentitySource =
  | "CX_REAL_WITH_FOREIGNER_CLAIM_MOCK"
  | "CX_MOCK_WITH_FOREIGNER_CLAIM_MOCK";

export type HousingClaimKey =
  | "identityVerified"
  | "ageOver19"
  | "residenceValid"
  | "regionLevel1"
  | "residenceExpiryMonth";

export type PrivateClaimKey =
  | "alienRegistrationNumber"
  | "residentRegistrationNumber"
  | "passportNumber"
  | "nationality"
  | "fullAddress"
  | "visaStatusRaw"
  | "idCardImage";

export interface NormalizedIdentityClaims {
  identityVerified: boolean;
  credentialType: CredentialType;
  userDid: string;
  ageOver19: boolean;
  residenceValid: boolean;
  residenceExpiryMonth?: string;
  regionLevel1?: string;
  regionLevel2?: string;
  source?: IdentitySource;
  verifiedAt?: string;
}

export interface IdentityAuthStartRequest {
  mode: IdentityMode;
  credentialType: CredentialType;
}

export interface IdentityAuthStartResponse {
  authSessionId: string;
  mode: IdentityMode;
  status: "READY" | "PENDING" | "FAILED";
  authUrl?: string | null;
  qrBase64?: string | null;
  provider?: string;
}

export interface IdentityAuthCompleteRequest {
  authSessionId: string;
  mockProfile?: "DEFAULT_FOREIGNER_STUDENT" | "DEFAULT_FOREIGNER_WORKER";
}

// 인증 완료 시점에 내부 userId(uuid)와 userDid 매핑을 함께 반환한다.
// 이후 모든 요청은 userDid 로 사용자를 식별한다(IMPLEMENTATION_PLAN §1-①).
export interface IdentityAuthCompleteResponse {
  userId: string;
  userDid: string;
  claims: NormalizedIdentityClaims;
}

// GET /users/me — userDid 로 사용자와 최신 NormalizedIdentityClaims 를 조회한다.
export interface UserMeResponse {
  userId: string;
  userDid: string;
  claims: NormalizedIdentityClaims;
}

export interface HousingPassCredentialSubject {
  id: string;
  identityVerified: boolean;
  ageOver19: boolean;
  residenceValid: boolean;
  regionLevel1?: string;
  residenceExpiryMonth?: string;
}

export interface HousingPassCredential {
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: HousingPassCredentialSubject;
  evidence?: {
    source: IdentitySource;
    verifiedAt: string;
  };
}

export interface CreateHousingPassRequest {
  userDid: string;
}

export interface CreateHousingPassResponse {
  housingPassId: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  credential: HousingPassCredential;
}

export interface CreateVerificationRequestRequest {
  verifierId: string;
  targetUserDid: string;
  purpose: "HOUSING_CONTRACT";
  requestedClaims: HousingClaimKey[];
}

export interface CreateVerificationRequestResponse {
  requestId: string;
  status: "CREATED" | "SENT";
  consentUrl: string;
}

// GET /verification-requests/:requestId — 동의 화면이 쓰는 요청 상세.
// verifiedClaims 는 노출하지 않는다(결과는 result 엔드포인트 전용).
export interface VerificationRequestDetailResponse {
  requestId: string;
  verifierId: string;
  verifierName: string;
  purpose: "HOUSING_CONTRACT";
  requestedClaims: HousingClaimKey[];
  hiddenClaims: PrivateClaimKey[];
  status: "CREATED" | "SENT" | "CONSENTED" | "VERIFIED" | "REJECTED" | "EXPIRED";
}

export interface ConsentToVerificationRequest {
  userDid: string;
  consent: boolean;
  consentedClaims: HousingClaimKey[];
}

export interface ConsentToVerificationResponse {
  requestId: string;
  status: "CONSENTED" | "REJECTED";
  consentHash?: string;
  mockTxHash?: string;
}

export interface VerificationResultResponse {
  requestId: string;
  status: "VERIFIED" | "PENDING" | "REJECTED" | "EXPIRED";
  verifiedClaims: Partial<Record<HousingClaimKey, boolean | string>>;
  hiddenClaims: PrivateClaimKey[];
  verificationHash?: string;
  mockTxHash?: string;
}

export interface OcrContractResponse {
  ocrDocumentId: string;
  provider: "CLOVA_OCR" | "FIXTURE_OCR";
  status: "COMPLETED" | "FAILED";
  textPreview: string;
  maskedFields: string[];
}

export interface HousingContractReviewRequest {
  userDid: string;
  housingPassId: string;
  ocrDocumentId: string;
  preferredLanguage: "ko" | "en" | "zh" | "vi";
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type ResidenceConsistencyStatus = "OK" | "WARNING" | "UNKNOWN";

export interface ContractReviewRiskItem {
  level: RiskLevel;
  category: string;
  reason: string;
  evidenceText: string;
  recommendedQuestion: string;
}

export interface HousingContractReviewResponse {
  reviewId: string;
  summary: {
    deposit?: string;
    monthlyRent?: string;
    maintenanceFee?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    addressSummary?: string;
  };
  riskItems: ContractReviewRiskItem[];
  residencePeriodCheck: {
    status: ResidenceConsistencyStatus;
    residenceExpiryMonth?: string;
    contractEndMonth?: string;
    reason: string;
  };
  translatedSummary: Partial<Record<"ko" | "en" | "zh" | "vi", string>>;
  disclaimer: string;
}

export interface ConfirmReviewRequest {
  userDid: string;
  confirmations: {
    summaryChecked: boolean;
    riskItemsChecked: boolean;
    residenceWarningChecked: boolean;
    legalDisclaimerAccepted: boolean;
  };
}

export interface ConfirmReviewResponse {
  reviewId: string;
  status: "CONFIRMED";
  reviewHash: string;
  mockTxHash: string;
}

export interface AuditLogEntry {
  id: string;
  logType: "CONSENT" | "VERIFICATION" | "REVIEW";
  payloadHash: string;
  mockTxHash?: string;
  storage: "DB_ONLY_PHASE1" | "OMNIONE_CHAIN_PHASE2";
  createdAt: string;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
}
