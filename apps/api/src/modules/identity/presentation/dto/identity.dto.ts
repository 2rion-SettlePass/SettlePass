import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const authStartSchema = z.object({
  mode: z.enum(["CX_REAL_MODE", "CX_MOCK_MODE"]),
  credentialType: z.enum(["KOREAN_MOBILE_ID_REAL", "MOBILE_FOREIGNER_ID_MOCK"]),
});
export class IdentityAuthStartDto extends createZodDto(authStartSchema) {}

export const authCompleteSchema = z.object({
  authSessionId: z.string().min(1),
  mockProfile: z
    .enum(["DEFAULT_FOREIGNER_STUDENT", "DEFAULT_FOREIGNER_WORKER"])
    .optional(),
});
export class IdentityAuthCompleteDto extends createZodDto(authCompleteSchema) {}
