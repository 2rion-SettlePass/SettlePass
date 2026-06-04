import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "SettlePass",
  description: "외국인 정주 신뢰 인프라 — 1차 MVP 데모",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: 브라우저 확장(예: Immersive Translate가 붙이는
    // data-immersive-translate-page-theme)이 하이드레이션 전 <html>/<body> 속성을
    // 변경해 발생하는 양성 경고를 억제한다. 해당 요소 속성 불일치만 무시한다.
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
