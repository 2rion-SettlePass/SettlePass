"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, Claim, I } from "@/components/settlepass/chrome";
import type {
  IdentityMode,
  NormalizedIdentityClaims,
} from "@settlepass/api-contracts";
import { api } from "@/lib/api";
import { setFlow } from "@/lib/flow-state";
import { routes } from "@/lib/routes";

type ModeOption = { mode: IdentityMode; title: string; badge: string; badgeClass: string; sub: string };

const MODES: ModeOption[] = [
  {
    mode: "CX_MOCK_MODE",
    title: "Mock 모드",
    badge: "데모",
    badgeClass: "sp-badge-warn",
    sub: "외국인등록증 고유 claim을 데모 데이터로 사용합니다.",
  },
  {
    mode: "CX_REAL_MODE",
    title: "실연동 모드",
    badge: "CX_REAL_MODE",
    badgeClass: "sp-badge-primary-o",
    sub: "모바일 신분증 인증 흐름을 실제로 확인합니다. (Phase 1 미구성)",
  },
];

function valueOf(v: boolean | string | undefined): string {
  if (v === undefined) return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return v;
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<IdentityMode>("CX_MOCK_MODE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claims, setClaims] = useState<NormalizedIdentityClaims | null>(null);

  async function onStart() {
    setLoading(true);
    setError(null);
    try {
      const started = await api.startAuth({
        mode,
        credentialType: "MOBILE_FOREIGNER_ID_MOCK",
      });
      const completed = await api.completeAuth({
        authSessionId: started.authSessionId,
        mockProfile: "DEFAULT_FOREIGNER_STUDENT",
      });
      setFlow({ userId: completed.userId, userDid: completed.userDid });
      setClaims(completed.claims);
      router.push(routes.dashboard);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "인증에 실패했습니다. Mock 모드로 다시 시도해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="mock" />
      <Steps current={1} />
      <div className="sp-body" style={{ gap: 18 }}>
        <div>
          <span className="sp-eyebrow">STEP 1 · 신원 확인</span>
          <h2 className="sp-h2" style={{ marginTop: 4 }}>인증 방식을 선택하세요</h2>
        </div>

        <div className="sp-col" style={{ gap: 10 }}>
          {MODES.map((m) => (
            <button
              key={m.mode}
              type="button"
              onClick={() => setMode(m.mode)}
              className={"sp-modecard" + (mode === m.mode ? " is-active" : "")}
              style={{ textAlign: "left", cursor: "pointer", background: "none", border: undefined, width: "100%" }}
            >
              <span className="sp-radio" />
              <span className="sp-grow">
                <span className="sp-mode-titlerow">
                  <span className="sp-cardtitle">{m.title}</span>
                  <span className={"sp-badge " + m.badgeClass}>{m.badge}</span>
                </span>
                <span className="sp-sub">{m.sub}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="sp-card" style={{ gap: 14 }}>
          <div className="sp-card-head">
            <span className="sp-card-head-l">
              <span className="sp-claim-ico is-ok"><I.Check size={13} stroke={2.6} /></span>
              <span className="sp-cardtitle">본인확인 완료</span>
            </span>
            <span className="sp-badge sp-badge-success">{claims ? "VERIFIED" : "PENDING"}</span>
          </div>
          <div className="sp-cap" style={{ marginTop: -6 }}>인증 후 아래 claim만 패스에 담깁니다.</div>
          <div className="sp-claims">
            <Claim label="identityVerified" meta="본인확인 완료" value={valueOf(claims?.identityVerified)} />
            <Claim label="ageOver19" meta="성인 여부" value={valueOf(claims?.ageOver19)} />
            <Claim label="residenceValid" meta="체류 유효 여부" value={valueOf(claims?.residenceValid)} />
            <Claim label="residenceExpiryMonth" meta="체류 만료 월" value={valueOf(claims?.residenceExpiryMonth)} />
            <Claim label="regionLevel1" meta="거주지역" value={valueOf(claims?.regionLevel1)} />
          </div>
        </div>

        {error && (
          <div className="sp-notice" role="alert">
            <I.Alert size={16} stroke={2} style={{ color: "var(--danger, #c0392b)", flex: "0 0 16px", marginTop: 1 }} />
            <span className="sp-info-body">{error}</span>
          </div>
        )}

        <div className="sp-notice">
          <I.Lock size={16} stroke={2} style={{ color: "var(--caption)", flex: "0 0 16px", marginTop: 1 }} />
          <span className="sp-info-body">외국인등록번호·국적·여권번호·상세주소는 인증 과정에서도 패스에 담기지 않습니다.</span>
        </div>
      </div>

      <div className="sp-footer">
        <Btn variant="primary" onClick={onStart} iconR={<I.ArrowR size={18} stroke={2} />}>
          {loading ? "인증 중…" : "인증 시작"}
        </Btn>
      </div>
      <HomeBar />
    </Screen>
  );
}
