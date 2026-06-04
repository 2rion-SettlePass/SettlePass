import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import type {
  CreateVerificationRequestResponse,
  VerificationRequestDetailResponse,
  VerificationResultResponse,
} from "@settlepass/api-contracts";
import { CreateVerificationRequestUseCase } from "../../application/use-cases/create-verification-request.use-case";
import { GetVerificationRequestUseCase } from "../../application/use-cases/get-verification-request.use-case";
import { GetVerificationResultUseCase } from "../../application/use-cases/get-verification-result.use-case";
import {
  CreateVerificationRequestDto,
  requestIdParamSchema,
} from "../dto/verification-request.dto";

@Controller("verification-requests")
export class VerificationRequestController {
  constructor(
    @Inject(CreateVerificationRequestUseCase)
    private readonly createRequest: CreateVerificationRequestUseCase,
    @Inject(GetVerificationRequestUseCase)
    private readonly getRequest: GetVerificationRequestUseCase,
    @Inject(GetVerificationResultUseCase)
    private readonly getResult: GetVerificationResultUseCase,
  ) {}

  // body/param 스키마를 명시적으로 지정한다(테스트의 esbuild 변환은 데코레이터 메타데이터를
  // 방출하지 않아 전역 ZodValidationPipe 의 metatype 추론이 동작하지 않으므로, DTO/스키마를
  // 파이프에 직접 전달해 prod/test 양쪽에서 동일하게 검증한다).
  @Post()
  create(
    @Body(new ZodValidationPipe(CreateVerificationRequestDto))
    body: CreateVerificationRequestDto,
  ): Promise<CreateVerificationRequestResponse> {
    return this.createRequest.execute(body);
  }

  @Get(":requestId")
  detail(
    @Param("requestId", new ZodValidationPipe(requestIdParamSchema))
    requestId: string,
  ): Promise<VerificationRequestDetailResponse> {
    return this.getRequest.execute(requestId);
  }

  @Get(":requestId/result")
  result(
    @Param("requestId", new ZodValidationPipe(requestIdParamSchema))
    requestId: string,
  ): Promise<VerificationResultResponse> {
    return this.getResult.execute(requestId);
  }
}
