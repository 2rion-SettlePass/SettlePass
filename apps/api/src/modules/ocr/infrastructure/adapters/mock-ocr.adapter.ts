import { Injectable } from "@nestjs/common";
import type {
  OcrExtractInput,
  OcrExtractResult,
  OcrProviderPort,
} from "../../application/ports/ocr-provider.port";
import { PHASE1_MOCK_SAMPLE_CONTRACT_TEXT } from "../fixtures/sample-contract.fixture";

/**
 * Mock OCR 어댑터 — FIXTURE_OCR.
 * 실 OCR 호출 없이 Phase 1 샘플 계약서 원문을 돌려준다(seed/fixture 와 일관).
 * 업로드 버퍼는 사용하지 않으며(원문 미영속), provider 라벨은 FIXTURE_OCR.
 */
@Injectable()
export class MockOcrAdapter implements OcrProviderPort {
  async extractText(_input: OcrExtractInput): Promise<OcrExtractResult> {
    return {
      rawText: PHASE1_MOCK_SAMPLE_CONTRACT_TEXT,
      provider: "FIXTURE_OCR",
    };
  }
}
