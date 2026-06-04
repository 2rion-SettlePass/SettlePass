import { randomUUID } from "node:crypto";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateHousingPassResponse } from "@settlepass/api-contracts";
import { buildHousingPassCredential } from "@settlepass/shared";
import {
  IDENTITY_CLAIM_REPOSITORY,
  type IdentityClaimRepositoryPort,
} from "../../../identity/domain/identity.repository.port";
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import {
  HOUSING_PASS_REPOSITORY,
  type HousingPassRepositoryPort,
} from "../../domain/housing-pass.repository.port";

export interface CreateHousingPassInput {
  userDid: string;
}

/**
 * Housing Pass 발급:
 *  1. userDid 로 User resolve (없으면 404)
 *  2. 최신 IdentityClaim 로드 (없으면 404 — 먼저 인증 필요)
 *  3. buildHousingPassCredential 로 VC JSON 조립(공개 claim 만 담는 단일 통로)
 *  4. credential 영속(status ACTIVE, userId=internal PK)
 *  5. { housingPassId, status:'ACTIVE', credential } 반환
 */
@Injectable()
export class CreateHousingPassUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(IDENTITY_CLAIM_REPOSITORY)
    private readonly claims: IdentityClaimRepositoryPort,
    @Inject(HOUSING_PASS_REPOSITORY)
    private readonly housingPasses: HousingPassRepositoryPort,
  ) {}

  async execute(
    input: CreateHousingPassInput,
  ): Promise<CreateHousingPassResponse> {
    const user = await this.users.findByDid(input.userDid);
    if (!user) {
      throw new NotFoundException(`user not found: ${input.userDid}`);
    }

    const claim = await this.claims.findLatestByUserId(user.id);
    if (!claim) {
      throw new NotFoundException("no identity claim; complete auth first");
    }

    const now = new Date();
    const expirationDate = `${now.getFullYear()}-12-31T23:59:59+09:00`;

    const credential = buildHousingPassCredential({
      id: `urn:uuid:${randomUUID()}`,
      holderDid: input.userDid,
      claims: {
        identityVerified: claim.identityVerified,
        ageOver19: claim.ageOver19,
        residenceValid: claim.residenceValid,
        regionLevel1: claim.regionLevel1,
        residenceExpiryMonth: claim.residenceExpiryMonth,
      },
      issuanceDate: now.toISOString(),
      expirationDate,
      evidence: claim.source
        ? {
            source: claim.source,
            verifiedAt: claim.verifiedAt ?? now.toISOString(),
          }
        : undefined,
    });

    const stored = await this.housingPasses.create({
      userId: user.id,
      credential,
      status: "ACTIVE",
      expiresAt: new Date(expirationDate),
    });

    return {
      housingPassId: stored.id,
      status: "ACTIVE",
      credential,
    };
  }
}
