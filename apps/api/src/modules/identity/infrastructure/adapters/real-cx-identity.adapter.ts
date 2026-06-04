import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type {
  MobileIdentityProviderPort,
  RawIdentityResult,
  StartAuthResult,
} from "../../application/ports/mobile-identity-provider.port";

/**
 * OmniOne CX adapter — CX_REAL_MODE 슬롯 (Phase 1 미구성).
 * 실 연동 키/엔드포인트가 없으므로 명확한 503 으로 차단한다.
 * (IDENTITY_MODE=CX_REAL_MODE 일 때만 바인딩 — 데모는 CX_MOCK_MODE 사용)
 */
@Injectable()
export class RealCxIdentityAdapter implements MobileIdentityProviderPort {
  async startAuth(): Promise<StartAuthResult> {
    throw new ServiceUnavailableException(
      "CX_REAL_MODE not configured in Phase 1; use CX_MOCK_MODE",
    );
  }

  async completeAuth(): Promise<RawIdentityResult> {
    throw new ServiceUnavailableException(
      "CX_REAL_MODE not configured in Phase 1; use CX_MOCK_MODE",
    );
  }
}
