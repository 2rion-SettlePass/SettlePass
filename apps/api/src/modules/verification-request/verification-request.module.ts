import { Module } from "@nestjs/common";
import { VerificationRequestController } from "./presentation/controllers/verification-request.controller";

// 담당자는 controllers / providers 에 이 모듈의 use-case·controller·adapter를 등록한다.
@Module({
  controllers: [VerificationRequestController],
  providers: [],
  exports: [],
})
export class VerificationRequestModule {}
