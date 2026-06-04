import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { VerificationResultResponse } from "@settlepass/api-contracts";
import { HIDDEN_CLAIM_KEYS } from "../../../presentation/domain/hidden-claims";
import { PresentationService } from "../../../presentation/application/presentation.service";
import { VerificationRequest } from "../../domain/entities/verification-request.entity";
import {
  VERIFICATION_REQUEST_REPOSITORY,
  type VerificationRequestRepositoryPort,
} from "../../domain/verification-request.repository.port";

/**
 * GET /verification-requests/:requestId/result — VR-04 게이트.
 *
 *  - 아직 CONSENTED/VERIFIED 가 아니면 → PENDING (verifiedClaims:{}, 해시 없음).
 *  - REJECTED → REJECTED (verifiedClaims:{}, 해시 없음).
 *  - CONSENTED/VERIFIED → Presentation 의 VP 에서 검증 해시를 조회/최초계산(멱등),
 *    CONSENTED 였다면 VR→VERIFIED 전이, VERIFIED + verifiedClaims + 해시 반환.
 *
 * hiddenClaims 는 모든 응답에서 비공개 claim 전체 목록을 노출한다.
 */
@Injectable()
export class GetVerificationResultUseCase {
  constructor(
    @Inject(VERIFICATION_REQUEST_REPOSITORY)
    private readonly requests: VerificationRequestRepositoryPort,
    @Inject(PresentationService)
    private readonly presentationService: PresentationService,
  ) {}

  async execute(requestId: string): Promise<VerificationResultResponse> {
    const stored = await this.requests.findById(requestId);
    if (!stored) {
      throw new NotFoundException(
        `verification request not found: ${requestId}`,
      );
    }

    const hiddenClaims = [...HIDDEN_CLAIM_KEYS];

    if (stored.status === "REJECTED") {
      return {
        requestId,
        status: "REJECTED",
        verifiedClaims: {},
        hiddenClaims,
      };
    }

    const request = new VerificationRequest({
      id: stored.id,
      verifierId: stored.verifierId,
      targetUserId: stored.targetUserId,
      purpose: stored.purpose,
      requestedClaims: stored.requestedClaims,
      status: stored.status,
    });

    // VR-04: 동의 전(CREATED/SENT 등)에는 결과를 노출하지 않는다.
    if (!request.isResultReady()) {
      return {
        requestId,
        status: "PENDING",
        verifiedClaims: {},
        hiddenClaims,
      };
    }

    // CONSENTED/VERIFIED: VP 에서 검증 해시 조회/최초계산(멱등, audit 1회).
    const { verifiedClaims, verificationHash, mockTxHash } =
      await this.presentationService.getOrCreateVerification({
        requestId,
        userId: stored.targetUserId,
      });

    // 최초 검증(CONSENTED→VERIFIED)일 때만 전이한다(VERIFIED 면 멱등하게 생략).
    if (request.status === "CONSENTED") {
      request.transitionTo("VERIFIED");
      await this.requests.updateStatus(requestId, request.status);
    }

    return {
      requestId,
      status: "VERIFIED",
      verifiedClaims,
      hiddenClaims,
      verificationHash,
      mockTxHash,
    };
  }
}
