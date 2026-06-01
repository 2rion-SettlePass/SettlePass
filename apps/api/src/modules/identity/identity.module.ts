import { Module } from "@nestjs/common";
import { IdentityController } from "./presentation/controllers/identity.controller";

// 담당자는 controllers / providers 에 이 모듈의 use-case·controller·adapter를 등록한다.
@Module({
  controllers: [IdentityController],
  providers: [],
  exports: [],
})
export class IdentityModule {}
