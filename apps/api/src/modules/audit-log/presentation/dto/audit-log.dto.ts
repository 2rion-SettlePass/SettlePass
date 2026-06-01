import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const auditLogQuerySchema = z.object({
  userId: z.string().min(1),
  logType: z.enum(["CONSENT", "VERIFICATION", "REVIEW"]).optional(),
});
export class AuditLogQueryDto extends createZodDto(auditLogQuerySchema) {}
