import type { PrivateClaimKey } from "@settlepass/api-contracts";

/**
 * 비공개(민감) claim 키 전체 목록 — VerificationResultResponse.hiddenClaims 와
 * VerificationRequestDetailResponse.hiddenClaims 가 노출한다.
 * VP/result 의 verifiedClaims 에는 이 키들이 절대 포함되지 않는다(선택적 공개의 핵심).
 */
export const HIDDEN_CLAIM_KEYS: readonly PrivateClaimKey[] = [
  "alienRegistrationNumber",
  "residentRegistrationNumber",
  "passportNumber",
  "nationality",
  "fullAddress",
  "visaStatusRaw",
  "idCardImage",
];
