import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Param,
  Post,
} from "@nestjs/common";
import type {
  CreateVerificationRequestResponse,
  VerificationResultResponse,
} from "@settlepass/api-contracts";
import { CreateVerificationRequestDto } from "../dto/verification-request.dto";

/**
 * Phase 1 명세 스텁. 라우트·DTO 검증만 정의하고 use-case는 미구현.
 */
@Controller("verification-requests")
export class VerificationRequestController {
  @Post()
  create(
    @Body() _body: CreateVerificationRequestDto,
  ): CreateVerificationRequestResponse {
    throw new NotImplementedException(
      "verification-requests: use-case 미구현 (Phase 1 명세 단계)",
    );
  }

  @Get(":requestId/result")
  result(@Param("requestId") _requestId: string): VerificationResultResponse {
    throw new NotImplementedException(
      "verification-requests/:requestId/result: use-case 미구현 (Phase 1 명세 단계)",
    );
  }
}
