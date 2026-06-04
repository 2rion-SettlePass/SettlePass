import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HashService } from "../../infra/hash/hash.service";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { UsersModule } from "../users/users.module";
import { AI_REVIEW_PROVIDER } from "./application/ports/ai-review-provider.port";
import { HOUSING_PASS_READER } from "./application/ports/housing-pass-reader.port";
import { OCR_DOCUMENT_READER } from "./application/ports/ocr-document-reader.port";
import { ConfirmReviewUseCase } from "./application/use-cases/confirm-review.use-case";
import { GenerateReviewUseCase } from "./application/use-cases/generate-review.use-case";
import { GetReviewUseCase } from "./application/use-cases/get-review.use-case";
import { CONTRACT_REVIEW_REPOSITORY } from "./domain/ai-review.repository.port";
import { MockAiReviewAdapter } from "./infrastructure/adapters/mock-ai-review.adapter";
import { RealLlmReviewAdapter } from "./infrastructure/adapters/real-llm-review.adapter";
import { PrismaContractReviewRepository } from "./infrastructure/repositories/prisma-contract-review.repository";
import { PrismaHousingPassReader } from "./infrastructure/repositories/prisma-housing-pass-reader";
import { PrismaOcrDocumentReader } from "./infrastructure/repositories/prisma-ocr-document-reader";
import { AiReviewController } from "./presentation/controllers/ai-review.controller";

/**
 * AI Review 모듈.
 * USER_REPOSITORY 는 UsersModule 에서 가져온다(DID→userId resolve).
 * AUDIT_LOG_WRITER 는 AuditLogModule(P0, export) 에서 가져온다(REVIEW 감사 기록).
 * HashService 는 P0 에서 @Inject 가 추가되었으나, tsx/esbuild 변환은 데코레이터 메타데이터를
 * 방출하지 않아 전역 HashModule 클래스 바인딩으로는 ConfigService 가 undefined 가 될 수 있으므로
 * consent.module 과 동일하게 이 모듈 스코프에서 inject 를 명시한 팩토리로 안전하게 재바인딩한다.
 * AI_REVIEW_PROVIDER 는 AI_REVIEW_MODE env 로 mock(fixture)↔real(OpenAI-compatible) 어댑터를 고르는
 * factory 로 바인딩한다(ocr.module 의 mode-factory 패턴 재사용).
 * OcrDocument/HousingPass 는 P4/P2 모듈을 수정하지 않기 위해 PrismaService 기반 reader 어댑터를
 * 직접 바인딩해 읽는다.
 */
@Module({
  imports: [UsersModule, AuditLogModule],
  controllers: [AiReviewController],
  providers: [
    GenerateReviewUseCase,
    GetReviewUseCase,
    ConfirmReviewUseCase,
    MockAiReviewAdapter,
    RealLlmReviewAdapter,
    {
      provide: HashService,
      useFactory: (config: ConfigService) => new HashService(config),
      inject: [ConfigService],
    },
    {
      provide: AI_REVIEW_PROVIDER,
      useFactory: (
        config: ConfigService,
        mock: MockAiReviewAdapter,
        real: RealLlmReviewAdapter,
      ) => (config.get("AI_REVIEW_MODE") === "real" ? real : mock),
      inject: [ConfigService, MockAiReviewAdapter, RealLlmReviewAdapter],
    },
    {
      provide: CONTRACT_REVIEW_REPOSITORY,
      useClass: PrismaContractReviewRepository,
    },
    { provide: OCR_DOCUMENT_READER, useClass: PrismaOcrDocumentReader },
    { provide: HOUSING_PASS_READER, useClass: PrismaHousingPassReader },
  ],
})
export class AiReviewModule {}
