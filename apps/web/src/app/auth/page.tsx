import Link from "next/link";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, Claim, I } from "@/components/settlepass/chrome";

export default function AuthPage() {
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
          <div className="sp-modecard">
            <span className="sp-radio" />
            <span className="sp-grow">
              <span className="sp-mode-titlerow">
                <span className="sp-cardtitle">실연동 모드</span>
                <span className="sp-badge sp-badge-primary-o">CX_REAL_MODE</span>
              </span>
              <span className="sp-sub">모바일 신분증 인증 흐름을 실제로 확인합니다.</span>
            </span>
          </div>
          <div className="sp-modecard">
            <span className="sp-radio" />
            <span className="sp-grow">
              <span className="sp-mode-titlerow">
                <span className="sp-cardtitle">Mock 모드</span>
                <span className="sp-badge sp-badge-warn">데모</span>
              </span>
              <span className="sp-sub">외국인등록증 고유 claim을 데모 데이터로 사용합니다.</span>
            </span>
          </div>
        </div>

        <div className="sp-card" style={{ gap: 14 }}>
          <div className="sp-card-head">
            <span className="sp-card-head-l">
              <span className="sp-claim-ico is-ok"><I.Check size={13} stroke={2.6} /></span>
              <span className="sp-cardtitle">본인확인 완료</span>
            </span>
            <span className="sp-badge sp-badge-success">VERIFIED</span>
          </div>
          <div className="sp-cap" style={{ marginTop: -6 }}>인증 후 아래 claim만 패스에 담깁니다.</div>
          <div className="sp-claims">
            <Claim label="identityVerified" meta="본인확인 완료" value="" />
            <Claim label="ageOver19" meta="성인 여부" value="" />
            <Claim label="residenceValid" meta="체류 유효 여부" value="" />
            <Claim label="residenceExpiryMonth" meta="체류 만료 월" value="" />
            <Claim label="regionLevel1" meta="거주지역" value="" />
          </div>
        </div>

        <div className="sp-notice">
          <I.Lock size={16} stroke={2} style={{ color: "var(--caption)", flex: "0 0 16px", marginTop: 1 }} />
          <span className="sp-info-body">외국인등록번호·국적·여권번호·상세주소는 인증 과정에서도 패스에 담기지 않습니다.</span>
        </div>
      </div>

      <div className="sp-footer">
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <Btn variant="primary" iconR={<I.ArrowR size={18} stroke={2} />}>인증 시작</Btn>
        </Link>
      </div>
      <HomeBar />
    </Screen>
  );
}
