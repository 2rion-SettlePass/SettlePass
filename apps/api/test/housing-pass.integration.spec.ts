import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { assertNoForbiddenData } from "./privacy-guard";

/**
 * Housing Pass 슬라이스 통합 테스트 (health 스펙 부트 패턴 재사용 — supertest 미사용, 전역 fetch).
 * 선행: identity start→complete 로 DEMO 유저+claim 보장.
 * 본문: POST /api/housing-passes → 201 + credentialSubject 공개 claim 만 + 금지 데이터 0,
 *       GET /api/housing-passes/:id → 200 동일 credential.
 */
describe("Housing Pass (integration)", () => {
  let app: INestApplication;
  let port: number;
  const userDid = "did:settlepass:user:mock-001";
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
    // 생성된 데모 row 정리(best-effort — 테스트 격리용).
    if (createdUserDid) {
      const prisma = new PrismaClient();
      try {
        const user = await prisma.user.findUnique({
          where: { did: createdUserDid },
        });
        if (user) {
          await prisma.housingPass.deleteMany({ where: { userId: user.id } });
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

  it("creates a Housing Pass and reads it back with only public claims", async () => {
    // 선행: 인증 완료로 DEMO 유저 + 최신 IdentityClaim 보장.
    const startRes = await fetch(
      `http://localhost:${port}/api/identity/auth/start`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "CX_MOCK_MODE",
          credentialType: "MOBILE_FOREIGNER_ID_MOCK",
        }),
      },
    );
    expect(startRes.status).toBe(200);
    const start = await startRes.json();

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
    createdUserDid = complete.userDid;
    expect(complete.userDid).toBe(userDid);

    // POST /api/housing-passes
    const createRes = await fetch(
      `http://localhost:${port}/api/housing-passes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userDid }),
      },
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.housingPassId).toBeTruthy();
    expect(created.status).toBe("ACTIVE");
    expect(created.credential.credentialSubject.id).toBe(userDid);
    expect(created.credential.type).toEqual([
      "VerifiableCredential",
      "HousingPassCredential",
    ]);

    // credentialSubject 는 공개 claim + id 만 담아야 한다.
    const allowedSubjectKeys = [
      "id",
      "identityVerified",
      "ageOver19",
      "residenceValid",
      "regionLevel1",
      "residenceExpiryMonth",
    ];
    for (const key of Object.keys(created.credential.credentialSubject)) {
      expect(allowedSubjectKeys).toContain(key);
    }
    expect(() => assertNoForbiddenData(created)).not.toThrow();

    // GET /api/housing-passes/:id → 동일 credential.
    const getRes = await fetch(
      `http://localhost:${port}/api/housing-passes/${created.housingPassId}`,
    );
    expect(getRes.status).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.housingPassId).toBe(created.housingPassId);
    expect(fetched.status).toBe("ACTIVE");
    expect(fetched.credential).toEqual(created.credential);
    expect(() => assertNoForbiddenData(fetched)).not.toThrow();
  });
});
