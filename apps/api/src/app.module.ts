import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { validateEnv } from "./config/env.validation";
import { PrismaModule } from "./infra/prisma/prisma.module";
import { HashModule } from "./infra/hash/hash.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { UsersModule } from "./modules/users/users.module";
import { HousingPassModule } from "./modules/housing-pass/housing-pass.module";
import { VerificationRequestModule } from "./modules/verification-request/verification-request.module";
import { ConsentModule } from "./modules/consent/consent.module";
import { PresentationModule } from "./modules/presentation/presentation.module";
import { OcrModule } from "./modules/ocr/ocr.module";
import { AiReviewModule } from "./modules/ai-review/ai-review.module";
import { AuditLogModule } from "./modules/audit-log/audit-log.module";
import { FilesModule } from "./modules/files/files.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // cwd=apps/api. 우선 apps/api/.env(있으면), 없으면 모노레포 루트 .env.
      envFilePath: [".env", "../../.env"],
      validate: validateEnv,
    }),
    PrismaModule,
    HashModule,
    IdentityModule,
    UsersModule,
    HousingPassModule,
    VerificationRequestModule,
    ConsentModule,
    PresentationModule,
    OcrModule,
    AiReviewModule,
    AuditLogModule,
    FilesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
