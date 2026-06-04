import { Inject, Injectable } from "@nestjs/common";
import type {
  CredentialType,
  IdentitySource,
  NormalizedIdentityClaims,
} from "@settlepass/api-contracts";
import { PrismaService } from "../../../../infra/prisma/prisma.service";
import { buildNormalizedIdentityClaims } from "../../domain/value-objects/normalized-claims.factory";
import type {
  CreateIdentityClaimInput,
  IdentityClaimRepositoryPort,
} from "../../domain/identity.repository.port";

/**
 * IdentityClaim Prisma 어댑터.
 * 테이블에는 허용 claim 컬럼만 존재한다 (금지 데이터 컬럼 없음).
 */
@Injectable()
export class PrismaIdentityClaimRepository
  implements IdentityClaimRepositoryPort
{
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async create(input: CreateIdentityClaimInput): Promise<void> {
    const c = input.claims;
    await this.prisma.identityClaim.create({
      data: {
        userId: input.userId,
        identityVerified: c.identityVerified,
        credentialType: c.credentialType,
        ageOver19: c.ageOver19,
        residenceValid: c.residenceValid,
        residenceExpiryMonth: c.residenceExpiryMonth,
        regionLevel1: c.regionLevel1,
        regionLevel2: c.regionLevel2,
        source: c.source ?? "CX_MOCK_WITH_FOREIGNER_CLAIM_MOCK",
        verifiedAt: c.verifiedAt ? new Date(c.verifiedAt) : new Date(),
      },
    });
  }

  async findLatestByUserId(
    userId: string,
  ): Promise<NormalizedIdentityClaims | null> {
    const row = await this.prisma.identityClaim.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return null;

    // userDid 는 IdentityClaim 행에 저장되지 않는다(내부 PK 기준 영속).
    // 호출자(GetMe)가 User.did 로 채우므로 여기서는 빈 문자열을 둔다.
    return buildNormalizedIdentityClaims({
      identityVerified: row.identityVerified,
      credentialType: row.credentialType as CredentialType,
      userDid: "",
      ageOver19: row.ageOver19,
      residenceValid: row.residenceValid,
      residenceExpiryMonth: row.residenceExpiryMonth ?? undefined,
      regionLevel1: row.regionLevel1 ?? undefined,
      regionLevel2: row.regionLevel2 ?? undefined,
      source: row.source as IdentitySource,
      verifiedAt: row.verifiedAt.toISOString(),
    });
  }
}
