"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Screen, StatusBar, Header, Steps, HomeBar, Btn, I } from "@/components/settlepass/chrome";
import type { OcrContractResponse } from "@settlepass/api-contracts";
import { api } from "@/lib/api";
import { getFlow, setFlow } from "@/lib/flow-state";
import { routes } from "@/lib/routes";

const DEMO_USER_DID = "did:settlepass:user:mock-001";
const ACCEPT = ".pdf,.png,.jpg,.jpeg";

const PROCESSING_STEPS = [
  "파일 업로드",
  "CLOVA OCR",
  "텍스트 정규화",
  "AI 계약 리뷰",
  "결과 생성",
];

function userDidFromFlow(): string {
  return getFlow().userDid ?? DEMO_USER_DID;
}

export default function ContractUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OcrContractResponse | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualText, setManualText] = useState("");

  async function runOcr(form: FormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.ocrContract(form);
      setResult(res);
      // 새 계약서 업로드이므로 직전 리뷰 식별자는 초기화하고 ocrDocumentId 를 flow 에 보관(P5 AI 리뷰가 사용).
      setFlow({ reviewId: undefined, ocrDocumentId: res.ocrDocumentId });
      window.localStorage.setItem("settlepass.ocrDocumentId", res.ocrDocumentId);
    } catch {
      // OCR 실패 시 수동 텍스트 입력 fallback 을 노출한다(FR-OCR-06).
      setError("OCR 처리에 실패했습니다. 계약서 텍스트를 직접 붙여넣어 다시 시도할 수 있습니다.");
      setShowManual(true);
    } finally {
      setLoading(false);
    }
  }

  function onPickFile() {
    fileInputRef.current?.click();
  }

  async function onFileSelected(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    const form = new FormData();
    form.append("file", file);
    form.append("userDid", userDidFromFlow());
    await runOcr(form);
  }

  async function onSampleDemo() {
    setFileName("샘플 월세계약서 (mock)");
    const form = new FormData();
    form.append("userDid", userDidFromFlow());
    // 파일/manualText 없이 전송 → 백엔드가 fixture(FIXTURE_OCR) 로 fallback.
    await runOcr(form);
  }

  async function onManualSubmit() {
    if (manualText.trim().length === 0) {
      setError("계약서 텍스트를 입력해 주세요.");
      return;
    }
    const form = new FormData();
    form.append("userDid", userDidFromFlow());
    form.append("manualText", manualText);
    await runOcr(form);
  }

  function onStartReview() {
    if (!result) return;
    router.push(routes.aiReview(result.ocrDocumentId));
  }

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

        {!result && (
          <>
            <div className="sp-upload">
              <span className="sp-up-ico"><I.Upload size={24} stroke={2} /></span>
              <span className="sp-cardtitle">계약서를 올려주세요</span>
              <span className="sp-cap">PDF · PNG · JPG 지원 · 최대 10MB</span>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                style={{ display: "none" }}
                onChange={(e) => onFileSelected(e.target.files?.[0] ?? undefined)}
              />
              <Btn
                variant="secondary"
                size="sm"
                block={false}
                icon={<I.File size={16} stroke={2} />}
                onClick={onPickFile}
              >
                {loading ? "처리 중…" : "파일 선택"}
              </Btn>
              {fileName && (
                <span className="sp-cap" style={{ marginTop: 6 }}>{fileName}</span>
              )}
            </div>

            <Btn
              variant="tertiary"
              size="sm"
              block={false}
              icon={<I.Sparkle size={16} stroke={2} />}
              onClick={onSampleDemo}
            >
              샘플 계약서로 데모
            </Btn>
          </>
        )}

        {error && (
          <div className="sp-notice" style={{ borderColor: "var(--danger, #d33)" }}>
            <I.Lock size={16} stroke={2} style={{ color: "var(--danger, #d33)", flex: "0 0 16px", marginTop: 1 }} />
            <span className="sp-info-body">{error}</span>
          </div>
        )}

        {showManual && !result && (
          <div className="sp-card" style={{ gap: 8 }}>
            <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)" }}>
              계약서 텍스트 직접 입력 (OCR 대체)
            </span>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={6}
              placeholder="계약서 내용을 붙여넣어 주세요. 금액·날짜는 분석에 사용되고, 이름·연락처·상세주소는 자동으로 마스킹됩니다."
              style={{ width: "100%", resize: "vertical", padding: 10, borderRadius: 8, border: "1px solid var(--line, #ddd)", fontSize: 13 }}
            />
            <Btn variant="primary" size="sm" onClick={onManualSubmit}>
              {loading ? "처리 중…" : "텍스트로 분석"}
            </Btn>
          </div>
        )}

        {result && (
          <div className="sp-card" style={{ gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="sp-cardtitle">OCR 완료</span>
              <span className="sp-badge sp-badge-info" style={{ marginLeft: "auto" }}>
                {result.provider}
              </span>
            </div>
            <span className="sp-cap" style={{ color: "var(--sub)" }}>마스킹된 항목</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {result.maskedFields.length === 0 && (
                <span className="sp-cap">마스킹된 항목 없음</span>
              )}
              {result.maskedFields.map((f) => (
                <span key={f} className="sp-badge sp-badge-warn">{f}</span>
              ))}
            </div>
            <span className="sp-cap" style={{ color: "var(--sub)", marginTop: 4 }}>본문 미리보기 (마스킹 적용)</span>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.5, background: "var(--surface, #f6f6f6)", padding: 10, borderRadius: 8, maxHeight: 180, overflow: "auto", margin: 0 }}>
              {result.textPreview}
            </pre>
          </div>
        )}

        {!result && (
          <div className="sp-card" style={{ gap: 0 }}>
            <span className="sp-cap" style={{ fontWeight: 700, color: "var(--sub)", marginBottom: 4 }}>처리 단계</span>
            {PROCESSING_STEPS.map((label, i) => (
              <div key={i} className={`sp-pstep${loading ? " is-active" : ""}`}>
                <span className="sp-pstep-num">{i + 1}</span>
                <span className="sp-pstep-label">{label}</span>
                {loading && <span className="sp-badge sp-badge-info" style={{ marginLeft: "auto" }}>처리 중</span>}
              </div>
            ))}
          </div>
        )}

        <div className="sp-notice">
          <I.Lock size={16} stroke={2} style={{ color: "var(--caption)", flex: "0 0 16px", marginTop: 1 }} />
          <span className="sp-info-body">계약서 원문은 장기 저장하지 않습니다. 분석 완료 후 필요한 최소 결과만 저장합니다.</span>
        </div>
      </div>

      {result && (
        <div className="sp-footer">
          <Btn
            variant="primary"
            icon={<I.Sparkle size={18} stroke={2} />}
            onClick={onStartReview}
          >
            AI 리뷰 시작
          </Btn>
        </div>
      )}
      <HomeBar />
    </Screen>
  );
}
