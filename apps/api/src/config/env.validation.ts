import { z } from "zod";

/**
 * Phase 1 환경변수 스키마.
 * 외부 연동은 mock 기본값을 허용해 DB 없이도 부팅 가능하게 한다.
 * 실연동(real) 모드 값은 각 Adapter 구현 시점에 강제한다.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),

  IDENTITY_MODE: z.enum(["CX_REAL_MODE", "CX_MOCK_MODE"]).default("CX_MOCK_MODE"),
  FOREIGNER_CLAIM_MODE: z.enum(["MOCK", "REAL"]).default("MOCK"),

  OMNIONE_CX_BASE_URL: z.string().optional(),
  OMNIONE_CX_PROVIDER_ID: z.string().optional(),
  OMNIONE_CX_FOREIGNER_PROVIDER_ID: z.string().optional(),

  CLOVA_OCR_MODE: z.enum(["mock", "real"]).default("mock"),
  CLOVA_OCR_INVOKE_URL: z.string().optional(),
  CLOVA_OCR_SECRET: z.string().optional(),

  AI_REVIEW_MODE: z.enum(["mock", "real"]).default("mock"),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("gpt-4.1-mini"),

  HASH_SECRET_SALT: z.string().default("phase1-dev-salt"),
  FILE_TEMP_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
});

export type AppEnv = z.infer<typeof envSchema>;

/** ConfigModule.forRoot({ validate }) 용 검증 함수. */
export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
