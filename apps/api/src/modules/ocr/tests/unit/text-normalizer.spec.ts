import { describe, it, expect } from "vitest";
import { normalizeContractText } from "../../domain/value-objects/text-normalizer";

describe("normalizeContractText", () => {
  it("collapses repeated inline whitespace and trims lines", () => {
    const out = normalizeContractText("보증금   :    5,000,000원   ");
    expect(out).toBe("보증금 : 5,000,000원");
  });

  it("collapses full-width spaces (U+3000) common in Korean OCR", () => {
    const out = normalizeContractText("월세　　600,000원");
    expect(out).toBe("월세 600,000원");
  });

  it("removes blank lines and normalizes newlines (CRLF/CR -> LF)", () => {
    const out = normalizeContractText("줄1\r\n\r\n줄2\r\r줄3");
    expect(out).toBe("줄1\n줄2\n줄3");
  });

  it("removes spacing between amount and 원/만원 unit", () => {
    expect(normalizeContractText("5,000,000 원")).toBe("5,000,000원");
    expect(normalizeContractText("500 만원")).toBe("500만원");
    expect(normalizeContractText("월세 600,000  원")).toBe("월세 600,000원");
  });

  it("normalizes date separators to YYYY-MM-DD", () => {
    expect(normalizeContractText("2026.08.01")).toBe("2026-08-01");
    expect(normalizeContractText("2026 / 08 / 01")).toBe("2026-08-01");
    expect(normalizeContractText("2026-8-1")).toBe("2026-08-01");
  });

  it("normalizes Korean year/month/day dates", () => {
    expect(normalizeContractText("2026년 8월 1일")).toBe("2026-08-01");
    expect(normalizeContractText("계약기간 2027년 07월 31일")).toBe(
      "계약기간 2027-07-31",
    );
  });

  it("preserves thousands separators inside amounts", () => {
    const out = normalizeContractText("보증금: 5,000,000원");
    expect(out).toContain("5,000,000원");
  });

  it("is deterministic (same input -> same output)", () => {
    const input = "보증금 5,000,000 원\n계약기간 2026.08.01 ~ 2027 / 07 / 31";
    expect(normalizeContractText(input)).toBe(normalizeContractText(input));
  });
});
