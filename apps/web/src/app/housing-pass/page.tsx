"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, Claim, SecLabel, I } from "@/components/settlepass/chrome";
import type { CreateHousingPassResponse } from "@settlepass/api-contracts";
import { api } from "@/lib/api";
import { getFlow, setFlow } from "@/lib/flow-state";
import { routes } from "@/lib/routes";

function valueOf(v: boolean | string | undefined): string {
  if (v === undefined) return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return v;
}

export default function HousingPassPage() {
  const [userDid, setUserDid] = useState<string | null>(null);
  const [pass, setPass] = useState<CreateHousingPassResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUserDid(getFlow().userDid ?? null);
  }, []);

  const create = () => {
    if (!userDid) return;
    setLoading(true);
    setError(null);
    api
      .createHousingPass({ userDid })
      .then((res) => {
        setPass(res);
        setFlow({ housingPassId: res.housingPassId });
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Housing Pass 생성에 실패했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const subject = pass?.credential.credentialSubject;

  return (
    <Screen>
      <StatusBar />
      <Header lang="KO" status="verified" />
      <Steps current={2} />
      <div className="sp-body" style={{ gap: 18 }}>
        <div>
          <span className="sp-eyebrow">STEP 2 · HOUSING PASS</span>
          <h2 className="sp-h2" style={{ marginTop: 4 }}>주거계약용 최소 자격증명</h2>
          <p className="sp-sub" style={{ marginTop: 6 }}>Housing Pass는 월세계약에 필요한 최소 정보만 담습니다.</p>
        </div>

        {!userDid ? (
          <div className="sp-card" style={{ gap: 10 }}>
            <span className="sp-cardtitle">아직 인증되지 않았습니다</span>
            <span className="sp-cap">먼저 모바일 신분증 인증을 완료하세요.</span>
            <Link href={routes.auth} style={{ textDecoration: "none" }}>
              <Btn variant="primary" iconR={<I.ArrowR size={18} stroke={2} />}>인증하러 가기</Btn>
            </Link>
          </div>
        ) : (
          <div className="sp-card is-pad-lg" style={{ gap: 12, borderColor: "var(--blue-50)", borderWidth: 1.5 }}>
            <div className="sp-card-head">
              <span className="sp-card-head-l">
                <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--blue-50)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <I.Key size={17} stroke={2} />
                </span>
                <span className="sp-cardtitle">Housing Pass</span>
              </span>
              {pass && <span className="sp-badge sp-badge-success">{pass.status}</span>}
            </div>
            {error ? (
              <span className="sp-cap" style={{ color: "var(--danger, #c0392b)" }}>{error}</span>
            ) : pass && subject ? (
              <div className="sp-claims">
                <Claim label="본인확인 완료" meta="identityVerified" value={valueOf(subject.identityVerified)} />
                <Claim label="성인 여부" meta="ageOver19" value={valueOf(subject.ageOver19)} />
                <Claim label="체류 유효 여부" meta="residenceValid" value={valueOf(subject.residenceValid)} />
                <Claim label="체류 만료 월" meta="residenceExpiryMonth" value={valueOf(subject.residenceExpiryMonth)} />
                <Claim label="거주지역" meta="regionLevel1" value={valueOf(subject.regionLevel1)} />
              </div>
            ) : (
              <span className="sp-cap">아래 버튼을 눌러 Housing Pass를 생성하세요.</span>
            )}
          </div>
        )}

        <div className="sp-card" style={{ gap: 4, background: "var(--gray-5)", border: "none" }}>
          <SecLabel kind="hide">공개하지 않는 정보</SecLabel>
          <div className="sp-claims">
            <Claim label="외국인등록번호" priv />
            <Claim label="국적" priv />
            <Claim label="상세주소" priv />
            <Claim label="체류자격 원문" priv />
          </div>
        </div>
      </div>

      <div className="sp-footer">
        {userDid && !pass ? (
          <Btn variant="primary" onClick={create}>
            {loading ? "생성 중…" : "Housing Pass 생성하기"}
          </Btn>
        ) : null}
        <Link href={routes.verifierNewRequest} style={{ textDecoration: "none" }}>
          <Btn variant="tertiary" iconR={<I.ArrowR size={18} stroke={2} />}>임대인 요청 보기</Btn>
        </Link>
      </div>
      <HomeBar />
    </Screen>
  );
}
