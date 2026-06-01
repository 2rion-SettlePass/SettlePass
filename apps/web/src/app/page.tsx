import Link from "next/link";
import { Screen, StatusBar, Header, HomeBar, Btn, I } from "@/components/settlepass/chrome";

export default function LandingPage() {
  const problems = [
    { ico: <I.Doc size={18} />, t: "반복 서류 제출", s: "같은 증명서류를 계약마다 다시 제출" },
    { ico: <I.Lock size={18} />, t: "개인정보 사본 불안", s: "신분증 전체 사본이 그대로 남는 부담" },
    { ico: <I.File size={18} />, t: "한국어 계약서 이해 어려움", s: "특약·관리비 조항을 정확히 읽기 힘듦" },
    { ico: <I.Cal size={18} />, t: "체류기간·계약기간 충돌", s: "계약 종료일이 체류 만료보다 늦을 위험" },
  ];
  const flow = ["모바일 신분증 인증", "Housing Pass 생성", "선택적 정보공개", "AI 계약 리뷰", "reviewHash 기록"];

  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" />
      <div className="sp-body" style={{ gap: 20 }}>
        <div className="sp-hero">
          <span className="sp-badge sp-badge-primary-o sp-hero-badge">외국인 정주 신뢰 패스</span>
          <h1 className="sp-h1">필요한 정보만 증명하고,<br />민감정보는 공개하지 않습니다</h1>
          <p className="sp-sub">신원·체류·계약을 한 번에. 외국인등록번호와 국적을 공개하지 않고도 월세계약에 필요한 자격만 증명합니다.</p>
        </div>

        <div className="sp-col" style={{ gap: 9 }}>
          <Link href="/auth" style={{ textDecoration: "none" }}>
            <Btn variant="primary" icon={<I.ShieldChk size={20} stroke={2} />}>데모 시작하기</Btn>
          </Link>
          <Link href="/landlord/requests/new" style={{ textDecoration: "none" }}>
            <Btn variant="secondary" icon={<I.Building size={18} stroke={2} />}>임대인 포털 보기</Btn>
          </Link>
        </div>

        <div className="sp-col" style={{ gap: 10 }}>
          <div className="sp-seclabel is-hide" style={{ color: "var(--caption)" }}>
            외국인 세입자가 겪는 문제<span className="sp-line" />
          </div>
          {problems.map((p) => (
            <div key={p.t} className="sp-prob">
              <span className="sp-prob-ico">{p.ico}</span>
              <span>
                <span className="sp-cardtitle">{p.t}</span><br />
                <span className="sp-cap">{p.s}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="sp-card is-flat" style={{ gap: 12 }}>
          <span className="sp-cardtitle">SettlePass 흐름</span>
          <div className="sp-flow">
            {flow.map((t, i) => (
              <div key={i} className="sp-flow-item">
                <span className="sp-flow-num">{i + 1}</span>
                <span className="sp-flow-text">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <HomeBar />
    </Screen>
  );
}
