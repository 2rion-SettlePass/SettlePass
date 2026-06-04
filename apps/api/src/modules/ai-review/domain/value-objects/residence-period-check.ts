import type { ResidenceConsistencyStatus } from "@settlepass/api-contracts";

/**
 * 순수 도메인 VO — 체류기간·계약기간 정합성 계산. Nest/Prisma/외부 의존 0.
 *
 * SettlePass 의 핵심 차별점(FR-AI-04). 이 값은 어댑터(LLM/mock)를 신뢰하지 않고
 * use-case 가 Housing Pass 의 residenceExpiryMonth 와 리뷰 요약의 contractEndDate 로
 * 직접 계산한다.
 *
 * 규칙:
 *  - 둘 다 존재하고 contractEndMonth > residenceExpiryMonth → WARNING
 *  - 둘 다 존재하고 contractEndMonth <= residenceExpiryMonth → OK
 *  - 둘 중 하나라도 결측 → UNKNOWN
 *
 * 월 비교는 `YYYY-MM` 사전식 비교(동일 폭의 zero-padded 문자열이므로 안전).
 */
export interface ResidencePeriodCheckInput {
  /** Housing Pass credential 의 체류 만료월(`YYYY-MM`). */
  residenceExpiryMonth?: string;
  /** 리뷰 요약의 계약 종료일(`YYYY-MM-DD` 또는 그 prefix). */
  contractEndDate?: string;
}

export interface ResidencePeriodCheckResult {
  status: ResidenceConsistencyStatus;
  residenceExpiryMonth?: string;
  contractEndMonth?: string;
  reason: string;
}

const REASON_WARNING =
  "계약 종료일이 체류 만료월보다 늦습니다. 체류 연장 가능성과 중도해지 조건을 확인해야 합니다.";
const REASON_OK = "계약 종료일이 체류 만료월 이내입니다.";
const REASON_UNKNOWN =
  "체류 만료월 또는 계약 종료일 정보가 부족하여 정합성을 판단할 수 없습니다.";

/** `YYYY-MM-DD`(또는 `YYYY-MM...`) 에서 `YYYY-MM` 월 부분만 안전하게 추출한다. */
export function toMonth(date: string | undefined): string | undefined {
  if (!date) return undefined;
  const match = /^(\d{4})-(\d{2})/.exec(date.trim());
  return match ? `${match[1]}-${match[2]}` : undefined;
}

export function computeResidencePeriodCheck(
  input: ResidencePeriodCheckInput,
): ResidencePeriodCheckResult {
  const residenceExpiryMonth = toMonth(input.residenceExpiryMonth);
  const contractEndMonth = toMonth(input.contractEndDate);

  if (!residenceExpiryMonth || !contractEndMonth) {
    return {
      status: "UNKNOWN",
      residenceExpiryMonth,
      contractEndMonth,
      reason: REASON_UNKNOWN,
    };
  }

  const status: ResidenceConsistencyStatus =
    contractEndMonth > residenceExpiryMonth ? "WARNING" : "OK";

  return {
    status,
    residenceExpiryMonth,
    contractEndMonth,
    reason: status === "WARNING" ? REASON_WARNING : REASON_OK,
  };
}
