import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { assertNoForbiddenData } from "./privacy-guard";

/**
 * Phase 4 OCR 슬라이스 통합 테스트(health 스펙 부트 패턴 — supertest 미사용, 전역 fetch/FormData/Blob).
 *
 *  선행: identity start→complete 로 DEMO 유저 보장.
 *  본문: multipart(file: Blob[type=application/pdf] + userDid) → POST /api/contracts/ocr
 *        → 200 OcrContractResponse(provider, COMPLETED, textPreview 비어있지 않음, maskedFields 비어있지 않음)
 *        → textPreview 에 원문 전화번호 패턴 0(마스킹 검증) + 금지 데이터 0.
 *  거부: Blob[type=application/zip] → 400.
 */
describe("OCR (integration)", () => {
  let app: INestApplication;
  let port: number;
  const userDid = "did:settlepass:user:mock-001";
  let createdUserDid: string | null = null;

  beforeAll(async () => {
    process.env.DATABASE_URL ||=
      "postgresql://user:password@localhost:5432/settlepass_test?schema=public";
    process.env.IDENTITY_MODE ||= "CX_MOCK_MODE";
    process.env.CLOVA_OCR_MODE ||= "mock";
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ZodValidationPipe());
    await app.listen(0);
    const address = app.getHttpServer().address();
    port = typeof address === "object" && address ? address.port : 0;
  });

  afterAll(async () => {
    // 생성된 데모 row 정리(best-effort — 테스트 격리용). OcrDocument 는 User FK 참조.
    if (createdUserDid) {
      const prisma = new PrismaClient();
      try {
        const user = await prisma.user.findUnique({
          where: { did: createdUserDid },
        });
        if (user) {
          await prisma.ocrDocument.deleteMany({ where: { userId: user.id } });
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

  async function ensureDemoUser(): Promise<void> {
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
  }

  it("accepts a multipart upload and returns a masked OcrContractResponse", async () => {
    await ensureDemoUser();

    const form = new FormData();
    form.append(
      "file",
      new Blob(["%PDF-1.4 fake contract bytes"], { type: "application/pdf" }),
      "contract.pdf",
    );
    form.append("userDid", userDid);

    const res = await fetch(`http://localhost:${port}/api/contracts/ocr`, {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.ocrDocumentId).toBeTruthy();
    expect(body.status).toBe("COMPLETED");
    expect(["CLOVA_OCR", "FIXTURE_OCR"]).toContain(body.provider);
    expect(typeof body.textPreview).toBe("string");
    expect(body.textPreview.length).toBeGreaterThan(0);
    expect(Array.isArray(body.maskedFields)).toBe(true);
    expect(body.maskedFields.length).toBeGreaterThan(0);

    // 마스킹이 동작했음을 증명: 응답에 원문 전화번호 패턴이 없어야 한다.
    expect(/\d{2,3}-\d{3,4}-\d{4}/.test(body.textPreview)).toBe(false);
    expect(() => assertNoForbiddenData(body)).not.toThrow();
  });

  it("rejects an unsupported file type (application/zip) with 400", async () => {
    const form = new FormData();
    form.append(
      "file",
      new Blob(["PK zip bytes"], { type: "application/zip" }),
      "contract.zip",
    );
    form.append("userDid", userDid);

    const res = await fetch(`http://localhost:${port}/api/contracts/ocr`, {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(400);
  });

  it("rejects a file larger than 10MB with 400", async () => {
    const big = new Uint8Array(11 * 1024 * 1024); // 11MB > 10MB cap
    const form = new FormData();
    form.append(
      "file",
      new Blob([big], { type: "application/pdf" }),
      "big.pdf",
    );
    form.append("userDid", userDid);

    const res = await fetch(`http://localhost:${port}/api/contracts/ocr`, {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(400);
  });
});
