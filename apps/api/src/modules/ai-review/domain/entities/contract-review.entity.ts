import type {
  HousingContractReviewResponse,
  ResidenceConsistencyStatus,
} from "@settlepass/api-contracts";

/**
 * 순수 도메인 표현 — AI 계약 리뷰. Nest/Prisma/외부 의존 0.
 *
 * reviewResult 는 사용자에게 반환하는 응답 형태(HousingContractReviewResponse)를 그대로 담는다.
 * reviewHash/confirmedAt 은 P6(최종 확인)에서만 설정하며 P5 생성 시점에는 비운다(status='GENERATED').
 */
export type ContractReviewStatus = "GENERATED" | "CONFIRMED";

export interface ContractReview {
  id: string;
  userId: string;
  ocrDocumentId: string;
  housingPassId: string;
  reviewResult: HousingContractReviewResponse;
  residenceConsistencyStatus: ResidenceConsistencyStatus;
  status: ContractReviewStatus;
}
