import type { NormalizedIdentityClaims } from "@settlepass/api-contracts";
import type {
  IdentitySession,
  IdentitySessionStatus,
} from "./entities/identity-session.entity";

/**
 * 순수 도메인 포트 — Nest/Prisma/외부 의존 0.
 * infrastructure 의 Prisma repository 가 구현한다.
 */
export interface CreateIdentitySessionInput {
  id: string;
  mode: string;
  status: IdentitySessionStatus;
  provider?: string;
}

export interface IdentitySessionRepositoryPort {
  create(session: CreateIdentitySessionInput): Promise<IdentitySession>;
  findById(id: string): Promise<IdentitySession | null>;
  markCompleted(id: string, userId: string): Promise<void>;
}

export const IDENTITY_SESSION_REPOSITORY = Symbol(
  "IDENTITY_SESSION_REPOSITORY",
);

/** 사용자별 정규화 claim 영속. 저장 컬럼은 허용 필드만 (금지 데이터 컬럼 없음). */
export interface CreateIdentityClaimInput {
  userId: string;
  claims: NormalizedIdentityClaims;
}

export interface IdentityClaimRepositoryPort {
  create(input: CreateIdentityClaimInput): Promise<void>;
  findLatestByUserId(userId: string): Promise<NormalizedIdentityClaims | null>;
}

export const IDENTITY_CLAIM_REPOSITORY = Symbol("IDENTITY_CLAIM_REPOSITORY");
