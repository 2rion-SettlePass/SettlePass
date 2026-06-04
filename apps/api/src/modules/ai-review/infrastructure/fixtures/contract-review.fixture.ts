import { DEMO_CONTRACT_REVIEW } from "@settlepass/shared";
import type { AiReviewDraft } from "../../application/ports/ai-review-provider.port";

/**
 * Phase 1 mock/fixture 리뷰 초안 — DEMO_CONTRACT_REVIEW 형태를 그대로 미러한다.
 * 이름에 phase1/fixture 를 포함해 실데이터 오인을 방지한다.
 *
 * 초안에는 residencePeriodCheck/disclaimer/reviewId 를 포함하지 않는다
 * (use-case 가 정합성 계산·disclaimer 부착·reviewId 발급을 담당).
 *
 * MockAiReviewAdapter 와, real 어댑터 실패 시 use-case fallback 양쪽에서 재사용한다.
 */
export const PHASE1_FIXTURE_REVIEW_DRAFT: AiReviewDraft = {
  summary: { ...DEMO_CONTRACT_REVIEW.summary },
  riskItems: DEMO_CONTRACT_REVIEW.riskItems.map((item) => ({ ...item })),
  translatedSummary: { ...DEMO_CONTRACT_REVIEW.translatedSummary },
};
