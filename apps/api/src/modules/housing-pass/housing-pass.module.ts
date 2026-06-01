import { Module } from "@nestjs/common";
import { HousingPassController } from "./presentation/controllers/housing-pass.controller";

// 담당자는 controllers / providers 에 이 모듈의 use-case·controller·adapter를 등록한다.
@Module({
  controllers: [HousingPassController],
  providers: [],
  exports: [],
})
export class HousingPassModule {}
