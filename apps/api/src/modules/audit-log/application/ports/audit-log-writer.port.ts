/**
 * 순수 application 포트 — Nest/Prisma 의존 0.
 * consent/verification/review use-case 가 감사 로그를 기록할 때 호출한다.
 */
export interface AuditLogWriteInput {
  userId?: string;
  contractReviewId?: string;
  logType: "CONSENT" | "VERIFICATION" | "REVIEW";
  payloadHash: string;
  mockTxHash?: string;
}

export interface AuditLogWriterPort {
  write(input: AuditLogWriteInput): Promise<void>;
}

export const AUDIT_LOG_WRITER = Symbol("AUDIT_LOG_WRITER");
