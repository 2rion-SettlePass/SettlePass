"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, I } from "@/components/settlepass/chrome";
import type { ConfirmReviewResponse } from "@settlepass/api-contracts";
import { api } from "@/lib/api";
import { getFlow } from "@/lib/flow-state";
import { routes } from "@/lib/routes";

const DEMO_USER_DID = "did:settlepass:user:mock-001";

/** FR-RH-02: 네 가지 확인이 모두 true 여야 reviewHash 가 생성된다(클라이언트 미러). */
type CheckKey =
  | "summaryChecked"
  | "riskItemsChecked"
  | "residenceWarningChecked"
  | "legalDisclaimerAccepted";

const CHECKS: { key: CheckKey; label: string }[] = [
  { key: "summaryChecked", label: "계약 핵심조건을 확인했습니다." },
  { key: "riskItemsChecked", label: "위험조항 요약을 확인했습니다." },
  { key: "residenceWarningChecked", label: "체류기간·계약기간 정합성 경고를 확인했습니다." },
  { key: "legalDisclaimerAccepted", label: "이 분석은 법률 자문이 아니라는 점을 이해했습니다." },
];

export default function ReviewConfirmPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId: routeParam } = use(params);
  const router = useRouter();
  const [checked, setChecked] = useState<Record<CheckKey, boolean>>({
    summaryChecked: false,
    riskItemsChecked: false,
    residenceWarningChecked: false,
    legalDisclaimerAccepted: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ConfirmReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allChecked = CHECKS.every((c) => checked[c.key]);

  function toggle(key: CheckKey): void {
    if (result) return;
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function onConfirm(): void {
    if (!allChecked || submitting || result) return;
    const flow = getFlow();
    const reviewId = flow.reviewId ?? routeParam;
    const userDid = flow.userDid ?? DEMO_USER_DID;
    setSubmitting(true);
    setError(null);
    api
      .confirmReview(reviewId, {
        userDid,
        confirmations: {
          summaryChecked: true,
          riskItemsChecked: true,
          residenceWarningChecked: true,
          legalDisclaimerAccepted: true,
        },
      })
      .then((res) => {
        setResult(res);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "최종 확인에 실패했습니다.");
      })
      .finally(() => {
        setSubmitting(false);
      });
  }

  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="verified" />
      <Steps current={5} />
      <div className="sp-body" style={{ gap: 16 }}>
        <div>
          <span className="sp-eyebrow">STEP 5 · 리뷰 이력 기록</span>
          <h2 className="sp-h2" style={{ marginTop: 4 }}>AI 리뷰 최종 확인</h2>
        </div>

        <div className="sp-card" style={{ gap: 0 }}>
          {CHECKS.map((c, i) => (
            <div
              key={c.key}
              className="sp-check"
              onClick={() => toggle(c.key)}
              style={{
                borderBottom: i < CHECKS.length - 1 ? "1px solid var(--divider)" : "none",
                cursor: result ? "default" : "pointer",
              }}
            >
              <span
                className="sp-check-box"
                style={{
                  background: checked[c.key] ? "var(--blue-60)" : "transparent",
                  borderColor: checked[c.key] ? "var(--blue-60)" : "var(--border)",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {checked[c.key] && <I.Check size={13} stroke={2.6} />}
              </span>
              <span className="sp-check-text">{c.label}</span>
            </div>
          ))}
        </div>

        <div className="sp-info">
          <I.Hash size={16} stroke={2} style={{ color: "var(--blue-50)", flex: "0 0 16px", marginTop: 1 }} />
          <span className="sp-info-body">
            계약서 공증이 아니라 AI 리뷰 확인 이력입니다. reviewHash는 사용자가 AI 리뷰를 확인했다는 기록입니다.
          </span>
        </div>

        {result && (
          <div className="sp-card is-flat" style={{ gap: 6 }}>
            <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)" }}>reviewHash</span>
            <span className="sp-text" style={{ wordBreak: "break-all" }}>{result.reviewHash}</span>
            <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)", marginTop: 4 }}>mockTxHash</span>
            <span className="sp-text" style={{ wordBreak: "break-all" }}>{result.mockTxHash}</span>
          </div>
        )}

        {error && (
          <span className="sp-cap" style={{ color: "var(--danger, #c0392b)" }}>{error}</span>
        )}

        <div className="sp-disclaimer">
          이 분석은 계약 이해를 돕기 위한 참고 정보이며 <b style={{ color: "var(--sub)" }}>법률 자문이 아닙니다.</b> 필요한 경우 공인중개사·법률 전문가·학교 국제처 또는 외국인지원센터에 확인하세요.
        </div>
      </div>

      <div className="sp-footer">
        {result ? (
          <Btn
            variant="primary"
            icon={<I.List size={18} stroke={2} />}
            onClick={() => router.push(routes.auditLog)}
          >
            감사 로그 보기
          </Btn>
        ) : (
          <button
            className="sp-btn sp-btn-primary sp-btn-block"
            type="button"
            disabled={!allChecked || submitting}
            onClick={onConfirm}
            style={{ opacity: allChecked && !submitting ? 1 : 0.5, cursor: allChecked && !submitting ? "pointer" : "not-allowed" }}
          >
            <I.ShieldChk size={18} stroke={2} />
            {submitting ? "처리 중…" : "AI 리뷰 확인 완료"}
          </button>
        )}
      </div>
      <HomeBar />
    </Screen>
  );
}
