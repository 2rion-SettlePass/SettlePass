import { Module } from "@nestjs/common";

// 담당자는 controllers / providers 에 이 모듈의 use-case·controller·adapter를 등록한다.
@Module({
  controllers: [],
  providers: [],
  exports: [],
})
export class PresentationModule {}
