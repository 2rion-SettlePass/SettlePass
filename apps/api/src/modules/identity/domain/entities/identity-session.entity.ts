/**
 * 순수 도메인 표현 — 인증 세션. Nest/Prisma/외부 의존 0.
 * 세션 식별자(id)는 use-case 가 생성하며, provider 는 mock/real 어댑터가 채운다.
 */
export type IdentitySessionStatus = "READY" | "PENDING" | "FAILED" | "COMPLETED";

export interface IdentitySession {
  id: string;
  mode: string;
  status: IdentitySessionStatus;
  provider?: string;
  createdAt: Date;
}
