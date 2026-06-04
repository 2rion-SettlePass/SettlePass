import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { PresentationModule } from "../presentation/presentation.module";
import { VERIFICATION_REQUEST_REPOSITORY } from "./domain/verification-request.repository.port";
import { PrismaVerificationRequestRepository } from "./infrastructure/repositories/prisma-verification-request.repository";
import { CreateVerificationRequestUseCase } from "./application/use-cases/create-verification-request.use-case";
import { GetVerificationRequestUseCase } from "./application/use-cases/get-verification-request.use-case";
import { GetVerificationResultUseCase } from "./application/use-cases/get-verification-result.use-case";
import { VerificationRequestController } from "./presentation/controllers/verification-request.controller";

/**
 * Verification Request 모듈.
 * USER_REPOSITORY 는 UsersModule, PresentationService 는 PresentationModule 에서 가져온다.
 * VR repository 토큰은 export 하여 ConsentModule 이 공유한다(consent→VR 단방향, 순환 없음).
 * HashService 는 전역 HashModule, AUDIT_LOG_WRITER 는 PresentationModule 경유로 사용된다.
 */
@Module({
  imports: [UsersModule, PresentationModule],
  controllers: [VerificationRequestController],
  providers: [
    {
      provide: VERIFICATION_REQUEST_REPOSITORY,
      useClass: PrismaVerificationRequestRepository,
    },
    CreateVerificationRequestUseCase,
    GetVerificationRequestUseCase,
    GetVerificationResultUseCase,
  ],
  exports: [VERIFICATION_REQUEST_REPOSITORY],
})
export class VerificationRequestModule {}
