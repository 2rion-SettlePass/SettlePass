import { describe, it, expect, beforeEach } from "vitest";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  HousingClaimKey,
  HousingPassCredential,
} from "@settlepass/api-contracts";
import { buildPresentationVp } from "@settlepass/shared";
import { HashService } from "../../../../infra/hash/hash.service";
import type {
  AuditLogWriteInput,
  AuditLogWriterPort,
} from "../../../audit-log/application/ports/audit-log-writer.port";
import { PresentationService } from "../../../presentation/application/presentation.service";
import type {
  CreatePresentationInput,
  HousingPassReaderPort,
  PresentationRepositoryPort,
  StoredPresentation,
  UpdatePresentationVerificationInput,
} from "../../../presentation/domain/presentation.repository.port";
import type {
  CreateUserInput,
  UserRecord,
  UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import type { VerificationRequestStatus } from "../../../verification-request/domain/entities/verification-request.entity";
import type {
  CreateVerificationRequestInput,
  StoredVerificationRequest,
  VerificationRequestRepositoryPort,
} from "../../../verification-request/domain/verification-request.repository.port";
import type {
  ConsentRepositoryPort,
  CreateConsentInput,
} from "../../domain/consent.repository.port";
import { ConsentToVerificationUseCase } from "../../application/use-cases/consent-to-verification.use-case";
import { assertNoForbiddenData } from "../../../../../test/privacy-guard";

const DID = "did:settlepass:user:mock-001";
const USER_ID = "user-1";
const REQUEST_ID = "vr-1";
const REQUESTED: HousingClaimKey[] = [
  "identityVerified",
  "ageOver19",
  "residenceValid",
  "regionLevel1",
];

const CREDENTIAL: HousingPassCredential = {
  id: "urn:uuid:hp-1",
  type: ["VerifiableCredential", "HousingPassCredential"],
  issuer: "did:settlepass:issuer:housing",
  issuanceDate: "2026-06-15T09:00:00+09:00",
  expirationDate: "2026-12-31T23:59:59+09:00",
  credentialSubject: {
    id: DID,
    identityVerified: true,
    ageOver19: true,
    residenceValid: true,
    regionLevel1: "Seoul",
    residenceExpiryMonth: "2026-12",
  },
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
    const rec = {
      id: input.id,
      did: input.did,
      preferredLanguage: input.preferredLanguage ?? "ko",
    };
    this.byDid.set(rec.did, rec);
    return rec;
  }
}

class FakeRequests implements VerificationRequestRepositoryPort {
  public statusUpdates: { id: string; status: VerificationRequestStatus }[] =
    [];
  private store = new Map<string, StoredVerificationRequest>();
  seed(req: StoredVerificationRequest) {
    this.store.set(req.id, req);
  }
  async create(input: CreateVerificationRequestInput): Promise<{ id: string }> {
    const id = `vr-${this.store.size + 1}`;
    this.store.set(id, { id, verifierName: "Mr. Kim", ...input });
    return { id };
  }
  async findById(id: string): Promise<StoredVerificationRequest | null> {
    return this.store.get(id) ?? null;
  }
  async updateStatus(
    id: string,
    status: VerificationRequestStatus,
  ): Promise<void> {
    this.statusUpdates.push({ id, status });
    const existing = this.store.get(id);
    if (existing) this.store.set(id, { ...existing, status });
  }
}

class FakeConsents implements ConsentRepositoryPort {
  public created: CreateConsentInput[] = [];
  async create(input: CreateConsentInput): Promise<{ id: string }> {
    this.created.push(input);
    return { id: `consent-${this.created.length}` };
  }
}

class FakePresentations implements PresentationRepositoryPort {
  public created: CreatePresentationInput[] = [];
  private store = new Map<string, StoredPresentation>();
  async create(input: CreatePresentationInput): Promise<{ id: string }> {
    this.created.push(input);
    const id = `pres-${this.created.length}`;
    this.store.set(input.requestId, {
      id,
      requestId: input.requestId,
      housingPassId: input.housingPassId,
      presentationJson: input.presentationJson,
      verificationHash: null,
      mockTxHash: null,
      status: input.status,
    });
    return { id };
  }
  async findByRequestId(requestId: string): Promise<StoredPresentation | null> {
    return this.store.get(requestId) ?? null;
  }
  async updateVerification(
    id: string,
    input: UpdatePresentationVerificationInput,
  ): Promise<void> {
    for (const [key, value] of this.store) {
      if (value.id === id) {
        this.store.set(key, { ...value, ...input });
      }
    }
  }
}

class FakeHousingPassReader implements HousingPassReaderPort {
  constructor(private readonly has = true) {}
  async findLatestByUserId(): Promise<{
    id: string;
    credential: unknown;
  } | null> {
    return this.has ? { id: "hp-1", credential: CREDENTIAL } : null;
  }
}

class FakeAuditLog implements AuditLogWriterPort {
  public writes: AuditLogWriteInput[] = [];
  async write(input: AuditLogWriteInput): Promise<void> {
    this.writes.push(input);
  }
}

function makeHashService(): HashService {
  return new HashService({
    get: () => "test-salt",
  } as unknown as ConfigService);
}

function storedRequest(
  status: VerificationRequestStatus,
  overrides: Partial<StoredVerificationRequest> = {},
): StoredVerificationRequest {
  return {
    id: REQUEST_ID,
    verifierId: "verifier-1",
    verifierName: "Mr. Kim",
    targetUserId: USER_ID,
    purpose: "HOUSING_CONTRACT",
    requestedClaims: REQUESTED,
    status,
    ...overrides,
  };
}

