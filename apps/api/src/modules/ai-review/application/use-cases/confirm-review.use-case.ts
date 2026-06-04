import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  ConfirmReviewRequest,
  ConfirmReviewResponse,
} from "@settlepass/api-contracts";
import { HashService } from "../../../../infra/hash/hash.service";
import {
  AUDIT_LOG_WRITER,
  type AuditLogWriterPort,
} from "../../../audit-log/application/ports/audit-log-writer.port";
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import {
  CONTRACT_REVIEW_REPOSITORY,
  type ContractReviewRepositoryPort,
} from "../../domain/ai-review.repository.port";

export interface ConfirmReviewInput extends ConfirmReviewRequest {
  reviewId: string;
}

/**
 * AI 리뷰 최종 확인(reviewHash — 핵심 감사값, FR-RH-01/02/03):
 *  1. userDid → User resolve (없으면 404)
 *  2. ContractReview 로드(없으면 404), 인가(review.userId === user.id, 아니면 403)
 *  3. FR-RH-02 게이트: 4종 확인(summary/risk/residence/legal) 전부 true 여야 진행.
 *     하나라도 false → BadRequest (reviewHash 미생성, audit 미기록).
 *  4. 멱등: 이미 CONFIRMED(reviewHash 존재)면 기존 값을 그대로 반환(재해시·재기록 없음).
 *  5. reviewHash(+mockTx) 생성 → status=CONFIRMED 로 영속 갱신
 *     → AuditLog(REVIEW, payloadHash=reviewHash) 1건 기록.
 */
@Injectable()
export class ConfirmReviewUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(CONTRACT_REVIEW_REPOSITORY)
    private readonly reviews: ContractReviewRepositoryPort,
    @Inject(HashService) private readonly hashService: HashService,
    @Inject(AUDIT_LOG_WRITER)
    private readonly auditLog: AuditLogWriterPort,
  ) {}

  async execute(input: ConfirmReviewInput): Promise<ConfirmReviewResponse> {
    const user = await this.users.findByDid(input.userDid);
    if (!user) {
      throw new NotFoundException(`user not found: ${input.userDid}`);
    }

    const stored = await this.reviews.findById(input.reviewId);
    if (!stored) {
      throw new NotFoundException(`review not found: ${input.reviewId}`);
    }

    // 인가: 리뷰 소유자만 확인할 수 있다.
    if (stored.userId !== user.id) {
      throw new ForbiddenException("not authorized to confirm this review");
    }

    // FR-RH-02: 4종 확인이 모두 true 여야 reviewHash 가 생성된다.
    const { confirmations } = input;
    const allConfirmed =
      confirmations.summaryChecked &&
      confirmations.riskItemsChecked &&
      confirmations.residenceWarningChecked &&
      confirmations.legalDisclaimerAccepted;
    if (!allConfirmed) {
      throw new BadRequestException(
        "all confirmations required before reviewHash",
      );
    }

    // 멱등: 이미 확정된 리뷰는 재해시·재기록 없이 기존 값을 반환한다.
    if (stored.status === "CONFIRMED" && stored.reviewHash) {
      return {
        reviewId: stored.id,
        status: "CONFIRMED",
        reviewHash: stored.reviewHash,
        mockTxHash: stored.mockTxHash ?? "",
      };
    }

    const { hash: reviewHash } = this.hashService.createHash({
      reviewId: stored.id,
      userDid: input.userDid,
      confirmations,
      // 영속된 reviewResult 의 reviewId 는 비어 있을 수 있으므로 row id 로 채워 해시한다.
      reviewResult: { ...stored.reviewResult, reviewId: stored.id },
    });
    const mockTxHash = this.hashService.mockTxHash("review");

    await this.reviews.update(stored.id, {
      status: "CONFIRMED",
      reviewHash,
      mockTxHash,
      confirmedAt: new Date(),
    });

    await this.auditLog.write({
      userId: user.id,
      contractReviewId: stored.id,
      logType: "REVIEW",
      payloadHash: reviewHash,
      mockTxHash,
    });

    return {
      reviewId: stored.id,
      status: "CONFIRMED",
      reviewHash,
      mockTxHash,
    };
  }
}
