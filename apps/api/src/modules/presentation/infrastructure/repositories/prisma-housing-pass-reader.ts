import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infra/prisma/prisma.service";
import type { HousingPassReaderPort } from "../../domain/presentation.repository.port";

/**
 * 대상 사용자의 최신 Housing Pass 를 읽는 Prisma 어댑터.
 * P2 모듈(housing-pass)을 수정하지 않고 PrismaService 로 직접 조회한다.
 */
@Injectable()
export class PrismaHousingPassReader implements HousingPassReaderPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findLatestByUserId(
    userId: string,
  ): Promise<{ id: string; credential: unknown } | null> {
    const row = await this.prisma.housingPass.findFirst({
      where: { userId },
      orderBy: { issuedAt: "desc" },
    });
    if (!row) return null;
    return { id: row.id, credential: row.credential };
  }
}
