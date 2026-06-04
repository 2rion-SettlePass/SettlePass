import { describe, it, expect } from "vitest";
import { NotFoundException } from "@nestjs/common";
import type {
  CreateUserInput,
  UserRecord,
  UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import type {
  OcrExtractInput,
  OcrExtractResult,
  OcrProviderPort,
} from "../../application/ports/ocr-provider.port";
import type {
  CreateOcrDocumentInput,
  OcrDocumentRepositoryPort,
  StoredOcrDocument,
} from "../../domain/ocr.repository.port";
import { ProcessOcrUseCase } from "../../application/use-cases/process-ocr.use-case";
import { assertNoForbiddenData } from "../../../../../test/privacy-guard";

const DID = "did:settlepass:user:mock-001";
const USER_ID = "user-uuid-1";

const PII_CONTRACT = `임차인 성명: 린 응웬
임차인 연락처: 010-1234-5678
상세주소: 서울특별시 영등포구 여의대로 24
보증금: 5,000,000원
계약기간: 2026-08-01 ~ 2027-07-31`;

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

class FakeOcrProvider implements OcrProviderPort {
  public calls = 0;
  constructor(
    private readonly behavior:
      | { kind: "ok"; result: OcrExtractResult }
      | { kind: "throw" },
  ) {}
  async extractText(_input: OcrExtractInput): Promise<OcrExtractResult> {
    this.calls += 1;
    if (this.behavior.kind === "throw") {
      throw new Error("provider boom");
    }
    return this.behavior.result;
  }
}

class FakeDocuments implements OcrDocumentRepositoryPort {
  public created: CreateOcrDocumentInput[] = [];
  private store = new Map<string, StoredOcrDocument>();
  async create(input: CreateOcrDocumentInput): Promise<{ id: string }> {
    this.created.push(input);
    const id = `ocr-${this.created.length}`;
    this.store.set(id, { id, ...input });
    return { id };
  }
  async findById(id: string): Promise<StoredOcrDocument | null> {
    return this.store.get(id) ?? null;
  }
}

function seededUsers(): FakeUsers {
  const users = new FakeUsers();
  users.seed({ id: USER_ID, did: DID, preferredLanguage: "ko" });
  return users;
}

const FILE = {
  buffer: Buffer.from("fake-bytes"),
  filename: "contract.pdf",
  mimeType: "application/pdf",
};

describe("ProcessOcrUseCase", () => {
  it("processes the mock provider happy path: COMPLETED, masked text stored, no raw phone", async () => {
    const users = seededUsers();
    const provider = new FakeOcrProvider({
      kind: "ok",
      result: { rawText: PII_CONTRACT, provider: "CLOVA_OCR" },
    });
    const docs = new FakeDocuments();
    const uc = new ProcessOcrUseCase(users, provider, docs);

    const res = await uc.execute({ userDid: DID, file: FILE });

    expect(res.status).toBe("COMPLETED");
    expect(res.provider).toBe("CLOVA_OCR");
    expect(res.ocrDocumentId).toBeTruthy();
    expect(res.textPreview.length).toBeGreaterThan(0);
    expect(res.maskedFields.length).toBeGreaterThan(0);

    // 응답·영속 텍스트 모두 원문 전화번호가 없어야 한다(마스킹 검증).
    expect(/\d{2,3}-\d{3,4}-\d{4}/.test(res.textPreview)).toBe(false);
    expect(docs.created).toHaveLength(1);
    const storedText = docs.created[0].normalizedText;
    expect(/\d{2,3}-\d{3,4}-\d{4}/.test(storedText)).toBe(false);
    expect(storedText).not.toContain("린 응웬");
    expect(storedText).not.toContain("여의대로");
    // 금액·날짜는 유지.
    expect(storedText).toContain("5,000,000원");
    expect(storedText).toContain("2026-08-01");
    expect(docs.created[0].userId).toBe(USER_ID);
    expect(() => assertNoForbiddenData(res)).not.toThrow();
  });

  it("falls back to fixture text when the provider throws (still COMPLETED, FIXTURE_OCR)", async () => {
    const users = seededUsers();
    const provider = new FakeOcrProvider({ kind: "throw" });
    const docs = new FakeDocuments();
    const uc = new ProcessOcrUseCase(users, provider, docs);

    const res = await uc.execute({ userDid: DID, file: FILE });

    expect(provider.calls).toBe(1);
    expect(res.status).toBe("COMPLETED");
    expect(res.provider).toBe("FIXTURE_OCR");
    expect(docs.created).toHaveLength(1);
    // fixture 도 마스킹을 거쳐 저장되며 금액은 유지된다.
    expect(docs.created[0].normalizedText).toContain("5,000,000원");
    expect(/\d{2,3}-\d{3,4}-\d{4}/.test(docs.created[0].normalizedText)).toBe(
      false,
    );
  });

  it("uses manualText without calling the provider (FIXTURE_OCR)", async () => {
    const users = seededUsers();
    const provider = new FakeOcrProvider({
      kind: "ok",
      result: { rawText: "SHOULD_NOT_BE_USED", provider: "CLOVA_OCR" },
    });
    const docs = new FakeDocuments();
    const uc = new ProcessOcrUseCase(users, provider, docs);

    const res = await uc.execute({ userDid: DID, manualText: PII_CONTRACT });

    expect(provider.calls).toBe(0);
    expect(res.provider).toBe("FIXTURE_OCR");
    expect(res.status).toBe("COMPLETED");
    expect(docs.created[0].normalizedText).not.toContain("SHOULD_NOT_BE_USED");
    expect(docs.created[0].normalizedText).toContain("5,000,000원");
  });

  it("throws NotFound when the user does not exist", async () => {
    const uc = new ProcessOcrUseCase(
      new FakeUsers(),
      new FakeOcrProvider({
        kind: "ok",
        result: { rawText: PII_CONTRACT, provider: "CLOVA_OCR" },
      }),
      new FakeDocuments(),
    );
    await expect(
      uc.execute({ userDid: DID, file: FILE }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
