import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../infra/prisma/prisma.service";
import type {
  ConsentRepositoryPort,
  CreateConsentInput,
} from "../../domain/consent.repository.port";

/**
 * Consent Prisma 어댑터.
 * consentedClaims 는 Json 컬럼에 저장한다(거절 시 빈 배열 + 빈 consentHash).
 */
@Injectable()
export class PrismaConsentRepository implements ConsentRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: CreateConsentInput): Promise<{ id: string }> {
    const row = await this.prisma.consent.create({
      data: {
        requestId: input.requestId,
        userId: input.userId,
        consentedClaims:
          input.consentedClaims as unknown as Prisma.InputJsonValue,
        consentHash: input.consentHash,
        mockTxHash: input.mockTxHash,
        status: input.status,
      },
    });
    return { id: row.id };
  }
}
