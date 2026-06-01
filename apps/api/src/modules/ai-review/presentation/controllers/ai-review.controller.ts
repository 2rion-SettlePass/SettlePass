import {
  Body,
  Controller,
  NotImplementedException,
  Param,
  Post,
} from "@nestjs/common";
import type {
  ConfirmReviewResponse,
  HousingContractReviewResponse,
} from "@settlepass/api-contracts";
import {
  ConfirmReviewDto,
  HousingContractReviewDto,
} from "../dto/ai-review.dto";

/**
 * Phase 1 명세 스텁. 라우트·DTO 검증만 정의하고 use-case는 미구현.
 */
@Controller("ai-reviews")
export class AiReviewController {
  @Post("housing-contract")
  review(
    @Body() _body: HousingContractReviewDto,
  ): HousingContractReviewResponse {
    throw new NotImplementedException(
      "ai-reviews/housing-contract: use-case 미구현 (Phase 1 명세 단계)",
    );
  }

  @Post(":reviewId/confirm")
  confirm(
    @Param("reviewId") _reviewId: string,
    @Body() _body: ConfirmReviewDto,
  ): ConfirmReviewResponse {
    throw new NotImplementedException(
      "ai-reviews/:reviewId/confirm: use-case 미구현 (Phase 1 명세 단계)",
    );
  }
}
