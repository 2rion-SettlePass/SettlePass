import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { HousingContractReviewResponse } from "@settlepass/api-contracts";
import {
  CONTRACT_REVIEW_REPOSITORY,
  type ContractReviewRepositoryPort,
} from "../../domain/ai-review.repository.port";

/**
 * GET /ai-reviews/:reviewId — 저장된 AI 리뷰 조회.
 * 생성 시 응답과 동일한 형태(HousingContractReviewResponse)를 돌려준다.
 * 저장된 reviewResult 의 reviewId 는 비어 있을 수 있으므로 row id 로 채운다.
 */
@Injectable()
export class GetReviewUseCase {
  constructor(
    @Inject(CONTRACT_REVIEW_REPOSITORY)
    private readonly reviews: ContractReviewRepositoryPort,
  ) {}

  async execute(reviewId: string): Promise<HousingContractReviewResponse> {
    const stored = await this.reviews.findById(reviewId);
    if (!stored) {
      throw new NotFoundException(`review not found: ${reviewId}`);
    }

    return {
      ...stored.reviewResult,
      reviewId: stored.id,
    };
  }
}
