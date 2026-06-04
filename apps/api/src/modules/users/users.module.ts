import { Module } from "@nestjs/common";
import { IDENTITY_CLAIM_REPOSITORY } from "../identity/domain/identity.repository.port";
import { PrismaIdentityClaimRepository } from "../identity/infrastructure/repositories/prisma-identity-claim.repository";
import { USER_REPOSITORY } from "./domain/user.repository.port";
import { PrismaUserRepository } from "./infrastructure/prisma-user.repository";
import { GetMeUseCase } from "./application/use-cases/get-me.use-case";
import { UsersController } from "./presentation/controllers/users.controller";

/**
 * Users 모듈.
 * GetMe 는 최신 IdentityClaim 을 읽어야 하므로 동일한 Prisma claim 어댑터 클래스를
 * 직접 바인딩한다(클래스 import — IdentityModule↔UsersModule 순환 모듈 의존을 피한다).
 */
@Module({
  controllers: [UsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    {
      provide: IDENTITY_CLAIM_REPOSITORY,
      useClass: PrismaIdentityClaimRepository,
    },
    GetMeUseCase,
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
