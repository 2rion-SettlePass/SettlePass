/**
 * AI 리뷰 use-case 가 P2 에서 저장한 HousingPass 를 읽기 위한 포트.
 * P2 모듈을 수정하지 않기 위해 ai-review infrastructure 가 PrismaService 로 직접 구현한다.
 *
 * residenceExpiryMonth 는 credential.credentialSubject 에서 파싱한 체류 만료월(`YYYY-MM`)이며,
 * 정합성 계산(ResidencePeriodCheck VO)의 입력으로 사용한다. 없으면 undefined.
 */
export interface HousingPassView {
  id: string;
  residenceExpiryMonth?: string;
}

export interface HousingPassReaderPort {
  findById(id: string): Promise<HousingPassView | null>;
}

export const HOUSING_PASS_READER = Symbol("HOUSING_PASS_READER");
