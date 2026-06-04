import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UsersModule } from "../users/users.module";
import {
  IDENTITY_CLAIM_REPOSITORY,
  IDENTITY_SESSION_REPOSITORY,
} from "./domain/identity.repository.port";
import { FOREIGNER_CLAIM_MOCK } from "./application/ports/foreigner-claim-mock.port";
import { MOBILE_IDENTITY_PROVIDER } from "./application/ports/mobile-identity-provider.port";
import { StartAuthUseCase } from "./application/use-cases/start-auth.use-case";
import { CompleteAuthUseCase } from "./application/use-cases/complete-auth.use-case";
import { MockCxIdentityAdapter } from "./infrastructure/adapters/mock-cx-identity.adapter";
import { RealCxIdentityAdapter } from "./infrastructure/adapters/real-cx-identity.adapter";
import { ForeignerClaimMockAdapter } from "./infrastructure/adapters/foreigner-claim-mock.adapter";
import { PrismaIdentitySessionRepository } from "./infrastructure/repositories/prisma-identity-session.repository";
import { PrismaIdentityClaimRepository } from "./infrastructure/repositories/prisma-identity-claim.repository";
import { IdentityController } from "./presentation/controllers/identity.controller";

/**
 * Identity 모듈.
 * provider 포트는 IDENTITY_MODE env 로 mock↔real 어댑터를 고르는 factory 로 바인딩한다
 * (이후 슬라이스가 재사용하는 mode-factory 패턴 — IMPLEMENTATION_PLAN §P0 어댑터 모드 factory).
 */
@Module({
  imports: [UsersModule],
  controllers: [IdentityController],
  providers: [
    StartAuthUseCase,
    CompleteAuthUseCase,
    MockCxIdentityAdapter,
    RealCxIdentityAdapter,
    ForeignerClaimMockAdapter,
    {
      provide: MOBILE_IDENTITY_PROVIDER,
      useFactory: (
        config: ConfigService,
        mock: MockCxIdentityAdapter,
        real: RealCxIdentityAdapter,
      ) => (config.get("IDENTITY_MODE") === "CX_REAL_MODE" ? real : mock),
      inject: [ConfigService, MockCxIdentityAdapter, RealCxIdentityAdapter],
    },
    { provide: FOREIGNER_CLAIM_MOCK, useClass: ForeignerClaimMockAdapter },
    {
      provide: IDENTITY_SESSION_REPOSITORY,
      useClass: PrismaIdentitySessionRepository,
    },
    {
      provide: IDENTITY_CLAIM_REPOSITORY,
      useClass: PrismaIdentityClaimRepository,
    },
  ],
})
export class IdentityModule {}
