import { Body, Controller, HttpCode, Inject, Param, Post } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import type { ConsentToVerificationResponse } from "@settlepass/api-contracts";
import { ConsentToVerificationUseCase } from "../../application/use-cases/consent-to-verification.use-case";
import {
  ConsentToVerificationDto,
  requestIdParamSchema,
} from "../dto/consent.dto";

/** 라우트는 verification-requests 하위에 위치한다. */
@Controller("verification-requests")
export class ConsentController {
  constructor(
    @Inject(ConsentToVerificationUseCase)
    private readonly consentToVerification: ConsentToVerificationUseCase,
  ) {}

  // body/param 스키마를 명시적으로 지정한다(테스트의 esbuild 변환은 데코레이터 메타데이터를
  // 방출하지 않아 전역 ZodValidationPipe 의 metatype 추론이 동작하지 않으므로, DTO/스키마를
  // 파이프에 직접 전달해 prod/test 양쪽에서 동일하게 검증한다).
  @Post(":requestId/consent")
  @HttpCode(200)
  consent(
    @Param("requestId", new ZodValidationPipe(requestIdParamSchema))
    requestId: string,
    @Body(new ZodValidationPipe(ConsentToVerificationDto))
    body: ConsentToVerificationDto,
  ): Promise<ConsentToVerificationResponse> {
    return this.consentToVerification.execute({ ...body, requestId });
  }
}
