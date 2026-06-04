import { Inject, Injectable } from "@nestjs/common";
import type { HousingClaimKey } from "@settlepass/api-contracts";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../infra/prisma/prisma.service";
import type { VerificationRequestStatus } from "../../domain/entities/verification-request.entity";
import type {
  CreateVerificationRequestInput,
  StoredVerificationRequest,
  VerificationRequestRepositoryPort,
} from "../../domain/verification-request.repository.port";

/**
 * VerificationRequest Prisma 어댑터.
 * requestedClaims 는 Json 컬럼에 저장/조회하고, 조회 시 Verifier 를 join 해
 * verifierName 을 함께 로드한다.
 */
@Injectable()
export class PrismaVerificationRequestRepository
  implements VerificationRequestRepositoryPort
{
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(
    input: CreateVerificationRequestInput,
  ): Promise<{ id: string }> {
    const row = await this.prisma.verificationRequest.create({
      data: {
        verifierId: input.verifierId,
        targetUserId: input.targetUserId,
        purpose: input.purpose,
        requestedClaims:
          input.requestedClaims as unknown as Prisma.InputJsonValue,
        status: input.status,
      },
    });
    return { id: row.id };
  }

  async findById(id: string): Promise<StoredVerificationRequest | null> {
    const row = await this.prisma.verificationRequest.findUnique({
      where: { id },
      include: { verifier: true },
    });
    if (!row) return null;

    return {
      id: row.id,
      verifierId: row.verifierId,
      verifierName: row.verifier.name,
      targetUserId: row.targetUserId,
      purpose: row.purpose as "HOUSING_CONTRACT",
      requestedClaims: row.requestedClaims as unknown as HousingClaimKey[],
      status: row.status as VerificationRequestStatus,
    };
  }

  async updateStatus(
    id: string,
    status: VerificationRequestStatus,
  ): Promise<void> {
    await this.prisma.verificationRequest.update({
      where: { id },
      data: { status },
    });
  }
}
