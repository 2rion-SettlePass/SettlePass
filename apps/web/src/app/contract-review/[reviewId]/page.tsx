import Link from "next/link";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, I } from "@/components/settlepass/chrome";

type SummaryRow = { k: string; v: string };
type Risk = { lv: string; tag: string; cat: string; desc: string; quote: string; ask: string };

const SUMMARY: SummaryRow[] = [];
const RISKS: Risk[] = [];

export default function AiReviewResultPage() {
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

        {/* Summary grid */}
        <div className="sp-col" style={{ gap: 10 }}>
          <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)" }}>핵심 조건</span>
          <div className="sp-sumgrid">
            {SUMMARY.map((s, i) => (
              <div key={i} className={`sp-sumcell${s.k === "주소" ? " is-full" : ""}`}>
                <span className="sp-sumcell-k">{s.k}</span>
                <span className="sp-sumcell-v">{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Residence warning */}
        <div className="sp-warn-panel">
          <I.Alert size={18} stroke={2} style={{ color: "var(--warn-text)", flex: "0 0 18px", marginTop: 1 }} />
          <span className="sp-info-body">
            <b>체류기간·계약기간 충돌</b><br />
          </span>
        </div>

        {/* Risk items */}
        <div className="sp-col" style={{ gap: 10 }}>
          <div className="sp-between">
            <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)" }}>확인 필요 항목</span>
            <span className="sp-cap" />
          </div>
          {RISKS.map((r) => (
            <div key={r.cat} className={`sp-riskitem is-${r.lv}`}>
              <div className="sp-riskitem-head">
                <span className={`sp-risk-pill sp-risk-${r.lv}`}>{r.tag}</span>
                <span className="sp-riskitem-cat">{r.cat}</span>
              </div>
              <span className="sp-riskitem-desc">{r.desc}</span>
              <span className="sp-quote">{r.quote}</span>
              <span className="sp-ask">
                <I.Info size={14} stroke={2} style={{ flex: "0 0 14px", marginTop: 2 }} />
                질문 예시 · {r.ask}
              </span>
            </div>
          ))}
        </div>

        {/* Multilingual summary */}
        <div className="sp-card" style={{ gap: 10 }}>
          <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)" }}>다국어 요약</span>
          <div className="sp-tabs">
            <span className="sp-tab">한국어</span>
            <span className="sp-tab">EN</span>
            <span className="sp-tab">中文</span>
            <span className="sp-tab">VI</span>
          </div>
          <p className="sp-sub" style={{ marginTop: 2 }} />
        </div>

        <div className="sp-disclaimer">이 분석은 계약 이해를 돕기 위한 참고 정보이며 <b style={{ color: "var(--sub)" }}>법률 자문이 아닙니다.</b> 필요한 경우 공인중개사·법률 전문가·학교 국제처 또는 외국인지원센터에 확인하세요.</div>
      </div>

      <div className="sp-footer">
        <Link href="/contract-review/review-001/confirm" style={{ textDecoration: "none" }}>
          <Btn variant="primary" iconR={<I.ArrowR size={18} stroke={2} />}>리뷰 확인 단계로 이동</Btn>
        </Link>
      </div>
      <HomeBar />
    </Screen>
  );
}
