import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
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
