/**
 * 순수 함수 — 계약서 텍스트 PII 마스킹. Nest/Prisma/외부 의존 0.
 *
 * Phase 1 핵심 프라이버시 가드: 영속되는 텍스트는 반드시 이 마스커를 통과한 결과여야 한다.
 *  - 마스킹: 전화번호, 상세주소(시/구/동/로/길 + 번지), 당사자 성명(임차인/임대인/성명 라벨 뒤).
 *  - 유지: 금액(보증금/월세/관리비)·날짜(계약기간) — AI 리뷰에 필요하므로 절대 가리지 않는다.
 * 반환 maskedFields 는 ['tenantName','landlordName','phoneNumber','fullAddress'] 중 실제로 마스킹된 카테고리.
 */

export type MaskedFieldCategory =
  | "tenantName"
  | "landlordName"
  | "phoneNumber"
  | "fullAddress";

export interface MaskResult {
  masked: string;
  maskedFields: string[];
}

const MASK_TOKEN = "[보호됨]";

// 한국 휴대전화/일반전화: 01X-XXXX-XXXX, 02-XXX-XXXX, 0XX-XXXX-XXXX 등. 구분자는 -, ., 공백 허용.
const PHONE_RE = /(\d{2,3})[-.\s](\d{3,4})[-.\s](\d{4})/g;

// 당사자 성명: '임차인'/'임대인'/'성명' 라벨 뒤에 오는 한글 이름(공백 포함 2~4토큰).
// 라벨 자체와 사이의 콜론/공백은 보존하고 이름만 가린다. 다른 라벨/줄바꿈을 만나면 멈춘다.
const TENANT_NAME_RE = /(임차인(?:\s*성명)?\s*[:：]?\s*)([가-힣]+(?:\s+[가-힣]+)*)/g;
const LANDLORD_NAME_RE = /(임대인(?:\s*성명)?\s*[:：]?\s*)([가-힣]+(?:\s+[가-힣]+)*)/g;
// 라벨이 '성명' 단독인 경우(임차인/임대인 접두 없이).
const BARE_NAME_RE = /((?<![가-힣])성명\s*[:：]?\s*)([가-힣]+(?:\s+[가-힣]+)*)/g;

/**
 * 상세주소 휴리스틱: 행정구역 키워드(시/구/동/로/길/읍/면/리)와 번지(숫자[-숫자])를
 * 함께 포함하는 라인을 주소로 보고 라인 전체를 마스킹한다. 금액/날짜만 있는 라인은 제외.
 */
const ADDRESS_LINE_RE =
  /^(.*?(?:특별시|광역시|[가-힣]+시|[가-힣]+도)?\s*[가-힣]+(?:구|군)?\s*[가-힣]*(?:동|읍|면|리)?\s*[가-힣]*(?:로|길)\s*\d.*)$/;

function maskNameByLabel(
  text: string,
  re: RegExp,
): { text: string; matched: boolean } {
  let matched = false;
  const next = text.replace(re, (_full, label: string, _name: string) => {
    matched = true;
    return `${label}${MASK_TOKEN}`;
  });
  return { text: next, matched };
}

/**
 * 텍스트에서 PII 를 마스킹하고, 마스킹된 카테고리 목록을 반환한다.
 * 입력은 normalizeContractText 를 거친 정규화 텍스트를 기대하지만, 원문에도 안전하게 동작한다.
 */
export function maskPii(text: string): MaskResult {
  const categories = new Set<MaskedFieldCategory>();

  // 1) 당사자 성명(라벨 기반) — 주소/전화 마스킹 전에 처리(라벨 문맥이 온전할 때).
  let working = text;
  const tenant = maskNameByLabel(working, TENANT_NAME_RE);
  working = tenant.text;
  if (tenant.matched) categories.add("tenantName");

  const landlord = maskNameByLabel(working, LANDLORD_NAME_RE);
  working = landlord.text;
  if (landlord.matched) categories.add("landlordName");

  const bare = maskNameByLabel(working, BARE_NAME_RE);
  working = bare.text;
  if (bare.matched) {
    // '성명' 단독 라벨은 임차인 성명으로 간주(데모 계약서 관례).
    categories.add("tenantName");
  }

  // 2) 상세주소(라인 휴리스틱).
  working = working
    .split("\n")
    .map((line) => {
      if (ADDRESS_LINE_RE.test(line)) {
        categories.add("fullAddress");
        return maskAddressLine(line);
      }
      return line;
    })
    .join("\n");

  // 3) 전화번호.
  if (PHONE_RE.test(working)) {
    categories.add("phoneNumber");
  }
  PHONE_RE.lastIndex = 0;
  working = working.replace(PHONE_RE, MASK_TOKEN);

  return {
    masked: working,
    maskedFields: [...categories],
  };
}

/**
 * 주소 라인 마스킹: '상세주소'/'주소' 라벨이 있으면 라벨 뒤 값만 가리고,
 * 없으면 라인 전체를 마스킹한다(원문 주소 토큰이 남지 않게 보수적으로 처리).
 */
function maskAddressLine(line: string): string {
  const labelMatch = line.match(/^(\s*(?:상세\s*)?주소\s*[:：]?\s*)(.*)$/);
  if (labelMatch) {
    return `${labelMatch[1]}${MASK_TOKEN}`;
  }
  return MASK_TOKEN;
}
