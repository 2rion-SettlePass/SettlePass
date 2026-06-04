import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HashService } from "../../infra/hash/hash.service";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AUDIT_LOG_WRITER } from "../audit-log/application/ports/audit-log-writer.port";
import { PrismaAuditLogWriter } from "../audit-log/infrastructure/prisma-audit-log-writer.adapter";
import { PresentationModule } from "../presentation/presentation.module";
import { UsersModule } from "../users/users.module";
import { VerificationRequestModule } from "../verification-request/verification-request.module";
import { CONSENT_REPOSITORY } from "./domain/consent.repository.port";
import { PrismaConsentRepository } from "./infrastructure/repositories/prisma-consent.repository";
import { ConsentToVerificationUseCase } from "./application/use-cases/consent-to-verification.use-case";
import { ConsentController } from "./presentation/controllers/consent.controller";

/**
 * Consent 모듈.
 * USER_REPOSITORY(UsersModule), VERIFICATION_REQUEST_REPOSITORY(VerificationRequestModule),
 * PresentationService(PresentationModule) 를 가져온다. Consent repository 는 로컬 바인딩.
 *
 * HashService / AUDIT_LOG_WRITER 는 명시적 inject 팩토리로 이 모듈 스코프에서 바인딩한다.
 * (테스트의 esbuild/tsx 변환은 데코레이터 메타데이터를 방출하지 않아, 생성자 의존을
 *  메타데이터로 추론하는 전역 HashModule/AuditLogModule 클래스 바인딩으로는 ConfigService/
 *  PrismaService 가 undefined 가 된다. P0 의 HashService/PrismaAuditLogWriter 는 수정하지
 *  않고, identity.module 과 동일하게 inject 를 명시한 팩토리로 안전하게 재바인딩한다.)
 */
@Module({
  imports: [UsersModule, VerificationRequestModule, PresentationModule],
  controllers: [ConsentController],
  providers: [
    { provide: CONSENT_REPOSITORY, useClass: PrismaConsentRepository },
    {
      provide: HashService,
      useFactory: (config: ConfigService) => new HashService(config),
      inject: [ConfigService],
    },
    {
      provide: AUDIT_LOG_WRITER,
      useFactory: (prisma: PrismaService) => new PrismaAuditLogWriter(prisma),
      inject: [PrismaService],
    },
    ConsentToVerificationUseCase,
  ],
})
export class ConsentModule {}
