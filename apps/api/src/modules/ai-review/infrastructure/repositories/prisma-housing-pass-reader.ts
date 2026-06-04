import { Inject, Injectable } from "@nestjs/common";
import type { HousingPassCredential } from "@settlepass/api-contracts";
import { PrismaService } from "../../../../infra/prisma/prisma.service";
import type {
  HousingPassReaderPort,
  HousingPassView,
} from "../../application/ports/housing-pass-reader.port";

/**
 * P2 에서 저장한 HousingPass 를 읽는 Prisma 어댑터(ai-review 전용 reader).
 * P2 모듈을 import 하지 않고 PrismaService 로 직접 조회한다.
 * credential(Json) 의 credentialSubject.residenceExpiryMonth(`YYYY-MM`)를 파싱해 노출한다.
 */
@Injectable()
export class PrismaHousingPassReader implements HousingPassReaderPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<HousingPassView | null> {
    const row = await this.prisma.housingPass.findUnique({ where: { id } });
    if (!row) return null;

    const credential = row.credential as unknown as
      | HousingPassCredential
      | null;
    const residenceExpiryMonth =
      credential?.credentialSubject?.residenceExpiryMonth;

    return { id: row.id, residenceExpiryMonth };
  }
}
