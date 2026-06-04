import { createHash as nodeCreateHash, randomBytes } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type AuditHashKind = "consent" | "verification" | "review";

/**
 * 교차 관심사 해시 서비스 (NFR-S-03).
 * - salt(HASH_SECRET_SALT) + per-payload nonce 로 결정적 SHA-256 해시 생성.
 * - mockTxHash 는 이름에 `mock` 을 포함해 실제 체인 txHash 와 혼동되지 않도록 한다.
 */
@Injectable()
export class HashService {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  /** 동일한 (nonce, payload) 에 대해 항상 같은 값을 돌려주는 결정적 해시. */
  hashWith(nonce: string, payload: unknown): string {
    const salt = this.configService.get<string>("HASH_SECRET_SALT") ?? "";
    const input = `${salt}:${nonce}:${stableStringify(payload)}`;
    const digest = nodeCreateHash("sha256").update(input).digest("hex");
    return `0x${digest}`;
  }

  /** payload 별 무작위 nonce 를 생성하고 {hash, nonce} 를 함께 반환한다. */
  createHash(payload: unknown): { hash: string; nonce: string } {
    const nonce = randomBytes(16).toString("hex");
    return { hash: this.hashWith(nonce, payload), nonce };
  }

  /** 데모용 mock 트랜잭션 해시. 실제 체인 txHash 가 아님을 이름으로 명시한다. */
  mockTxHash(kind: AuditHashKind, seq = 1): string {
    const now = new Date();
    const yyyymmdd = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(
      now.getDate(),
    )}`;
    return `mocktx_${kind}_${yyyymmdd}_${String(seq).padStart(4, "0")}`;
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Phase 1: JSON.stringify 로 충분(키 순서 입력에 의존). */
function stableStringify(payload: unknown): string {
  return JSON.stringify(payload);
}
