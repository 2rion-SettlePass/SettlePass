import { Body, Controller, HttpCode, Inject, Post } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import type {
  IdentityAuthCompleteResponse,
  IdentityAuthStartResponse,
} from "@settlepass/api-contracts";
import { StartAuthUseCase } from "../../application/use-cases/start-auth.use-case";
import { CompleteAuthUseCase } from "../../application/use-cases/complete-auth.use-case";
import {
  IdentityAuthCompleteDto,
  IdentityAuthStartDto,
} from "../dto/identity.dto";

@Controller("identity")
export class IdentityController {
  constructor(
    @Inject(StartAuthUseCase) private readonly startAuth: StartAuthUseCase,
    @Inject(CompleteAuthUseCase)
    private readonly completeAuth: CompleteAuthUseCase,
  ) {}

  // body 스키마를 명시적으로 지정한다(테스트의 esbuild 변환은 데코레이터 메타데이터를
  // 방출하지 않아 전역 ZodValidationPipe 의 metatype 추론이 동작하지 않으므로, DTO 를
  // 파이프에 직접 전달해 prod/test 양쪽에서 동일하게 검증한다).
  @Post("auth/start")
  @HttpCode(200)
  start(
    @Body(new ZodValidationPipe(IdentityAuthStartDto))
    body: IdentityAuthStartDto,
  ): Promise<IdentityAuthStartResponse> {
    return this.startAuth.execute(body);
  }

  @Post("auth/complete")
  @HttpCode(200)
  complete(
    @Body(new ZodValidationPipe(IdentityAuthCompleteDto))
    body: IdentityAuthCompleteDto,
  ): Promise<IdentityAuthCompleteResponse> {
    return this.completeAuth.execute(body);
  }
}
