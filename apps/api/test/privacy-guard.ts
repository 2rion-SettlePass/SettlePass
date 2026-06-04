/**
 * 전 슬라이스 재사용 privacy 가드.
 * 객체/배열을 깊이 우선으로 순회하며 금지 키(원문/민감정보)가 객체 키로
 * 등장하면 즉시 throw 한다. (영속 row · API 응답 검증용)
 */
export const FORBIDDEN_KEYS = [
  "alienRegistrationNumber",
  "residentRegistrationNumber",
  "passportNumber",
  "nationality",
  "fullAddress",
  "visaStatusRaw",
  "idCardImage",
] as const;

export function assertNoForbiddenData(value: unknown): void {
  walk(value, new Set());
}

function walk(value: unknown, seen: Set<object>): void {
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) walk(item, seen);
    return;
  }

  for (const key of Object.keys(value as Record<string, unknown>)) {
    if ((FORBIDDEN_KEYS as readonly string[]).includes(key)) {
      throw new Error(`Forbidden data key found: ${key}`);
    }
    walk((value as Record<string, unknown>)[key], seen);
  }
}
