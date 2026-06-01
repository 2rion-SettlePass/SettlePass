import {
  Body,
  Controller,
  NotImplementedException,
  Post,
} from "@nestjs/common";
import type {
  IdentityAuthCompleteResponse,
  IdentityAuthStartResponse,
} from "@settlepass/api-contracts";
import {
  IdentityAuthCompleteDto,
  IdentityAuthStartDto,
} from "../dto/identity.dto";

/**
 * Phase 1 명세 스텁. 라우트·DTO 검증만 정의하고 use-case는 미구현.
 */
@Controller("identity")
export class IdentityController {
  @Post("auth/start")
  startAuth(@Body() _body: IdentityAuthStartDto): IdentityAuthStartResponse {
    throw new NotImplementedException(
      "identity/auth/start: use-case 미구현 (Phase 1 명세 단계)",
    );
  }

  @Post("auth/complete")
  completeAuth(
    @Body() _body: IdentityAuthCompleteDto,
  ): IdentityAuthCompleteResponse {
    throw new NotImplementedException(
      "identity/auth/complete: use-case 미구현 (Phase 1 명세 단계)",
    );
  }
}
