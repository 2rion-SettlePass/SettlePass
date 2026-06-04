import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AuditLogEntry,
  AuditLogResponse,
} from "@settlepass/api-contracts";
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import {
  AUDIT_LOG_READER,
  type AuditLogReaderPort,
} from "../ports/audit-log-reader.port";

export interface ListAuditLogsInput {
  userDid: string;
  logType?: AuditLogEntry["logType"];
}

/**
 * GET /audit-logs — 사용자 본인의 감사 로그 목록(NFR-S-05).
 *  1. userDid → User resolve (없으면 404)
 *  2. 해당 user 의 로그만 조회(logType 옵션 필터). 다른 사용자의 로그는 절대 노출하지 않는다.
 */
@Injectable()
export class ListAuditLogsUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(AUDIT_LOG_READER)
    private readonly auditLogs: AuditLogReaderPort,
  ) {}

  async execute(input: ListAuditLogsInput): Promise<AuditLogResponse> {
    const user = await this.users.findByDid(input.userDid);
    if (!user) {
      throw new NotFoundException(`user not found: ${input.userDid}`);
    }

    const items = await this.auditLogs.listByUserId(user.id, input.logType);
    return { items };
  }
}
