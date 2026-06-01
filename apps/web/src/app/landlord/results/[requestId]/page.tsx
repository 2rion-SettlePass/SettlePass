import { Screen, StatusBar, Header, HomeBar, Btn, SecLabel, I } from "@/components/settlepass/chrome";

const results = [
  { k: "본인확인 완료", v: "" },
  { k: "성인 여부", v: "" },
  { k: "체류 유효", v: "" },
  { k: "거주지역", v: "" },
];
const notDisclosed = ["국적", "외국인등록번호", "상세주소", "체류자격 원문"];

export default function LandlordResultPage() {
  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="landlord" />
      <div className="sp-context">
        <I.Building size={15} stroke={2} />임대인 포털 · 검증 결과
      </div>
      <div className="sp-body" style={{ gap: 16 }}>
        <div className="sp-between">
          <h2 className="sp-h2">검증 결과</h2>
          <span className="sp-badge sp-badge-gray" />
        </div>

        <div className="sp-card" style={{ gap: 2 }}>
          <SecLabel kind="show">확인된 자격</SecLabel>
          {results.map((r) => (
            <div key={r.k} className="sp-result-row">
              <span className="sp-result-k">
                <span className="sp-claim-ico is-ok"><I.Check size={13} stroke={2.6} /></span>
                {r.k}
              </span>
              <span className="sp-yes">{r.v}</span>
            </div>
          ))}
        </div>

        <div className="sp-card" style={{ gap: 4, background: "var(--gray-5)", border: "none" }}>
          <SecLabel kind="hide">공개되지 않은 정보</SecLabel>
          <div className="sp-row" style={{ flexWrap: "wrap", gap: 6, paddingTop: 4 }}>
            {notDisclosed.map((c) => (
              <span key={c} className="sp-badge sp-badge-gray"><I.Lock size={12} />{c}</span>
            ))}
          </div>
        </div>

        <div className="sp-card" style={{ gap: 10 }}>
          <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)", display: "flex", alignItems: "center", gap: 6 }}>
            <I.Hash size={14} stroke={2} />감사 요약
          </span>
          <div className="sp-hash-val">verificationHash · </div>
          <div className="sp-hash-val" style={{ color: "var(--caption)" }}>mockTxHash · </div>
        </div>

        <div className="sp-between sp-card is-flat" style={{ padding: 14 }}>
          <span className="sp-sub" style={{ fontWeight: 700 }}>AI 계약 리뷰 확인 여부</span>
          <span className="sp-badge sp-badge-gray" />
        </div>
      </div>

      <div className="sp-footer">
        <Btn variant="tertiary">결과 내보내기</Btn>
      </div>
      <HomeBar />
    </Screen>
  );
}
