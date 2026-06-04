import { describe, it, expect } from "vitest";
import { NotFoundException } from "@nestjs/common";
import type { NormalizedIdentityClaims } from "@settlepass/api-contracts";
import type {
  CreateUserInput,
  UserRecord,
  UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import type { IdentityClaimRepositoryPort } from "../../../identity/domain/identity.repository.port";
import type {
  CreateHousingPassInput,
  HousingPassRepositoryPort,
  StoredHousingPass,
} from "../../domain/housing-pass.repository.port";
import { CreateHousingPassUseCase } from "../../application/use-cases/create-housing-pass.use-case";
import { assertNoForbiddenData } from "../../../../../test/privacy-guard";

const DID = "did:settlepass:user:mock-001";
const USER_ID = "user-uuid-1";

const CLAIMS: NormalizedIdentityClaims = {
  identityVerified: true,
  credentialType: "MOBILE_FOREIGNER_ID_MOCK",
  userDid: DID,
  ageOver19: true,
  residenceValid: true,
  residenceExpiryMonth: "2026-12",
  regionLevel1: "Seoul",
  regionLevel2: "Yeongdeungpo-gu",
  source: "CX_MOCK_WITH_FOREIGNER_CLAIM_MOCK",
  verifiedAt: "2026-06-15T09:00:00+09:00",
};

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

class FakeClaims implements IdentityClaimRepositoryPort {
  private latest: NormalizedIdentityClaims | null = null;
  seed(claims: NormalizedIdentityClaims) {
    this.latest = claims;
  }
  async create(): Promise<void> {
    // unused in this use-case
  }
  async findLatestByUserId(): Promise<NormalizedIdentityClaims | null> {
    return this.latest;
  }
}

class FakeHousingPasses implements HousingPassRepositoryPort {
  public created: CreateHousingPassInput[] = [];
  private store = new Map<string, StoredHousingPass>();
  async create(input: CreateHousingPassInput): Promise<{ id: string }> {
    this.created.push(input);
    const id = `hp-${this.created.length}`;
    this.store.set(id, {
      id,
      userId: input.userId,
      credential: input.credential,
      status: input.status,
    });
    return { id };
  }
  async findById(id: string): Promise<StoredHousingPass | null> {
    return this.store.get(id) ?? null;
  }
}

describe("CreateHousingPassUseCase", () => {
  it("issues an ACTIVE Housing Pass with only public claims and no forbidden data", async () => {
    const users = new FakeUsers();
    users.seed({ id: USER_ID, did: DID, preferredLanguage: "ko" });
    const claims = new FakeClaims();
    claims.seed(CLAIMS);
    const housingPasses = new FakeHousingPasses();

    const uc = new CreateHousingPassUseCase(users, claims, housingPasses);
    const result = await uc.execute({ userDid: DID });

    expect(result.status).toBe("ACTIVE");
    expect(result.housingPassId).toBeTruthy();

    const subject = result.credential.credentialSubject;
    expect(subject.id).toBe(DID);
    expect(subject.identityVerified).toBe(true);
    expect(subject.ageOver19).toBe(true);
    expect(subject.residenceValid).toBe(true);
    expect(subject.regionLevel1).toBe("Seoul");
    expect(subject.residenceExpiryMonth).toBe("2026-12");

    // credentialSubject 는 공개 claim + id 만 담아야 한다(비공개 claim 절대 금지).
    expect(Object.keys(subject).sort()).toEqual(
      [
        "ageOver19",
        "id",
        "identityVerified",
        "regionLevel1",
        "residenceExpiryMonth",
        "residenceValid",
      ].sort(),
    );

    expect(result.credential.type).toEqual([
      "VerifiableCredential",
      "HousingPassCredential",
    ]);
    expect(result.credential.issuer).toBe("did:settlepass:issuer:housing");

    // 영속 입력과 응답 양쪽 모두 금지 데이터가 없어야 한다.
    expect(() => assertNoForbiddenData(result.credential)).not.toThrow();
    expect(() => assertNoForbiddenData(result)).not.toThrow();
    expect(housingPasses.created).toHaveLength(1);
    expect(housingPasses.created[0].status).toBe("ACTIVE");
    expect(housingPasses.created[0].userId).toBe(USER_ID);
    expect(() =>
      assertNoForbiddenData(housingPasses.created[0].credential),
    ).not.toThrow();
  });

  it("throws NotFound when the user does not exist", async () => {
    const uc = new CreateHousingPassUseCase(
      new FakeUsers(),
      new FakeClaims(),
      new FakeHousingPasses(),
    );
    await expect(uc.execute({ userDid: DID })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("throws NotFound when the user has no identity claim", async () => {
    const users = new FakeUsers();
    users.seed({ id: USER_ID, did: DID, preferredLanguage: "ko" });
    const uc = new CreateHousingPassUseCase(
      users,
      new FakeClaims(),
      new FakeHousingPasses(),
    );
    await expect(uc.execute({ userDid: DID })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
