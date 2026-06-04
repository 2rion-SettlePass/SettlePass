import type {
  ContractReviewRiskItem,
  HousingContractReviewResponse,
} from "@settlepass/api-contracts";

/**
 * AI 리뷰 제공자 포트 — 마스킹된 계약서 텍스트에서 구조화된 리뷰 초안을 만든다.
 * infrastructure 의 mock(fixture) / real(OpenAI-compatible) 어댑터가 구현한다.
 *
 * 초안(AiReviewDraft)에는 다음을 포함하지 않는다:
 *  - residencePeriodCheck — use-case 가 Housing Pass 데이터로 직접 계산(어댑터 미신뢰)
 *  - disclaimer — use-case 가 상수로 부착(FR-AI-06: 항상 동일 문구)
 *
 * PRIVACY: 입력은 이미 마스킹된 normalizedText 이며, 출력에 금지 데이터가 없어야 한다.
 */
export type AiReviewDraftSummary = HousingContractReviewResponse["summary"];
export type AiReviewDraftTranslatedSummary =
  HousingContractReviewResponse["translatedSummary"];

export interface AiReviewDraft {
  summary: AiReviewDraftSummary;
  riskItems: ContractReviewRiskItem[];
  translatedSummary: AiReviewDraftTranslatedSummary;
}

export interface AiReviewGenerateInput {
  normalizedText: string;
  preferredLanguage: "ko" | "en" | "zh" | "vi";
}

export interface AiReviewProviderPort {
  generate(input: AiReviewGenerateInput): Promise<AiReviewDraft>;
}

export const AI_REVIEW_PROVIDER = Symbol("AI_REVIEW_PROVIDER");
