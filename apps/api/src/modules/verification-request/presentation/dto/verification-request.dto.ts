import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const housingClaimKeySchema = z.enum([
  "identityVerified",
  "ageOver19",
  "residenceValid",
  "regionLevel1",
  "residenceExpiryMonth",
]);

export const createVerificationRequestSchema = z.object({
  verifierId: z.string().min(1),
  targetUserDid: z.string().min(1),
  purpose: z.literal("HOUSING_CONTRACT"),
  requestedClaims: z.array(housingClaimKeySchema).min(1),
});
export class CreateVerificationRequestDto extends createZodDto(
  createVerificationRequestSchema,
) {}

/** 경로 파라미터(requestId) 명시적 검증용 스키마. */
export const requestIdParamSchema = z.string().min(1);
