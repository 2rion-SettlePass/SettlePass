import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { VerificationRequestDetailResponse } from "@settlepass/api-contracts";
import { HIDDEN_CLAIM_KEYS } from "../../../presentation/domain/hidden-claims";
import {
  VERIFICATION_REQUEST_REPOSITORY,
  type VerificationRequestRepositoryPort,
} from "../../domain/verification-request.repository.port";

/**
 * GET /verification-requests/:requestId — 동의 화면용 상세.
 * verifierName 은 Verifier row 에서, hiddenClaims 는 비공개 claim 전체 목록.
 * verifiedClaims 는 노출하지 않는다(결과 전용).
 */
@Injectable()
export class GetVerificationRequestUseCase {
  constructor(
    @Inject(VERIFICATION_REQUEST_REPOSITORY)
    private readonly requests: VerificationRequestRepositoryPort,
  ) {}

  async execute(
    requestId: string,
  ): Promise<VerificationRequestDetailResponse> {
    const request = await this.requests.findById(requestId);
    if (!request) {
      throw new NotFoundException(
        `verification request not found: ${requestId}`,
      );
    }

    return {
      requestId: request.id,
      verifierId: request.verifierId,
      verifierName: request.verifierName,
      purpose: request.purpose,
      requestedClaims: request.requestedClaims,
      hiddenClaims: [...HIDDEN_CLAIM_KEYS],
      status: request.status,
    };
  }
}
