import { Module } from "@nestjs/common";
import { AuditLogController } from "./presentation/controllers/audit-log.controller";

// 담당자는 controllers / providers 에 이 모듈의 use-case·controller·adapter를 등록한다.
@Module({
  controllers: [AuditLogController],
  providers: [],
  exports: [],
})
export class AuditLogModule {}
