import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { PresentationVp } from "@settlepass/shared";
import { PrismaService } from "../../../../infra/prisma/prisma.service";
import type {
  CreatePresentationInput,
  PresentationRepositoryPort,
  StoredPresentation,
  UpdatePresentationVerificationInput,
} from "../../domain/presentation.repository.port";

/**
 * Presentation Prisma 어댑터.
 * presentationJson 은 동의된 공개 claim 만 담은 VP JSON 으로 Json 컬럼에 저장/조회한다.
 */
@Injectable()
export class PrismaPresentationRepository
  implements PresentationRepositoryPort
{
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: CreatePresentationInput): Promise<{ id: string }> {
    const row = await this.prisma.presentation.create({
      data: {
        requestId: input.requestId,
        housingPassId: input.housingPassId,
        presentationJson:
          input.presentationJson as unknown as Prisma.InputJsonValue,
        status: input.status,
      },
    });
    return { id: row.id };
  }

  async findByRequestId(
    requestId: string,
  ): Promise<StoredPresentation | null> {
    const row = await this.prisma.presentation.findFirst({
      where: { requestId },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return null;

    return {
      id: row.id,
      requestId: row.requestId,
      housingPassId: row.housingPassId,
      presentationJson: row.presentationJson as unknown as PresentationVp,
      verificationHash: row.verificationHash,
      mockTxHash: row.mockTxHash,
      status: row.status,
    };
  }

  async updateVerification(
    id: string,
    input: UpdatePresentationVerificationInput,
  ): Promise<void> {
    await this.prisma.presentation.update({
      where: { id },
      data: {
        verificationHash: input.verificationHash,
        mockTxHash: input.mockTxHash,
        status: input.status,
      },
    });
  }
}
