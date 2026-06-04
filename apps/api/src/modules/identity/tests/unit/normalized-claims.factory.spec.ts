import { describe, it, expect } from "vitest";
import { buildNormalizedIdentityClaims } from "../../domain/value-objects/normalized-claims.factory";
import { assertNoForbiddenData } from "../../../../../test/privacy-guard";

const ALLOWED_KEYS = [
  "identityVerified",
  "credentialType",
  "userDid",
  "ageOver19",
  "residenceValid",
  "residenceExpiryMonth",
  "regionLevel1",
  "regionLevel2",
  "source",
  "verifiedAt",
];

describe("buildNormalizedIdentityClaims", () => {
  it("maps only allowed fields and never emits forbidden keys", () => {
    // 입력에 금지 데이터가 섞여 있어도 결과에는 절대 들어가지 않는다.
    const dirtyInput = {
      identityVerified: true,
      credentialType: "MOBILE_FOREIGNER_ID_MOCK" as const,
      userDid: "did:settlepass:user:mock-001",
      ageOver19: true,
      residenceValid: true,
      residenceExpiryMonth: "2026-12",
      regionLevel1: "Seoul",
      regionLevel2: "Yeongdeungpo-gu",
      source: "CX_MOCK_WITH_FOREIGNER_CLAIM_MOCK" as const,
      verifiedAt: "2026-06-15T09:00:00+09:00",
      // 아래는 모두 금지 데이터 — factory 가 무시해야 한다.
      alienRegistrationNumber: "900101-5XXXXXX",
      nationality: "VN",
      passportNumber: "M12345678",
      fullAddress: "서울시 영등포구 ... 101동 1001호",
      visaStatusRaw: "D-2",
      idCardImage: "base64...",
    };

    const claims = buildNormalizedIdentityClaims(
      dirtyInput as unknown as Parameters<
        typeof buildNormalizedIdentityClaims
      >[0],
    );

    expect(Object.keys(claims).sort()).toEqual(ALLOWED_KEYS.sort());
    expect(() => assertNoForbiddenData(claims)).not.toThrow();
  });

  it("omits optional fields when not provided", () => {
    const claims = buildNormalizedIdentityClaims({
      identityVerified: true,
      credentialType: "MOBILE_FOREIGNER_ID_MOCK",
      userDid: "did:settlepass:user:mock-001",
      ageOver19: true,
      residenceValid: true,
    });

    expect(Object.keys(claims).sort()).toEqual(
      ["identityVerified", "credentialType", "userDid", "ageOver19", "residenceValid"].sort(),
    );
    expect("regionLevel2" in claims).toBe(false);
    expect("source" in claims).toBe(false);
  });
});
