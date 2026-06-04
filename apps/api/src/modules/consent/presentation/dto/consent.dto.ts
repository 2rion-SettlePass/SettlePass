import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const housingClaimKeySchema = z.enum([
  "identityVerified",
  "ageOver19",
  "residenceValid",
  "regionLevel1",
  "residenceExpiryMonth",
]);

export const consentToVerificationSchema = z.object({
  userDid: z.string().min(1),
  consent: z.boolean(),
  consentedClaims: z.array(housingClaimKeySchema),
});
export class ConsentToVerificationDto extends createZodDto(
  consentToVerificationSchema,
) {}

/** 경로 파라미터(requestId) 명시적 검증용 스키마. */
export const requestIdParamSchema = z.string().min(1);
