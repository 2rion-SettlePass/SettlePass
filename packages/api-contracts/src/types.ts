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

export interface IdentityAuthCompleteResponse {
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
  userId: string;
}

export interface CreateHousingPassResponse {
  housingPassId: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  credential: HousingPassCredential;
}

export interface CreateVerificationRequestRequest {
  verifierId: string;
  targetUserId: string;
  purpose: "HOUSING_CONTRACT";
  requestedClaims: HousingClaimKey[];
}

export interface CreateVerificationRequestResponse {
  requestId: string;
  status: "CREATED" | "SENT";
  consentUrl: string;
}

export interface ConsentToVerificationRequest {
  userId: string;
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
  userId: string;
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
  userId: string;
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
