import type { HousingClaimKey } from "@settlepass/api-contracts";
import type { VerificationRequestStatus } from "./entities/verification-request.entity";

/**
 * 순수 도메인 포트 — Nest/Prisma/외부 의존 0.
 * infrastructure 의 Prisma repository 가 구현한다.
 */
export interface CreateVerificationRequestInput {
  verifierId: string;
  targetUserId: string;
  purpose: "HOUSING_CONTRACT";
  requestedClaims: HousingClaimKey[];
  status: VerificationRequestStatus;
}

/** 영속된 검증 요청의 조회 형태(verifierName 은 join 으로 함께 로드). */
export interface StoredVerificationRequest {
  id: string;
  verifierId: string;
  verifierName: string;
  targetUserId: string;
  purpose: "HOUSING_CONTRACT";
  requestedClaims: HousingClaimKey[];
  status: VerificationRequestStatus;
}

export interface VerificationRequestRepositoryPort {
  create(input: CreateVerificationRequestInput): Promise<{ id: string }>;
  findById(id: string): Promise<StoredVerificationRequest | null>;
  updateStatus(id: string, status: VerificationRequestStatus): Promise<void>;
}

export const VERIFICATION_REQUEST_REPOSITORY = Symbol(
  "VERIFICATION_REQUEST_REPOSITORY",
);
