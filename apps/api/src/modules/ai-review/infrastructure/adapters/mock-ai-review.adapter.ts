import { Injectable } from "@nestjs/common";
import type {
  AiReviewDraft,
  AiReviewGenerateInput,
  AiReviewProviderPort,
} from "../../application/ports/ai-review-provider.port";
import { PHASE1_FIXTURE_REVIEW_DRAFT } from "../fixtures/contract-review.fixture";

/**
 * Mock AI 리뷰 어댑터 — AI_REVIEW_MODE 기본값.
 * 실제 LLM 호출 없이 DEMO_CONTRACT_REVIEW 를 미러한 fixture 초안을 돌려준다.
 *
 * Phase 1 에서는 fixture 형태 초안을 그대로 반환해도 데모 요건을 충족한다.
 * (normalizedText 를 가볍게 파싱해 금액을 덮어쓸 수도 있으나 필수는 아니다 — fixture 우선.)
 */
@Injectable()
export class MockAiReviewAdapter implements AiReviewProviderPort {
  async generate(_input: AiReviewGenerateInput): Promise<AiReviewDraft> {
    // 새 객체로 복제해 호출자가 fixture 를 변형하지 못하게 한다.
    return {
      summary: { ...PHASE1_FIXTURE_REVIEW_DRAFT.summary },
      riskItems: PHASE1_FIXTURE_REVIEW_DRAFT.riskItems.map((item) => ({
        ...item,
      })),
      translatedSummary: { ...PHASE1_FIXTURE_REVIEW_DRAFT.translatedSummary },
    };
  }
}
