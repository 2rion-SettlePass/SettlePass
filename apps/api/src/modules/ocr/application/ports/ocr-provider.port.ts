import type { OcrProvider } from "../../domain/entities/ocr-document.entity";

/**
 * OCR 제공자 포트 — 업로드 파일에서 원문 텍스트를 추출한다.
 * infrastructure 의 mock(FIXTURE_OCR) / real(CLOVA_OCR) 어댑터가 구현한다.
 *
 * 파일 버퍼는 메모리에서만 다루며 절대 영속하지 않는다(use-case 가 정규화·마스킹 후 텍스트만 저장).
 */
export interface OcrExtractInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface OcrExtractResult {
  rawText: string;
  provider: OcrProvider;
}

export interface OcrProviderPort {
  extractText(input: OcrExtractInput): Promise<OcrExtractResult>;
}

export const OCR_PROVIDER = Symbol("OCR_PROVIDER");
