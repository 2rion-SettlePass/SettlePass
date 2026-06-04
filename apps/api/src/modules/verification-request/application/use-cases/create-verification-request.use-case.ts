import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  CreateVerificationRequestRequest,
  CreateVerificationRequestResponse,
} from "@settlepass/api-contracts";
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import {
  VERIFICATION_REQUEST_REPOSITORY,
  type VerificationRequestRepositoryPort,
} from "../../domain/verification-request.repository.port";

/**
 * 검증 요청 생성:
 *  1. targetUserDid 로 User resolve (없으면 404)
 *  2. VR 영속 { verifierId, targetUserId, purpose, requestedClaims, status:'CREATED' }
 *  3. { requestId, status:'CREATED', consentUrl:'/consent/'+requestId } 반환
 *
 * Phase 1 에서는 생성 시 CREATED 로 시작하고 이를 동의 가능 상태로 취급한다(SENT 는 선택).
 */
@Injectable()
export class CreateVerificationRequestUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(VERIFICATION_REQUEST_REPOSITORY)
    private readonly requests: VerificationRequestRepositoryPort,
  ) {}

  async execute(
    input: CreateVerificationRequestRequest,
  ): Promise<CreateVerificationRequestResponse> {
    const user = await this.users.findByDid(input.targetUserDid);
    if (!user) {
      throw new NotFoundException(`user not found: ${input.targetUserDid}`);
    }

    const created = await this.requests.create({
      verifierId: input.verifierId,
      targetUserId: user.id,
      purpose: input.purpose,
      requestedClaims: input.requestedClaims,
      status: "CREATED",
    });

    return {
      requestId: created.id,
      status: "CREATED",
      consentUrl: `/consent/${created.id}`,
    };
  }
}
