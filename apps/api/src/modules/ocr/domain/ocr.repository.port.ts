import type { OcrProvider, OcrStatus } from "./entities/ocr-document.entity";

/**
 * 순수 도메인 포트 — Nest/Prisma/외부 의존 0.
 * infrastructure 의 Prisma repository 가 구현한다.
 *
 * PRIVACY: normalizedText 는 반드시 마스킹된 텍스트여야 하며, 원문 바이너리는 받지 않는다.
 */
export interface CreateOcrDocumentInput {
  userId: string;
  provider: OcrProvider;
  status: OcrStatus;
  /** 마스킹을 거친 정규화 텍스트(원문 아님). */
  normalizedText: string;
  textPreview: string;
  maskedFields: string[];
}

/** 영속된 OCR 문서의 조회 형태. */
export interface StoredOcrDocument {
  id: string;
  userId: string;
  provider: OcrProvider;
  status: OcrStatus;
  normalizedText: string;
  textPreview: string;
  maskedFields: string[];
}

export interface OcrDocumentRepositoryPort {
  create(input: CreateOcrDocumentInput): Promise<{ id: string }>;
  findById(id: string): Promise<StoredOcrDocument | null>;
}

export const OCR_DOCUMENT_REPOSITORY = Symbol("OCR_DOCUMENT_REPOSITORY");
