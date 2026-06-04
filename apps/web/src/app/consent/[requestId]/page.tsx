"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, SecLabel, I } from "@/components/settlepass/chrome";
import type {
  ConsentToVerificationResponse,
  HousingClaimKey,
  PrivateClaimKey,
  VerificationRequestDetailResponse,
} from "@settlepass/api-contracts";
import { api } from "@/lib/api";
import { getFlow } from "@/lib/flow-state";
import { routes } from "@/lib/routes";

const DEMO_USER_DID = "did:settlepass:user:mock-001";

const CLAIM_LABELS: Record<HousingClaimKey, string> = {
  identityVerified: "본인확인 완료",
  ageOver19: "성인 여부",
  residenceValid: "체류 유효 여부",
  regionLevel1: "거주지역",
  residenceExpiryMonth: "체류 만료 월",
};

const HIDDEN_LABELS: Partial<Record<PrivateClaimKey, string>> = {
  alienRegistrationNumber: "외국인등록번호",
  residentRegistrationNumber: "주민등록번호",
  passportNumber: "여권번호",
  nationality: "국적",
  fullAddress: "상세주소",
  visaStatusRaw: "체류자격 원문",
  idCardImage: "신분증 이미지",
};

export default function ConsentRequestPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);
  const router = useRouter();
  const [detail, setDetail] = useState<VerificationRequestDetailResponse | null>(null);
  const [result, setResult] = useState<ConsentToVerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getVerificationRequest(requestId)
      .then(setDetail)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "요청 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [requestId]);

  const decide = (consent: boolean) => {
    if (!detail) return;
    setSubmitting(true);
    setError(null);
    const userDid = getFlow().userDid ?? DEMO_USER_DID;
    api
      .consent(requestId, {
        userDid,
        consent,
        consentedClaims: consent ? detail.requestedClaims : [],
      })
      .then((res) => {
        setResult(res);
        if (res.status === "CONSENTED") {
          router.push(routes.verifierRequest(requestId));
        }
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("409")) {
          // 이미 동의/처리된 요청 — 결과 화면으로 안내.
          router.push(routes.verifierRequest(requestId));
        } else {
          setError(msg || "처리에 실패했습니다.");
        }
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  // CREATED/SENT 가 아니면 이미 동의/거절/검증된 요청 → 동의 버튼 숨기고 결과로 안내.
  const processed =
    !!detail && detail.status !== "CREATED" && detail.status !== "SENT";

  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="verified" />
      <Steps current={3} />
      <div className="sp-body" style={{ gap: 16 }}>
        <div>
          <span className="sp-eyebrow">STEP 3 · 정보공개 동의</span>
          <h2 className="sp-h2" style={{ marginTop: 4 }}>공유할 정보를 확인하세요</h2>
        </div>

        {loading ? (
          <span className="sp-cap">불러오는 중…</span>
        ) : error && !detail ? (
          <span className="sp-cap" style={{ color: "var(--danger, #c0392b)" }}>{error}</span>
        ) : detail ? (
          <>
            <div className="sp-requester">
              <span className="sp-requester-av"><I.Building size={22} /></span>
              <span className="sp-grow">
                <span className="sp-cardtitle">{detail.verifierName}</span>
                <span className="sp-sub" style={{ display: "block", marginTop: 1 }}>요청 목적 · 월세계약 전 자격 확인</span>
              </span>
              <span className="sp-badge sp-badge-info">요청</span>
            </div>

            <div className="sp-card" style={{ gap: 2 }}>
              <SecLabel kind="show">공유할 정보</SecLabel>
              {detail.requestedClaims.map((claim) => (
                <div key={claim} className="sp-sharerow">
                  <span className="sp-sharerow-ico is-on"><I.Check size={18} /></span>
                  <span className="sp-grow">
                    <span className="sp-claim-label">{CLAIM_LABELS[claim] ?? claim}</span>
                    <span className="sp-claim-meta" style={{ display: "block" }}>{claim}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="sp-card" style={{ gap: 2, background: "var(--gray-5)", border: "none" }}>
              <SecLabel kind="hide">공개되지 않는 정보</SecLabel>
              {detail.hiddenClaims.map((claim) => (
                <div key={claim} className="sp-sharerow is-locked">
                  <span className="sp-sharerow-ico is-locked"><I.Lock size={16} /></span>
                  <span className="sp-grow">
                    <span className="sp-claim-label" style={{ color: "var(--caption)" }}>{HIDDEN_LABELS[claim] ?? claim}</span>
                  </span>
                  <span className="sp-badge sp-badge-gray">비공개</span>
                </div>
              ))}
            </div>

            {processed && !result ? (
              <div className="sp-notice">
                <I.Info size={16} stroke={2} style={{ color: "var(--caption)", flex: "0 0 16px", marginTop: 1 }} />
                <span className="sp-info-body">이미 처리된 요청입니다 (상태: {detail.status}). 아래 “검증 결과 보기”로 확인하세요.</span>
              </div>
            ) : result && result.status === "REJECTED" ? (
              <div className="sp-notice">
                <I.Info size={16} stroke={2} style={{ color: "var(--caption)", flex: "0 0 16px", marginTop: 1 }} />
                <span className="sp-info-body">요청을 거절했습니다.</span>
              </div>
            ) : result && result.status === "CONSENTED" ? (
              <div className="sp-card is-flat" style={{ gap: 6 }}>
                <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)" }}>consentHash</span>
                <span className="sp-text" style={{ wordBreak: "break-all" }}>{result.consentHash}</span>
                <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)", marginTop: 4 }}>mockTxHash</span>
                <span className="sp-text" style={{ wordBreak: "break-all" }}>{result.mockTxHash}</span>
              </div>
            ) : error ? (
              <span className="sp-cap" style={{ color: "var(--danger, #c0392b)" }}>{error}</span>
            ) : (
              <div className="sp-notice">
                <I.Info size={16} stroke={2} style={{ color: "var(--caption)", flex: "0 0 16px", marginTop: 1 }} />
                <span className="sp-info-body">동의 시 선택한 항목에 대해서만 consentHash가 생성됩니다.</span>
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className="sp-footer">
        {detail && !processed && !result ? (
          <>
            <Btn variant="primary" icon={<I.ShieldChk size={18} stroke={2} />} onClick={() => decide(true)}>
              {submitting ? "처리 중…" : "동의하고 제출"}
            </Btn>
            <Btn variant="danger" onClick={() => decide(false)}>거절</Btn>
          </>
        ) : detail ? (
          <Btn variant="primary" iconR={<I.ArrowR size={18} stroke={2} />} onClick={() => router.push(routes.verifierRequest(requestId))}>
            검증 결과 보기
          </Btn>
        ) : null}
      </div>
      <HomeBar />
    </Screen>
  );
}
