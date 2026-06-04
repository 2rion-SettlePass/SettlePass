import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { OcrContractResponse } from "@settlepass/api-contracts";
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import type { OcrProvider } from "../../domain/entities/ocr-document.entity";
import {
  OCR_DOCUMENT_REPOSITORY,
  type OcrDocumentRepositoryPort,
} from "../../domain/ocr.repository.port";
import { maskPii } from "../../domain/value-objects/pii-masker";
import { normalizeContractText } from "../../domain/value-objects/text-normalizer";
import { PHASE1_MOCK_SAMPLE_CONTRACT_TEXT } from "../../infrastructure/fixtures/sample-contract.fixture";
import {
  OCR_PROVIDER,
  type OcrProviderPort,
} from "../ports/ocr-provider.port";

export interface ProcessOcrInput {
  userDid: string;
  file?: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  };
  /** FR-OCR-06 fallback — 수동 입력 텍스트(있으면 OCR 호출 대신 사용, provider=FIXTURE_OCR). */
  manualText?: string;
}

const TEXT_PREVIEW_LENGTH = 300;

/**
 * 계약서 OCR 처리:
 *  1. userDid → User resolve (없으면 404)
 *  2. rawText 확보:
 *     - manualText 가 있으면 그대로 사용(FIXTURE_OCR)
 *     - 없으면 OCR_PROVIDER.extractText(file). 실패하면 fixture 텍스트로 fallback(FIXTURE_OCR) — 사용자에게 throw 금지
 *  3. 정규화 → 마스킹
 *  4. 마스킹된 텍스트만 영속(원문 미저장, status COMPLETED)
 *  5. OcrContractResponse 반환
 */
@Injectable()
export class ProcessOcrUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(OCR_PROVIDER)
    private readonly ocrProvider: OcrProviderPort,
    @Inject(OCR_DOCUMENT_REPOSITORY)
    private readonly documents: OcrDocumentRepositoryPort,
  ) {}

  async execute(input: ProcessOcrInput): Promise<OcrContractResponse> {
    const user = await this.users.findByDid(input.userDid);
    if (!user) {
      throw new NotFoundException(`user not found: ${input.userDid}`);
    }

    const { rawText, provider } = await this.resolveRawText(input);

    const normalized = normalizeContractText(rawText);
    const { masked, maskedFields } = maskPii(normalized);
    const textPreview = masked.slice(0, TEXT_PREVIEW_LENGTH);

    const stored = await this.documents.create({
      userId: user.id,
      provider,
      status: "COMPLETED",
      normalizedText: masked,
      textPreview,
      maskedFields,
    });

    return {
      ocrDocumentId: stored.id,
      provider,
      status: "COMPLETED",
      textPreview,
      maskedFields,
    };
  }

  private async resolveRawText(
    input: ProcessOcrInput,
  ): Promise<{ rawText: string; provider: OcrProvider }> {
    // FR-OCR-06: 수동 입력 텍스트 fallback.
    if (input.manualText && input.manualText.trim().length > 0) {
      return { rawText: input.manualText, provider: "FIXTURE_OCR" };
    }

    // 파일이 없고 manualText 도 없으면 데모 편의를 위해 fixture 로 진행(샘플 계약서 데모).
    if (!input.file) {
      return {
        rawText: PHASE1_MOCK_SAMPLE_CONTRACT_TEXT,
        provider: "FIXTURE_OCR",
      };
    }

    // provider 호출 — 실패 시 fixture fallback(R-03/NFR-R-01), 사용자에게 throw 금지.
    try {
      const result = await this.ocrProvider.extractText(input.file);
      return { rawText: result.rawText, provider: result.provider };
    } catch {
      return {
        rawText: PHASE1_MOCK_SAMPLE_CONTRACT_TEXT,
        provider: "FIXTURE_OCR",
      };
    }
  }
}
