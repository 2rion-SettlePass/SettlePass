import { Controller, NotImplementedException, Post } from "@nestjs/common";
import type { OcrContractResponse } from "@settlepass/api-contracts";

/**
 * Phase 1 명세 스텁. 라우트만 정의하고 use-case는 미구현.
 * 요청은 multipart/form-data (file + userId)이며, 파일 인터셉터와
 * CLOVA OCR adapter 연결은 구현 단계에서 추가한다.
 */
@Controller("contracts")
export class OcrController {
  @Post("ocr")
  extract(): OcrContractResponse {
    throw new NotImplementedException(
      "contracts/ocr: multipart 처리 및 CLOVA OCR adapter 미구현 (Phase 1 명세 단계)",
    );
  }
}
