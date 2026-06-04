import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { UserMeResponse } from "@settlepass/api-contracts";
import {
  IDENTITY_CLAIM_REPOSITORY,
  type IdentityClaimRepositoryPort,
} from "../../../identity/domain/identity.repository.port";
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from "../../domain/user.repository.port";

/**
 * GET /users/me — userDid 로 사용자 + 최신 NormalizedIdentityClaims 조회.
 * IdentityClaim 행은 userDid 를 저장하지 않으므로 resolve 한 User.did 로 채운다.
 */
@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(IDENTITY_CLAIM_REPOSITORY)
    private readonly claims: IdentityClaimRepositoryPort,
  ) {}

  async execute(userDid: string): Promise<UserMeResponse> {
    const user = await this.users.findByDid(userDid);
    if (!user) {
      throw new NotFoundException(`user not found: ${userDid}`);
    }

    const claims = await this.claims.findLatestByUserId(user.id);
    if (!claims) {
      throw new NotFoundException(
        `identity claims not found for user: ${userDid}`,
      );
    }

    return { userId: user.id, userDid: user.did, claims: { ...claims, userDid: user.did } };
  }
}
