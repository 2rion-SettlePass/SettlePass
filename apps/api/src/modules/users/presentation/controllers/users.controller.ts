import { Controller, Get, Inject, Query } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import type { UserMeResponse } from "@settlepass/api-contracts";
import { GetMeUseCase } from "../../application/use-cases/get-me.use-case";
import { UsersMeQueryDto } from "../dto/users.dto";

@Controller("users")
export class UsersController {
  constructor(@Inject(GetMeUseCase) private readonly getMe: GetMeUseCase) {}

  // query 스키마를 파이프에 직접 전달해 metatype 추론 없이 검증한다(identity.controller 참조).
  @Get("me")
  me(
    @Query(new ZodValidationPipe(UsersMeQueryDto)) query: UsersMeQueryDto,
  ): Promise<UserMeResponse> {
    return this.getMe.execute(query.userDid);
  }
}
