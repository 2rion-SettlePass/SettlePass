import { Module } from "@nestjs/common";
import { ConsentController } from "./presentation/controllers/consent.controller";

// 담당자는 controllers / providers 에 이 모듈의 use-case·controller·adapter를 등록한다.
@Module({
  controllers: [ConsentController],
  providers: [],
  exports: [],
})
export class ConsentModule {}
