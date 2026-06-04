import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    setupFiles: ["./test/load-test-env.ts"],
    hookTimeout: 30000,
    testTimeout: 30000,
    // 통합 스펙들은 동일한 test DB·공유 DEMO 유저(did:...:mock-001)를 사용하므로
    // 파일 병렬 실행 시 User.create(unique did) 가 경합한다. 파일 단위 병렬을 끄고
    // 직렬 실행해 DB-backed 스펙 간 격리를 보장한다(단위 테스트 속도 영향 미미).
    fileParallelism: false,
  },
});
