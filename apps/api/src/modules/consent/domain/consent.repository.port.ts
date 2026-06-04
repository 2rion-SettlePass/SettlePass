import type { HousingClaimKey } from "@settlepass/api-contracts";

/**
 * 순수 도메인 포트 — Nest/Prisma/외부 의존 0.
 * infrastructure 의 Prisma repository 가 구현한다.
 */
export type ConsentStatus = "CONSENTED" | "REJECTED";

export interface CreateConsentInput {
  requestId: string;
  userId: string;
  consentedClaims: HousingClaimKey[];
  consentHash: string;
  mockTxHash: string | null;
  status: ConsentStatus;
}

export interface ConsentRepositoryPort {
  create(input: CreateConsentInput): Promise<{ id: string }>;
}

export const CONSENT_REPOSITORY = Symbol("CONSENT_REPOSITORY");
