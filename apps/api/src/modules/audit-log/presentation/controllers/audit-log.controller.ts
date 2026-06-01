import {
  Controller,
  Get,
  NotImplementedException,
  Query,
} from "@nestjs/common";
import type { AuditLogResponse } from "@settlepass/api-contracts";
import { AuditLogQueryDto } from "../dto/audit-log.dto";

/**
 * Phase 1 명세 스텁. 라우트·쿼리 검증만 정의하고 use-case는 미구현.
 */
@Controller("audit-logs")
export class AuditLogController {
  @Get()
  list(@Query() _query: AuditLogQueryDto): AuditLogResponse {
    throw new NotImplementedException(
      "audit-logs: use-case 미구현 (Phase 1 명세 단계)",
    );
  }
}
