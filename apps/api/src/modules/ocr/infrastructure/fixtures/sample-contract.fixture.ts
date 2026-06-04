/**
 * Phase 1 mock/fixture 계약서 원문 (FIXTURE_OCR 어댑터 + provider 실패 fallback 용).
 * 이름에 phase1/mock/fixture 를 포함해 실데이터 오인을 방지한다.
 *
 * 마스킹 대상 PII(임차인/임대인 성명, 전화번호, 상세주소)와
 * 마스킹 후에도 반드시 남아야 하는 금액·날짜(보증금/월세/관리비/계약기간)를 함께 포함한다.
 */
export const PHASE1_MOCK_SAMPLE_CONTRACT_TEXT = `주택 월세 계약서

부동산의 표시
상세주소: 서울특별시 영등포구 여의대로 24 101동 1502호

임대인 성명: 김민수
임대인 연락처: 010-9876-5432

임차인 성명: 린 응웬
임차인 연락처: 010-1234-5678

계약 내용
보증금: 5,000,000원
월세: 600,000원
관리비: 100,000원
계약기간: 2026-08-01 ~ 2027-07-31

특약사항
중도해지 관련 특약은 별도 협의한다.
관리비에는 수도료가 포함된다.
`;

export const PHASE1_MOCK_OCR_FIXTURE = {
  label: "phase1-mock-fixture-ocr",
  text: PHASE1_MOCK_SAMPLE_CONTRACT_TEXT,
} as const;
