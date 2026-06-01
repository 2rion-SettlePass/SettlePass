import { Module } from "@nestjs/common";
import { OcrController } from "./presentation/controllers/ocr.controller";

// 담당자는 controllers / providers 에 이 모듈의 use-case·controller·adapter를 등록한다.
@Module({
  controllers: [OcrController],
  providers: [],
  exports: [],
})
export class OcrModule {}
