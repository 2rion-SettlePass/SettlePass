import type {
  HousingClaimKey,
  HousingPassCredential,
} from "@settlepass/api-contracts";

export interface BuildPresentationVpInput {
  id: string;
  holderDid: string;
  credential: HousingPassCredential;
  consentedClaims: HousingClaimKey[];
}

export interface PresentationVp {
  id: string;
  type: string[];
  holder: string;
  verifiableCredential: Array<{
    type: string[];
    credentialSubject: Record<string, unknown>;
  }>;
  presentationPurpose: string;
}

/**
 * 순수 함수 — 선택적 공개(VP)를 조립한다.
 * 제시되는 credentialSubject 에는 consentedClaims 와 실제 VC 에 존재하는 키의
 * 교집합만 담는다(비공개 claim 은 어떤 경우에도 미포함). holder DID(id) 는 항상 포함.
 */
export function buildPresentationVp(
  input: BuildPresentationVpInput,
): PresentationVp {
  const { id, holderDid, credential, consentedClaims } = input;

  const source = credential.credentialSubject as unknown as Record<
    string,
    unknown
  >;

  const presentedSubject: Record<string, unknown> = { id: holderDid };
  for (const claim of consentedClaims) {
    if (Object.prototype.hasOwnProperty.call(source, claim)) {
      presentedSubject[claim] = source[claim];
    }
  }

  return {
    id,
    type: ["VerifiablePresentation"],
    holder: holderDid,
    verifiableCredential: [
      {
        type: credential.type,
        credentialSubject: presentedSubject,
      },
    ],
    presentationPurpose: "HOUSING_CONTRACT_VERIFICATION",
  };
}
