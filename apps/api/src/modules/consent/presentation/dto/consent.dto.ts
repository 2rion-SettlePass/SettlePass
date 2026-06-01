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
  userId: z.string().min(1),
  consent: z.boolean(),
  consentedClaims: z.array(housingClaimKeySchema),
});
export class ConsentToVerificationDto extends createZodDto(
  consentToVerificationSchema,
) {}
