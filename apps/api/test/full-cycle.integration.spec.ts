import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { PrismaClient } from "@prisma/client";
import { DEMO_VERIFIER } from "@settlepass/shared";
import type {
  AuditLogResponse,
  ConfirmReviewResponse,
} from "@settlepass/api-contracts";
import { AppModule } from "../src/app.module";
import { assertNoForbiddenData } from "./privacy-guard";

/**
 * Phase 6 — 백엔드 한 싸이클 완주 통합 테스트(health 스펙 부트 패턴 — 전역 fetch/FormData).
 *
 * DEMO 유저 한 명으로 데모 12단계를 끝까지 실행한다:
 *  identity start→complete → housing pass 생성 → 검증 요청 생성
 *  → consent(true, 4 claims) → result === VERIFIED
 *  → OCR → ai-review 생성
 *  → confirm(부분 체크 1개 false) === 400 (reviewHash 미생성)
 *  → confirm(전부 true) === CONFIRMED + reviewHash + mockTxHash
 *  → confirm 재호출 === 동일 reviewHash (멱등)
 *  → GET /api/audit-logs?userDid=DEMO → CONSENT/VERIFICATION/REVIEW 3종 모두 존재
 *    (각 payloadHash + mockTxHash + storage 'DB_ONLY_PHASE1'), 금지 데이터 0.
 */
