import {
  Body,
  Controller,
  NotImplementedException,
  Param,
  Post,
} from "@nestjs/common";
import type { ConsentToVerificationResponse } from "@settlepass/api-contracts";
import { ConsentToVerificationDto } from "../dto/consent.dto";

/**
 * Phase 1 명세 스텁. 라우트·DTO 검증만 정의하고 use-case는 미구현.
 * 라우트는 verification-requests 하위에 위치한다.
 */
@Controller("verification-requests")
export class ConsentController {
  @Post(":requestId/consent")
  consent(
    @Param("requestId") _requestId: string,
    @Body() _body: ConsentToVerificationDto,
  ): ConsentToVerificationResponse {
    throw new NotImplementedException(
      "verification-requests/:requestId/consent: use-case 미구현 (Phase 1 명세 단계)",
    );
  }
}
