import type { HousingPassCredential } from "@settlepass/api-contracts";

/**
 * 순수 도메인 표현 — Housing Pass. Nest/Prisma/외부 의존 0.
 * credential 은 공개 claim 만 담은 VC JSON 이다(비공개 claim 절대 미포함).
 */
export type HousingPassStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

export interface HousingPass {
  id: string;
  userId: string;
  credential: HousingPassCredential;
  status: HousingPassStatus;
  issuedAt: Date;
  expiresAt?: Date;
}
