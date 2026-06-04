import type {
  HousingPassCredential,
  HousingPassCredentialSubject,
  IdentitySource,
} from "@settlepass/api-contracts";
import { HOUSING_ISSUER_DID } from "./issuer";

export interface BuildHousingPassCredentialInput {
  id: string;
  holderDid: string;
  claims: {
    identityVerified: boolean;
    ageOver19: boolean;
    residenceValid: boolean;
    regionLevel1?: string;
    residenceExpiryMonth?: string;
  };
  issuanceDate: string;
  expirationDate?: string;
  evidence?: {
    source: IdentitySource;
    verifiedAt: string;
  };
}

/**
 * 순수 함수 — Housing Pass VC JSON 을 조립한다.
 * credentialSubject 에는 공개 claim 만 담는다(비공개 claim 절대 미포함).
 */
export function buildHousingPassCredential(
  input: BuildHousingPassCredentialInput,
): HousingPassCredential {
  const { id, holderDid, claims, issuanceDate, expirationDate, evidence } =
    input;

  const credentialSubject: HousingPassCredentialSubject = {
    id: holderDid,
    identityVerified: claims.identityVerified,
    ageOver19: claims.ageOver19,
    residenceValid: claims.residenceValid,
  };
  if (claims.regionLevel1 !== undefined) {
    credentialSubject.regionLevel1 = claims.regionLevel1;
  }
  if (claims.residenceExpiryMonth !== undefined) {
    credentialSubject.residenceExpiryMonth = claims.residenceExpiryMonth;
  }

  const credential: HousingPassCredential = {
    id,
    type: ["VerifiableCredential", "HousingPassCredential"],
    issuer: HOUSING_ISSUER_DID,
    issuanceDate,
    credentialSubject,
  };
  if (expirationDate !== undefined) {
    credential.expirationDate = expirationDate;
  }
  if (evidence !== undefined) {
    credential.evidence = evidence;
  }

  return credential;
}
