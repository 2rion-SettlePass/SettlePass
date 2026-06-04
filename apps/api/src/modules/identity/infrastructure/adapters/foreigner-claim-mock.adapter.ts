import { Injectable } from "@nestjs/common";
import { DEMO_IDENTITY_CLAIMS } from "@settlepass/shared";
import type {
  ForeignerClaimMockPort,
  ForeignerDefaultClaims,
} from "../../application/ports/foreigner-claim-mock.port";

/**
 * 외국인 거주 claim mock 어댑터.
 * DEMO_IDENTITY_CLAIMS 의 허용 claim 만 발급한다 (금지 데이터 미포함).
 * residenceExpiryMonth/regionLevel1 은 항상 존재하므로 안전 기본값으로 보강.
 */
@Injectable()
export class ForeignerClaimMockAdapter implements ForeignerClaimMockPort {
  async issueDefaultClaims(): Promise<ForeignerDefaultClaims> {
    return {
      ageOver19: DEMO_IDENTITY_CLAIMS.ageOver19,
      residenceValid: DEMO_IDENTITY_CLAIMS.residenceValid,
      residenceExpiryMonth: DEMO_IDENTITY_CLAIMS.residenceExpiryMonth ?? "2026-12",
      regionLevel1: DEMO_IDENTITY_CLAIMS.regionLevel1 ?? "Seoul",
      regionLevel2: DEMO_IDENTITY_CLAIMS.regionLevel2,
    };
  }
}
