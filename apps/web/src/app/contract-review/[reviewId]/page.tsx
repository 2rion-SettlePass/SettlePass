"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, I } from "@/components/settlepass/chrome";
import type {
  ContractReviewRiskItem,
  HousingContractReviewResponse,
  RiskLevel,
} from "@settlepass/api-contracts";
import { api } from "@/lib/api";
import { getFlow, setFlow } from "@/lib/flow-state";
import { routes } from "@/lib/routes";

const DEMO_USER_DID = "did:settlepass:user:mock-001";

const RISK_LEVEL_CLASS: Record<RiskLevel, string> = {
  HIGH: "high",
  MEDIUM: "med",
  LOW: "low",
};

const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  HIGH: "높음",
  MEDIUM: "중간",
  LOW: "낮음",
};

/** P4 업로드 페이지가 보관한 ocrDocumentId(flow 필드 또는 별도 키)를 회수한다. */
function storedOcrDocumentId(): string | undefined {
  const fromFlow = getFlow().ocrDocumentId;
  if (fromFlow) return fromFlow;
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem("settlepass.ocrDocumentId") ?? undefined;
  } catch {
    return undefined;
  }
}

type Lang = "ko" | "en";

export default function AiReviewResultPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  // 라우트 세그먼트는 P4 가 navigate 한 ocrDocumentId 이다(reviewId 슬롯이지만 업로드 직후엔 ocrDocumentId).
  const { reviewId: routeParam } = use(params);
  const router = useRouter();
  const [review, setReview] = useState<HousingContractReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingContext, setMissingContext] = useState(false);
  const [activeLang, setActiveLang] = useState<Lang>("ko");

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const flow = getFlow();
      const userDid = flow.userDid ?? DEMO_USER_DID;
      const housingPassId = flow.housingPassId;
      const ocrDocumentId = storedOcrDocumentId() ?? routeParam;

      try {
        // 이미 생성된 리뷰가 있으면 그대로 조회한다.
        if (flow.reviewId) {
          const got = await api.getReview(flow.reviewId);
          if (!cancelled) setReview(got);
          return;
        }

        // 신규 생성에는 housingPassId + ocrDocumentId 가 필요하다.
        if (!housingPassId || !ocrDocumentId) {
          if (!cancelled) setMissingContext(true);
          return;
        }

        const created = await api.generateReview({
          userDid,
          housingPassId,
          ocrDocumentId,
          preferredLanguage: "ko",
        });
        if (cancelled) return;
        setReview(created);
        setFlow({ reviewId: created.reviewId });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "리뷰를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [routeParam]);

  function onConfirm(): void {
    if (!review) return;
    router.push(routes.reviewConfirm(review.reviewId));
  }

  const summaryRows = review ? buildSummaryRows(review.summary) : [];
  const warning = review?.residencePeriodCheck;

  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="verified" />
      <Steps current={4} />
      <div className="sp-body" style={{ gap: 16 }}>
        <div>
          <span className="sp-eyebrow">STEP 4 · AI 계약 리뷰</span>
          <h2 className="sp-h2" style={{ marginTop: 4 }}>계약 리뷰 결과</h2>
        </div>

        {loading && <span className="sp-cap">AI 리뷰를 생성하는 중…</span>}

        {missingContext && (
          <div className="sp-notice" style={{ borderColor: "var(--danger)" }}>
            <I.Alert size={16} stroke={2} style={{ color: "var(--danger)", flex: "0 0 16px", marginTop: 1 }} />
            <span className="sp-info-body">
              계약서 정보가 없습니다. 먼저 계약서를 업로드해 주세요.{" "}
              <Link href={routes.contractUpload} style={{ color: "var(--blue-60)", fontWeight: 700 }}>
                업로드 단계로 이동
              </Link>
            </span>
          </div>
        )}

        {error && !review && (
          <span className="sp-cap" style={{ color: "var(--danger)" }}>{error}</span>
        )}

        {review && (
          <>
            {/* 핵심 조건 */}
            <div className="sp-col" style={{ gap: 10 }}>
              <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)" }}>핵심 조건</span>
              <div className="sp-sumgrid">
                {summaryRows.map((s) => (
                  <div key={s.k} className={`sp-sumcell${s.full ? " is-full" : ""}`}>
                    <span className="sp-sumcell-k">{s.k}</span>
                    <span className="sp-sumcell-v">{s.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 체류기간·계약기간 정합성 경고 (WARNING 일 때만 강조) */}
            {warning && warning.status === "WARNING" && (
              <div className="sp-warn-panel">
                <I.Alert size={18} stroke={2} style={{ color: "var(--warn-text)", flex: "0 0 18px", marginTop: 1 }} />
                <span className="sp-info-body">
                  <b>체류기간·계약기간 충돌</b>
                  <br />
                  체류 만료월 <b>{warning.residenceExpiryMonth}</b> vs 계약 종료월{" "}
                  <b>{warning.contractEndMonth}</b>
                  <br />
                  {warning.reason}
                </span>
              </div>
            )}

            {/* 위험 조항 */}
            <div className="sp-col" style={{ gap: 10 }}>
              <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)" }}>확인 필요 항목</span>
              {review.riskItems.map((r, i) => (
                <RiskCard key={`${r.category}-${i}`} risk={r} />
              ))}
            </div>

            {/* 다국어 요약 (ko + en) */}
            <div className="sp-card" style={{ gap: 10 }}>
              <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)" }}>다국어 요약</span>
              <div className="sp-tabs">
                <span
                  className={`sp-tab${activeLang === "ko" ? " is-active" : ""}`}
                  onClick={() => setActiveLang("ko")}
                >
                  한국어
                </span>
                <span
                  className={`sp-tab${activeLang === "en" ? " is-active" : ""}`}
                  onClick={() => setActiveLang("en")}
                >
                  EN
                </span>
              </div>
              <p className="sp-sub" style={{ marginTop: 2 }}>
                {review.translatedSummary[activeLang] ??
                  review.translatedSummary.ko ??
                  "요약 정보가 없습니다."}
              </p>
            </div>

            {/* 고지 (항상 노출) */}
            <div className="sp-disclaimer">{review.disclaimer}</div>
          </>
        )}
      </div>

      {review && (
        <div className="sp-footer">
          <Btn variant="primary" iconR={<I.ArrowR size={18} stroke={2} />} onClick={onConfirm}>
            AI 리뷰 최종 확인
          </Btn>
        </div>
      )}
      <HomeBar />
    </Screen>
  );
}

