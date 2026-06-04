import type {
  CredentialType,
  IdentitySource,
  NormalizedIdentityClaims,
} from "@settlepass/api-contracts";

/**
 * NormalizedIdentityClaims 생성 가드 (도메인, 순수 TS).
 *
 * 허용된 필드만 명시적으로 매핑한다. 입력에 외국인등록번호·국적·여권번호·상세주소·
 * 체류자격 원문 등 금지 데이터가 섞여 있어도 결과 객체에는 절대 들어가지 않는다.
 * (저장/응답 직전 단일 통로 — IMPLEMENTATION_PLAN §0-3, CLAUDE.md hard rules)
 */
export interface BuildNormalizedClaimsInput {
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

export function buildNormalizedIdentityClaims(
  input: BuildNormalizedClaimsInput,
): NormalizedIdentityClaims {
  const claims: NormalizedIdentityClaims = {
    identityVerified: input.identityVerified,
    credentialType: input.credentialType,
    userDid: input.userDid,
    ageOver19: input.ageOver19,
    residenceValid: input.residenceValid,
  };

  if (input.residenceExpiryMonth !== undefined) {
    claims.residenceExpiryMonth = input.residenceExpiryMonth;
  }
  if (input.regionLevel1 !== undefined) {
    claims.regionLevel1 = input.regionLevel1;
  }
  if (input.regionLevel2 !== undefined) {
    claims.regionLevel2 = input.regionLevel2;
  }
  if (input.source !== undefined) {
    claims.source = input.source;
  }
  if (input.verifiedAt !== undefined) {
    claims.verifiedAt = input.verifiedAt;
  }

  return claims;
}
