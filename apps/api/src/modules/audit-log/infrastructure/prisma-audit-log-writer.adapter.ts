import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infra/prisma/prisma.service";
import type {
  AuditLogWriteInput,
  AuditLogWriterPort,
} from "../application/ports/audit-log-writer.port";

/** Phase 1: 감사 로그는 DB 에만 적재한다 (storage = DB_ONLY_PHASE1). */
@Injectable()
export class PrismaAuditLogWriter implements AuditLogWriterPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async write(input: AuditLogWriteInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: { ...input, storage: "DB_ONLY_PHASE1" },
    });
  }
}
