"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, I } from "@/components/settlepass/chrome";
import type { AuditLogEntry } from "@settlepass/api-contracts";
import { api } from "@/lib/api";
import { getFlow } from "@/lib/flow-state";
import { routes } from "@/lib/routes";

/** logType → 표시 이름 + 의미(REVIEW 가 핵심 감사값). */
const LOG_META: Record<
  AuditLogEntry["logType"],
  { name: string; mean: string; point: boolean }
> = {
  CONSENT: {
    name: "consentHash",
    mean: "사용자가 임대인에게 선택한 claim 공개에 동의한 이력",
    point: false,
  },
  VERIFICATION: {
    name: "verificationHash",
    mean: "임대인이 동의된 claim의 검증 결과를 확인한 이력",
    point: false,
  },
  REVIEW: {
    name: "reviewHash",
    mean: "사용자가 AI 계약 리뷰 결과를 확인한 이력 (공증 아님)",
    point: true,
  },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR");
}

export default function AuditLogPage() {
  const [items, setItems] = useState<AuditLogEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingUser, setMissingUser] = useState(false);

  useEffect(() => {
    const userDid = getFlow().userDid;
    if (!userDid) {
      setMissingUser(true);
      setLoading(false);
      return;
    }
    api
      .getAuditLogs(userDid)
      .then((res) => {
        setItems(res.items);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "감사 로그를 불러오지 못했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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

        {loading && <span className="sp-cap">불러오는 중…</span>}

        {missingUser && (
          <div className="sp-notice">
            <I.Info size={16} stroke={2} style={{ color: "var(--caption)", flex: "0 0 16px", marginTop: 1 }} />
            <span className="sp-info-body">
              진행 중인 세션이 없습니다. 먼저 데모를 시작해 주세요.{" "}
              <Link href={routes.landing} style={{ color: "var(--blue-60)", fontWeight: 700 }}>
                시작 화면으로 이동
              </Link>
            </span>
          </div>
        )}

        {error && !items && (
          <span className="sp-cap" style={{ color: "var(--danger, #c0392b)" }}>{error}</span>
        )}

        {items && items.length === 0 && !loading && (
          <span className="sp-cap">아직 기록된 감사 로그가 없습니다.</span>
        )}

        {items?.map((l) => {
          const meta = LOG_META[l.logType];
          return (
            <div
              key={l.id}
              className="sp-hash"
              style={{
                gap: 11,
                borderColor: meta.point ? "var(--blue-50)" : "var(--border-soft)",
                borderWidth: meta.point ? 1.5 : 1,
              }}
            >
              <div className="sp-between">
                <span className="sp-row" style={{ gap: 7 }}>
                  <span style={{ color: meta.point ? "var(--blue-60)" : "var(--caption)" }}>
                    <I.Hash size={16} stroke={2} />
                  </span>
                  <span className="sp-cardtitle">{meta.name}</span>
                </span>
                {meta.point && <span className="sp-badge sp-badge-primary-o">최종 확인</span>}
              </div>
              <div className="sp-hash-val" style={{ color: meta.point ? "var(--blue-70)" : "var(--gray-90)", wordBreak: "break-all" }}>{l.payloadHash}</div>
              <div className="sp-kv" style={{ padding: 0, border: "none" }}>
                <span className="sp-kv-k">
                  <I.Clock size={13} stroke={2} style={{ verticalAlign: -2, marginRight: 4 }} />
                  생성 시각
                </span>
                <span className="sp-cap" style={{ fontFamily: "var(--mono)" }}>{formatTime(l.createdAt)}</span>
              </div>
              <p className="sp-sub" style={{ fontSize: 14 }}>{meta.mean}</p>
              <div className="sp-divider" />
              <div className="sp-col" style={{ gap: 5 }}>
                <span className="sp-cap" style={{ fontFamily: "var(--mono)", wordBreak: "break-all" }}>mockTxHash · {l.mockTxHash ?? "—"}</span>
                <div className="sp-row" style={{ gap: 6, flexWrap: "wrap" }}>
                  <span className="sp-badge sp-badge-success">{l.storage}</span>
                  <span className="sp-badge sp-badge-gray">Phase 2 · OmniOne Chain txHash 예정</span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="sp-warn-panel">
          <I.Info size={16} stroke={2} style={{ color: "var(--warn-text)", flex: "0 0 16px", marginTop: 1 }} />
          <span className="sp-info-body">
            1차 MVP의 <b>mockTxHash는 실제 블록체인 트랜잭션이 아닙니다</b> (DB_ONLY_PHASE1). 데모 단계의 기록용 값입니다.
          </span>
        </div>
      </div>

      <div className="sp-footer">
        <Link href={routes.landing} style={{ textDecoration: "none" }}>
          <Btn variant="tertiary" icon={<I.Reset size={18} stroke={2} />}>데모 초기화</Btn>
        </Link>
      </div>
      <HomeBar />
    </Screen>
  );
}