function build(
  reader: FakeHousingPassReader = new FakeHousingPassReader(),
): {
  uc: ConsentToVerificationUseCase;
  users: FakeUsers;
  requests: FakeRequests;
  consents: FakeConsents;
  presentations: FakePresentations;
  audit: FakeAuditLog;
} {
  const users = new FakeUsers();
  users.seed({ id: USER_ID, did: DID, preferredLanguage: "ko" });
  const requests = new FakeRequests();
  const consents = new FakeConsents();
  const presentations = new FakePresentations();
  const audit = new FakeAuditLog();
  const presentationService = new PresentationService(
    reader,
    presentations,
    makeHashService(),
    audit,
  );
  const uc = new ConsentToVerificationUseCase(
    users,
    requests,
    consents,
    makeHashService(),
    presentationService,
    audit,
  );
  return { uc, users, requests, consents, presentations, audit };
}

describe("ConsentToVerificationUseCase", () => {
  let ctx: ReturnType<typeof build>;

  beforeEach(() => {
    ctx = build();
  });

  it("consent=false → REJECTED with no VP and no hashes", async () => {
    ctx.requests.seed(storedRequest("CREATED"));
    const res = await ctx.uc.execute({
      requestId: REQUEST_ID,
      userDid: DID,
      consent: false,
      consentedClaims: [],
    });

    expect(res.status).toBe("REJECTED");
    expect(res.consentHash).toBeUndefined();
    expect(res.mockTxHash).toBeUndefined();
    expect(ctx.presentations.created).toHaveLength(0);
    expect(ctx.audit.writes).toHaveLength(0);
    expect(ctx.requests.statusUpdates).toEqual([
      { id: REQUEST_ID, status: "REJECTED" },
    ]);
    expect(ctx.consents.created[0].status).toBe("REJECTED");
  });

  it("consentedClaims ⊄ requestedClaims → 400", async () => {
    ctx.requests.seed(
      storedRequest("CREATED", {
        requestedClaims: ["identityVerified", "ageOver19"],
      }),
    );
    await expect(
      ctx.uc.execute({
        requestId: REQUEST_ID,
        userDid: DID,
        consent: true,
        consentedClaims: ["identityVerified", "residenceValid"],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("wrong user → Forbidden", async () => {
    ctx.requests.seed(storedRequest("CREATED", { targetUserId: "other" }));
    await expect(
      ctx.uc.execute({
        requestId: REQUEST_ID,
        userDid: DID,
        consent: true,
        consentedClaims: REQUESTED,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("non-consentable status → Conflict", async () => {
    ctx.requests.seed(storedRequest("CONSENTED"));
    await expect(
      ctx.uc.execute({
        requestId: REQUEST_ID,
        userDid: DID,
        consent: true,
        consentedClaims: REQUESTED,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("consent=true → CONSENTED with consentHash+mockTxHash, VP from consented claims only, audit CONSENT", async () => {
    ctx.requests.seed(storedRequest("CREATED"));
    const res = await ctx.uc.execute({
      requestId: REQUEST_ID,
      userDid: DID,
      consent: true,
      consentedClaims: REQUESTED,
    });

    expect(res.status).toBe("CONSENTED");
    expect(res.consentHash).toMatch(/^0x/);
    expect(res.mockTxHash).toContain("mocktx_consent_");

    // VP 는 동의된 공개 claim 만 담는다(비공개 claim 절대 미포함).
    expect(ctx.presentations.created).toHaveLength(1);
    const vp = ctx.presentations.created[0].presentationJson;
    const subject = vp.verifiableCredential[0].credentialSubject;
    expect(Object.keys(subject).sort()).toEqual(
      ["ageOver19", "id", "identityVerified", "regionLevel1", "residenceValid"].sort(),
    );
    expect(() => assertNoForbiddenData(vp)).not.toThrow();

    // CONSENT audit 1건 기록.
    expect(ctx.audit.writes).toHaveLength(1);
    expect(ctx.audit.writes[0].logType).toBe("CONSENT");
    expect(ctx.audit.writes[0].payloadHash).toBe(res.consentHash);

    // VR → CONSENTED 전이.
    expect(ctx.requests.statusUpdates).toEqual([
      { id: REQUEST_ID, status: "CONSENTED" },
    ]);
  });

  it("VP excludes claims not consented (subset consent)", async () => {
    ctx.requests.seed(storedRequest("CREATED"));
    await ctx.uc.execute({
      requestId: REQUEST_ID,
      userDid: DID,
      consent: true,
      consentedClaims: ["identityVerified", "ageOver19"],
    });
    const subject =
      ctx.presentations.created[0].presentationJson.verifiableCredential[0]
        .credentialSubject;
    expect(Object.keys(subject).sort()).toEqual(
      ["ageOver19", "id", "identityVerified"].sort(),
    );
    expect(subject).not.toHaveProperty("residenceValid");
    expect(subject).not.toHaveProperty("regionLevel1");
  });

  it("buildPresentationVp itself never leaks private claims", () => {
    // 방어적 단언: 비공개 키를 동의 목록에 넣어도 VP 에 새지 않는다.
    const vp = buildPresentationVp({
      id: "urn:uuid:x",
      holderDid: DID,
      credential: CREDENTIAL,
      consentedClaims: REQUESTED,
    });
    expect(() => assertNoForbiddenData(vp)).not.toThrow();
  });
});
