import { Injectable } from "@nestjs/common";
import { DEMO_USER } from "@settlepass/shared";
import type {
  CompleteAuthInput,
  MobileIdentityProviderPort,
  RawIdentityResult,
  StartAuthResult,
} from "../../application/ports/mobile-identity-provider.port";

/**
 * OmniOne CX adapter — CX_MOCK_MODE.
 * 실 연동 없이 DEMO_USER 기반 기본 신원을 돌려준다 (seed/fixture 와 일관).
 * 금지 데이터는 발급하지 않으며, source 는 mock+foreigner-claim-mock 조합으로 표기.
 */
@Injectable()
export class MockCxIdentityAdapter implements MobileIdentityProviderPort {
  async startAuth(): Promise<StartAuthResult> {
    return { status: "READY", provider: "coresidence_v1.5_mock" };
  }

  async completeAuth(_input: CompleteAuthInput): Promise<RawIdentityResult> {
    return {
      credentialType: "MOBILE_FOREIGNER_ID_MOCK",
      userDid: DEMO_USER.userDid,
      identityVerified: true,
      source: "CX_MOCK_WITH_FOREIGNER_CLAIM_MOCK",
    };
  }
}
