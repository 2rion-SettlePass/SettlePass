import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infra/prisma/prisma.service";
import type {
  OcrDocumentReaderPort,
  OcrDocumentView,
} from "../../application/ports/ocr-document-reader.port";

/**
 * P4 에서 저장한 OcrDocument 를 읽는 Prisma 어댑터(ai-review 전용 reader).
 * P4 모듈을 import 하지 않고 PrismaService 로 직접 조회한다(housing-pass.module 의 클래스-바인딩 패턴과 동일 취지).
 * 삭제(deletedAt) 된 문서는 없는 것으로 취급한다.
 */
@Injectable()
export class PrismaOcrDocumentReader implements OcrDocumentReaderPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<OcrDocumentView | null> {
    const row = await this.prisma.ocrDocument.findUnique({ where: { id } });
    if (!row || row.deletedAt) return null;
    return { id: row.id, normalizedText: row.normalizedText };
  }
}
