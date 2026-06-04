import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  HousingContractReviewResponse,
  ResidenceConsistencyStatus,
} from "@settlepass/api-contracts";
import { PrismaService } from "../../../../infra/prisma/prisma.service";
import type { ContractReviewStatus } from "../../domain/entities/contract-review.entity";
import type {
  ContractReviewRepositoryPort,
  CreateContractReviewInput,
  StoredContractReview,
  UpdateContractReviewInput,
} from "../../domain/ai-review.repository.port";

/**
 * ContractReview Prisma 어댑터.
 * reviewResult(응답 본문 JSON)를 Json 컬럼에 저장/조회한다.
 * reviewHash/mockTxHash/confirmedAt 은 P6(최종 확인)에서만 채워지므로 P5 에서는 null 로 둔다.
 */
@Injectable()
export class PrismaContractReviewRepository
  implements ContractReviewRepositoryPort
{
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: CreateContractReviewInput): Promise<{ id: string }> {
    const row = await this.prisma.contractReview.create({
      data: {
        userId: input.userId,
        ocrDocumentId: input.ocrDocumentId,
        housingPassId: input.housingPassId,
        reviewResult: input.reviewResult as unknown as Prisma.InputJsonValue,
        residenceConsistencyStatus: input.residenceConsistencyStatus,
        status: input.status,
      },
    });
    return { id: row.id };
  }

  async findById(id: string): Promise<StoredContractReview | null> {
    const row = await this.prisma.contractReview.findUnique({ where: { id } });
    if (!row) return null;

    return {
      id: row.id,
      userId: row.userId,
      ocrDocumentId: row.ocrDocumentId,
      housingPassId: row.housingPassId,
      reviewResult: row.reviewResult as unknown as HousingContractReviewResponse,
      residenceConsistencyStatus:
        row.residenceConsistencyStatus as ResidenceConsistencyStatus,
      status: row.status as ContractReviewStatus,
      reviewHash: row.reviewHash,
      mockTxHash: row.mockTxHash,
    };
  }

  async update(id: string, patch: UpdateContractReviewInput): Promise<void> {
    await this.prisma.contractReview.update({
      where: { id },
      data: {
        status: patch.status,
        reviewHash: patch.reviewHash,
        mockTxHash: patch.mockTxHash,
        confirmedAt: patch.confirmedAt,
      },
    });
  }
}
