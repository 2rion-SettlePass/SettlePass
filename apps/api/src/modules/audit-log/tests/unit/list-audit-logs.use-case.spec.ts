import { describe, it, expect, beforeEach } from "vitest";
import { NotFoundException } from "@nestjs/common";
import type { AuditLogEntry } from "@settlepass/api-contracts";
import type {
  CreateUserInput,
  UserRecord,
  UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import type { AuditLogReaderPort } from "../../application/ports/audit-log-reader.port";
import { ListAuditLogsUseCase } from "../../application/use-cases/list-audit-logs.use-case";

const DID_A = "did:settlepass:user:mock-001";
const USER_A = "user-a";
const DID_B = "did:settlepass:user:mock-002";
const USER_B = "user-b";

function entry(
  id: string,
  userId: string,
  logType: AuditLogEntry["logType"],
): AuditLogEntry & { userId: string } {
  return {
    id,
    userId,
    logType,
    payloadHash: `0x${id}`,
    mockTxHash: `mocktx_${logType.toLowerCase()}_20260603_0001`,
    storage: "DB_ONLY_PHASE1",
    createdAt: "2026-06-03T00:00:00.000Z",
  };
}

class FakeUsers implements UserRepositoryPort {
  private byDid = new Map<string, UserRecord>();
  seed(rec: UserRecord) {
    this.byDid.set(rec.did, rec);
  }
  async findByDid(did: string): Promise<UserRecord | null> {
    return this.byDid.get(did) ?? null;
  }
  async findById(): Promise<UserRecord | null> {
    return null;
  }
  async create(input: CreateUserInput): Promise<UserRecord> {
    const rec: UserRecord = {
      id: input.id,
      did: input.did,
      preferredLanguage: input.preferredLanguage ?? "ko",
    };
    this.byDid.set(rec.did, rec);
    return rec;
  }
}

/** userId 로 스코프된 in-memory reader — listByUserId 가 본인 로그만 돌려주는지 검증. */
class FakeReader implements AuditLogReaderPort {
  private all: (AuditLogEntry & { userId: string })[] = [];
  seed(...rows: (AuditLogEntry & { userId: string })[]) {
    this.all.push(...rows);
  }
  async listByUserId(
    userId: string,
    logType?: AuditLogEntry["logType"],
  ): Promise<AuditLogEntry[]> {
    return this.all
      .filter((r) => r.userId === userId && (!logType || r.logType === logType))
      .map(({ userId: _userId, ...entry }) => entry);
  }
}

function build(): {
  uc: ListAuditLogsUseCase;
  users: FakeUsers;
  reader: FakeReader;
} {
  const users = new FakeUsers();
  users.seed({ id: USER_A, did: DID_A, preferredLanguage: "ko" });
  users.seed({ id: USER_B, did: DID_B, preferredLanguage: "ko" });
  const reader = new FakeReader();
  reader.seed(
    entry("a-consent", USER_A, "CONSENT"),
    entry("a-verification", USER_A, "VERIFICATION"),
    entry("a-review", USER_A, "REVIEW"),
    entry("b-consent", USER_B, "CONSENT"),
    entry("b-review", USER_B, "REVIEW"),
  );
  const uc = new ListAuditLogsUseCase(users, reader);
  return { uc, users, reader };
}

describe("ListAuditLogsUseCase", () => {
  let ctx: ReturnType<typeof build>;

  beforeEach(() => {
    ctx = build();
  });

  it("returns only the resolved user's entries (a second user's logs excluded)", async () => {
    const res = await ctx.uc.execute({ userDid: DID_A });

    expect(res.items).toHaveLength(3);
    const ids = res.items.map((i) => i.id).sort();
    expect(ids).toEqual(["a-consent", "a-review", "a-verification"]);
    // user B 의 로그는 절대 포함되지 않는다(NFR-S-05).
    expect(res.items.some((i) => i.id.startsWith("b-"))).toBe(false);
    // 모든 항목은 DB_ONLY_PHASE1 + payloadHash 를 가진다.
    for (const item of res.items) {
      expect(item.storage).toBe("DB_ONLY_PHASE1");
      expect(item.payloadHash).toMatch(/^0x/);
    }
  });

  it("logType filter narrows to the requested type only", async () => {
    const res = await ctx.uc.execute({ userDid: DID_A, logType: "REVIEW" });
    expect(res.items).toHaveLength(1);
    expect(res.items[0].id).toBe("a-review");
    expect(res.items[0].logType).toBe("REVIEW");
  });

  it("missing user → 404", async () => {
    await expect(
      ctx.uc.execute({ userDid: "did:settlepass:user:nope" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
