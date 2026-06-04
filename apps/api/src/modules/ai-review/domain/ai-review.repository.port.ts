import type {
  HousingContractReviewResponse,
  ResidenceConsistencyStatus,
} from "@settlepass/api-contracts";
import type { ContractReviewStatus } from "./entities/contract-review.entity";

/**
 * 순수 도메인 포트 — Nest/Prisma/외부 의존 0.
 * infrastructure 의 Prisma repository 가 구현한다.
 */
export interface CreateContractReviewInput {
  userId: string;
  ocrDocumentId: string;
  housingPassId: string;
  /** 사용자에게 반환한 응답 그대로(reviewId 포함). */
  reviewResult: HousingContractReviewResponse;
  residenceConsistencyStatus: ResidenceConsistencyStatus;
  status: ContractReviewStatus;
}

/** 영속된 리뷰의 조회 형태. */
export interface StoredContractReview {
  id: string;
  userId: string;
  ocrDocumentId: string;
  housingPassId: string;
  reviewResult: HousingContractReviewResponse;
  residenceConsistencyStatus: ResidenceConsistencyStatus;
  status: ContractReviewStatus;
  /** 최종 확인(P6) 전에는 비어 있다. */
  reviewHash?: string | null;
  mockTxHash?: string | null;
}

/** 최종 확인(P6) 시 채워지는 필드 패치. */
export interface UpdateContractReviewInput {
  status: ContractReviewStatus;
  reviewHash: string;
  mockTxHash: string;
  confirmedAt: Date;
}

export interface ContractReviewRepositoryPort {
  create(input: CreateContractReviewInput): Promise<{ id: string }>;
  findById(id: string): Promise<StoredContractReview | null>;
  update(id: string, patch: UpdateContractReviewInput): Promise<void>;
}

export const CONTRACT_REVIEW_REPOSITORY = Symbol("CONTRACT_REVIEW_REPOSITORY");
