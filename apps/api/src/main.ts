import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors();
  // 모든 DTO(createZodDto 기반)를 전역에서 zod로 검증한다.
  app.useGlobalPipes(new ZodValidationPipe());

  const config = app.get(ConfigService);
  const port = config.get<number>("PORT") ?? 4000;
  await app.listen(port);
  console.log(`[settlepass-api] listening on http://localhost:${port}/api`);
}

void bootstrap();
