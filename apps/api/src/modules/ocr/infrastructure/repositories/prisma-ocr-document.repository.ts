import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../infra/prisma/prisma.service";
import type {
  OcrProvider,
  OcrStatus,
} from "../../domain/entities/ocr-document.entity";
import type {
  CreateOcrDocumentInput,
  OcrDocumentRepositoryPort,
  StoredOcrDocument,
} from "../../domain/ocr.repository.port";

/**
 * OCR 문서 Prisma 어댑터.
 *
 * PRIVACY: 업로드 원본 파일/바이너리는 저장하지 않는다(테이블에 컬럼 자체가 없음).
 * normalizedText 는 use-case 가 마스킹한 텍스트만 들어온다.
 */
@Injectable()
export class PrismaOcrDocumentRepository implements OcrDocumentRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: CreateOcrDocumentInput): Promise<{ id: string }> {
    const row = await this.prisma.ocrDocument.create({
      data: {
        userId: input.userId,
        provider: input.provider,
        status: input.status,
        normalizedText: input.normalizedText,
        textPreview: input.textPreview,
        maskedFields: input.maskedFields as unknown as Prisma.InputJsonValue,
      },
    });
    return { id: row.id };
  }

  async findById(id: string): Promise<StoredOcrDocument | null> {
    const row = await this.prisma.ocrDocument.findUnique({ where: { id } });
    if (!row || row.deletedAt) return null;

    return {
      id: row.id,
      userId: row.userId,
      provider: row.provider as OcrProvider,
      status: row.status as OcrStatus,
      normalizedText: row.normalizedText,
      textPreview: row.textPreview ?? "",
      maskedFields: (row.maskedFields as unknown as string[] | null) ?? [],
    };
  }
}
