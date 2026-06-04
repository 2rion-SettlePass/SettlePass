import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import type { CreateHousingPassResponse } from "@settlepass/api-contracts";
import { CreateHousingPassUseCase } from "../../application/use-cases/create-housing-pass.use-case";
import { GetHousingPassUseCase } from "../../application/use-cases/get-housing-pass.use-case";
import { CreateHousingPassDto } from "../dto/housing-pass.dto";

@Controller("housing-passes")
export class HousingPassController {
  constructor(
    @Inject(CreateHousingPassUseCase)
    private readonly createHousingPass: CreateHousingPassUseCase,
    @Inject(GetHousingPassUseCase)
    private readonly getHousingPass: GetHousingPassUseCase,
  ) {}

  // body 스키마를 명시적으로 지정한다(테스트의 esbuild 변환은 데코레이터 메타데이터를
  // 방출하지 않아 전역 ZodValidationPipe 의 metatype 추론이 동작하지 않으므로, DTO 를
  // 파이프에 직접 전달해 prod/test 양쪽에서 동일하게 검증한다).
  @Post()
  create(
    @Body(new ZodValidationPipe(CreateHousingPassDto))
    body: CreateHousingPassDto,
  ): Promise<CreateHousingPassResponse> {
    return this.createHousingPass.execute(body);
  }

  @Get(":id")
  get(@Param("id") id: string): Promise<CreateHousingPassResponse> {
    return this.getHousingPass.execute(id);
  }
}
