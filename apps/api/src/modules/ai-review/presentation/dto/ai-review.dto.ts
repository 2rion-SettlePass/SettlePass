import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const housingContractReviewSchema = z.object({
  userDid: z.string().min(1),
  housingPassId: z.string().min(1),
  ocrDocumentId: z.string().min(1),
  preferredLanguage: z.enum(["ko", "en", "zh", "vi"]),
});
export class HousingContractReviewDto extends createZodDto(
  housingContractReviewSchema,
) {}

export const confirmReviewSchema = z.object({
  userDid: z.string().min(1),
  confirmations: z.object({
    summaryChecked: z.boolean(),
    riskItemsChecked: z.boolean(),
    residenceWarningChecked: z.boolean(),
    legalDisclaimerAccepted: z.boolean(),
  }),
});
export class ConfirmReviewDto extends createZodDto(confirmReviewSchema) {}

/** 경로 파라미터(reviewId) 명시적 검증용 스키마. */
export const reviewIdParamSchema = z.string().min(1);
