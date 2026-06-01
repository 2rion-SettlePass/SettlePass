import type {
  AuditLogEntry,
  HousingContractReviewResponse,
  HousingPassCredential,
  NormalizedIdentityClaims,
  VerificationResultResponse,
} from "@settlepass/api-contracts";

export const DEMO_USER = {
  userId: "user_001",
  userDid: "did:settlepass:user:mock-001",
  displayName: "Linh",
  preferredLanguage: "ko",
} as const;

export const DEMO_VERIFIER = {
  verifierId: "verifier_landlord_001",
  name: "김민수 임대인",
  type: "LANDLORD",
  did: "did:settlepass:verifier:landlord-001",
} as const;

export const DEMO_IDENTITY_CLAIMS: NormalizedIdentityClaims = {
  identityVerified: true,
  credentialType: "MOBILE_FOREIGNER_ID_MOCK",
  userDid: DEMO_USER.userDid,
  ageOver19: true,
  residenceValid: true,
  residenceExpiryMonth: "2026-12",
  regionLevel1: "Seoul",
  regionLevel2: "Yeongdeungpo-gu",
  source: "CX_MOCK_WITH_FOREIGNER_CLAIM_MOCK",
  verifiedAt: "2026-06-15T09:00:00+09:00",
};

export const DEMO_HOUSING_PASS: HousingPassCredential = {
  id: "urn:uuid:hp_001",
  type: ["VerifiableCredential", "HousingPassCredential"],
  issuer: "did:settlepass:issuer:housing",
  issuanceDate: "2026-06-15T09:05:00+09:00",
  expirationDate: "2026-12-31T23:59:59+09:00",
  credentialSubject: {
    id: DEMO_USER.userDid,
    identityVerified: true,
    ageOver19: true,
    residenceValid: true,
    regionLevel1: "Seoul",
    residenceExpiryMonth: "2026-12",
  },
  evidence: {
    source: "CX_MOCK_WITH_FOREIGNER_CLAIM_MOCK",
    verifiedAt: "2026-06-15T09:00:00+09:00",
  },
};

export const DEMO_VERIFICATION_REQUEST = {
  requestId: "vr_001",
  verifierId: DEMO_VERIFIER.verifierId,
  targetUserId: DEMO_USER.userId,
  purpose: "HOUSING_CONTRACT",
  requestedClaims: ["identityVerified", "ageOver19", "residenceValid", "regionLevel1"],
  status: "CREATED",
} as const;

export const DEMO_VERIFICATION_RESULT: VerificationResultResponse = {
  requestId: "vr_001",
  status: "VERIFIED",
  verifiedClaims: {
    identityVerified: true,
    ageOver19: true,
    residenceValid: true,
    regionLevel1: "Seoul",
  },
  hiddenClaims: [
    "alienRegistrationNumber",
    "nationality",
    "passportNumber",
    "fullAddress",
    "visaStatusRaw",
    "idCardImage",
  ],
  verificationHash: "0xverification_phase1_fixture_001",
  mockTxHash: "mocktx_verification_20260615_0001",
};

export const DEMO_CONTRACT_REVIEW: HousingContractReviewResponse = {
  reviewId: "review_001",
  summary: {
    deposit: "5000000",
    monthlyRent: "600000",
    maintenanceFee: "100000",
    contractStartDate: "2026-08-01",
    contractEndDate: "2027-07-31",
    addressSummary: "서울시 영등포구 소재 원룸",
  },
  riskItems: [
    {
      level: "MEDIUM",
      category: "EARLY_TERMINATION",
      reason: "중도해지 시 보증금 반환 조건이 명확하지 않습니다.",
      evidenceText: "중도해지 관련 특약은 별도 협의한다.",
      recommendedQuestion: "중도해지 시 보증금 반환 기준을 계약서에 명확히 적을 수 있나요?",
    },
    {
      level: "LOW",
      category: "MAINTENANCE_FEE",
      reason: "관리비 포함 항목이 충분히 구체적이지 않습니다.",
      evidenceText: "관리비 월 100,000원",
      recommendedQuestion: "관리비에 수도, 전기, 인터넷이 포함되는지 확인할 수 있나요?",
    },
  ],
  residencePeriodCheck: {
    status: "WARNING",
    residenceExpiryMonth: "2026-12",
    contractEndMonth: "2027-07",
    reason: "계약 종료일이 체류 만료월보다 늦습니다. 체류 연장 가능성과 중도해지 조건을 확인해야 합니다.",
  },
  translatedSummary: {
    ko: "보증금 500만 원, 월세 60만 원, 계약기간은 2026년 8월부터 2027년 7월까지입니다.",
    en: "The deposit is KRW 5,000,000, monthly rent is KRW 600,000, and the contract runs from Aug 2026 to Jul 2027.",
  },
  disclaimer: "이 분석은 계약 이해를 돕기 위한 참고 정보이며 법률 자문이 아닙니다.",
};

export const DEMO_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log_consent_001",
    logType: "CONSENT",
    payloadHash: "0xconsent_phase1_fixture_001",
    mockTxHash: "mocktx_consent_20260615_0001",
    storage: "DB_ONLY_PHASE1",
    createdAt: "2026-06-15T09:20:00+09:00",
  },
  {
    id: "log_verification_001",
    logType: "VERIFICATION",
    payloadHash: "0xverification_phase1_fixture_001",
    mockTxHash: "mocktx_verification_20260615_0001",
    storage: "DB_ONLY_PHASE1",
    createdAt: "2026-06-15T09:25:00+09:00",
  },
  {
    id: "log_review_001",
    logType: "REVIEW",
    payloadHash: "0xreview_phase1_fixture_001",
    mockTxHash: "mocktx_review_20260615_0001",
    storage: "DB_ONLY_PHASE1",
    createdAt: "2026-06-15T09:40:00+09:00",
  },
];
