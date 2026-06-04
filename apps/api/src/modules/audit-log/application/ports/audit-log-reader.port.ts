import type { AuditLogEntry } from "@settlepass/api-contracts";

/**
 * 순수 application 포트 — Nest/Prisma 의존 0.
 * 감사 로그 조회(읽기) 전용. P0 의 writer 와 분리한다(읽기/쓰기 책임 분리).
 * 조회는 항상 특정 사용자 범위로 제한된다(NFR-S-05).
 */
export interface AuditLogReaderPort {
  listByUserId(
    userId: string,
    logType?: AuditLogEntry["logType"],
  ): Promise<AuditLogEntry[]>;
}

export const AUDIT_LOG_READER = Symbol("AUDIT_LOG_READER");
