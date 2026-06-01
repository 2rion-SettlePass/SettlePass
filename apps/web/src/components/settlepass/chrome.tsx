import type { ReactNode, CSSProperties } from "react";

/* ── SVG icon factory ──────────────────────────────────── */
type IconProps = { size?: number; stroke?: number; style?: CSSProperties; className?: string };
const mk = (paths: string[], fill = false) => {
  const Icon = ({ size = 20, stroke = 1.8, ...rest }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
  Icon.displayName = "Icon";
  return Icon;
};

export const I = {
  Check:    mk(["M20 6L9 17l-5-5"]),
  Shield:   mk(["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"]),
  ShieldChk:mk(["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z","M9 12l2 2 4-4"]),
  Lock:     mk(["M5 11h14v10H5z","M8 11V7a4 4 0 0 1 8 0v4"]),
  Eye:      mk(["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"]),
  EyeOff:   mk(["M3 3l18 18","M10.6 10.6a3 3 0 0 0 4.2 4.2","M9.4 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.8","M6 6.5A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 3-.5"]),
  Doc:      mk(["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M8 13h8","M8 17h6"]),
  Upload:   mk(["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M12 3v13","M7 8l5-5 5 5"]),
  Alert:    mk(["M12 9v4","M12 17h.01","M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"]),
  Info:     mk(["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 11v5","M12 8h.01"]),
  ChevDown: mk(["M6 9l6 6 6-6"]),
  ArrowR:   mk(["M5 12h14","M13 6l6 6-6 6"]),
  Globe:    mk(["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M2 12h20","M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"]),
  Home:     mk(["M3 10l9-7 9 7v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z"]),
  User:     mk(["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2","M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]),
  Key:      mk(["M14.5 3a5.5 5.5 0 0 0-5 7.8L3 17.3V21h3.7l1-1v-2h2v-2h2l1.2-1.2A5.5 5.5 0 1 0 14.5 3z","M16.5 7.5h.01"]),
  Map:      mk(["M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2z","M9 3v16","M15 5v16"]),
  Cal:      mk(["M3 5h18v16H3z","M3 9h18","M8 3v4","M16 3v4"]),
  Hash:     mk(["M4 9h16","M4 15h16","M10 3L8 21","M16 3l-2 18"]),
  Clock:    mk(["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 7v5l3 2"]),
  File:     mk(["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6"]),
  List:     mk(["M8 6h13","M8 12h13","M8 18h13","M3 6h.01","M3 12h.01","M3 18h.01"]),
  Reset:    mk(["M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.3 2.6L3 8","M3 4v4h4"]),
  Sparkle:  mk(["M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z","M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"]),
  Building: mk(["M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16","M14 9h4a2 2 0 0 1 2 2v10","M8 7h2","M8 11h2","M8 15h2","M3 21h18"]),
};

/* ── Status bar ────────────────────────────────────────── */
export function StatusBar() {
  return (
    <div className="sp-status">
      <span>9:41</span>
      <span className="sp-status-icons">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="6" width="3" height="5" rx="1"/>
          <rect x="4.5" y="4" width="3" height="7" rx="1"/>
          <rect x="9" y="2" width="3" height="9" rx="1"/>
          <rect x="13.5" y="0" width="3" height="11" rx="1"/>
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
          <path d="M8 2.5c2 0 3.8.8 5.2 2L8 11 2.8 4.5C4.2 3.3 6 2.5 8 2.5z" opacity=".95"/>
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="1" y="1" width="20" height="10" rx="2.5" stroke="currentColor" strokeOpacity=".5"/>
          <rect x="2.5" y="2.5" width="15" height="7" rx="1.3" fill="currentColor"/>
          <rect x="22.5" y="4" width="1.6" height="4" rx="0.8" fill="currentColor" fillOpacity=".5"/>
        </svg>
      </span>
    </div>
  );
}

/* ── App header ────────────────────────────────────────── */
type HeaderProps = { status?: "verified" | "mock" | "landlord"; lang?: string; landlord?: boolean };
export function Header({ status, lang = "KO", landlord = false }: HeaderProps) {
  return (
    <div className={"sp-header" + (landlord ? " is-landlord" : "")}>
      <div className="sp-logo">
        <span className="sp-logomark"><I.ShieldChk size={16} stroke={2} /></span>
        SettlePass
      </div>
      <div className="sp-header-utils">
        {status === "verified" && (
          <span className="sp-chip sp-chip-verified"><span className="sp-dot" />Verified</span>
        )}
        {status === "mock" && (
          <span className="sp-chip sp-chip-mock"><span className="sp-dot" />Mock</span>
        )}
        {status === "landlord" && (
          <span className="sp-chip sp-chip-real"><I.Building size={13} stroke={2} />임대인</span>
        )}
        <span className="sp-chip sp-chip-lang"><I.Globe size={13} stroke={2} />{lang}</span>
      </div>
    </div>
  );
}

/* ── Step progress ─────────────────────────────────────── */
const STEP_LABELS = ["신원 확인", "Housing Pass", "정보공개 동의", "AI 계약 리뷰", "리뷰 이력 기록"];
export function Steps({ current = 1 }: { current?: number }) {
  return (
    <div className="sp-steps">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const cls = n < current ? "is-done" : n === current ? "is-current" : "";
        return (
          <div key={n} className={`sp-step ${cls}`}>
            <div className="sp-step-dot">
              {n < current ? <I.Check size={14} stroke={2.4} /> : n}
            </div>
            <div className="sp-step-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Button ────────────────────────────────────────────── */
type BtnProps = {
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "ghost";
  size?: "sm" | "lg";
  block?: boolean;
  icon?: ReactNode;
  iconR?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
};
export function Btn({ variant = "primary", size, block = true, icon, iconR, children, onClick, type = "button" }: BtnProps) {
  const cls = [
    "sp-btn",
    `sp-btn-${variant}`,
    block ? "sp-btn-block" : "",
    size ? `sp-btn-${size}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} onClick={onClick} type={type}>
      {icon}
      {children}
      {iconR}
    </button>
  );
}

/* ── Claim row ─────────────────────────────────────────── */
type ClaimProps = { label: string; meta?: string; value?: string; priv?: boolean };
export function Claim({ label, meta, value, priv = false }: ClaimProps) {
  return (
    <div className={"sp-claim" + (priv ? " is-priv" : "")}>
      <span className={"sp-claim-ico " + (priv ? "is-priv" : "is-ok")}>
        {priv ? <I.Lock size={12} stroke={2.2} /> : <I.Check size={13} stroke={2.6} />}
      </span>
      <span className="sp-claim-main">
        <span className="sp-claim-label">{label}</span>
        {meta && <span className="sp-claim-meta">{meta}</span>}
      </span>
      {value && <span className="sp-claim-val">{value}</span>}
    </div>
  );
}

/* ── Section label ─────────────────────────────────────── */
type SecLabelProps = { kind?: "show" | "hide"; children: ReactNode };
export function SecLabel({ kind = "show", children }: SecLabelProps) {
  return (
    <div className={`sp-seclabel ${kind === "show" ? "is-show" : "is-hide"}`}>
      {kind === "show" ? <I.Eye size={15} stroke={2} /> : <I.EyeOff size={15} stroke={2} />}
      {children}
      <span className="sp-line" />
    </div>
  );
}

/* ── Home bar ──────────────────────────────────────────── */
export function HomeBar() {
  return <div className="sp-home-bar" />;
}

/* ── Screen scaffold ───────────────────────────────────── */
export function Screen({ children }: { children: ReactNode }) {
  return <div className="sp-screen">{children}</div>;
}