function RiskCard({ risk }: { risk: ContractReviewRiskItem }): React.JSX.Element {
  const lv = RISK_LEVEL_CLASS[risk.level];
  return (
    <div className={`sp-riskitem is-${lv}`}>
      <div className="sp-riskitem-head">
        <span className={`sp-risk-pill sp-risk-${lv}`}>{RISK_LEVEL_LABEL[risk.level]}</span>
        <span className="sp-riskitem-cat">{risk.category}</span>
      </div>
      <span className="sp-riskitem-desc">{risk.reason}</span>
      <span className="sp-quote">{risk.evidenceText}</span>
      <span className="sp-ask">
        <I.Info size={14} stroke={2} style={{ flex: "0 0 14px", marginTop: 2 }} />
        질문 예시 · {risk.recommendedQuestion}
      </span>
    </div>
  );
}

type SummaryRow = { k: string; v: string; full?: boolean };

function buildSummaryRows(
  summary: HousingContractReviewResponse["summary"],
): SummaryRow[] {
  const rows: SummaryRow[] = [];
  if (summary.deposit) rows.push({ k: "보증금", v: formatKrw(summary.deposit) });
  if (summary.monthlyRent) rows.push({ k: "월세", v: formatKrw(summary.monthlyRent) });
  if (summary.maintenanceFee) rows.push({ k: "관리비", v: formatKrw(summary.maintenanceFee) });
  if (summary.contractStartDate || summary.contractEndDate) {
    rows.push({
      k: "계약기간",
      v: `${summary.contractStartDate ?? "?"} ~ ${summary.contractEndDate ?? "?"}`,
      full: true,
    });
  }
  if (summary.addressSummary) {
    rows.push({ k: "주소", v: summary.addressSummary, full: true });
  }
  return rows;
}

/** 숫자 문자열이면 천단위 구분 + 원 표기, 아니면 원본 그대로. */
function formatKrw(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n) || value.trim() === "") return value;
  return `${n.toLocaleString("ko-KR")}원`;
}
