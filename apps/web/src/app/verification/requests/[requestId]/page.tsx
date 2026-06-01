import Link from "next/link";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, SecLabel, I } from "@/components/settlepass/chrome";

const REQ_CLAIMS = [
  { label: "본인확인 완료", meta: "identityVerified", ico: "ShieldChk" as const },
  { label: "성인 여부", meta: "ageOver19", ico: "User" as const },
  { label: "체류 유효 여부", meta: "residenceValid", ico: "Check" as const },
  { label: "거주지역", meta: "regionLevel1 · Seoul", ico: "Map" as const },
];
const PRIV_CLAIMS = ["국적", "외국인등록번호", "상세주소", "체류자격 원문"];

export default function ConsentRequestPage() {
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

        {/* Requester card */}
        <div className="sp-requester">
          <span className="sp-requester-av"><I.Building size={22} /></span>
          <span className="sp-grow">
            <span className="sp-cardtitle" />
            <span className="sp-sub" style={{ display: "block", marginTop: 1 }}>요청 목적 · 월세계약 전 자격 확인</span>
          </span>
          <span className="sp-badge sp-badge-info">요청</span>
        </div>

        {/* Toggle-style consent (Option B) */}
        <div className="sp-card" style={{ gap: 2 }}>
          <div className="sp-between" style={{ marginBottom: 4 }}>
            <SecLabel kind="show">공유할 정보 선택</SecLabel>
          </div>
          <p className="sp-cap" style={{ marginTop: -2, marginBottom: 4 }}>공유할 항목을 직접 켜고 끌 수 있습니다.</p>
          {REQ_CLAIMS.map((c) => (
            <div key={c.label} className="sp-sharerow">
              <span className="sp-sharerow-ico is-on">
                <I.Check size={18} />
              </span>
              <span className="sp-grow">
                <span className="sp-claim-label">{c.label}</span>
                <span className="sp-claim-meta" style={{ display: "block" }}>{c.meta}</span>
              </span>
              <span className="sp-switch is-off"><span className="sp-knob" /></span>
            </div>
          ))}
        </div>

        <div className="sp-card" style={{ gap: 2, background: "var(--gray-5)", border: "none" }}>
          <SecLabel kind="hide">공유 불가 · 요청 불가</SecLabel>
          {PRIV_CLAIMS.map((c) => (
            <div key={c} className="sp-sharerow is-locked">
              <span className="sp-sharerow-ico is-locked"><I.Lock size={16} /></span>
              <span className="sp-grow">
                <span className="sp-claim-label" style={{ color: "var(--caption)" }}>{c}</span>
              </span>
              <span className="sp-badge sp-badge-gray">비공개</span>
            </div>
          ))}
        </div>

        <div className="sp-notice">
          <I.Info size={16} stroke={2} style={{ color: "var(--caption)", flex: "0 0 16px", marginTop: 1 }} />
          <span className="sp-info-body">동의 시 선택한 항목에 대해서만 consentHash가 생성됩니다.</span>
        </div>
      </div>

      <div className="sp-footer">
        <Link href="/landlord/results/req-001" style={{ textDecoration: "none" }}>
          <Btn variant="primary" icon={<I.ShieldChk size={18} stroke={2} />}>선택한 정보만 공유하기</Btn>
        </Link>
        <Btn variant="danger">거절하기</Btn>
      </div>
      <HomeBar />
    </Screen>
  );
}
