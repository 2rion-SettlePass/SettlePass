import { z } from "zod";
import type { AiReviewDraft } from "./ports/ai-review-provider.port";

/**
 * 어댑터(특히 RealLlmReviewAdapter)가 돌려준 초안을 use-case 가 신뢰하기 전에 검증하는 스키마.
 * 검증 실패 시 use-case 는 fixture fallback 으로 완주한다(NFR-P-04 / R-03).
 *
 * 모든 텍스트 필드는 비어 있지 않아야 하며, summary 의 금액/날짜는 optional 문자열이다.
 * residencePeriodCheck/disclaimer 는 초안에 없다(use-case 가 부착).
 */
const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

const riskItemSchema = z.object({
  level: riskLevelSchema,
  category: z.string().min(1),
  reason: z.string().min(1),
  evidenceText: z.string().min(1),
  recommendedQuestion: z.string().min(1),
});

const summarySchema = z.object({
  deposit: z.string().optional(),
  monthlyRent: z.string().optional(),
  maintenanceFee: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  addressSummary: z.string().optional(),
});

const translatedSummarySchema = z
  .object({
    ko: z.string().optional(),
    en: z.string().optional(),
    zh: z.string().optional(),
    vi: z.string().optional(),
  })
  // 최소 한 개 언어 요약은 있어야 한다.
  .refine((v) => Object.values(v).some((s) => typeof s === "string" && s.length > 0), {
    message: "translatedSummary must contain at least one language",
  });

export const aiReviewDraftSchema = z.object({
  summary: summarySchema,
  riskItems: z.array(riskItemSchema).min(1),
  translatedSummary: translatedSummarySchema,
});

/** 검증 통과 시 AiReviewDraft 로 안전하게 사용 가능. 실패 시 null. */
export function parseAiReviewDraft(value: unknown): AiReviewDraft | null {
  const parsed = aiReviewDraftSchema.safeParse(value);
  return parsed.success ? (parsed.data as AiReviewDraft) : null;
}
