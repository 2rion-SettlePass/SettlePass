"use client";

import { use, useEffect, useState } from "react";
import { Screen, StatusBar, Header, HomeBar, Claim, SecLabel, I } from "@/components/settlepass/chrome";
import type {
  HousingClaimKey,
  PrivateClaimKey,
  VerificationResultResponse,
} from "@settlepass/api-contracts";
import { api } from "@/lib/api";

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

function valueOf(v: boolean | string | undefined): string {
  if (v === undefined) return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return v;
}

export default function VerifierRequestResultPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);
  const [result, setResult] = useState<VerificationResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getVerificationResult(requestId)
      .then(setResult)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "결과를 불러오지 못했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [requestId]);

  const verifiedEntries = result
    ? (Object.entries(result.verifiedClaims) as [HousingClaimKey, boolean | string][])
    : [];

  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="landlord" />
      <div className="sp-context">
        <I.Building size={15} stroke={2} />임대인 포털 · 검증 결과
      </div>
      <div className="sp-body" style={{ gap: 16 }}>
        <div>
          <span className="sp-eyebrow">검증 결과</span>
          <h2 className="sp-h2" style={{ marginTop: 4 }}>제출된 자격 확인</h2>
        </div>

        {loading ? (
          <span className="sp-cap">불러오는 중…</span>
        ) : error ? (
          <span className="sp-cap" style={{ color: "var(--danger, #c0392b)" }}>{error}</span>
        ) : result && result.status === "PENDING" ? (
          <div className="sp-card" style={{ gap: 10 }}>
            <span className="sp-cardtitle">사용자 동의 대기</span>
            <span className="sp-cap">사용자가 아직 정보공개에 동의하지 않았습니다.</span>
          </div>
        ) : result && result.status === "REJECTED" ? (
          <div className="sp-card" style={{ gap: 10 }}>
            <span className="sp-cardtitle">요청 거절됨</span>
            <span className="sp-cap">사용자가 정보공개를 거절했습니다.</span>
          </div>
        ) : result && result.status === "VERIFIED" ? (
          <>
            <div className="sp-card is-pad-lg" style={{ gap: 12, borderColor: "var(--blue-50)", borderWidth: 1.5 }}>
              <div className="sp-card-head">
                <span className="sp-card-head-l">
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--blue-50)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <I.ShieldChk size={17} stroke={2} />
                  </span>
                  <span className="sp-cardtitle">검증된 정보</span>
                </span>
                <span className="sp-badge sp-badge-success">VERIFIED</span>
              </div>
              <div className="sp-claims">
                {verifiedEntries.map(([key, value]) => (
                  <Claim
                    key={key}
                    label={CLAIM_LABELS[key] ?? key}
                    meta={key}
                    value={valueOf(value)}
                  />
                ))}
              </div>
            </div>

            <div className="sp-card" style={{ gap: 4, background: "var(--gray-5)", border: "none" }}>
              <SecLabel kind="hide">공유되지 않은 정보</SecLabel>
              <div className="sp-claims">
                {result.hiddenClaims.map((claim) => (
                  <Claim key={claim} label={HIDDEN_LABELS[claim] ?? claim} priv />
                ))}
              </div>
            </div>

            <div className="sp-card is-flat" style={{ gap: 6 }}>
              <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)" }}>verificationHash</span>
              <span className="sp-text" style={{ wordBreak: "break-all" }}>{result.verificationHash}</span>
              <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)", marginTop: 4 }}>mockTxHash</span>
              <span className="sp-text" style={{ wordBreak: "break-all" }}>{result.mockTxHash}</span>
            </div>
          </>
        ) : null}
      </div>
      <HomeBar />
    </Screen>
  );
}
