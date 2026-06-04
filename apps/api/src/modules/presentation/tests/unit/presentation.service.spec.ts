import { describe, it, expect } from "vitest";
import { ConfigService } from "@nestjs/config";
import { NotFoundException } from "@nestjs/common";
import type {
  HousingClaimKey,
  HousingPassCredential,
} from "@settlepass/api-contracts";
import { HashService } from "../../../../infra/hash/hash.service";
import type {
  AuditLogWriteInput,
  AuditLogWriterPort,
} from "../../../audit-log/application/ports/audit-log-writer.port";
import { PresentationService } from "../../application/presentation.service";
import type {
  CreatePresentationInput,
  HousingPassReaderPort,
  PresentationRepositoryPort,
  StoredPresentation,
  UpdatePresentationVerificationInput,
} from "../../domain/presentation.repository.port";
import { assertNoForbiddenData } from "../../../../../test/privacy-guard";

const DID = "did:settlepass:user:mock-001";
const REQUEST_ID = "vr-1";
const USER_ID = "user-1";
const CONSENTED: HousingClaimKey[] = [
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

class FakePresentations implements PresentationRepositoryPort {
  public created: CreatePresentationInput[] = [];
  public updateCalls = 0;
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
    this.updateCalls += 1;
    for (const [key, value] of this.store) {
      if (value.id === id) this.store.set(key, { ...value, ...input });
    }
  }
}

class FakeReader implements HousingPassReaderPort {
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

function hashService(): HashService {
  return new HashService({
    get: () => "test-salt",
  } as unknown as ConfigService);
}

describe("PresentationService", () => {
  it("createForConsent builds a VP with consented public claims only (no forbidden data)", async () => {
    const presentations = new FakePresentations();
    const audit = new FakeAuditLog();
    const svc = new PresentationService(
      new FakeReader(),
      presentations,
      hashService(),
      audit,
    );

    await svc.createForConsent({
      requestId: REQUEST_ID,
      userId: USER_ID,
      holderDid: DID,
      consentedClaims: CONSENTED,
    });

    expect(presentations.created).toHaveLength(1);
    const vp = presentations.created[0].presentationJson;
    const subject = vp.verifiableCredential[0].credentialSubject;
    expect(Object.keys(subject).sort()).toEqual(
      ["ageOver19", "id", "identityVerified", "regionLevel1", "residenceValid"].sort(),
    );
    expect(() => assertNoForbiddenData(vp)).not.toThrow();
  });

  it("createForConsent throws NotFound when the user has no housing pass", async () => {
    const svc = new PresentationService(
      new FakeReader(false),
      new FakePresentations(),
      hashService(),
      new FakeAuditLog(),
    );
    await expect(
      svc.createForConsent({
        requestId: REQUEST_ID,
        userId: USER_ID,
        holderDid: DID,
        consentedClaims: CONSENTED,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("getOrCreateVerification is idempotent: same hash, audit written once, no re-hash", async () => {
    const presentations = new FakePresentations();
    const audit = new FakeAuditLog();
    const svc = new PresentationService(
      new FakeReader(),
      presentations,
      hashService(),
      audit,
    );

    await svc.createForConsent({
      requestId: REQUEST_ID,
      userId: USER_ID,
      holderDid: DID,
      consentedClaims: CONSENTED,
    });

    const first = await svc.getOrCreateVerification({
      requestId: REQUEST_ID,
      userId: USER_ID,
    });
    const second = await svc.getOrCreateVerification({
      requestId: REQUEST_ID,
      userId: USER_ID,
    });

    expect(first.verificationHash).toMatch(/^0x/);
    expect(second.verificationHash).toBe(first.verificationHash);
    expect(second.mockTxHash).toBe(first.mockTxHash);

    // verifiedClaims = 동의된 공개 claim (id 제외).
    expect(first.verifiedClaims).toEqual({
      identityVerified: true,
      ageOver19: true,
      residenceValid: true,
      regionLevel1: "Seoul",
    });

    // 멱등: 영속 update 1회, audit VERIFICATION 1건만.
    expect(presentations.updateCalls).toBe(1);
    expect(audit.writes.filter((w) => w.logType === "VERIFICATION")).toHaveLength(
      1,
    );
  });

  it("getOrCreateVerification throws NotFound when no presentation exists", async () => {
    const svc = new PresentationService(
      new FakeReader(),
      new FakePresentations(),
      hashService(),
      new FakeAuditLog(),
    );
    await expect(
      svc.getOrCreateVerification({ requestId: "missing", userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
