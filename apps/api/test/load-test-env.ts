import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 테스트 실행 전 환경변수 로더 (dotenv 미사용).
 * 모노레포 루트의 `.env.test` 를 직접 파싱해 이미 설정되지 않은 키만 채운다.
 * 파일이 없으면 최소한의 DATABASE_URL(test DB) 만 보장한다.
 */
const FALLBACK_TEST_DATABASE_URL =
  "postgresql://user:password@localhost:5432/settlepass_test?schema=public";

function applyEnvFromFile(path: string): void {
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key === "") continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

try {
  // apps/api/test/ → 모노레포 루트는 3단계 위.
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, "../../..");
  applyEnvFromFile(resolve(repoRoot, ".env.test"));
} catch {
  // .env.test 가 없으면 test DB 만 보장한다.
  process.env.DATABASE_URL ||= FALLBACK_TEST_DATABASE_URL;
}
