import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  ConsentToVerificationRequest,
  ConsentToVerificationResponse,
  HousingClaimKey,
} from "@settlepass/api-contracts";
import { HashService } from "../../../../infra/hash/hash.service";
import {
  AUDIT_LOG_WRITER,
  type AuditLogWriterPort,
} from "../../../audit-log/application/ports/audit-log-writer.port";
import { PresentationService } from "../../../presentation/application/presentation.service";
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from "../../../users/domain/user.repository.port";
import { VerificationRequest } from "../../../verification-request/domain/entities/verification-request.entity";
import {
  VERIFICATION_REQUEST_REPOSITORY,
  type VerificationRequestRepositoryPort,
} from "../../../verification-request/domain/verification-request.repository.port";
import {
  CONSENT_REPOSITORY,
  type ConsentRepositoryPort,
} from "../../domain/consent.repository.port";

export interface ConsentToVerificationInput
  extends ConsentToVerificationRequest {
  requestId: string;
}

/**
 * 선택적 공개 동의:
 *  1. userDid resolve (없으면 404)
 *  2. VR 로드 (없으면 404), 인가(VR.targetUserId === user.id, 아니면 403)
 *  3. 동의 가능 상태(CREATED/SENT)인지 검사(아니면 409)
 *  4. consentedClaims ⊆ requestedClaims 검증(아니면 400)
 *  5a. consent=false → REJECTED Consent 영속 + VR→REJECTED + { REJECTED } (해시 없음)
 *  5b. consent=true → consentHash(+mockTx) → CONSENTED Consent 영속
 *      → PresentationService.createForConsent(동의 claim 만 VP)
 *      → AuditLog(CONSENT) → VR→CONSENTED → { CONSENTED, consentHash, mockTxHash }
 */
@Injectable()
export class ConsentToVerificationUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(VERIFICATION_REQUEST_REPOSITORY)
    private readonly requests: VerificationRequestRepositoryPort,
    @Inject(CONSENT_REPOSITORY)
    private readonly consents: ConsentRepositoryPort,
    @Inject(HashService) private readonly hashService: HashService,
    @Inject(PresentationService)
    private readonly presentationService: PresentationService,
    @Inject(AUDIT_LOG_WRITER)
    private readonly auditLog: AuditLogWriterPort,
  ) {}

  async execute(
    input: ConsentToVerificationInput,
  ): Promise<ConsentToVerificationResponse> {
    const user = await this.users.findByDid(input.userDid);
    if (!user) {
      throw new NotFoundException(`user not found: ${input.userDid}`);
    }

    const stored = await this.requests.findById(input.requestId);
    if (!stored) {
      throw new NotFoundException(
        `verification request not found: ${input.requestId}`,
      );
    }

    // 인가: 요청 대상 사용자만 동의/거절할 수 있다.
    if (stored.targetUserId !== user.id) {
      throw new ForbiddenException(
        "not authorized to consent to this request",
      );
    }

    const request = new VerificationRequest({
      id: stored.id,
      verifierId: stored.verifierId,
      targetUserId: stored.targetUserId,
      purpose: stored.purpose,
      requestedClaims: stored.requestedClaims,
      status: stored.status,
    });

    if (!request.isConsentable()) {
      throw new ConflictException(
        `request is not consentable in status ${request.status}`,
      );
    }

    // consentedClaims ⊆ requestedClaims
    const requested = new Set<HousingClaimKey>(stored.requestedClaims);
    for (const claim of input.consentedClaims) {
      if (!requested.has(claim)) {
        throw new BadRequestException(
          `claim not in requested set: ${claim}`,
        );
      }
    }

    if (input.consent === false) {
      await this.consents.create({
        requestId: input.requestId,
        userId: user.id,
        consentedClaims: [],
        consentHash: "",
        mockTxHash: null,
        status: "REJECTED",
      });
      request.transitionTo("REJECTED");
      await this.requests.updateStatus(input.requestId, request.status);
      return { requestId: input.requestId, status: "REJECTED" };
    }

    const { hash: consentHash } = this.hashService.createHash({
      requestId: input.requestId,
      userDid: input.userDid,
      consentedClaims: input.consentedClaims,
    });
    const mockTxHash = this.hashService.mockTxHash("consent");

    await this.consents.create({
      requestId: input.requestId,
      userId: user.id,
      consentedClaims: input.consentedClaims,
      consentHash,
      mockTxHash,
      status: "CONSENTED",
    });

    await this.presentationService.createForConsent({
      requestId: input.requestId,
      userId: user.id,
      holderDid: input.userDid,
      consentedClaims: input.consentedClaims,
    });

    await this.auditLog.write({
      userId: user.id,
      logType: "CONSENT",
      payloadHash: consentHash,
      mockTxHash,
    });

    request.transitionTo("CONSENTED");
    await this.requests.updateStatus(input.requestId, request.status);

    return {
      requestId: input.requestId,
      status: "CONSENTED",
      consentHash,
      mockTxHash,
    };
  }
}
