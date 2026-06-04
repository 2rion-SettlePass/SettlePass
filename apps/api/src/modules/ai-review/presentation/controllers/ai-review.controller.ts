import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import type {
  ConfirmReviewResponse,
  HousingContractReviewResponse,
} from "@settlepass/api-contracts";
import { ConfirmReviewUseCase } from "../../application/use-cases/confirm-review.use-case";
import { GenerateReviewUseCase } from "../../application/use-cases/generate-review.use-case";
import { GetReviewUseCase } from "../../application/use-cases/get-review.use-case";
import {
  ConfirmReviewDto,
  HousingContractReviewDto,
  reviewIdParamSchema,
} from "../dto/ai-review.dto";

@Controller("ai-reviews")
export class AiReviewController {
  constructor(
    @Inject(GenerateReviewUseCase)
    private readonly generateReview: GenerateReviewUseCase,
    @Inject(GetReviewUseCase)
    private readonly getReview: GetReviewUseCase,
    @Inject(ConfirmReviewUseCase)
    private readonly confirmReview: ConfirmReviewUseCase,
  ) {}

  // body 스키마를 명시적으로 지정한다(테스트의 esbuild 변환은 데코레이터 메타데이터를
  // 방출하지 않아 전역 ZodValidationPipe 의 metatype 추론이 동작하지 않으므로, DTO 를
  // 파이프에 직접 전달해 prod/test 양쪽에서 동일하게 검증한다 — housing-pass.controller 와 동일 방식).
  @Post("housing-contract")
  review(
    @Body(new ZodValidationPipe(HousingContractReviewDto))
    body: HousingContractReviewDto,
  ): Promise<HousingContractReviewResponse> {
    return this.generateReview.execute(body);
  }

  @Get(":reviewId")
  get(
    @Param("reviewId") reviewId: string,
  ): Promise<HousingContractReviewResponse> {
    return this.getReview.execute(reviewId);
  }

  // 최종 확인(reviewHash) — 4종 확인이 모두 true 여야 reviewHash 가 생성된다(FR-RH-02).
  // body/param 스키마를 파이프에 직접 전달한다(다른 핸들러와 동일 — esbuild 메타데이터 부재 대응).
  @Post(":reviewId/confirm")
  @HttpCode(200)
  confirm(
    @Param("reviewId", new ZodValidationPipe(reviewIdParamSchema))
    reviewId: string,
    @Body(new ZodValidationPipe(ConfirmReviewDto))
    body: ConfirmReviewDto,
  ): Promise<ConfirmReviewResponse> {
    return this.confirmReview.execute({ ...body, reviewId });
  }
}
