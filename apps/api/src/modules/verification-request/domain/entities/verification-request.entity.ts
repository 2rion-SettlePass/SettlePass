import type { HousingClaimKey } from "@settlepass/api-contracts";

/**
 * 순수 도메인 표현 — 검증 요청. Nest/Prisma/외부 의존 0.
 *
 * 상태 머신: CREATED → SENT → CONSENTED → VERIFIED
 *   + REJECTED (동의 거절 시 CREATED/SENT 에서 전이)
 *   + EXPIRED  (Phase 1 에서는 실제로 사용하지 않으나 enum 으로 모델링)
 *
 * 적법하지 않은 전이는 도메인에서 throw 한다(application 이 상태를 바꾸기 전에 호출).
 */
export type VerificationRequestStatus =
  | "CREATED"
  | "SENT"
  | "CONSENTED"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

/** status → 허용된 다음 status 집합. */
const ALLOWED_TRANSITIONS: Record<
  VerificationRequestStatus,
  readonly VerificationRequestStatus[]
> = {
  CREATED: ["SENT", "CONSENTED", "REJECTED", "EXPIRED"],
  SENT: ["CONSENTED", "REJECTED", "EXPIRED"],
  CONSENTED: ["VERIFIED"],
  VERIFIED: [],
  REJECTED: [],
  EXPIRED: [],
};

/** consent 를 받을 수 있는 상태(아직 동의/거절/만료되지 않음). */
const CONSENTABLE_STATUSES: readonly VerificationRequestStatus[] = [
  "CREATED",
  "SENT",
];

export class InvalidVerificationRequestTransitionError extends Error {
  constructor(
    public readonly from: VerificationRequestStatus,
    public readonly to: VerificationRequestStatus,
  ) {
    super(`illegal verification request transition: ${from} -> ${to}`);
    this.name = "InvalidVerificationRequestTransitionError";
  }
}

export interface VerificationRequestProps {
  id: string;
  verifierId: string;
  targetUserId: string;
  purpose: "HOUSING_CONTRACT";
  requestedClaims: HousingClaimKey[];
  status: VerificationRequestStatus;
}

/**
 * 검증 요청 엔티티. 상태 전이의 적법성만 책임진다(영속은 repository 담당).
 */
export class VerificationRequest {
  readonly id: string;
  readonly verifierId: string;
  readonly targetUserId: string;
  readonly purpose: "HOUSING_CONTRACT";
  readonly requestedClaims: HousingClaimKey[];
  private _status: VerificationRequestStatus;

  constructor(props: VerificationRequestProps) {
    this.id = props.id;
    this.verifierId = props.verifierId;
    this.targetUserId = props.targetUserId;
    this.purpose = props.purpose;
    this.requestedClaims = props.requestedClaims;
    this._status = props.status;
  }

  get status(): VerificationRequestStatus {
    return this._status;
  }

  /** 동의를 받을 수 있는 상태인지(CREATED/SENT). */
  isConsentable(): boolean {
    return CONSENTABLE_STATUSES.includes(this._status);
  }

  /** 결과를 노출해도 되는 상태인지(VR-04 게이트: CONSENTED/VERIFIED 만). */
  isResultReady(): boolean {
    return this._status === "CONSENTED" || this._status === "VERIFIED";
  }

  /** 전이가 적법한지 검사(상태는 바꾸지 않음). */
  canTransitionTo(next: VerificationRequestStatus): boolean {
    return ALLOWED_TRANSITIONS[this._status].includes(next);
  }

  /** 적법한 전이만 수행하고, 아니면 throw 한다. */
  transitionTo(next: VerificationRequestStatus): void {
    if (!this.canTransitionTo(next)) {
      throw new InvalidVerificationRequestTransitionError(this._status, next);
    }
    this._status = next;
  }
}
