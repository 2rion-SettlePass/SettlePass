/**
 * AI 리뷰 use-case 가 P4 에서 저장한 OcrDocument 를 읽기 위한 포트.
 * P4 모듈을 수정하지 않기 위해 ai-review infrastructure 가 PrismaService 로 직접 구현한다.
 *
 * normalizedText 는 P4 가 마스킹한 텍스트이며, 리뷰 입력으로만 사용한다.
 */
export interface OcrDocumentView {
  id: string;
  normalizedText: string;
}

export interface OcrDocumentReaderPort {
  findById(id: string): Promise<OcrDocumentView | null>;
}

export const OCR_DOCUMENT_READER = Symbol("OCR_DOCUMENT_READER");
