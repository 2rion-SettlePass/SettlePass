import { describe, it, expect } from "vitest";
import { NotFoundException } from "@nestjs/common";
import type {
  CreateUserInput,
  UserRecord,
  UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import type {
  CreateIdentityClaimInput,
  CreateIdentitySessionInput,
  IdentityClaimRepositoryPort,
  IdentitySessionRepositoryPort,
} from "../../domain/identity.repository.port";
import type { IdentitySession } from "../../domain/entities/identity-session.entity";
import type {
  CompleteAuthInput,
  MobileIdentityProviderPort,
  RawIdentityResult,
} from "../../application/ports/mobile-identity-provider.port";
import type {
  ForeignerClaimMockPort,
  ForeignerDefaultClaims,
} from "../../application/ports/foreigner-claim-mock.port";
import { CompleteAuthUseCase } from "../../application/use-cases/complete-auth.use-case";
import { assertNoForbiddenData } from "../../../../../test/privacy-guard";

const DID = "did:settlepass:user:mock-001";

class FakeProvider implements MobileIdentityProviderPort {
  async startAuth() {
    return { status: "READY" as const, provider: "fake" };
  }
  async completeAuth(_input: CompleteAuthInput): Promise<RawIdentityResult> {
    return {
      credentialType: "MOBILE_FOREIGNER_ID_MOCK",
      userDid: DID,
      identityVerified: true,
      source: "CX_MOCK_WITH_FOREIGNER_CLAIM_MOCK",
    };
  }
}

class FakeForeignerClaim implements ForeignerClaimMockPort {
  async issueDefaultClaims(): Promise<ForeignerDefaultClaims> {
    return {
      ageOver19: true,
      residenceValid: true,
      residenceExpiryMonth: "2026-12",
      regionLevel1: "Seoul",
      regionLevel2: "Yeongdeungpo-gu",
    };
  }
}

class FakeSessions implements IdentitySessionRepositoryPort {
  public completedWith: { id: string; userId: string }[] = [];
  private store = new Map<string, IdentitySession>();
  seed(session: IdentitySession) {
    this.store.set(session.id, session);
  }
  async create(input: CreateIdentitySessionInput): Promise<IdentitySession> {
    const s: IdentitySession = { ...input, createdAt: new Date() };
    this.store.set(s.id, s);
    return s;
  }
  async findById(id: string): Promise<IdentitySession | null> {
    return this.store.get(id) ?? null;
  }
  async markCompleted(id: string, userId: string): Promise<void> {
    this.completedWith.push({ id, userId });
  }
}

class FakeClaims implements IdentityClaimRepositoryPort {
  public created: CreateIdentityClaimInput[] = [];
  async create(input: CreateIdentityClaimInput): Promise<void> {
    this.created.push(input);
  }
  async findLatestByUserId() {
    return null;
  }
}

class FakeUsers implements UserRepositoryPort {
  public createCalls = 0;
  private byDid = new Map<string, UserRecord>();
  async findByDid(did: string): Promise<UserRecord | null> {
    return this.byDid.get(did) ?? null;
  }
  async findById(): Promise<UserRecord | null> {
    return null;
  }
  async create(input: CreateUserInput): Promise<UserRecord> {
    this.createCalls += 1;
    const rec: UserRecord = {
      id: input.id,
      did: input.did,
      preferredLanguage: input.preferredLanguage ?? "ko",
    };
    this.byDid.set(rec.did, rec);
    return rec;
  }
}

function makeSession(id: string): IdentitySession {
  return { id, mode: "CX_MOCK_MODE", status: "READY", createdAt: new Date() };
}

describe("CompleteAuthUseCase", () => {
  it("throws NotFound when session is missing", async () => {
    const uc = new CompleteAuthUseCase(
      new FakeProvider(),
      new FakeForeignerClaim(),
      new FakeSessions(),
      new FakeClaims(),
      new FakeUsers(),
    );
    await expect(uc.execute({ authSessionId: "missing" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("creates the user once, persists claims, and returns claims with no forbidden data", async () => {
    const sessions = new FakeSessions();
    sessions.seed(makeSession("sess-1"));
    const claims = new FakeClaims();
    const users = new FakeUsers();

    const uc = new CompleteAuthUseCase(
      new FakeProvider(),
      new FakeForeignerClaim(),
      sessions,
      claims,
      users,
    );

    const res = await uc.execute({ authSessionId: "sess-1" });

    expect(res.userDid).toBe(DID);
    expect(res.userId).toBeTruthy();
    expect(res.claims.identityVerified).toBe(true);
    expect(res.claims.ageOver19).toBe(true);
    expect(res.claims.regionLevel1).toBe("Seoul");
    expect(() => assertNoForbiddenData(res)).not.toThrow();

    // 영속된 claim row 에도 금지 데이터가 없어야 한다.
    expect(claims.created).toHaveLength(1);
    expect(() => assertNoForbiddenData(claims.created[0])).not.toThrow();

    // 세션 completed 표시.
    expect(sessions.completedWith).toEqual([{ id: "sess-1", userId: res.userId }]);

    // 같은 userDid 로 한 번 더 인증하면 User 를 재사용한다(중복 생성 X).
    sessions.seed(makeSession("sess-2"));
    const res2 = await uc.execute({ authSessionId: "sess-2" });
    expect(res2.userId).toBe(res.userId);
    expect(users.createCalls).toBe(1);
  });
});
