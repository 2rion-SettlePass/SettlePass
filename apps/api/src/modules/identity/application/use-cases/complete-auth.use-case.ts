import { randomUUID } from "node:crypto";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  IdentityAuthCompleteRequest,
  IdentityAuthCompleteResponse,
} from "@settlepass/api-contracts";
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import {
  IDENTITY_CLAIM_REPOSITORY,
  IDENTITY_SESSION_REPOSITORY,
  type IdentityClaimRepositoryPort,
  type IdentitySessionRepositoryPort,
} from "../../domain/identity.repository.port";
import { buildNormalizedIdentityClaims } from "../../domain/value-objects/normalized-claims.factory";
import {
  FOREIGNER_CLAIM_MOCK,
  type ForeignerClaimMockPort,
} from "../ports/foreigner-claim-mock.port";
import {
  MOBILE_IDENTITY_PROVIDER,
  type MobileIdentityProviderPort,
} from "../ports/mobile-identity-provider.port";

/**
 * 인증 완료:
 *  1. authSessionId 로 세션 로드 (없으면 404)
 *  2. provider.completeAuth → 기본 신원 + foreignerClaimMock.issueDefaultClaims → 보강
 *  3. 도메인 factory 로 NormalizedIdentityClaims 구성 (금지 데이터 차단 단일 통로)
 *  4. userDid 로 User upsert (있으면 재사용, 없으면 새 uuid 로 생성)
 *  5. IdentityClaim 영속 + 세션 completed 표시
 *  6. { userId, userDid, claims } 반환 (이후 호출은 userDid 사용)
 */
@Injectable()
export class CompleteAuthUseCase {
  constructor(
    @Inject(MOBILE_IDENTITY_PROVIDER)
    private readonly provider: MobileIdentityProviderPort,
    @Inject(FOREIGNER_CLAIM_MOCK)
    private readonly foreignerClaimMock: ForeignerClaimMockPort,
    @Inject(IDENTITY_SESSION_REPOSITORY)
    private readonly sessions: IdentitySessionRepositoryPort,
    @Inject(IDENTITY_CLAIM_REPOSITORY)
    private readonly claims: IdentityClaimRepositoryPort,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
  ) {}

  async execute(
    input: IdentityAuthCompleteRequest,
  ): Promise<IdentityAuthCompleteResponse> {
    const session = await this.sessions.findById(input.authSessionId);
    if (!session) {
      throw new NotFoundException(
        `auth session not found: ${input.authSessionId}`,
      );
    }

    const base = await this.provider.completeAuth({
      session,
      mockProfile: input.mockProfile,
    });

    const extra = await this.foreignerClaimMock.issueDefaultClaims({
      userDid: base.userDid,
      mockProfile: input.mockProfile,
    });

    const claims = buildNormalizedIdentityClaims({
      identityVerified: base.identityVerified,
      credentialType: base.credentialType,
      userDid: base.userDid,
      ageOver19: extra.ageOver19,
      residenceValid: extra.residenceValid,
      residenceExpiryMonth: extra.residenceExpiryMonth,
      regionLevel1: extra.regionLevel1,
      regionLevel2: extra.regionLevel2,
      source: base.source,
      verifiedAt: new Date().toISOString(),
    });

    const existing = await this.users.findByDid(base.userDid);
    const user =
      existing ??
      (await this.users.create({ id: randomUUID(), did: base.userDid }));

    await this.claims.create({ userId: user.id, claims });
    await this.sessions.markCompleted(session.id, user.id);

    return { userId: user.id, userDid: user.did, claims };
  }
}
