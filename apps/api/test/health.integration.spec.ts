import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "../src/app.module";

/**
 * Prisma 연결 + Nest 부트가 test DB 를 상대로 정상 동작함을 증명하는 스모크 테스트.
 * supertest 미사용 — Node 전역 fetch 로 실제 HTTP 요청을 보낸다.
 */
describe("Health (integration)", () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    process.env.DATABASE_URL ||=
      "postgresql://user:password@localhost:5432/settlepass_test?schema=public";
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ZodValidationPipe());
    await app.listen(0);
    const address = app.getHttpServer().address();
    port = typeof address === "object" && address ? address.port : 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/health returns 200 with status ok", async () => {
    const res = await fetch(`http://localhost:${port}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});
