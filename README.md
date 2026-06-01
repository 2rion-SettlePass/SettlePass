# SettlePass Agent Coding Wireframe Structure

1차 MVP 구현을 위한 AI 코딩 에이전트 전용 모노레포 폴더구조입니다.

## 목적
- 와이어프레임 기준으로 Next.js 화면 라우팅을 고정한다.
- NestJS 백엔드는 Clean Architecture + 도메인 모듈 구조로 고정한다.
- AI 코딩 에이전트가 임의 판단하지 않도록 제품/기술/화면/작업 문서를 분리한다.

## 1차 MVP 범위
- 주거계약 도메인만 구현
- Web App 데모
- OmniOne CX 실연동 가능 구조 + 외국인 claim Mock
- Housing Pass VC/VP JSON 시뮬레이션
- CLOVA OCR + AI 계약 리뷰
- consentHash / verificationHash / reviewHash DB 기록 + mockTxHash
- Sui, Walrus, PTB, zkLogin 제외
