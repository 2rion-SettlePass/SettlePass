import { Inject, Injectable } from "@nestjs/common";
import type {
  CreateHousingPassResponse,
  HousingPassCredential,
} from "@settlepass/api-contracts";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../infra/prisma/prisma.service";
import type {
  CreateHousingPassInput,
  HousingPassRepositoryPort,
  StoredHousingPass,
} from "../../domain/housing-pass.repository.port";

/**
 * Housing Pass Prisma 어댑터.
 * credential 은 공개 claim 만 담은 VC JSON 으로 Json 컬럼에 저장/조회한다.
 */
@Injectable()
export class PrismaHousingPassRepository implements HousingPassRepositoryPort {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async create(input: CreateHousingPassInput): Promise<{ id: string }> {
    const row = await this.prisma.housingPass.create({
      data: {
        userId: input.userId,
        credential: input.credential as unknown as Prisma.InputJsonValue,
        status: input.status,
        ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
      },
    });
    return { id: row.id };
  }

  async findById(id: string): Promise<StoredHousingPass | null> {
    const row = await this.prisma.housingPass.findUnique({ where: { id } });
    if (!row) return null;

    return {
      id: row.id,
      userId: row.userId,
      credential: row.credential as unknown as HousingPassCredential,
      status: row.status as CreateHousingPassResponse["status"],
    };
  }
}
