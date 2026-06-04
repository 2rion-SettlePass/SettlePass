import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  AiReviewDraft,
  AiReviewGenerateInput,
  AiReviewProviderPort,
} from "../../application/ports/ai-review-provider.port";

/**
 * Real LLM 어댑터 — AI_REVIEW_MODE=real 슬롯.
 *
 * Phase 1 에서는 SDK 없이 전역 fetch 로 OpenAI 호환 chat completion 만 호출한다.
 * AI_API_KEY 미설정이거나 호출 실패/타임아웃/파싱 실패 시 명확히 throw 하며,
 * GenerateReviewUseCase 의 fallback 이 이를 받아 fixture 초안으로 완주한다(NFR-P-04 / R-03).
 *
 * 입력은 이미 마스킹된 normalizedText 이며, 구조화된 JSON 초안만 반환한다
 * (residencePeriodCheck/disclaimer 는 use-case 가 처리하므로 요청하지 않는다).
 */
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
// 긴 계약서 + thinking 모델 대비 여유. 초과 시 use-case 가 fixture 로 fallback.
const REQUEST_TIMEOUT_MS = 60_000;

@Injectable()
export class RealLlmReviewAdapter implements AiReviewProviderPort {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async generate(input: AiReviewGenerateInput): Promise<AiReviewDraft> {
    const apiKey = this.config.get<string>("AI_API_KEY");
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "AI_REVIEW_MODE=real not configured (AI_API_KEY missing)",
      );
    }
    const model = this.config.get<string>("AI_MODEL") ?? "gpt-4.1-mini";
    const baseUrl =
      this.config.get<string>("AI_BASE_URL") ?? DEFAULT_BASE_URL;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          // GLM(Zhipu) 호환: temperature 는 (0,1) 범위로 0 이 거부됨 → 0.1 사용(OpenAI도 무방).
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: buildUserPrompt(input.normalizedText, input.preferredLanguage),
            },
          ],
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      throw new ServiceUnavailableException(
        `LLM request failed: ${res.status}`,
      );
    }

    const body = (await res.json()) as ChatCompletionResponse;
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      throw new ServiceUnavailableException("LLM returned empty content");
    }

    // 모델 출력 파싱 — 실패 시 throw(use-case fallback). 스키마 검증은 use-case 가 수행.
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new ServiceUnavailableException("LLM returned non-JSON content");
    }

    return parsed as AiReviewDraft;
  }
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

const SYSTEM_PROMPT = [
  "You are a Korean housing-lease contract review assistant for foreign residents.",
  "You receive already-masked contract text (names/phones/street addresses are removed).",
  "Return ONLY a JSON object with this exact shape:",
  "{",
  '  "summary": { "deposit"?, "monthlyRent"?, "maintenanceFee"?, "contractStartDate"?, "contractEndDate"?, "addressSummary"? },',
  '  "riskItems": [ { "level": "LOW"|"MEDIUM"|"HIGH", "category", "reason", "evidenceText", "recommendedQuestion" } ],',
  '  "translatedSummary": { "ko"?, "en"?, "zh"?, "vi"? }',
  "}",
  "Rules: amounts/dates as strings; contractStartDate/contractEndDate as YYYY-MM-DD;",
  "addressSummary is a coarse area only (e.g. '서울시 영등포구 소재 원룸'), never a full street address;",
  "do NOT include personal identifiers; do NOT include a residence-period check or any disclaimer;",
  "include at least one riskItem and at least the 'ko' translatedSummary.",
].join("\n");

function buildUserPrompt(normalizedText: string, lang: string): string {
  return [
    `Preferred language for translatedSummary (besides ko): ${lang}.`,
    "Contract text (masked):",
    "---",
    normalizedText,
    "---",
    "Respond with the JSON object only.",
  ].join("\n");
}
