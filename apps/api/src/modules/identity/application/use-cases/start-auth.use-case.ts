import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type {
  IdentityAuthStartRequest,
  IdentityAuthStartResponse,
} from "@settlepass/api-contracts";
import {
  IDENTITY_SESSION_REPOSITORY,
  type IdentitySessionRepositoryPort,
} from "../../domain/identity.repository.port";
import {
  MOBILE_IDENTITY_PROVIDER,
  type MobileIdentityProviderPort,
} from "../ports/mobile-identity-provider.port";

/**
 * 인증 시작: provider.startAuth → IdentitySession 생성·영속 → 시작 응답.
 * 세션 id 는 여기서 발급한다 (provider 는 상태/표시정보만 반환).
 */
@Injectable()
export class StartAuthUseCase {
  constructor(
    @Inject(MOBILE_IDENTITY_PROVIDER)
    private readonly provider: MobileIdentityProviderPort,
    @Inject(IDENTITY_SESSION_REPOSITORY)
    private readonly sessions: IdentitySessionRepositoryPort,
  ) {}

  async execute(
    input: IdentityAuthStartRequest,
  ): Promise<IdentityAuthStartResponse> {
    const result = await this.provider.startAuth({
      mode: input.mode,
      credentialType: input.credentialType,
    });

    const id = randomUUID();
    await this.sessions.create({
      id,
      mode: input.mode,
      status: result.status,
      provider: result.provider,
    });

    return {
      authSessionId: id,
      mode: input.mode,
      status: result.status,
      authUrl: result.authUrl ?? null,
      qrBase64: result.qrBase64 ?? null,
      provider: result.provider,
    };
  }
}
