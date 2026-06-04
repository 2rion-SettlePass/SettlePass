/**
 * 순수 함수 — 계약서 OCR 원문 정규화. Nest/Prisma/외부 의존 0.
 *
 * 목표: OCR 출력의 잡음(중복 공백/개행, 금액·날짜 표기 변형)을 결정적으로 정돈해
 * 이후 마스킹·AI 리뷰가 안정적으로 동작하게 한다. 의미를 바꾸지 않는 표면 정규화만 한다.
 */

/** 줄 단위로 좌우 공백을 제거하고, 줄 안의 연속 공백/탭을 단일 공백으로 합친다. */
function collapseInlineWhitespace(line: string): string {
  return line.replace(/[ \t\u3000]+/g, " ").trim();
}

/**
 * 금액 표기 정규화:
 *  - 숫자와 단위(원/만원) 사이 공백 제거: `5,000,000 원` → `5,000,000원`, `500 만원` → `500만원`
 *  - `만 원` → `만원` (한글 단위 내부 공백 제거)
 * 천단위 콤마 자체는 보존한다(금액 가독성 유지, AI 리뷰가 그대로 읽음).
 */
function normalizeAmounts(text: string): string {
  return text
    .replace(/(\d)\s*만\s*원/g, "$1만원")
    .replace(/(\d)\s*원/g, "$1원");
}

/**
 * 날짜 구분자 정규화:
 *  - `2026.08.01` / `2026 / 08 / 01` / `2026-08-01` → `2026-08-01`
 *  - `2026년 08월 01일` → `2026-08-01`
 * 4자리 연도로 시작하는 한국식 날짜만 대상으로 하며, 그 외 숫자는 건드리지 않는다.
 */
function normalizeDates(text: string): string {
  return text
    .replace(
      /(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/g,
      (_m, y, mo, d) => `${y}-${pad2(mo)}-${pad2(d)}`,
    )
    .replace(
      /(\d{4})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})/g,
      (_m, y, mo, d) => `${y}-${pad2(mo)}-${pad2(d)}`,
    );
}

function pad2(value: string): string {
  return value.length === 1 ? `0${value}` : value;
}

/**
 * 계약서 원문을 결정적으로 정규화한다.
 *  1. 개행 통일(CRLF/CR → LF)
 *  2. 줄별 인라인 공백 합치기 + 빈 줄 제거
 *  3. 금액/날짜 표기 정규화
 */
export function normalizeContractText(raw: string): string {
  const lines = raw
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map(collapseInlineWhitespace)
    .filter((line) => line.length > 0);

  const joined = lines.join("\n");
  return normalizeDates(normalizeAmounts(joined));
}
