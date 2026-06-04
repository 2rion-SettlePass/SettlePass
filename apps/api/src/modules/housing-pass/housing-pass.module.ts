import { Module } from "@nestjs/common";
import { IDENTITY_CLAIM_REPOSITORY } from "../identity/domain/identity.repository.port";
import { PrismaIdentityClaimRepository } from "../identity/infrastructure/repositories/prisma-identity-claim.repository";
import { UsersModule } from "../users/users.module";
import { HOUSING_PASS_REPOSITORY } from "./domain/housing-pass.repository.port";
import { PrismaHousingPassRepository } from "./infrastructure/repositories/prisma-housing-pass.repository";
import { CreateHousingPassUseCase } from "./application/use-cases/create-housing-pass.use-case";
import { GetHousingPassUseCase } from "./application/use-cases/get-housing-pass.use-case";
import { HousingPassController } from "./presentation/controllers/housing-pass.controller";

/**
 * Housing Pass 모듈.
 * USER_REPOSITORY 는 UsersModule 에서 가져오고(import),
 * 최신 IdentityClaim 조회는 동일한 Prisma claim 어댑터 클래스를 직접 바인딩한다
 * (클래스 import — IdentityModule 순환 모듈 의존을 피한다; users.module.ts 와 동일 방식).
 */
@Module({
  imports: [UsersModule],
  controllers: [HousingPassController],
  providers: [
    { provide: HOUSING_PASS_REPOSITORY, useClass: PrismaHousingPassRepository },
    {
      provide: IDENTITY_CLAIM_REPOSITORY,
      useClass: PrismaIdentityClaimRepository,
    },
    CreateHousingPassUseCase,
    GetHousingPassUseCase,
  ],
})
export class HousingPassModule {}
