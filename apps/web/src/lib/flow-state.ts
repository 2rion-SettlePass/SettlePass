/**
 * 데모 단계 간 상태 전달용 경량 client-side store (localStorage).
 * 무거운 store 금지 — userDid 등 단계 식별자만 carry 한다.
 * SSR/빌드 시 window 가 없으므로 모든 접근을 가드한다.
 */
export interface FlowState {
  userId?: string;
  userDid?: string;
  housingPassId?: string;
  requestId?: string;
  ocrDocumentId?: string;
  reviewId?: string;
}

const KEY = "settlepass.flow";

export function getFlow(): FlowState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FlowState) : {};
  } catch {
    return {};
  }
}

export function setFlow(partial: Partial<FlowState>): FlowState {
  if (typeof window === "undefined") return { ...partial };
  const next = { ...getFlow(), ...partial };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage 불가 환경은 무시(데모 진행에 치명적이지 않음).
  }
  return next;
}

export function clearFlow(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
