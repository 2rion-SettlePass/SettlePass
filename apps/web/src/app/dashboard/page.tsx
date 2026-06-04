"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Screen, StatusBar, Header, HomeBar, Btn, Claim, I } from "@/components/settlepass/chrome";
import type { ReactNode } from "react";
import type { UserMeResponse } from "@settlepass/api-contracts";
import { DEMO_USER } from "@settlepass/shared";
import { api } from "@/lib/api";
import { getFlow } from "@/lib/flow-state";
import { routes } from "@/lib/routes";

function valueOf(v: boolean | string | undefined): string {
  if (v === undefined) return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return v;
}

export default function DashboardPage() {
  const [me, setMe] = useState<UserMeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userDid, setUserDid] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    const flow = getFlow();
    setUserDid(flow.userDid ?? null);
    setRequestId(flow.requestId ?? null);
    const did = flow.userDid;
    if (!did) return;
    let active = true;
    api
      .getMe(did)
      .then((res) => {
        if (active) setMe(res);
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : "사용자 정보를 불러오지 못했습니다.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // "임대인 요청" 카드는 flow 기반: 생성된 요청이 있으면 해당 consent, 없으면 요청 생성 화면.
  const cards: { ico: ReactNode; t: string; s: string; badge: ReactNode; href: string }[] = [
    { ico: <I.ShieldChk size={18} />, t: "모바일 신분증 인증", s: "", badge: null, href: routes.auth },
    { ico: <I.Key size={18} />, t: "Housing Pass", s: "", badge: null, href: routes.housingPass },
    { ico: <I.Building size={18} />, t: "임대인 요청", s: "", badge: null, href: requestId ? routes.consentRequest(requestId) : routes.verifierNewRequest },
    { ico: <I.Sparkle size={18} />, t: "AI 계약 리뷰", s: "", badge: null, href: routes.contractUpload },
    { ico: <I.List size={18} />, t: "Audit Log", s: "", badge: null, href: routes.auditLog },
  ];

  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="verified" />
      <div className="sp-body" style={{ gap: 18 }}>
        {!userDid ? (
          <div className="sp-card" style={{ gap: 10 }}>
            <span className="sp-cardtitle">아직 인증되지 않았습니다</span>
            <span className="sp-cap">먼저 모바일 신분증 인증을 완료하세요.</span>
            <Link href={routes.auth} style={{ textDecoration: "none" }}>
              <Btn variant="primary" iconR={<I.ArrowR size={18} stroke={2} />}>인증하러 가기</Btn>
            </Link>
          </div>
        ) : (
          <div className="sp-card" style={{ gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--blue-5)", color: "var(--blue-60)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 48px" }}>
                <I.User size={24} />
              </span>
              <span className="sp-grow">
                <span className="sp-h3">{DEMO_USER.displayName}</span>
                <span className="sp-cap" style={{ display: "block", wordBreak: "break-all" }}>{me?.userDid ?? userDid}</span>
              </span>
            </div>
            {error ? (
              <span className="sp-cap" style={{ color: "var(--danger, #c0392b)" }}>{error}</span>
            ) : me ? (
              <div className="sp-claims">
                <Claim label="identityVerified" meta="본인확인 완료" value={valueOf(me.claims.identityVerified)} />
                <Claim label="ageOver19" meta="성인 여부" value={valueOf(me.claims.ageOver19)} />
                <Claim label="residenceValid" meta="체류 유효 여부" value={valueOf(me.claims.residenceValid)} />
                <Claim label="residenceExpiryMonth" meta="체류 만료 월" value={valueOf(me.claims.residenceExpiryMonth)} />
                <Claim label="regionLevel1" meta="거주지역" value={valueOf(me.claims.regionLevel1)} />
              </div>
            ) : (
              <span className="sp-cap">불러오는 중…</span>
            )}
          </div>
        )}

        <div className="sp-col" style={{ gap: 10 }}>
          <div className="sp-seclabel is-hide" style={{ color: "var(--caption)" }}>
            진행 현황<span className="sp-line" />
          </div>
          {cards.map((c) => (
            <Link key={c.t} href={c.href} style={{ textDecoration: "none" }}>
              <div className="sp-card" style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--gray-5)", color: "var(--blue-60)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 40px" }}>{c.ico}</span>
                <span className="sp-grow"><span className="sp-cardtitle">{c.t}</span><br /><span className="sp-cap">{c.s}</span></span>
                {c.badge}
              </div>
            </Link>
          ))}
        </div>

        <div className="sp-info">
          <I.Info size={16} stroke={2} style={{ color: "var(--blue-50)", flex: "0 0 16px", marginTop: 1 }} />
          <span className="sp-info-body">다음 행동: <b>Housing Pass를 생성</b>하면 임대인 요청에 선택적으로 응답할 수 있습니다.</span>
        </div>
      </div>
      <div className="sp-footer">
        <Link href={routes.housingPass} style={{ textDecoration: "none" }}>
          <Btn variant="primary" iconR={<I.ArrowR size={18} stroke={2} />}>Housing Pass 생성하기</Btn>
        </Link>
      </div>
      <HomeBar />
    </Screen>
  );
}
