import { Module } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { UsersModule } from "../users/users.module";
import { AUDIT_LOG_READER } from "./application/ports/audit-log-reader.port";
import { AUDIT_LOG_WRITER } from "./application/ports/audit-log-writer.port";
import { ListAuditLogsUseCase } from "./application/use-cases/list-audit-logs.use-case";
import { PrismaAuditLogReader } from "./infrastructure/prisma-audit-log-reader.adapter";
import { PrismaAuditLogWriter } from "./infrastructure/prisma-audit-log-writer.adapter";
import { AuditLogController } from "./presentation/controllers/audit-log.controller";

/**
 * Audit Log 모듈.
 * writer(P0, AUDIT_LOG_WRITER) 는 consent/verification/review use-case 가 공유하므로 export 한다.
 * reader(P6, AUDIT_LOG_READER) + ListAuditLogsUseCase 는 조회 라우트 전용이다(NFR-S-05).
 * USER_REPOSITORY 는 UsersModule 에서 가져온다(DID→userId resolve).
 * reader 는 PrismaService 를 inject 명시 팩토리로 바인딩한다(consent.module 과 동일 — esbuild 메타데이터 부재 대응).
 */
@Module({
  imports: [UsersModule],
  controllers: [AuditLogController],
  providers: [
    { provide: AUDIT_LOG_WRITER, useClass: PrismaAuditLogWriter },
    {
      provide: AUDIT_LOG_READER,
      useFactory: (prisma: PrismaService) => new PrismaAuditLogReader(prisma),
      inject: [PrismaService],
    },
    ListAuditLogsUseCase,
  ],
  exports: [AUDIT_LOG_WRITER],
})
export class AuditLogModule {}
