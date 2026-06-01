import Link from "next/link";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, I } from "@/components/settlepass/chrome";

const logs = [
  { name: "consentHash", val: "", time: "", mean: "사용자가 임대인에게 선택한 claim 공개에 동의한 이력", tx: "", point: false },
  { name: "verificationHash", val: "", time: "", mean: "임대인이 동의된 claim의 검증 결과를 확인한 이력", tx: "", point: false },
  { name: "reviewHash", val: "", time: "", mean: "사용자가 AI 계약 리뷰 결과를 확인한 이력 (공증 아님)", tx: "", point: true },
];

export default function AuditLogPage() {
  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="verified" />
      <Steps current={5} />
      <div className="sp-body" style={{ gap: 16 }}>
        <div>
          <span className="sp-eyebrow">STEP 5 · 리뷰 이력 기록</span>
          <h2 className="sp-h2" style={{ marginTop: 4 }}>감사 로그</h2>
          <p className="sp-sub" style={{ marginTop: 6 }}>동의·검증·리뷰 확인 이력이 해시로 기록됩니다.</p>
        </div>

        {logs.map((l) => (
          <div
            key={l.name}
            className="sp-hash"
            style={{ gap: 11, borderColor: l.point ? "var(--blue-50)" : "var(--border-soft)", borderWidth: l.point ? 1.5 : 1 }}
          >
            <div className="sp-between">
              <span className="sp-row" style={{ gap: 7 }}>
                <span style={{ color: l.point ? "var(--blue-60)" : "var(--caption)" }}>
                  <I.Hash size={16} stroke={2} />
                </span>
                <span className="sp-cardtitle">{l.name}</span>
              </span>
              {l.point && <span className="sp-badge sp-badge-primary-o">최종 확인</span>}
            </div>
            <div className="sp-hash-val" style={{ color: l.point ? "var(--blue-70)" : "var(--gray-90)" }}>{l.val}</div>
            <div className="sp-kv" style={{ padding: 0, border: "none" }}>
              <span className="sp-kv-k">
                <I.Clock size={13} stroke={2} style={{ verticalAlign: -2, marginRight: 4 }} />
                생성 시각
              </span>
              <span className="sp-cap" style={{ fontFamily: "var(--mono)" }}>{l.time}</span>
            </div>
            <p className="sp-sub" style={{ fontSize: 14 }}>{l.mean}</p>
            <div className="sp-divider" />
            <div className="sp-col" style={{ gap: 5 }}>
              <span className="sp-cap" style={{ fontFamily: "var(--mono)" }}>mockTxHash · {l.tx}</span>
              <div className="sp-row" style={{ gap: 6, flexWrap: "wrap" }}>
                <span className="sp-badge sp-badge-success">Phase 1 · DB 기록</span>
                <span className="sp-badge sp-badge-gray">Phase 2 · OmniOne Chain txHash 예정</span>
              </div>
            </div>
          </div>
        ))}

        <div className="sp-warn-panel">
          <I.Info size={16} stroke={2} style={{ color: "var(--warn-text)", flex: "0 0 16px", marginTop: 1 }} />
          <span className="sp-info-body">1차 MVP의 <b>mockTxHash는 실제 블록체인 트랜잭션이 아닙니다.</b> 데모 단계의 기록용 값입니다.</span>
        </div>
      </div>

      <div className="sp-footer">
        <Link href="/" style={{ textDecoration: "none" }}>
          <Btn variant="tertiary" icon={<I.Reset size={18} stroke={2} />}>데모 초기화</Btn>
        </Link>
      </div>
      <HomeBar />
    </Screen>
  );
}
