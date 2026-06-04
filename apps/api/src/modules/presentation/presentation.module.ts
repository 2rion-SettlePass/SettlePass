import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HashService } from "../../infra/hash/hash.service";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AUDIT_LOG_WRITER } from "../audit-log/application/ports/audit-log-writer.port";
import { PrismaAuditLogWriter } from "../audit-log/infrastructure/prisma-audit-log-writer.adapter";
import {
  HOUSING_PASS_READER,
  PRESENTATION_REPOSITORY,
} from "./domain/presentation.repository.port";
import { PrismaPresentationRepository } from "./infrastructure/repositories/prisma-presentation.repository";
import { PrismaHousingPassReader } from "./infrastructure/repositories/prisma-housing-pass-reader";
import { PresentationService } from "./application/presentation.service";

/**
 * Presentation 모듈 — VP 조립 + Presentation 영속 + 검증 해시 생성을 소유한다.
 * PresentationService 를 export 해 consent / verification-request 모듈이 공유한다.
 * HousingPass 는 P2 모듈을 수정하지 않고 이 모듈의 Prisma reader 로 직접 읽는다.
 *
 * HashService / AUDIT_LOG_WRITER 는 명시적 inject 팩토리로 이 모듈 스코프에서 바인딩한다.
 * (테스트의 esbuild/tsx 변환은 데코레이터 메타데이터를 방출하지 않아, 생성자 의존을
 *  메타데이터로 추론하는 전역 HashModule/AuditLogModule 클래스 바인딩으로는 ConfigService/
 *  PrismaService 가 undefined 가 된다. P0 의 HashService/PrismaAuditLogWriter 는 수정하지
 *  않고, identity.module 과 동일하게 inject 를 명시한 팩토리로 안전하게 재바인딩한다.)
 */
@Module({
  providers: [
    { provide: PRESENTATION_REPOSITORY, useClass: PrismaPresentationRepository },
    { provide: HOUSING_PASS_READER, useClass: PrismaHousingPassReader },
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
    PresentationService,
  ],
  exports: [PresentationService],
})
export class PresentationModule {}
