import { describe, it, expect } from "vitest";
import { maskPii } from "../../domain/value-objects/pii-masker";

const SAMPLE = `상세주소: 서울특별시 영등포구 여의대로 24 101동 1502호
임대인 성명: 김민수
임대인 연락처: 010-9876-5432
임차인 성명: 린 응웬
임차인 연락처: 010-1234-5678
보증금: 5,000,000원
월세: 600,000원
관리비: 100,000원
계약기간: 2026-08-01 ~ 2027-07-31`;

describe("maskPii", () => {
  it("masks phone numbers and removes raw phone patterns", () => {
    const { masked, maskedFields } = maskPii(SAMPLE);
    expect(/\d{2,3}-\d{3,4}-\d{4}/.test(masked)).toBe(false);
    expect(masked).not.toContain("010-1234-5678");
    expect(masked).not.toContain("010-9876-5432");
    expect(maskedFields).toContain("phoneNumber");
  });

  it("masks party names following 임차인/임대인/성명 labels", () => {
    const { masked, maskedFields } = maskPii(SAMPLE);
    expect(masked).not.toContain("김민수");
    expect(masked).not.toContain("린 응웬");
    // 라벨 자체는 보존된다(문맥 표시 유지).
    expect(masked).toContain("임대인 성명");
    expect(masked).toContain("임차인 성명");
    expect(maskedFields).toContain("tenantName");
    expect(maskedFields).toContain("landlordName");
  });

  it("masks street addresses (시/구/동/로/길 + number)", () => {
    const { masked, maskedFields } = maskPii(SAMPLE);
    expect(masked).not.toContain("여의대로");
    expect(masked).not.toContain("영등포구");
    expect(maskedFields).toContain("fullAddress");
  });

  it("keeps financial figures and dates unmasked (AI review needs them)", () => {
    const { masked } = maskPii(SAMPLE);
    expect(masked).toContain("5,000,000원");
    expect(masked).toContain("600,000원");
    expect(masked).toContain("100,000원");
    expect(masked).toContain("2026-08-01");
    expect(masked).toContain("2027-07-31");
  });

  it("returns only the categories actually masked", () => {
    const { maskedFields } = maskPii(SAMPLE);
    expect([...maskedFields].sort()).toEqual(
      ["fullAddress", "landlordName", "phoneNumber", "tenantName"].sort(),
    );
  });

  it("masks a bare 성명 label as tenantName", () => {
    const { masked, maskedFields } = maskPii("성명: 박지훈");
    expect(masked).not.toContain("박지훈");
    expect(masked).toContain("성명");
    expect(maskedFields).toContain("tenantName");
  });

  it("returns no maskedFields when there is no PII", () => {
    const { masked, maskedFields } = maskPii(
      "보증금: 5,000,000원\n월세: 600,000원\n계약기간: 2026-08-01 ~ 2027-07-31",
    );
    expect(maskedFields).toEqual([]);
    expect(masked).toContain("5,000,000원");
  });
});
