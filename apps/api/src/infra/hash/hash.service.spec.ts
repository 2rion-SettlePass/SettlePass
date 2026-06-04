import { describe, it, expect, beforeEach } from "vitest";
import type { ConfigService } from "@nestjs/config";
import { HashService } from "./hash.service";

describe("HashService", () => {
  let service: HashService;

  beforeEach(() => {
    const fakeConfig = {
      get: () => "phase1-test-salt",
    } as unknown as ConfigService;
    service = new HashService(fakeConfig);
  });

  it("hashWith is deterministic for the same (nonce, payload)", () => {
    const nonce = "fixed-nonce";
    const payload = { a: 1, b: "two" };
    const first = service.hashWith(nonce, payload);
    const second = service.hashWith(nonce, payload);
    expect(first).toBe(second);
  });

  it("createHash produces a different nonce and hash on each call for the same payload", () => {
    const payload = { same: "payload" };
    const a = service.createHash(payload);
    const b = service.createHash(payload);
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.hash).not.toBe(b.hash);
  });

  it("hash starts with 0x", () => {
    const { hash } = service.createHash({ x: 1 });
    expect(hash.startsWith("0x")).toBe(true);
  });

  it("mockTxHash('review') contains 'mock' and 'review'", () => {
    const tx = service.mockTxHash("review");
    expect(tx).toContain("mock");
    expect(tx).toContain("review");
  });
});
