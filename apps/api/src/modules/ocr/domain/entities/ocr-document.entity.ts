import type { OcrContractResponse } from "@settlepass/api-contracts";

/**
 * 순수 도메인 표현 — OCR 처리 결과 문서. Nest/Prisma/외부 의존 0.
 *
 * PRIVACY 불변식(Phase 1 핵심): 업로드 원본 파일은 절대 영속하지 않는다.
 * `normalizedText` 는 PII 마스킹을 거친 텍스트만 담는다(이름/전화/상세주소 마스킹,
 * 금액·날짜는 AI 리뷰를 위해 유지). 원문 바이너리 컬럼은 존재하지 않는다.
 */
export type OcrProvider = OcrContractResponse["provider"];
export type OcrStatus = OcrContractResponse["status"];

export interface OcrDocument {
  id: string;
  userId: string;
  provider: OcrProvider;
  status: OcrStatus;
  /** 마스킹을 거친 정규화 텍스트(원문 아님). */
  normalizedText: string;
  /** normalizedText 앞부분 미리보기(마스킹 적용 상태). */
  textPreview: string;
  /** 마스킹된 카테고리 목록. */
  maskedFields: string[];
}
