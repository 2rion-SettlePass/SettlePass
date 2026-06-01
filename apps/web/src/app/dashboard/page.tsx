import Link from "next/link";
import { Screen, StatusBar, Header, HomeBar, Btn, I } from "@/components/settlepass/chrome";
import type { ReactNode } from "react";

const cards: { ico: ReactNode; t: string; s: string; badge: ReactNode; href: string }[] = [
  { ico: <I.ShieldChk size={18} />, t: "모바일 신분증 인증", s: "", badge: null, href: "/auth" },
  { ico: <I.Key size={18} />, t: "Housing Pass", s: "", badge: null, href: "/housing-pass" },
  { ico: <I.Building size={18} />, t: "임대인 요청", s: "", badge: null, href: "/verification/requests/req-001" },
  { ico: <I.Sparkle size={18} />, t: "AI 계약 리뷰", s: "", badge: null, href: "/contract-review/upload" },
  { ico: <I.List size={18} />, t: "Audit Log", s: "", badge: null, href: "/audit-log" },
];

export default function DashboardPage() {
  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="verified" />
      <div className="sp-body" style={{ gap: 18 }}>
        <div className="sp-card" style={{ gap: 12, flexDirection: "row", alignItems: "center" }}>
          <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--blue-5)", color: "var(--blue-60)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 48px" }}>
            <I.User size={24} />
          </span>
          <span className="sp-grow">
            <span className="sp-h3" />
            <span className="sp-col" style={{ gap: 3, marginTop: 4 }} />
          </span>
        </div>

        <div className="sp-col" style={{ gap: 10 }}>
          <div className="sp-seclabel is-hide" style={{ color: "var(--caption)" }}>
            진행 현황<span className="sp-line" />
          </div>
          {cards.map((c) => (
            <Link key={c.t} href={c.href} style={{ textDecoration: "none" }}>
              <div className="sp-card" style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--gray-5)", color: "var(--blue-60)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 40px" }}>{c.ico}</span>
                <span className="sp-grow"><span className="sp-cardtitle">{c.t}</span><br /><span className="sp-cap">{c.s}</span></span>
                {c.badge}
              </div>
            </Link>
          ))}
        </div>

        <div className="sp-info">
          <I.Info size={16} stroke={2} style={{ color: "var(--blue-50)", flex: "0 0 16px", marginTop: 1 }} />
          <span className="sp-info-body">다음 행동: <b>Housing Pass를 생성</b>하면 임대인 요청에 선택적으로 응답할 수 있습니다.</span>
        </div>
      </div>
      <div className="sp-footer">
        <Link href="/housing-pass" style={{ textDecoration: "none" }}>
          <Btn variant="primary" iconR={<I.ArrowR size={18} stroke={2} />}>Housing Pass 생성하기</Btn>
        </Link>
      </div>
      <HomeBar />
    </Screen>
  );
}
