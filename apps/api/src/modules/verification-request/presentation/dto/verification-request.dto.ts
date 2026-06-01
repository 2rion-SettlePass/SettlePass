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
  targetUserId: z.string().min(1),
  purpose: z.literal("HOUSING_CONTRACT"),
  requestedClaims: z.array(housingClaimKeySchema).min(1),
});
export class CreateVerificationRequestDto extends createZodDto(
  createVerificationRequestSchema,
) {}
