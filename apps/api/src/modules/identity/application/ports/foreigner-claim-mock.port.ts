/**
 * 외국인 거주 claim mock 포트 (application).
 * 실 외국인 credential 미가용 시 기본 claim 을 발급한다 (PRD Foreigner Residence Card mock).
 * 금지 데이터(국적/체류자격 원문/상세주소 등)는 절대 발급하지 않는다 — 허용 claim 만.
 */
export interface ForeignerClaimMockProfileInput {
  userDid: string;
  mockProfile?: string;
}

export interface ForeignerDefaultClaims {
  ageOver19: boolean;
  residenceValid: boolean;
  residenceExpiryMonth: string;
  regionLevel1: string;
  regionLevel2?: string;
}

export interface ForeignerClaimMockPort {
  issueDefaultClaims(
    profile: ForeignerClaimMockProfileInput,
  ): Promise<ForeignerDefaultClaims>;
}

export const FOREIGNER_CLAIM_MOCK = Symbol("FOREIGNER_CLAIM_MOCK");
