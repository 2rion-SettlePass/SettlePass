"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Screen, StatusBar, Header, HomeBar, Btn, SecLabel, I } from "@/components/settlepass/chrome";
import type { HousingClaimKey } from "@settlepass/api-contracts";
import { api } from "@/lib/api";
import { getFlow, setFlow } from "@/lib/flow-state";
import { routes } from "@/lib/routes";

const DEMO_TARGET_DID = "did:settlepass:user:mock-001";

const ALLOWED: { label: string; meta: HousingClaimKey }[] = [
  { label: "본인확인 완료", meta: "identityVerified" },
  { label: "성인 여부", meta: "ageOver19" },
  { label: "체류 유효 여부", meta: "residenceValid" },
  { label: "거주지역", meta: "regionLevel1" },
];
const BLOCKED = ["국적", "외국인등록번호", "상세주소", "체류자격 원문"];

export default function CreateVerificationRequestPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<HousingClaimKey[]>(
    ALLOWED.map((c) => c.meta),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: HousingClaimKey) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const submit = () => {
    if (selected.length === 0) {
      setError("요청할 정보를 1개 이상 선택하세요.");
      return;
    }
    setLoading(true);
    setError(null);
    const targetUserDid = getFlow().userDid ?? DEMO_TARGET_DID;
    api
      .createVerificationRequest({
        verifierId: "verifier_landlord_001",
        targetUserDid,
        purpose: "HOUSING_CONTRACT",
        requestedClaims: selected,
      })
      .then((res) => {
        setFlow({ requestId: res.requestId });
        router.push(routes.consentRequest(res.requestId));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "검증 요청 생성에 실패했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="landlord" />
      <div className="sp-context">
        <I.Building size={15} stroke={2} />임대인 포털 · 검증 요청 생성
      </div>
      <div className="sp-body" style={{ gap: 16 }}>
        <div>
          <span className="sp-eyebrow">검증 요청</span>
          <h2 className="sp-h2" style={{ marginTop: 4 }}>필요한 정보만 요청하세요</h2>
        </div>

        <div className="sp-card is-flat" style={{ gap: 6 }}>
          <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)" }}>요청 목적</span>
          <span className="sp-text" style={{ fontWeight: 700 }}>월세계약 전 자격 확인</span>
        </div>

        <div className="sp-card" style={{ gap: 2 }}>
          <SecLabel kind="show">요청할 정보</SecLabel>
          {ALLOWED.map((c) => {
            const on = selected.includes(c.meta);
            return (
              <button
                key={c.meta}
                type="button"
                onClick={() => toggle(c.meta)}
                className="sp-check"
                style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer", width: "100%" }}
              >
                <span className="sp-check-box">{on ? <I.Check size={13} stroke={2.6} /> : null}</span>
                <span className="sp-grow">
                  <span className="sp-check-text" style={{ fontWeight: 700 }}>{c.label}</span>
                  <span className="sp-check-meta">{c.meta}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="sp-card" style={{ gap: 2, background: "var(--gray-5)", border: "none" }}>
          <SecLabel kind="hide">요청하지 않는 정보 · 민감정보</SecLabel>
          {BLOCKED.map((c) => (
            <div key={c} className="sp-check is-locked">
              <span className="sp-check-box"><I.Lock size={13} /></span>
              <span className="sp-grow"><span className="sp-check-text">{c}</span></span>
              <span className="sp-badge sp-badge-gray">선택 불가</span>
            </div>
          ))}
        </div>

        {error ? (
          <span className="sp-cap" style={{ color: "var(--danger, #c0392b)" }}>{error}</span>
        ) : (
          <div className="sp-notice">
            <I.Lock size={16} stroke={2} style={{ color: "var(--caption)", flex: "0 0 16px", marginTop: 1 }} />
            <span className="sp-info-body">임대인은 월세계약 확인에 필요한 최소 정보만 요청할 수 있습니다. 민감정보는 선택할 수 없습니다.</span>
          </div>
        )}
      </div>

      <div className="sp-footer">
        <Btn variant="primary" onClick={submit} iconR={<I.ArrowR size={18} stroke={2} />}>
          {loading ? "생성 중…" : "검증 요청 생성"}
        </Btn>
      </div>
      <HomeBar />
    </Screen>
  );
}
