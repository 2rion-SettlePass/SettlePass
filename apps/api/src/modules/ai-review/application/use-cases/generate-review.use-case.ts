import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { HousingContractReviewResponse } from "@settlepass/api-contracts";
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import { computeResidencePeriodCheck } from "../../domain/value-objects/residence-period-check";
import {
  CONTRACT_REVIEW_REPOSITORY,
  type ContractReviewRepositoryPort,
} from "../../domain/ai-review.repository.port";
import { PHASE1_FIXTURE_REVIEW_DRAFT } from "../../infrastructure/fixtures/contract-review.fixture";
import { parseAiReviewDraft } from "../ai-review-draft.schema";
import { REVIEW_DISCLAIMER } from "../disclaimer";
import {
  AI_REVIEW_PROVIDER,
  type AiReviewDraft,
  type AiReviewProviderPort,
} from "../ports/ai-review-provider.port";
import {
  HOUSING_PASS_READER,
  type HousingPassReaderPort,
} from "../ports/housing-pass-reader.port";
import {
  OCR_DOCUMENT_READER,
  type OcrDocumentReaderPort,
} from "../ports/ocr-document-reader.port";

export interface GenerateReviewInput {
  userDid: string;
  housingPassId: string;
  ocrDocumentId: string;
  preferredLanguage: "ko" | "en" | "zh" | "vi";
}

/**
 * AI 계약 리뷰 생성:
 *  1. userDid → User resolve (없으면 404)
 *  2. OcrDocument 로드(없으면 404) → normalizedText 확보(이미 마스킹됨)
 *  3. HousingPass 로드(없으면 404) → residenceExpiryMonth 확보(credential 파싱)
 *  4. AI_REVIEW_PROVIDER.generate 호출 — throw/timeout 또는 스키마 부적합 시 fixture fallback
 *     (사용자에게 throw 금지 — NFR-P-04 / R-03)
 *  5. residencePeriodCheck 를 도메인 VO 로 직접 계산(어댑터 출력 미신뢰 — FR-AI-04)
 *  6. disclaimer 상수 부착(FR-AI-06) → HousingContractReviewResponse 조립
 *  7. ContractReview 영속(status='GENERATED', reviewHash/confirmedAt 은 P6 에서)
 *  8. 응답 반환
 */
@Injectable()
export class GenerateReviewUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(OCR_DOCUMENT_READER)
    private readonly ocrDocuments: OcrDocumentReaderPort,
    @Inject(HOUSING_PASS_READER)
    private readonly housingPasses: HousingPassReaderPort,
    @Inject(AI_REVIEW_PROVIDER)
    private readonly provider: AiReviewProviderPort,
    @Inject(CONTRACT_REVIEW_REPOSITORY)
    private readonly reviews: ContractReviewRepositoryPort,
  ) {}

  async execute(
    input: GenerateReviewInput,
  ): Promise<HousingContractReviewResponse> {
    const user = await this.users.findByDid(input.userDid);
    if (!user) {
      throw new NotFoundException(`user not found: ${input.userDid}`);
    }

    const ocrDocument = await this.ocrDocuments.findById(input.ocrDocumentId);
    if (!ocrDocument) {
      throw new NotFoundException(
        `ocr document not found: ${input.ocrDocumentId}`,
      );
    }

    const housingPass = await this.housingPasses.findById(input.housingPassId);
    if (!housingPass) {
      throw new NotFoundException(
        `housing pass not found: ${input.housingPassId}`,
      );
    }

    const draft = await this.resolveDraft({
      normalizedText: ocrDocument.normalizedText,
      preferredLanguage: input.preferredLanguage,
    });

    // FR-AI-04: 정합성은 어댑터가 아니라 use-case 가 Housing Pass 데이터로 직접 계산한다.
    const residencePeriodCheck = computeResidencePeriodCheck({
      residenceExpiryMonth: housingPass.residenceExpiryMonth,
      contractEndDate: draft.summary.contractEndDate,
    });

    const stored = await this.reviews.create({
      userId: user.id,
      ocrDocumentId: ocrDocument.id,
      housingPassId: housingPass.id,
      // reviewResult 는 reviewId 를 제외한 응답 본문을 담는다(reviewId 는 영속 PK 와 동일).
      reviewResult: {
        reviewId: "",
        summary: draft.summary,
        riskItems: draft.riskItems,
        residencePeriodCheck,
        translatedSummary: draft.translatedSummary,
        disclaimer: REVIEW_DISCLAIMER,
      },
      residenceConsistencyStatus: residencePeriodCheck.status,
      status: "GENERATED",
    });

    return {
      reviewId: stored.id,
      summary: draft.summary,
      riskItems: draft.riskItems,
      residencePeriodCheck,
      translatedSummary: draft.translatedSummary,
      disclaimer: REVIEW_DISCLAIMER,
    };
  }

  /**
   * provider 호출 → 실패(throw/timeout)하거나 스키마 부적합이면 fixture 초안으로 fallback.
   * 어떤 경우에도 사용자에게 throw 하지 않는다(NFR-P-04).
   */
  private async resolveDraft(input: {
    normalizedText: string;
    preferredLanguage: "ko" | "en" | "zh" | "vi";
  }): Promise<AiReviewDraft> {
    try {
      const raw = await this.provider.generate(input);
      const validated = parseAiReviewDraft(raw);
      return validated ?? PHASE1_FIXTURE_REVIEW_DRAFT;
    } catch {
      return PHASE1_FIXTURE_REVIEW_DRAFT;
    }
  }
}
