import { Inject, Injectable } from "@nestjs/common";
import type { AuditLogEntry } from "@settlepass/api-contracts";
import { PrismaService } from "../../../infra/prisma/prisma.service";
import type { AuditLogReaderPort } from "../application/ports/audit-log-reader.port";

/**
 * 감사 로그 조회 Prisma 어댑터.
 * userId 범위로만 조회하며(NFR-S-05), logType 이 주어지면 추가로 필터한다.
 * createdAt 오름차순(데모 흐름 순서: CONSENT → VERIFICATION → REVIEW)으로 반환한다.
 */
@Injectable()
export class PrismaAuditLogReader implements AuditLogReaderPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listByUserId(
    userId: string,
    logType?: AuditLogEntry["logType"],
  ): Promise<AuditLogEntry[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { userId, ...(logType ? { logType } : {}) },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((row) => ({
      id: row.id,
      logType: row.logType as AuditLogEntry["logType"],
      payloadHash: row.payloadHash,
      mockTxHash: row.mockTxHash ?? undefined,
      storage: row.storage as AuditLogEntry["storage"],
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
