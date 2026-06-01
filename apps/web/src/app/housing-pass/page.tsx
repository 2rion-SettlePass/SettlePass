import Link from "next/link";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, Claim, SecLabel, I } from "@/components/settlepass/chrome";

export default function HousingPassPage() {
  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="verified" />
      <Steps current={2} />
      <div className="sp-body" style={{ gap: 18 }}>
        <div>
          <span className="sp-eyebrow">STEP 2 · HOUSING PASS</span>
          <h2 className="sp-h2" style={{ marginTop: 4 }}>주거계약용 최소 자격증명</h2>
          <p className="sp-sub" style={{ marginTop: 6 }}>Housing Pass는 월세계약에 필요한 최소 정보만 담습니다.</p>
        </div>

        <div className="sp-card is-pad-lg" style={{ gap: 12, borderColor: "var(--blue-50)", borderWidth: 1.5 }}>
          <div className="sp-card-head">
            <span className="sp-card-head-l">
              <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--blue-50)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <I.Key size={17} stroke={2} />
              </span>
              <span className="sp-cardtitle">Housing Pass</span>
            </span>
            <span className="sp-badge sp-badge-success">ACTIVE</span>
          </div>
          <div className="sp-claims">
            <Claim label="본인확인 완료" value="" />
            <Claim label="성인 여부" value="" />
            <Claim label="체류 유효 여부" value="" />
            <Claim label="체류 만료 월" value="" />
            <Claim label="거주지역" value="" />
          </div>
        </div>

        <div className="sp-card" style={{ gap: 4, background: "var(--gray-5)", border: "none" }}>
          <SecLabel kind="hide">공개하지 않는 정보</SecLabel>
          <div className="sp-claims">
            <Claim label="외국인등록번호" priv />
            <Claim label="국적" priv />
            <Claim label="상세주소" priv />
            <Claim label="체류자격 원문" priv />
          </div>
        </div>
      </div>

      <div className="sp-footer">
        <Link href="/verification/requests/req-001" style={{ textDecoration: "none" }}>
          <Btn variant="primary">Housing Pass 생성하기</Btn>
        </Link>
        <Link href="/landlord/requests/new" style={{ textDecoration: "none" }}>
          <Btn variant="tertiary" iconR={<I.ArrowR size={18} stroke={2} />}>임대인 요청 보기</Btn>
        </Link>
      </div>
      <HomeBar />
    </Screen>
  );
}
