import { describe, it, expect, beforeEach } from "vitest";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { HousingContractReviewResponse } from "@settlepass/api-contracts";
import { HashService } from "../../../../infra/hash/hash.service";
import type {
  AuditLogWriteInput,
  AuditLogWriterPort,
} from "../../../audit-log/application/ports/audit-log-writer.port";
import type {
  CreateUserInput,
  UserRecord,
  UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import type {
  ContractReviewRepositoryPort,
  CreateContractReviewInput,
  StoredContractReview,
  UpdateContractReviewInput,
} from "../../domain/ai-review.repository.port";
import { ConfirmReviewUseCase } from "../../application/use-cases/confirm-review.use-case";

const DID = "did:settlepass:user:mock-001";
const USER_ID = "user-uuid-1";
const REVIEW_ID = "review-1";

const ALL_TRUE = {
  summaryChecked: true,
  riskItemsChecked: true,
  residenceWarningChecked: true,
  legalDisclaimerAccepted: true,
};

const REVIEW_RESULT: HousingContractReviewResponse = {
  reviewId: "",
  summary: { deposit: "10000000", monthlyRent: "600000", contractEndDate: "2027-07-31" },
  riskItems: [
    {
      level: "HIGH",
      category: "특약",
      reason: "원상복구 범위가 과도합니다.",
      evidenceText: "임차인은 모든 시설을 원상복구한다.",
      recommendedQuestion: "원상복구 범위를 구체화할 수 있나요?",
    },
  ],
  residencePeriodCheck: {
    status: "WARNING",
    residenceExpiryMonth: "2026-12",
    contractEndMonth: "2027-07",
    reason: "체류 만료가 계약 종료보다 빠릅니다.",
  },
  translatedSummary: { ko: "요약", en: "summary" },
  disclaimer: "법률 자문이 아닙니다.",
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

class FakeReviews implements ContractReviewRepositoryPort {
  public updates: { id: string; patch: UpdateContractReviewInput }[] = [];
  private store = new Map<string, StoredContractReview>();
  seed(rec: StoredContractReview) {
    this.store.set(rec.id, rec);
  }
  async create(_input: CreateContractReviewInput): Promise<{ id: string }> {
    return { id: REVIEW_ID };
  }
  async findById(id: string): Promise<StoredContractReview | null> {
    return this.store.get(id) ?? null;
  }
  async update(id: string, patch: UpdateContractReviewInput): Promise<void> {
    this.updates.push({ id, patch });
    const existing = this.store.get(id);
    if (existing) this.store.set(id, { ...existing, ...patch });
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

function storedReview(
  overrides: Partial<StoredContractReview> = {},
): StoredContractReview {
  return {
    id: REVIEW_ID,
    userId: USER_ID,
    ocrDocumentId: "ocr-1",
    housingPassId: "hp-1",
    reviewResult: REVIEW_RESULT,
    residenceConsistencyStatus: "WARNING",
    status: "GENERATED",
    reviewHash: null,
    mockTxHash: null,
    ...overrides,
  };
}

function build(): {
  uc: ConfirmReviewUseCase;
  users: FakeUsers;
  reviews: FakeReviews;
  audit: FakeAuditLog;
} {
  const users = new FakeUsers();
  users.seed({ id: USER_ID, did: DID, preferredLanguage: "ko" });
  const reviews = new FakeReviews();
  const audit = new FakeAuditLog();
  const uc = new ConfirmReviewUseCase(
    users,
    reviews,
    makeHashService(),
    audit,
  );
  return { uc, users, reviews, audit };
}

describe("ConfirmReviewUseCase", () => {
  let ctx: ReturnType<typeof build>;

  beforeEach(() => {
    ctx = build();
  });

  it("all four confirmations true → reviewHash (0x…) + status CONFIRMED + audit REVIEW written once", async () => {
    ctx.reviews.seed(storedReview());

    const res = await ctx.uc.execute({
      reviewId: REVIEW_ID,
      userDid: DID,
      confirmations: ALL_TRUE,
    });

    expect(res.reviewId).toBe(REVIEW_ID);
    expect(res.status).toBe("CONFIRMED");
    expect(res.reviewHash).toMatch(/^0x/);
    expect(res.mockTxHash).toContain("mocktx_review_");

    // 영속 갱신 1회: status CONFIRMED + reviewHash + mockTxHash + confirmedAt.
    expect(ctx.reviews.updates).toHaveLength(1);
    expect(ctx.reviews.updates[0].patch.status).toBe("CONFIRMED");
    expect(ctx.reviews.updates[0].patch.reviewHash).toBe(res.reviewHash);
    expect(ctx.reviews.updates[0].patch.mockTxHash).toBe(res.mockTxHash);
    expect(ctx.reviews.updates[0].patch.confirmedAt).toBeInstanceOf(Date);

    // REVIEW audit 1건 (payloadHash = reviewHash).
    expect(ctx.audit.writes).toHaveLength(1);
    expect(ctx.audit.writes[0].logType).toBe("REVIEW");
    expect(ctx.audit.writes[0].payloadHash).toBe(res.reviewHash);
    expect(ctx.audit.writes[0].mockTxHash).toBe(res.mockTxHash);
    expect(ctx.audit.writes[0].contractReviewId).toBe(REVIEW_ID);
    expect(ctx.audit.writes[0].userId).toBe(USER_ID);
  });

  it("any confirmation false → BadRequest, NO hash and NO audit", async () => {
    const partials = [
      { ...ALL_TRUE, summaryChecked: false },
      { ...ALL_TRUE, riskItemsChecked: false },
      { ...ALL_TRUE, residenceWarningChecked: false },
      { ...ALL_TRUE, legalDisclaimerAccepted: false },
    ];

    for (const confirmations of partials) {
      const local = build();
      local.reviews.seed(storedReview());
      await expect(
        local.uc.execute({ reviewId: REVIEW_ID, userDid: DID, confirmations }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(local.reviews.updates).toHaveLength(0);
      expect(local.audit.writes).toHaveLength(0);
    }
  });

  it("wrong user → Forbidden (review owned by another user)", async () => {
    ctx.reviews.seed(storedReview({ userId: "other-user" }));
    await expect(
      ctx.uc.execute({
        reviewId: REVIEW_ID,
        userDid: DID,
        confirmations: ALL_TRUE,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(ctx.reviews.updates).toHaveLength(0);
    expect(ctx.audit.writes).toHaveLength(0);
  });

  it("idempotent: second confirm returns same reviewHash, audit written only once", async () => {
    ctx.reviews.seed(storedReview());

    const first = await ctx.uc.execute({
      reviewId: REVIEW_ID,
      userDid: DID,
      confirmations: ALL_TRUE,
    });
    // 첫 호출이 store 를 CONFIRMED + reviewHash 로 갱신했으므로 두 번째는 멱등 경로를 탄다.
    const second = await ctx.uc.execute({
      reviewId: REVIEW_ID,
      userDid: DID,
      confirmations: ALL_TRUE,
    });

    expect(second.reviewHash).toBe(first.reviewHash);
    expect(second.mockTxHash).toBe(first.mockTxHash);
    expect(second.status).toBe("CONFIRMED");

    // 재해시·재기록 없음: update 1회, audit 1건만.
    expect(ctx.reviews.updates).toHaveLength(1);
    expect(ctx.audit.writes).toHaveLength(1);
  });
});
