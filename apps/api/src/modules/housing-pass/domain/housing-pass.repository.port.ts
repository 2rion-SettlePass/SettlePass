import type {
  CreateHousingPassResponse,
  HousingPassCredential,
} from "@settlepass/api-contracts";

/**
 * 순수 도메인 포트 — Nest/Prisma/외부 의존 0.
 * infrastructure 의 Prisma repository 가 구현한다.
 */
export interface CreateHousingPassInput {
  userId: string;
  credential: HousingPassCredential;
  status: CreateHousingPassResponse["status"];
  expiresAt?: Date;
}

/** 영속된 Housing Pass 의 조회 형태(공개 claim 만 담은 credential 포함). */
export interface StoredHousingPass {
  id: string;
  userId: string;
  credential: HousingPassCredential;
  status: CreateHousingPassResponse["status"];
}

export interface HousingPassRepositoryPort {
  create(input: CreateHousingPassInput): Promise<{ id: string }>;
  findById(id: string): Promise<StoredHousingPass | null>;
}

export const HOUSING_PASS_REPOSITORY = Symbol("HOUSING_PASS_REPOSITORY");
