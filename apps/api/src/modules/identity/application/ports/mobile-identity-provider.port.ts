import type { CredentialType, IdentitySource } from "@settlepass/api-contracts";
import type { IdentitySession } from "../../domain/entities/identity-session.entity";

/**
 * 모바일 신원확인 provider 포트 (application).
 * mock(MockCxIdentityAdapter) / real(RealCxIdentityAdapter) 어댑터가 구현한다.
 * 세션 id 생성·영속은 use-case 책임 — provider 는 상태/표시정보만 돌려준다.
 */
export interface StartAuthInput {
  mode: string;
  credentialType: CredentialType;
}

export interface StartAuthResult {
  status: "READY" | "PENDING" | "FAILED";
  provider?: string;
  authUrl?: string | null;
  qrBase64?: string | null;
}

export interface CompleteAuthInput {
  session: IdentitySession;
  mockProfile?: string;
}

/** 인증으로 확립되는 기본 신원 (claim 보강 전). */
export interface RawIdentityResult {
  credentialType: CredentialType;
  userDid: string;
  identityVerified: boolean;
  source: IdentitySource;
}

export interface MobileIdentityProviderPort {
  startAuth(input: StartAuthInput): Promise<StartAuthResult>;
  completeAuth(input: CompleteAuthInput): Promise<RawIdentityResult>;
}

export const MOBILE_IDENTITY_PROVIDER = Symbol("MOBILE_IDENTITY_PROVIDER");
