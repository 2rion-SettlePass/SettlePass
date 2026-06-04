import { describe, it, expect } from "vitest";
import {
  HOUSING_ISSUER_DID,
  buildHousingPassCredential,
  buildPresentationVp,
} from "@settlepass/shared";

const HOLDER_DID = "did:settlepass:user:mock-001";

const PRIVATE_KEYS = [
  "nationality",
  "alienRegistrationNumber",
  "fullAddress",
  "passportNumber",
  "visaStatusRaw",
  "idCardImage",
];

describe("buildHousingPassCredential", () => {
  it("emits only public claims in credentialSubject (no private-claim keys)", () => {
    const vc = buildHousingPassCredential({
      id: "urn:uuid:hp_test",
      holderDid: HOLDER_DID,
      claims: {
        identityVerified: true,
        ageOver19: true,
        residenceValid: true,
        regionLevel1: "Seoul",
        residenceExpiryMonth: "2026-12",
      },
      issuanceDate: "2026-06-15T09:05:00+09:00",
      expirationDate: "2026-12-31T23:59:59+09:00",
    });

    const subjectKeys = Object.keys(vc.credentialSubject);
    for (const forbidden of PRIVATE_KEYS) {
      expect(subjectKeys).not.toContain(forbidden);
    }

    expect(vc.issuer).toBe(HOUSING_ISSUER_DID);
    expect(vc.type).toEqual(["VerifiableCredential", "HousingPassCredential"]);
    expect(vc.credentialSubject.id).toBe(HOLDER_DID);
    expect(vc.credentialSubject.identityVerified).toBe(true);
    expect(vc.credentialSubject.ageOver19).toBe(true);
    expect(vc.credentialSubject.residenceValid).toBe(true);
    expect(vc.credentialSubject.regionLevel1).toBe("Seoul");
    expect(vc.credentialSubject.residenceExpiryMonth).toBe("2026-12");
  });
});

describe("buildPresentationVp", () => {
  it("presents only the consented claims (plus id), never others", () => {
    const vc = buildHousingPassCredential({
      id: "urn:uuid:hp_test",
      holderDid: HOLDER_DID,
      claims: {
        identityVerified: true,
        ageOver19: true,
        residenceValid: true,
        regionLevel1: "Seoul",
        residenceExpiryMonth: "2026-12",
      },
      issuanceDate: "2026-06-15T09:05:00+09:00",
    });

    const vp = buildPresentationVp({
      id: "urn:uuid:vp_test",
      holderDid: HOLDER_DID,
      credential: vc,
      consentedClaims: ["identityVerified", "ageOver19"],
    });

    const presented = vp.verifiableCredential[0].credentialSubject;
    const presentedKeys = Object.keys(presented).sort();
    expect(presentedKeys).toEqual(["ageOver19", "id", "identityVerified"]);
    expect(presented.id).toBe(HOLDER_DID);
    expect(presented.identityVerified).toBe(true);
    expect(presented.ageOver19).toBe(true);
    expect(presented).not.toHaveProperty("residenceValid");
    expect(presented).not.toHaveProperty("regionLevel1");
    expect(vp.presentationPurpose).toBe("HOUSING_CONTRACT_VERIFICATION");
    expect(vp.type).toEqual(["VerifiablePresentation"]);
  });
});
