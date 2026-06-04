import type {
  AuditLogResponse,
  ConfirmReviewRequest,
  ConfirmReviewResponse,
  ConsentToVerificationRequest,
  ConsentToVerificationResponse,
  CreateHousingPassRequest,
  CreateHousingPassResponse,
  CreateVerificationRequestRequest,
  CreateVerificationRequestResponse,
  HousingContractReviewRequest,
  HousingContractReviewResponse,
  IdentityAuthCompleteRequest,
  IdentityAuthCompleteResponse,
  IdentityAuthStartRequest,
  IdentityAuthStartResponse,
  OcrContractResponse,
  UserMeResponse,
  VerificationRequestDetailResponse,
  VerificationResultResponse,
} from "@settlepass/api-contracts";
import { apiClient } from "./api-client";

/**
 * api-contracts 타입 기반 클라이언트.
 * apiClient 가 baseUrl 을 prepend 하므로 경로는 `/api/...` 로 시작한다.
 * 모든 호출은 클라이언트 사이드에서만 사용한다(빌드 시 API 서버 불필요).
 */
function postJson<T>(path: string, body: unknown): Promise<T> {
  return apiClient<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * multipart/form-data POST.
 * Content-Type 을 설정하지 않는다 — 브라우저가 boundary 를 포함해 자동 설정한다.
 */
async function postForm<T>(path: string, form: FormData): Promise<T> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  const res = await fetch(`${baseUrl}${path}`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`API request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  startAuth(
    body: IdentityAuthStartRequest,
  ): Promise<IdentityAuthStartResponse> {
    return postJson<IdentityAuthStartResponse>("/api/identity/auth/start", body);
  },

  completeAuth(
    body: IdentityAuthCompleteRequest,
  ): Promise<IdentityAuthCompleteResponse> {
    return postJson<IdentityAuthCompleteResponse>(
      "/api/identity/auth/complete",
      body,
    );
  },

  getMe(userDid: string): Promise<UserMeResponse> {
    return apiClient<UserMeResponse>(
      `/api/users/me?userDid=${encodeURIComponent(userDid)}`,
    );
  },

  createHousingPass(
    body: CreateHousingPassRequest,
  ): Promise<CreateHousingPassResponse> {
    return postJson<CreateHousingPassResponse>("/api/housing-passes", body);
  },

  getHousingPass(id: string): Promise<CreateHousingPassResponse> {
    return apiClient<CreateHousingPassResponse>(
      `/api/housing-passes/${encodeURIComponent(id)}`,
    );
  },

  createVerificationRequest(
    body: CreateVerificationRequestRequest,
  ): Promise<CreateVerificationRequestResponse> {
    return postJson<CreateVerificationRequestResponse>(
      "/api/verification-requests",
      body,
    );
  },

  getVerificationRequest(
    id: string,
  ): Promise<VerificationRequestDetailResponse> {
    return apiClient<VerificationRequestDetailResponse>(
      `/api/verification-requests/${encodeURIComponent(id)}`,
    );
  },

  consent(
    requestId: string,
    body: ConsentToVerificationRequest,
  ): Promise<ConsentToVerificationResponse> {
    return postJson<ConsentToVerificationResponse>(
      `/api/verification-requests/${encodeURIComponent(requestId)}/consent`,
      body,
    );
  },

  getVerificationResult(id: string): Promise<VerificationResultResponse> {
    return apiClient<VerificationResultResponse>(
      `/api/verification-requests/${encodeURIComponent(id)}/result`,
    );
  },

  ocrContract(form: FormData): Promise<OcrContractResponse> {
    return postForm<OcrContractResponse>("/api/contracts/ocr", form);
  },

  generateReview(
    body: HousingContractReviewRequest,
  ): Promise<HousingContractReviewResponse> {
    return postJson<HousingContractReviewResponse>(
      "/api/ai-reviews/housing-contract",
      body,
    );
  },

  getReview(id: string): Promise<HousingContractReviewResponse> {
    return apiClient<HousingContractReviewResponse>(
      `/api/ai-reviews/${encodeURIComponent(id)}`,
    );
  },

  confirmReview(
    reviewId: string,
    body: ConfirmReviewRequest,
  ): Promise<ConfirmReviewResponse> {
    return postJson<ConfirmReviewResponse>(
      `/api/ai-reviews/${encodeURIComponent(reviewId)}/confirm`,
      body,
    );
  },

  getAuditLogs(
    userDid: string,
    logType?: "CONSENT" | "VERIFICATION" | "REVIEW",
  ): Promise<AuditLogResponse> {
    const params = new URLSearchParams({ userDid });
    if (logType) params.set("logType", logType);
    return apiClient<AuditLogResponse>(`/api/audit-logs?${params.toString()}`);
  },
};