describe("Full cycle (integration)", () => {
  let app: INestApplication;
  let port: number;
  const userDid = "did:settlepass:user:mock-001";
  let createdUserId: string | null = null;

  beforeAll(async () => {
    process.env.DATABASE_URL ||=
      "postgresql://user:password@localhost:5432/settlepass_test?schema=public";
    process.env.IDENTITY_MODE ||= "CX_MOCK_MODE";
    process.env.CLOVA_OCR_MODE ||= "mock";
    process.env.AI_REVIEW_MODE ||= "mock";

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
    // 생성된 데모 row 정리(best-effort — 테스트 격리용). FK 순서 준수.
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
        }
        await prisma.auditLog.deleteMany({ where: { userId: createdUserId } });
        await prisma.contractReview.deleteMany({
          where: { userId: createdUserId },
        });
        if (requestIds.length > 0) {
          await prisma.verificationRequest.deleteMany({
            where: { id: { in: requestIds } },
          });
        }
        await prisma.ocrDocument.deleteMany({
          where: { userId: createdUserId },
        });
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

  it("runs the whole demo cycle: confirm is gated, idempotent, and audit-logs hold all 3 hash types", async () => {
    const base = `http://localhost:${port}/api`;

    async function postJson(path: string, body: unknown): Promise<Response> {
      return fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    // 1) identity start → complete (DEMO 유저 + 최신 IdentityClaim).
    const start = await (
      await postJson("/identity/auth/start", {
        mode: "CX_MOCK_MODE",
        credentialType: "MOBILE_FOREIGNER_ID_MOCK",
      })
    ).json();
    const complete = await (
      await postJson("/identity/auth/complete", {
        authSessionId: start.authSessionId,
        mockProfile: "DEFAULT_FOREIGNER_STUDENT",
      })
    ).json();
    createdUserId = complete.userId;
    expect(complete.userDid).toBe(userDid);

    // 2) Housing Pass 생성.
    const hpRes = await postJson("/housing-passes", { userDid });
    expect(hpRes.status).toBe(201);
    const housingPassId = (await hpRes.json()).housingPassId;
    expect(housingPassId).toBeTruthy();

    // 3) 검증 요청 생성.
    const requestedClaims = [
      "identityVerified",
      "ageOver19",
      "residenceValid",
      "regionLevel1",
    ];
    const created = await (
      await postJson("/verification-requests", {
        verifierId: DEMO_VERIFIER.verifierId,
        targetUserDid: userDid,
        purpose: "HOUSING_CONTRACT",
        requestedClaims,
      })
    ).json();
    const requestId = created.requestId;
    expect(requestId).toBeTruthy();

    // 4) 동의(true, 4 claims) → consentHash + mockTxHash.
    const consentRes = await postJson(
      `/verification-requests/${requestId}/consent`,
      { userDid, consent: true, consentedClaims: requestedClaims },
    );
    expect(consentRes.status).toBe(200);
    const consent = await consentRes.json();
    expect(consent.status).toBe("CONSENTED");
    expect(consent.consentHash).toMatch(/^0x/);

    // 5) result === VERIFIED (verificationHash 기록).
    const verified = await (
      await fetch(`${base}/verification-requests/${requestId}/result`)
    ).json();
    expect(verified.status).toBe("VERIFIED");
    expect(verified.verificationHash).toMatch(/^0x/);

    // 6) OCR → ocrDocumentId (fixture fallback).
    const form = new FormData();
    form.append("userDid", userDid);
    const ocrRes = await fetch(`${base}/contracts/ocr`, {
      method: "POST",
      body: form,
    });
    expect(ocrRes.status).toBe(200);
    const ocrDocumentId = (await ocrRes.json()).ocrDocumentId;
    expect(ocrDocumentId).toBeTruthy();

    // 7) AI 리뷰 생성.
    const reviewRes = await postJson("/ai-reviews/housing-contract", {
      userDid,
      housingPassId,
      ocrDocumentId,
      preferredLanguage: "ko",
    });
    expect([200, 201]).toContain(reviewRes.status);
    const reviewId = (await reviewRes.json()).reviewId;
    expect(reviewId).toBeTruthy();

    // 8) confirm — 부분 체크(1개 false) → 400, reviewHash 미생성.
    const partialRes = await postJson(`/ai-reviews/${reviewId}/confirm`, {
      userDid,
      confirmations: {
        summaryChecked: true,
        riskItemsChecked: true,
        residenceWarningChecked: true,
        legalDisclaimerAccepted: false,
      },
    });
    expect(partialRes.status).toBe(400);

    // 9) confirm — 전부 true → CONFIRMED + reviewHash + mockTxHash.
    const confirmRes = await postJson(`/ai-reviews/${reviewId}/confirm`, {
      userDid,
      confirmations: {
        summaryChecked: true,
        riskItemsChecked: true,
        residenceWarningChecked: true,
        legalDisclaimerAccepted: true,
      },
    });
    expect(confirmRes.status).toBe(200);
    const confirm: ConfirmReviewResponse = await confirmRes.json();
    expect(confirm.status).toBe("CONFIRMED");
    expect(confirm.reviewHash).toMatch(/^0x/);
    expect(confirm.mockTxHash).toContain("mocktx_review_");

    // 10) confirm 재호출 → 동일 reviewHash (멱등).
    const againRes = await postJson(`/ai-reviews/${reviewId}/confirm`, {
      userDid,
      confirmations: {
        summaryChecked: true,
        riskItemsChecked: true,
        residenceWarningChecked: true,
        legalDisclaimerAccepted: true,
      },
    });
    expect(againRes.status).toBe(200);
    const again: ConfirmReviewResponse = await againRes.json();
    expect(again.reviewHash).toBe(confirm.reviewHash);
    expect(again.mockTxHash).toBe(confirm.mockTxHash);

    // 11) GET /api/audit-logs?userDid=DEMO → CONSENT/VERIFICATION/REVIEW 3종 모두 존재.
    const auditRes = await fetch(
      `${base}/audit-logs?userDid=${encodeURIComponent(userDid)}`,
    );
    expect(auditRes.status).toBe(200);
    const audit: AuditLogResponse = await auditRes.json();

    const byType = new Map(audit.items.map((i) => [i.logType, i]));
    for (const logType of ["CONSENT", "VERIFICATION", "REVIEW"] as const) {
      const entry = byType.get(logType);
      expect(entry, `audit entry ${logType} present`).toBeTruthy();
      expect(entry?.payloadHash).toMatch(/^0x/);
      expect(entry?.mockTxHash).toBeTruthy();
      expect(entry?.storage).toBe("DB_ONLY_PHASE1");
    }

    // REVIEW 의 payloadHash 는 최종 reviewHash 와 일치한다(핵심 감사값).
    expect(byType.get("REVIEW")?.payloadHash).toBe(confirm.reviewHash);

    // 멱등 보장: REVIEW 감사 로그는 단 1건(재confirm 으로 중복 기록되지 않음).
    const reviewEntries = audit.items.filter((i) => i.logType === "REVIEW");
    expect(reviewEntries).toHaveLength(1);

    // 응답에 금지 데이터 0.
    expect(() => assertNoForbiddenData(audit)).not.toThrow();
  });
});
