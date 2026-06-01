import Link from "next/link";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, I } from "@/components/settlepass/chrome";

const steps = [
  { t: "파일 업로드", s: "" },
  { t: "CLOVA OCR", s: "" },
  { t: "텍스트 정규화", s: "" },
  { t: "AI 계약 리뷰", s: "" },
  { t: "결과 생성", s: "" },
];

export default function ContractUploadPage() {
  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="verified" />
      <Steps current={4} />
      <div className="sp-body" style={{ gap: 18 }}>
        <div>
          <span className="sp-eyebrow">STEP 4 · AI 계약 리뷰</span>
          <h2 className="sp-h2" style={{ marginTop: 4 }}>월세계약서 업로드</h2>
        </div>

        <div className="sp-upload">
          <span className="sp-up-ico"><I.Upload size={24} stroke={2} /></span>
          <span className="sp-cardtitle">계약서를 올려주세요</span>
          <span className="sp-cap">PDF · PNG · JPG 지원 · 최대 10MB</span>
          <Btn variant="secondary" size="sm" block={false} icon={<I.File size={16} stroke={2} />}>파일 선택</Btn>
        </div>

        <div className="sp-card" style={{ gap: 0 }}>
          <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)", marginBottom: 4 }}>처리 단계</span>
          {steps.map((p, i) => (
            <div key={i} className={`sp-pstep${p.s === "done" ? " is-done" : p.s === "active" ? " is-active" : ""}`}>
              <span className="sp-pstep-num">
                {p.s === "done" ? <I.Check size={14} stroke={2.6} /> : i + 1}
              </span>
              <span className="sp-pstep-label">{p.t}</span>
              {p.s === "active" && <span className="sp-badge sp-badge-info" style={{ marginLeft: "auto" }}>처리 중</span>}
            </div>
          ))}
        </div>

        <div className="sp-notice">
          <I.Lock size={16} stroke={2} style={{ color: "var(--caption)", flex: "0 0 16px", marginTop: 1 }} />
          <span className="sp-info-body">계약서 원문은 장기 저장하지 않습니다. 분석 완료 후 필요한 최소 결과만 저장합니다.</span>
        </div>
      </div>

      <div className="sp-footer">
        <Link href="/contract-review/review-001" style={{ textDecoration: "none" }}>
          <Btn variant="primary" icon={<I.Sparkle size={18} stroke={2} />}>계약서 분석 시작</Btn>
        </Link>
      </div>
      <HomeBar />
    </Screen>
  );
}
