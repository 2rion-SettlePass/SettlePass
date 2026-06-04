import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UsersModule } from "../users/users.module";
import { OCR_PROVIDER } from "./application/ports/ocr-provider.port";
import { ProcessOcrUseCase } from "./application/use-cases/process-ocr.use-case";
import { OCR_DOCUMENT_REPOSITORY } from "./domain/ocr.repository.port";
import { MockOcrAdapter } from "./infrastructure/adapters/mock-ocr.adapter";
import { RealClovaOcrAdapter } from "./infrastructure/adapters/real-clova-ocr.adapter";
import { PrismaOcrDocumentRepository } from "./infrastructure/repositories/prisma-ocr-document.repository";
import { OcrController } from "./presentation/controllers/ocr.controller";

/**
 * OCR 모듈.
 * USER_REPOSITORY 는 UsersModule 에서 가져온다(DID→userId resolve).
 * OCR_PROVIDER 는 CLOVA_OCR_MODE env 로 mock(FIXTURE_OCR)↔real(CLOVA_OCR) 어댑터를 고르는
 * factory 로 바인딩한다(identity.module 의 mode-factory 패턴 재사용).
 */
@Module({
  imports: [UsersModule],
  controllers: [OcrController],
  providers: [
    ProcessOcrUseCase,
    MockOcrAdapter,
    RealClovaOcrAdapter,
    {
      provide: OCR_PROVIDER,
      useFactory: (
        config: ConfigService,
        mock: MockOcrAdapter,
        real: RealClovaOcrAdapter,
      ) => (config.get("CLOVA_OCR_MODE") === "real" ? real : mock),
      inject: [ConfigService, MockOcrAdapter, RealClovaOcrAdapter],
    },
    {
      provide: OCR_DOCUMENT_REPOSITORY,
      useClass: PrismaOcrDocumentRepository,
    },
  ],
})
export class OcrModule {}
