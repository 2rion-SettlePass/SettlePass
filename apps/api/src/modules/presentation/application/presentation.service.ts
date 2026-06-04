import { randomUUID } from "node:crypto";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  HousingClaimKey,
  HousingPassCredential,
} from "@settlepass/api-contracts";
import { buildPresentationVp, type PresentationVp } from "@settlepass/shared";
import { HashService } from "../../../infra/hash/hash.service";
import {
  AUDIT_LOG_WRITER,
  type AuditLogWriterPort,
} from "../../audit-log/application/ports/audit-log-writer.port";
import {
  HOUSING_PASS_READER,
  PRESENTATION_REPOSITORY,
  type HousingPassReaderPort,
  type PresentationRepositoryPort,
} from "../domain/presentation.repository.port";

export interface CreateForConsentInput {
  requestId: string;
  userId: string;
  holderDid: string;
  consentedClaims: HousingClaimKey[];
}

export interface GetOrCreateVerificationInput {
  requestId: string;
  userId: string;
}

export interface VerificationResult {
  verifiedClaims: Partial<Record<HousingClaimKey, boolean | string>>;
  verificationHash: string;
  mockTxHash: string;
}

/**
 * VP 조립 + Presentation 영속 + 검증 해시 생성을 담당하는 application 서비스.
 * consent / verification-request 모듈이 공유한다(Nest provider 로 export).
 */
@Injectable()
export class PresentationService {
  constructor(
    @Inject(HOUSING_PASS_READER)
    private readonly housingPassReader: HousingPassReaderPort,
    @Inject(PRESENTATION_REPOSITORY)
    private readonly presentations: PresentationRepositoryPort,
    @Inject(HashService) private readonly hashService: HashService,
    @Inject(AUDIT_LOG_WRITER)
    private readonly auditLog: AuditLogWriterPort,
  ) {}

  /**
   * 동의 시점에 대상 사용자의 최신 Housing Pass 로 VP 를 만들어 영속한다.
   * VP 의 credentialSubject 에는 동의된 공개 claim 만 담긴다(비공개 claim 절대 미포함).
   */
  async createForConsent(input: CreateForConsentInput): Promise<void> {
    const housingPass = await this.housingPassReader.findLatestByUserId(
      input.userId,
    );
    if (!housingPass) {
      throw new NotFoundException("create a Housing Pass first");
    }

    const vp = buildPresentationVp({
      id: `urn:uuid:${randomUUID()}`,
      holderDid: input.holderDid,
      credential: housingPass.credential as HousingPassCredential,
      consentedClaims: input.consentedClaims,
    });

    await this.presentations.create({
      requestId: input.requestId,
      housingPassId: housingPass.id,
      presentationJson: vp,
      status: "CREATED",
    });
  }

  /**
   * 검증 결과를 조회하거나(이미 해시가 있으면 그대로 반환) 최초 1회 계산한다.
   * 최초 계산 시: verificationHash + mockTxHash 영속 + AuditLog(VERIFICATION) 기록.
   * 멱등 — 이미 해시가 있으면 재해시/재기록하지 않는다.
   */
  async getOrCreateVerification(
    input: GetOrCreateVerificationInput,
  ): Promise<VerificationResult> {
    const presentation = await this.presentations.findByRequestId(
      input.requestId,
    );
    if (!presentation) {
      throw new NotFoundException("no presentation for this request");
    }

    const verifiedClaims = extractVerifiedClaims(presentation.presentationJson);

    if (presentation.verificationHash && presentation.mockTxHash) {
      return {
        verifiedClaims,
        verificationHash: presentation.verificationHash,
        mockTxHash: presentation.mockTxHash,
      };
    }

    const { hash: verificationHash } = this.hashService.createHash(
      presentation.presentationJson,
    );
    const mockTxHash = this.hashService.mockTxHash("verification");

    await this.presentations.updateVerification(presentation.id, {
      verificationHash,
      mockTxHash,
      status: "VERIFIED",
    });

    await this.auditLog.write({
      userId: input.userId,
      logType: "VERIFICATION",
      payloadHash: verificationHash,
      mockTxHash,
    });

    return { verifiedClaims, verificationHash, mockTxHash };
  }
}

/**
 * 영속된 VP 의 제시된 credentialSubject 에서 `id`(holder DID) 를 제외한
 * 동의된 공개 claim 만 추출한다.
 */
function extractVerifiedClaims(
  vp: PresentationVp,
): Partial<Record<HousingClaimKey, boolean | string>> {
  const subject = vp.verifiableCredential[0]?.credentialSubject ?? {};
  const result: Partial<Record<HousingClaimKey, boolean | string>> = {};
  for (const [key, value] of Object.entries(subject)) {
    if (key === "id") continue;
    if (typeof value === "boolean" || typeof value === "string") {
      result[key as HousingClaimKey] = value;
    }
  }
  return result;
}
