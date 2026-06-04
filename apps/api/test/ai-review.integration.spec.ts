import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { assertNoForbiddenData } from "./privacy-guard";

/**
 * Phase 5 AI Review 슬라이스 통합 테스트(health 스펙 부트 패턴 — supertest 미사용, 전역 fetch/FormData/Blob).
 *
 *  선행 체인: identity start→complete (DEMO 유저) → POST /api/housing-passes (housingPassId 확보)
 *            → POST /api/contracts/ocr (ocrDocumentId 확보)
 *  본문: POST /api/ai-reviews/housing-contract { userDid, housingPassId, ocrDocumentId, preferredLanguage }
 *        → 200/201 with summary, riskItems.length>=1, residencePeriodCheck.status==='WARNING'
 *          (housing pass residenceExpiryMonth 2026-12 < 계약 종료 2027-07), translatedSummary.ko/.en, disclaimer 비어있지 않음,
 *          금지 데이터 0.
 *  조회: GET /api/ai-reviews/:reviewId → 동일.
 */
describe("AI Review (integration)", () => {
  let app: INestApplication;
  let port: number;
  const userDid = "did:settlepass:user:mock-001";
  let createdUserDid: string | null = null;

  beforeAll(async () => {
    process.env.DATABASE_URL ||=
      "postgresql://user:password@localhost:5432/settlepass_test?schema=public";
    process.env.IDENTITY_MODE ||= "CX_MOCK_MODE";
    process.env.CLOVA_OCR_MODE ||= "mock";
    process.env.AI_REVIEW_MODE ||= "mock";
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ZodValidationPipe());
    await app.listen(0);
    const address = app.getHttpServer().address();
    port = typeof address === "object" && address ? address.port : 0;
  });

  afterAll(async () => {
    // 생성된 데모 row 정리(best-effort — 테스트 격리용). FK 순서: review → ocr/housingPass → claim → user.
    if (createdUserDid) {
      const prisma = new PrismaClient();
      try {
        const user = await prisma.user.findUnique({
          where: { did: createdUserDid },
        });
        if (user) {
          await prisma.auditLog.deleteMany({ where: { userId: user.id } });
          await prisma.contractReview.deleteMany({
            where: { userId: user.id },
          });
          await prisma.ocrDocument.deleteMany({ where: { userId: user.id } });
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

  function url(path: string): string {
    return `http://localhost:${port}${path}`;
  }

  async function postJson(path: string, body: unknown): Promise<Response> {
    return fetch(url(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("runs the full chain and returns a WARNING review, then reads it back", async () => {
    // 1) identity start → complete (DEMO 유저 + 최신 IdentityClaim 확립).
    const startRes = await postJson("/api/identity/auth/start", {
      mode: "CX_MOCK_MODE",
      credentialType: "MOBILE_FOREIGNER_ID_MOCK",
    });
    expect(startRes.status).toBe(200);
    const start = await startRes.json();

    const completeRes = await postJson("/api/identity/auth/complete", {
      authSessionId: start.authSessionId,
      mockProfile: "DEFAULT_FOREIGNER_STUDENT",
    });
    expect(completeRes.status).toBe(200);
    const complete = await completeRes.json();
    createdUserDid = complete.userDid;
    expect(complete.userDid).toBe(userDid);

    // 2) housing pass 생성 → housingPassId 확보(credential.residenceExpiryMonth=2026-12).
    const hpRes = await postJson("/api/housing-passes", { userDid });
    expect(hpRes.status).toBe(201);
    const hp = await hpRes.json();
    const housingPassId = hp.housingPassId;
    expect(housingPassId).toBeTruthy();
    expect(hp.credential.credentialSubject.residenceExpiryMonth).toBe("2026-12");

    // 3) OCR → ocrDocumentId 확보(fixture fallback 으로 진행).
    const form = new FormData();
    form.append("userDid", userDid);
    const ocrRes = await fetch(url("/api/contracts/ocr"), {
      method: "POST",
      body: form,
    });
    expect(ocrRes.status).toBe(200);
    const ocr = await ocrRes.json();
    const ocrDocumentId = ocr.ocrDocumentId;
    expect(ocrDocumentId).toBeTruthy();

    // 4) AI 리뷰 생성.
    const reviewRes = await postJson("/api/ai-reviews/housing-contract", {
      userDid,
      housingPassId,
      ocrDocumentId,
      preferredLanguage: "ko",
    });
    expect([200, 201]).toContain(reviewRes.status);
    const review = await reviewRes.json();

    expect(review.reviewId).toBeTruthy();
    expect(review.summary).toBeTruthy();
    expect(Array.isArray(review.riskItems)).toBe(true);
    expect(review.riskItems.length).toBeGreaterThanOrEqual(1);
    // 핵심 차별점: housing pass 만료(2026-12) < 계약 종료(2027-07) → WARNING.
    expect(review.residencePeriodCheck.status).toBe("WARNING");
    expect(review.residencePeriodCheck.residenceExpiryMonth).toBe("2026-12");
    expect(review.residencePeriodCheck.contractEndMonth).toBe("2027-07");
    expect(typeof review.translatedSummary.ko).toBe("string");
    expect(review.translatedSummary.ko.length).toBeGreaterThan(0);
    expect(typeof review.translatedSummary.en).toBe("string");
    expect(review.translatedSummary.en.length).toBeGreaterThan(0);
    expect(typeof review.disclaimer).toBe("string");
    expect(review.disclaimer.length).toBeGreaterThan(0);
    expect(() => assertNoForbiddenData(review)).not.toThrow();

    // 5) GET /api/ai-reviews/:reviewId → 동일 응답.
    const getRes = await fetch(url(`/api/ai-reviews/${review.reviewId}`));
    expect(getRes.status).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.reviewId).toBe(review.reviewId);
    expect(fetched.residencePeriodCheck.status).toBe("WARNING");
    expect(fetched.riskItems.length).toBeGreaterThanOrEqual(1);
    expect(fetched.translatedSummary.ko).toBeTruthy();
    expect(fetched.translatedSummary.en).toBeTruthy();
    expect(fetched.disclaimer.length).toBeGreaterThan(0);
    expect(() => assertNoForbiddenData(fetched)).not.toThrow();
  });
});
