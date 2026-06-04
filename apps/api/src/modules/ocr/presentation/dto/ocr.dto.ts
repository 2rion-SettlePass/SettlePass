import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * multipart/form-data 의 텍스트 필드 검증 스키마.
 * 파일(file)은 FileInterceptor 가 다루고 컨트롤러에서 수동 검증한다(metadata 파이프 미사용).
 */
export const ocrContractSchema = z.object({
  userDid: z.string().min(1),
  manualText: z.string().optional(),
});
export class OcrContractDto extends createZodDto(ocrContractSchema) {}
