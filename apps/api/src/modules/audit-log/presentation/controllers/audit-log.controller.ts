import { Controller, Get, Inject, Query } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import type { AuditLogResponse } from "@settlepass/api-contracts";
import { ListAuditLogsUseCase } from "../../application/use-cases/list-audit-logs.use-case";
import { AuditLogQueryDto } from "../dto/audit-log.dto";

@Controller("audit-logs")
export class AuditLogController {
  constructor(
    @Inject(ListAuditLogsUseCase)
    private readonly listAuditLogs: ListAuditLogsUseCase,
  ) {}

  // query 스키마를 파이프에 직접 전달한다(다른 핸들러와 동일 — esbuild 메타데이터 부재 대응).
  @Get()
  list(
    @Query(new ZodValidationPipe(AuditLogQueryDto))
    query: AuditLogQueryDto,
  ): Promise<AuditLogResponse> {
    return this.listAuditLogs.execute({
      userDid: query.userDid,
      logType: query.logType,
    });
  }
}
