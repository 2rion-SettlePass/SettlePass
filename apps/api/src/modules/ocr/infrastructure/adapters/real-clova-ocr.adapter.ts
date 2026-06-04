import { randomUUID } from "node:crypto";
import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  OcrExtractInput,
  OcrExtractResult,
  OcrProviderPort,
} from "../../application/ports/ocr-provider.port";

/**
 * CLOVA OCR 어댑터 — CLOVA_OCR_MODE=real 슬롯.
 *
 * Phase 1 에서는 SDK 없이 전역 fetch 로 가드된 호출만 수행한다.
 * INVOKE_URL/SECRET 미설정이거나 호출 실패 시 명확히 throw 하며,
 * ProcessOcrUseCase 의 fallback 이 이를 받아 fixture(mock) 텍스트로 완주한다(R-03/NFR-R-01).
 */
@Injectable()
export class RealClovaOcrAdapter implements OcrProviderPort {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async extractText(input: OcrExtractInput): Promise<OcrExtractResult> {
    const invokeUrl = this.config.get<string>("CLOVA_OCR_INVOKE_URL");
    const secret = this.config.get<string>("CLOVA_OCR_SECRET");
    if (!invokeUrl || !secret) {
      throw new ServiceUnavailableException(
        "CLOVA_OCR_MODE=real not configured (CLOVA_OCR_INVOKE_URL/CLOVA_OCR_SECRET missing)",
      );
    }

    const format = extToClovaFormat(input.filename, input.mimeType);
    const payload = {
      version: "V2",
      requestId: randomUUID(),
      timestamp: Date.now(),
      images: [
        {
          name: input.filename || "contract",
          format,
          data: input.buffer.toString("base64"),
        },
      ],
    };

    const res = await fetch(invokeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-OCR-SECRET": secret,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new ServiceUnavailableException(
        `CLOVA OCR request failed: ${res.status}`,
      );
    }

    const body = (await res.json()) as ClovaOcrResponse;
    const rawText = extractFieldsText(body);
    if (!rawText.trim()) {
      throw new ServiceUnavailableException("CLOVA OCR returned empty text");
    }

    return { rawText, provider: "CLOVA_OCR" };
  }
}

interface ClovaOcrResponse {
  images?: Array<{
    fields?: Array<{ inferText?: string; lineBreak?: boolean }>;
  }>;
}

/** CLOVA fields[] 를 줄바꿈을 보존하며 평문으로 합친다. */
function extractFieldsText(body: ClovaOcrResponse): string {
  const fields = body.images?.[0]?.fields ?? [];
  let text = "";
  for (const field of fields) {
    text += field.inferText ?? "";
    text += field.lineBreak ? "\n" : " ";
  }
  return text;
}

function extToClovaFormat(filename: string, mimeType: string): string {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "jpg";
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext === "pdf" || ext === "png" ? ext : "jpg";
}
