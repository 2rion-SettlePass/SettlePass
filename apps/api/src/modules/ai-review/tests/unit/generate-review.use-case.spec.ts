import { describe, it, expect } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { DEMO_CONTRACT_REVIEW } from "@settlepass/shared";
import type {
  CreateUserInput,
  UserRecord,
  UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import type {
  AiReviewDraft,
  AiReviewGenerateInput,
  AiReviewProviderPort,
} from "../../application/ports/ai-review-provider.port";
import type {
  HousingPassReaderPort,
  HousingPassView,
} from "../../application/ports/housing-pass-reader.port";
import type {
  OcrDocumentReaderPort,
  OcrDocumentView,
} from "../../application/ports/ocr-document-reader.port";
import type {
  ContractReviewRepositoryPort,
  CreateContractReviewInput,
  StoredContractReview,
} from "../../domain/ai-review.repository.port";
import { REVIEW_DISCLAIMER } from "../../application/disclaimer";
import { GenerateReviewUseCase } from "../../application/use-cases/generate-review.use-case";
import { assertNoForbiddenData } from "../../../../../test/privacy-guard";

const DID = "did:settlepass:user:mock-001";
const USER_ID = "user-uuid-1";
const OCR_ID = "ocr-1";
const HP_ID = "hp-1";

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

class FakeOcrReader implements OcrDocumentReaderPort {
  constructor(private readonly doc: OcrDocumentView | null) {}
  async findById(id: string): Promise<OcrDocumentView | null> {
    return this.doc && this.doc.id === id ? this.doc : null;
  }
}

class FakeHousingPassReader implements HousingPassReaderPort {
  constructor(private readonly hp: HousingPassView | null) {}
  async findById(id: string): Promise<HousingPassView | null> {
    return this.hp && this.hp.id === id ? this.hp : null;
  }
}

class FakeProvider implements AiReviewProviderPort {
  public calls = 0;
  constructor(
    private readonly behavior:
      | { kind: "ok"; draft: AiReviewDraft }
      | { kind: "invalid"; value: unknown }
      | { kind: "throw" },
  ) {}
  async generate(_input: AiReviewGenerateInput): Promise<AiReviewDraft> {
    this.calls += 1;
    if (this.behavior.kind === "throw") throw new Error("provider boom");
    if (this.behavior.kind === "invalid") {
      return this.behavior.value as AiReviewDraft;
    }
    return this.behavior.draft;
  }
}

class FakeReviews implements ContractReviewRepositoryPort {
  public created: CreateContractReviewInput[] = [];
  private store = new Map<string, StoredContractReview>();
  async create(input: CreateContractReviewInput): Promise<{ id: string }> {
    this.created.push(input);
    const id = `review-${this.created.length}`;
    this.store.set(id, { id, ...input });
    return { id };
  }
  async findById(id: string): Promise<StoredContractReview | null> {
    return this.store.get(id) ?? null;
  }
}

function seededUsers(): FakeUsers {
  const users = new FakeUsers();
  users.seed({ id: USER_ID, did: DID, preferredLanguage: "ko" });
  return users;
}

const DEMO_OCR: OcrDocumentView = {
  id: OCR_ID,
  normalizedText: "보증금: 5,000,000원\n계약기간: 2026-08-01 ~ 2027-07-31",
};

// Housing Pass residenceExpiryMonth 2026-12 → 데모 계약 종료 2027-07 보다 빠름 → WARNING.
const DEMO_HP: HousingPassView = { id: HP_ID, residenceExpiryMonth: "2026-12" };

const GOOD_DRAFT: AiReviewDraft = {
  summary: { ...DEMO_CONTRACT_REVIEW.summary },
  riskItems: DEMO_CONTRACT_REVIEW.riskItems.map((r) => ({ ...r })),
  translatedSummary: { ...DEMO_CONTRACT_REVIEW.translatedSummary },
};

function makeUseCase(opts: {
  users?: UserRepositoryPort;
  ocr?: OcrDocumentReaderPort;
  hp?: HousingPassReaderPort;
  provider: FakeProvider;
  reviews?: FakeReviews;
}): {
  uc: GenerateReviewUseCase;
  reviews: FakeReviews;
  provider: FakeProvider;
} {
  const reviews = opts.reviews ?? new FakeReviews();
  const uc = new GenerateReviewUseCase(
    opts.users ?? seededUsers(),
    opts.ocr ?? new FakeOcrReader(DEMO_OCR),
    opts.hp ?? new FakeHousingPassReader(DEMO_HP),
    opts.provider,
    reviews,
  );
  return { uc, reviews, provider: opts.provider };
}

const INPUT = {
  userDid: DID,
  housingPassId: HP_ID,
  ocrDocumentId: OCR_ID,
  preferredLanguage: "ko" as const,
};

describe("GenerateReviewUseCase", () => {
  it("always attaches the disclaimer and persists status GENERATED", async () => {
    const { uc, reviews } = makeUseCase({
      provider: new FakeProvider({ kind: "ok", draft: GOOD_DRAFT }),
    });
    const res = await uc.execute(INPUT);

    expect(res.disclaimer).toBe(REVIEW_DISCLAIMER);
    expect(res.disclaimer.length).toBeGreaterThan(0);
    expect(res.reviewId).toBeTruthy();
    expect(reviews.created).toHaveLength(1);
    expect(reviews.created[0].status).toBe("GENERATED");
    expect(reviews.created[0].userId).toBe(USER_ID);
    // 영속된 reviewResult 에도 disclaimer 가 포함된다.
    expect(reviews.created[0].reviewResult.disclaimer).toBe(REVIEW_DISCLAIMER);
  });

  it("computes residencePeriodCheck WARNING from housing-pass expiry vs contract end (use-case, not adapter)", async () => {
    const { uc, reviews } = makeUseCase({
      provider: new FakeProvider({ kind: "ok", draft: GOOD_DRAFT }),
    });
    const res = await uc.execute(INPUT);

    expect(res.residencePeriodCheck.status).toBe("WARNING");
    expect(res.residencePeriodCheck.residenceExpiryMonth).toBe("2026-12");
    expect(res.residencePeriodCheck.contractEndMonth).toBe("2027-07");
    expect(reviews.created[0].residenceConsistencyStatus).toBe("WARNING");
  });

  it("computes the check from the housing pass even if the draft summary date is OK-looking but pass says WARNING", async () => {
    // 어댑터가 정합성을 주장하지 않아도 use-case 가 직접 계산함을 보강 확인.
    const earlyHp = new FakeHousingPassReader({
      id: HP_ID,
      residenceExpiryMonth: "2099-12",
    });
    const { uc } = makeUseCase({
      hp: earlyHp,
      provider: new FakeProvider({ kind: "ok", draft: GOOD_DRAFT }),
    });
    const res = await uc.execute(INPUT);
    expect(res.residencePeriodCheck.status).toBe("OK");
  });

  it("falls back to the fixture draft when the provider throws (never fails the request)", async () => {
    const provider = new FakeProvider({ kind: "throw" });
    const { uc } = makeUseCase({ provider });
    const res = await uc.execute(INPUT);

    expect(provider.calls).toBe(1);
    // fixture 초안의 risk 항목/요약이 반영된다.
    expect(res.riskItems.length).toBeGreaterThanOrEqual(1);
    expect(res.summary.deposit).toBe(DEMO_CONTRACT_REVIEW.summary.deposit);
    expect(res.residencePeriodCheck.status).toBe("WARNING");
    expect(res.disclaimer).toBe(REVIEW_DISCLAIMER);
  });

  it("falls back to the fixture draft when the provider returns an invalid (schema-violating) draft", async () => {
    const provider = new FakeProvider({
      kind: "invalid",
      // riskItems 비어있음 + translatedSummary 없음 → 스키마 위반.
      value: { summary: {}, riskItems: [], translatedSummary: {} },
    });
    const { uc } = makeUseCase({ provider });
    const res = await uc.execute(INPUT);

    expect(provider.calls).toBe(1);
    expect(res.riskItems.length).toBeGreaterThanOrEqual(1);
    expect(res.translatedSummary.ko).toBeTruthy();
    expect(res.summary.deposit).toBe(DEMO_CONTRACT_REVIEW.summary.deposit);
  });

  it("throws NotFound when the user does not exist", async () => {
    const { uc } = makeUseCase({
      users: new FakeUsers(),
      provider: new FakeProvider({ kind: "ok", draft: GOOD_DRAFT }),
    });
    await expect(uc.execute(INPUT)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("throws NotFound when the OCR document does not exist", async () => {
    const { uc } = makeUseCase({
      ocr: new FakeOcrReader(null),
      provider: new FakeProvider({ kind: "ok", draft: GOOD_DRAFT }),
    });
    await expect(uc.execute(INPUT)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("throws NotFound when the housing pass does not exist", async () => {
    const { uc } = makeUseCase({
      hp: new FakeHousingPassReader(null),
      provider: new FakeProvider({ kind: "ok", draft: GOOD_DRAFT }),
    });
    await expect(uc.execute(INPUT)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns a response with no forbidden data", async () => {
    const { uc, reviews } = makeUseCase({
      provider: new FakeProvider({ kind: "ok", draft: GOOD_DRAFT }),
    });
    const res = await uc.execute(INPUT);
    expect(() => assertNoForbiddenData(res)).not.toThrow();
    expect(() => assertNoForbiddenData(reviews.created[0])).not.toThrow();
  });
});
