import { describe, it, expect } from "vitest";
import {
  InvalidVerificationRequestTransitionError,
  VerificationRequest,
  type VerificationRequestStatus,
} from "../../domain/entities/verification-request.entity";

function make(status: VerificationRequestStatus): VerificationRequest {
  return new VerificationRequest({
    id: "vr-1",
    verifierId: "verifier-1",
    targetUserId: "user-1",
    purpose: "HOUSING_CONTRACT",
    requestedClaims: ["identityVerified", "ageOver19"],
    status,
  });
}

describe("VerificationRequest (state machine)", () => {
  it("allows the happy-path transitions CREATED → CONSENTED → VERIFIED", () => {
    const r = make("CREATED");
    expect(r.canTransitionTo("CONSENTED")).toBe(true);
    r.transitionTo("CONSENTED");
    expect(r.status).toBe("CONSENTED");
    expect(r.canTransitionTo("VERIFIED")).toBe(true);
    r.transitionTo("VERIFIED");
    expect(r.status).toBe("VERIFIED");
  });

  it("allows CREATED → SENT → CONSENTED", () => {
    const r = make("CREATED");
    r.transitionTo("SENT");
    expect(r.status).toBe("SENT");
    r.transitionTo("CONSENTED");
    expect(r.status).toBe("CONSENTED");
  });

  it("allows rejection from CREATED and SENT", () => {
    expect(make("CREATED").canTransitionTo("REJECTED")).toBe(true);
    expect(make("SENT").canTransitionTo("REJECTED")).toBe(true);
  });

  it("throws on illegal transitions", () => {
    // CREATED cannot jump straight to VERIFIED.
    expect(() => make("CREATED").transitionTo("VERIFIED")).toThrow(
      InvalidVerificationRequestTransitionError,
    );
    // CONSENTED cannot be rejected.
    expect(() => make("CONSENTED").transitionTo("REJECTED")).toThrow(
      InvalidVerificationRequestTransitionError,
    );
    // Terminal states cannot transition.
    expect(() => make("VERIFIED").transitionTo("CONSENTED")).toThrow(
      InvalidVerificationRequestTransitionError,
    );
    expect(() => make("REJECTED").transitionTo("CONSENTED")).toThrow(
      InvalidVerificationRequestTransitionError,
    );
    expect(() => make("EXPIRED").transitionTo("CONSENTED")).toThrow(
      InvalidVerificationRequestTransitionError,
    );
  });

  it("reports consentable only for CREATED/SENT", () => {
    expect(make("CREATED").isConsentable()).toBe(true);
    expect(make("SENT").isConsentable()).toBe(true);
    expect(make("CONSENTED").isConsentable()).toBe(false);
    expect(make("VERIFIED").isConsentable()).toBe(false);
    expect(make("REJECTED").isConsentable()).toBe(false);
    expect(make("EXPIRED").isConsentable()).toBe(false);
  });

  it("reports result-ready only for CONSENTED/VERIFIED (VR-04 gate)", () => {
    expect(make("CREATED").isResultReady()).toBe(false);
    expect(make("SENT").isResultReady()).toBe(false);
    expect(make("CONSENTED").isResultReady()).toBe(true);
    expect(make("VERIFIED").isResultReady()).toBe(true);
    expect(make("REJECTED").isResultReady()).toBe(false);
  });
});
