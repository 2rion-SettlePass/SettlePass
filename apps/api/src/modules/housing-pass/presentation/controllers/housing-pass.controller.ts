import {
  Body,
  Controller,
  NotImplementedException,
  Post,
} from "@nestjs/common";
import type { CreateHousingPassResponse } from "@settlepass/api-contracts";
import { CreateHousingPassDto } from "../dto/housing-pass.dto";

/**
 * Phase 1 명세 스텁. 라우트·DTO 검증만 정의하고 use-case는 미구현.
 */
@Controller("housing-passes")
export class HousingPassController {
  @Post()
  create(@Body() _body: CreateHousingPassDto): CreateHousingPassResponse {
    throw new NotImplementedException(
      "housing-passes: use-case 미구현 (Phase 1 명세 단계)",
    );
  }
}
