import { Module } from "@nestjs/common";
import { AiReviewController } from "./presentation/controllers/ai-review.controller";

// 담당자는 controllers / providers 에 이 모듈의 use-case·controller·adapter를 등록한다.
@Module({
  controllers: [AiReviewController],
  providers: [],
  exports: [],
})
export class AiReviewModule {}
