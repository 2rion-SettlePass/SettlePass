import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { assertNoForbiddenData } from "./privacy-guard";

/**
 * Identity 슬라이스 통합 테스트 (health 스펙 부트 패턴 재사용 — supertest 미사용, 전역 fetch).
 * start → complete → GET /users/me 해피패스 + 금지 데이터 0 + invalid mode 400.
 */
describe("Identity (integration)", () => {
  let app: INestApplication;
  let port: number;
  let createdUserDid: string | null = null;

  beforeAll(async () => {
    process.env.DATABASE_URL ||=
      "postgresql://user:password@localhost:5432/settlepass_test?schema=public";
    process.env.IDENTITY_MODE ||= "CX_MOCK_MODE";
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ZodValidationPipe());
    await app.listen(0);
    const address = app.getHttpServer().address();
    port = typeof address === "object" && address ? address.port : 0;
  });

  afterAll(async () => {
    // 생성된 데모 row 정리(멱등 데모 유저지만 테스트 격리를 위해 best-effort 정리).
    if (createdUserDid) {
      const prisma = new PrismaClient();
      try {
        const user = await prisma.user.findUnique({
          where: { did: createdUserDid },
        });
        if (user) {
          await prisma.identityClaim.deleteMany({ where: { userId: user.id } });
          await prisma.identitySession.updateMany({
            where: { userId: user.id },
            data: { userId: null },
          });
          await prisma.user.delete({ where: { id: user.id } });
        }
      } catch {
        // 정리 실패는 데모/테스트 진행에 치명적이지 않다.
      } finally {
        await prisma.$disconnect();
      }
    }
    await app.close();
  });

  it("completes the full start → complete → GET /users/me flow with no forbidden data", async () => {
    const startRes = await fetch(`http://localhost:${port}/api/identity/auth/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "CX_MOCK_MODE",
        credentialType: "MOBILE_FOREIGNER_ID_MOCK",
      }),
    });
    expect(startRes.status).toBe(200);
    const start = await startRes.json();
    expect(start.authSessionId).toBeTruthy();
    expect(start.status).toBe("READY");

    const completeRes = await fetch(
      `http://localhost:${port}/api/identity/auth/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authSessionId: start.authSessionId,
          mockProfile: "DEFAULT_FOREIGNER_STUDENT",
        }),
      },
    );
    expect(completeRes.status).toBe(200);
    const complete = await completeRes.json();
    expect(complete.userId).toBeTruthy();
    expect(complete.userDid).toBeTruthy();
    expect(complete.claims.identityVerified).toBe(true);
    expect(() => assertNoForbiddenData(complete)).not.toThrow();
    createdUserDid = complete.userDid;

    const meRes = await fetch(
      `http://localhost:${port}/api/users/me?userDid=${encodeURIComponent(
        complete.userDid,
      )}`,
    );
    expect(meRes.status).toBe(200);
    const me = await meRes.json();
    expect(me.userId).toBe(complete.userId);
    expect(me.userDid).toBe(complete.userDid);
    expect(me.claims.userDid).toBe(complete.userDid);
    expect(me.claims.regionLevel1).toBe(complete.claims.regionLevel1);
    expect(() => assertNoForbiddenData(me)).not.toThrow();
  });

  it("rejects an invalid mode with 400", async () => {
    const res = await fetch(`http://localhost:${port}/api/identity/auth/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "NOT_A_MODE",
        credentialType: "MOBILE_FOREIGNER_ID_MOCK",
      }),
    });
    expect(res.status).toBe(400);
  });
});
