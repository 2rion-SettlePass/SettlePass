# ocr Module

## Responsibility
Validate contract upload, run CLOVA OCR or fixture OCR, and produce masked normalized text.

## Owns
- OcrDocument
- normalized OCR text

## Does not own
- AI review generation
- reviewHash
- contract original long-term storage

## Dependency rule
- `domain/` is pure TypeScript and must not import NestJS, Prisma, HTTP clients, CLOVA, OpenAI, OmniOne CX, or chain SDKs.
- `application/` defines use cases and ports.
- `infrastructure/` implements ports.
- `presentation/` calls application use cases only.
- Cross-module access must go through ports or shared contract types.

## Phase 1 note
Phase 1 prioritizes a stable housing-contract demo and must preserve the mock/real boundary.
