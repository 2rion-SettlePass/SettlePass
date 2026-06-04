import type { PresentationVp } from "@settlepass/shared";

/**
 * 순수 도메인 포트 — Nest/Prisma/외부 의존 0.
 * infrastructure 의 Prisma repository 가 구현한다.
 */
export interface CreatePresentationInput {
  requestId: string;
  housingPassId: string;
  presentationJson: PresentationVp;
  status: string;
}

/** 영속된 Presentation 의 조회 형태(VP JSON + 검증 해시). */
export interface StoredPresentation {
  id: string;
  requestId: string;
  housingPassId: string;
  presentationJson: PresentationVp;
  verificationHash: string | null;
  mockTxHash: string | null;
  status: string;
}

export interface UpdatePresentationVerificationInput {
  verificationHash: string;
  mockTxHash: string;
  status: string;
}

export interface PresentationRepositoryPort {
  create(input: CreatePresentationInput): Promise<{ id: string }>;
  findByRequestId(requestId: string): Promise<StoredPresentation | null>;
  updateVerification(
    id: string,
    input: UpdatePresentationVerificationInput,
  ): Promise<void>;
}

export const PRESENTATION_REPOSITORY = Symbol("PRESENTATION_REPOSITORY");

/**
 * 대상 사용자의 최신 Housing Pass credential 을 읽는 포트.
 * (P2 모듈을 수정하지 않고 이 모듈의 infra 에서 Prisma 로 직접 조회한다.)
 */
export interface HousingPassReaderPort {
  findLatestByUserId(
    userId: string,
  ): Promise<{ id: string; credential: unknown } | null>;
}

export const HOUSING_PASS_READER = Symbol("HOUSING_PASS_READER");
