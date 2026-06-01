import Link from "next/link";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, I } from "@/components/settlepass/chrome";

const checks = [
  "핵심조건을 확인했습니다.",
  "위험조항 요약을 확인했습니다.",
  "체류기간·계약기간 경고를 확인했습니다.",
  "이 분석은 법률 자문이 아니라는 점을 이해했습니다.",
];

export default function ReviewConfirmPage() {
  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="verified" />
      <Steps current={5} />
      <div className="sp-body" style={{ gap: 16 }}>
        <div>
          <span className="sp-eyebrow">STEP 5 · 리뷰 이력 기록</span>
          <h2 className="sp-h2" style={{ marginTop: 4 }}>AI 리뷰 최종 확인</h2>
        </div>

        <div className="sp-card" style={{ gap: 0 }}>
          {checks.map((c, i) => (
            <div
              key={i}
              className="sp-check"
              style={{ borderBottom: i < checks.length - 1 ? "1px solid var(--divider)" : "none" }}
            >
              <span className="sp-check-box" />
              <span className="sp-check-text">{c}</span>
            </div>
          ))}
        </div>

        <div className="sp-info">
          <I.Hash size={16} stroke={2} style={{ color: "var(--blue-50)", flex: "0 0 16px", marginTop: 1 }} />
          <span className="sp-info-body">reviewHash는 <b>계약서 공증이 아닙니다.</b> 사용자가 AI 리뷰를 확인했다는 이력입니다.</span>
        </div>

        <div className="sp-disclaimer">이 분석은 계약 이해를 돕기 위한 참고 정보이며 <b style={{ color: "var(--sub)" }}>법률 자문이 아닙니다.</b> 필요한 경우 공인중개사·법률 전문가·학교 국제처 또는 외국인지원센터에 확인하세요.</div>
      </div>

      <div className="sp-footer">
        <Link href="/audit-log" style={{ textDecoration: "none" }}>
          <Btn variant="primary" icon={<I.ShieldChk size={18} stroke={2} />}>AI 리뷰 확인 완료</Btn>
        </Link>
      </div>
      <HomeBar />
    </Screen>
  );
}
