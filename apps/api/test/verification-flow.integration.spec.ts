import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { PrismaClient } from "@prisma/client";
import { DEMO_VERIFIER } from "@settlepass/shared";
import { AppModule } from "../src/app.module";
import { assertNoForbiddenData } from "./privacy-guard";

/**
 * Phase 3 검증 플로우 통합 테스트(health 스펙 부트 패턴 — supertest 미사용, 전역 fetch).
 *
 * 전체 체인:
 *  identity start→complete(DEMO 유저) → housing pass 생성
 *  → 검증 요청 생성(targetUserDid=DEMO did)
 *  → 동의 전 result === PENDING (verificationHash 없음, VR-04 게이트)
 *  → consent(true, 4 claims) → consentHash + mockTxHash
 *  → result === VERIFIED (verifiedClaims = 공개 4 claim, hiddenClaims 포함, 해시 존재)
 *  → result/detail 양쪽에 금지 데이터 0 (assertNoForbiddenData)
 *  → consent 에 요청되지 않은 claim → 400
 */
describe("Verification flow (integration)", () => {
  let app: INestApplication;
  let port: number;
  const userDid = "did:settlepass:user:mock-001";
  let createdUserId: string | null = null;
  let createdRequestId: string | null = null;

  beforeAll(async () => {
    process.env.DATABASE_URL ||=
      "postgresql://user:password@localhost:5432/settlepass_test?schema=public";
    process.env.IDENTITY_MODE ||= "CX_MOCK_MODE";

    // 검증 요청은 Verifier FK 를 참조하므로 DEMO 임대인이 존재해야 한다(멱등 upsert).
    const prisma = new PrismaClient();
    try {
      await prisma.verifier.upsert({
        where: { id: DEMO_VERIFIER.verifierId },
        update: {
          name: DEMO_VERIFIER.name,
          type: DEMO_VERIFIER.type,
          did: DEMO_VERIFIER.did,
        },
        create: {
          id: DEMO_VERIFIER.verifierId,
          name: DEMO_VERIFIER.name,
          type: DEMO_VERIFIER.type,
          did: DEMO_VERIFIER.did,
        },
      });
    } finally {
      await prisma.$disconnect();
    }

    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ZodValidationPipe());
    await app.listen(0);
    const address = app.getHttpServer().address();
    port = typeof address === "object" && address ? address.port : 0;
  });

  afterAll(async () => {
    // 생성된 데모 row 정리(best-effort — 테스트 격리용).
    if (createdUserId) {
      const prisma = new PrismaClient();
      try {
        const requests = await prisma.verificationRequest.findMany({
          where: { targetUserId: createdUserId },
        });
        const requestIds = requests.map((r) => r.id);
        if (requestIds.length > 0) {
          await prisma.presentation.deleteMany({
            where: { requestId: { in: requestIds } },
          });
          await prisma.consent.deleteMany({
            where: { requestId: { in: requestIds } },
          });
          await prisma.verificationRequest.deleteMany({
            where: { id: { in: requestIds } },
          });
        }
        await prisma.auditLog.deleteMany({ where: { userId: createdUserId } });
        await prisma.housingPass.deleteMany({
          where: { userId: createdUserId },
        });
        await prisma.identityClaim.deleteMany({
          where: { userId: createdUserId },
        });
        await prisma.identitySession.updateMany({
          where: { userId: createdUserId },
          data: { userId: null },
        });
        await prisma.user.delete({ where: { id: createdUserId } });
      } catch {
        // 정리 실패는 데모/테스트 진행에 치명적이지 않다.
      } finally {
        await prisma.$disconnect();
      }
    }
    await app.close();
  });

  it("runs the full selective-disclosure chain with VR-04 gate and privacy guards", async () => {
    const base = `http://localhost:${port}/api`;

    // 1) 인증 완료로 DEMO 유저 + 최신 IdentityClaim 보장.
    const start = await (
      await fetch(`${base}/identity/auth/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "CX_MOCK_MODE",
          credentialType: "MOBILE_FOREIGNER_ID_MOCK",
        }),
      })
    ).json();

    const complete = await (
      await fetch(`${base}/identity/auth/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authSessionId: start.authSessionId,
          mockProfile: "DEFAULT_FOREIGNER_STUDENT",
        }),
      })
    ).json();
    createdUserId = complete.userId;
    expect(complete.userDid).toBe(userDid);

    // 2) Housing Pass 생성.
    const hpRes = await fetch(`${base}/housing-passes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userDid }),
    });
    expect(hpRes.status).toBe(201);

    // 3) 검증 요청 생성.
    const requestedClaims = [
      "identityVerified",
      "ageOver19",
      "residenceValid",
      "regionLevel1",
    ];
    const createRes = await fetch(`${base}/verification-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verifierId: DEMO_VERIFIER.verifierId,
        targetUserDid: userDid,
        purpose: "HOUSING_CONTRACT",
        requestedClaims,
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    createdRequestId = created.requestId;
    expect(created.requestId).toBeTruthy();
    expect(created.status).toBe("CREATED");
    expect(created.consentUrl).toBe(`/consent/${created.requestId}`);

    // 3b) detail (동의 화면용) — verifierName + hiddenClaims, 금지 데이터 0.
    const detailRes = await fetch(
      `${base}/verification-requests/${created.requestId}`,
    );
    expect(detailRes.status).toBe(200);
    const detail = await detailRes.json();
    expect(detail.verifierName).toBe(DEMO_VERIFIER.name);
    expect(detail.requestedClaims).toEqual(requestedClaims);
    expect(detail.hiddenClaims).toContain("nationality");
    expect(detail.hiddenClaims).toContain("alienRegistrationNumber");
    expect(() => assertNoForbiddenData(detail)).not.toThrow();

    // 4) VR-04 게이트: 동의 전 result === PENDING (해시 없음).
    const pendingRes = await fetch(
      `${base}/verification-requests/${created.requestId}/result`,
    );
    expect(pendingRes.status).toBe(200);
    const pending = await pendingRes.json();
    expect(pending.status).toBe("PENDING");
    expect(pending.verifiedClaims).toEqual({});
    expect(pending.verificationHash).toBeUndefined();
    expect(pending.mockTxHash).toBeUndefined();
    expect(pending.hiddenClaims).toContain("nationality");

    // 5) 동의(true, 4 claims) → consentHash + mockTxHash.
    const consentRes = await fetch(
      `${base}/verification-requests/${created.requestId}/consent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userDid,
          consent: true,
          consentedClaims: requestedClaims,
        }),
      },
    );
    expect(consentRes.status).toBe(200);
    const consent = await consentRes.json();
    expect(consent.status).toBe("CONSENTED");
    expect(consent.consentHash).toMatch(/^0x/);
    expect(consent.mockTxHash).toContain("mocktx_consent_");

    // 6) result === VERIFIED, verifiedClaims = 공개 4 claim, 해시 존재, 금지 데이터 0.
    const verifiedRes = await fetch(
      `${base}/verification-requests/${created.requestId}/result`,
    );
    expect(verifiedRes.status).toBe(200);
    const verified = await verifiedRes.json();
    expect(verified.status).toBe("VERIFIED");
    expect(verified.verifiedClaims).toEqual({
      identityVerified: true,
      ageOver19: true,
      residenceValid: true,
      regionLevel1: "Seoul",
    });
    expect(verified.hiddenClaims).toContain("nationality");
    expect(verified.verificationHash).toMatch(/^0x/);
    expect(verified.mockTxHash).toContain("mocktx_verification_");
    expect(() => assertNoForbiddenData(verified)).not.toThrow();

    // 6b) 멱등: 다시 조회해도 같은 verificationHash.
    const verifiedAgain = await (
      await fetch(`${base}/verification-requests/${created.requestId}/result`)
    ).json();
    expect(verifiedAgain.verificationHash).toBe(verified.verificationHash);
    expect(verifiedAgain.mockTxHash).toBe(verified.mockTxHash);
  });

  it("rejects consent with a claim not in requestedClaims (400)", async () => {
    const base = `http://localhost:${port}/api`;

    // 새 요청을 만들고(requestedClaims = 2개), 범위를 벗어난 claim 으로 동의 시도.
    const created = await (
      await fetch(`${base}/verification-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifierId: DEMO_VERIFIER.verifierId,
          targetUserDid: userDid,
          purpose: "HOUSING_CONTRACT",
          requestedClaims: ["identityVerified", "ageOver19"],
        }),
      })
    ).json();

    const res = await fetch(
      `${base}/verification-requests/${created.requestId}/consent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userDid,
          consent: true,
          consentedClaims: ["identityVerified", "residenceValid"],
        }),
      },
    );
    expect(res.status).toBe(400);
  });
});
