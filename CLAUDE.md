# SettlePass Claude Rules

## Project
SettlePass Phase 1 MVP is a housing-contract Web App demo for foreign residents in Korea.

Core flow:
1. Mobile ID / mock identity authentication
2. Housing Pass creation
3. Landlord verification request
4. Selective claim disclosure consent
5. AI housing contract review
6. User review confirmation
7. consentHash / verificationHash / reviewHash audit logging

## Phase 1 scope
- Implement only the housing contract flow.
- Use Web App first. No mobile app in Phase 1.
- Use OmniOne CX adapter structure with `CX_REAL_MODE` and `CX_MOCK_MODE`.
- Use Foreigner Residence Card claim mock when real foreigner credential is unavailable.
- Use OpenDID VC/VP-compatible JSON simulation.
- Store audit logs in DB with `mockTxHash`.
- Keep `reviewHash` as the primary audit value.

## Explicit non-goals
Do not implement these in Phase 1:
- Sui
- Walrus
- PTB
- zkLogin
- Work Pass
- Finance Pass
- Telecom Pass
- real estate notarization
- fixed-date registration
- registry verification
- legal advice
- contract execution or e-signing
- contract original notarization
- `documentHash` as the core audit value

## Read first
Before editing, read:
- `AGENTS.md`
- `README.md`
- `docs/product/PRD.md`
- `docs/engineering/ARCHITECTURE.md`
- `docs/engineering/CODING_CONVENTIONS.md`
- `docs/engineering/API.md`
- `docs/engineering/SECURITY.md`
- relevant `specs/*/requirements.md`
- relevant `specs/*/design.md`
- relevant `specs/*/tasks.md`
- relevant `apps/api/src/modules/<module>/docs/*.md`

## Commands
- Install: `pnpm install`
- Dev: `pnpm dev`
- Web: `pnpm --filter @settlepass/web dev`
- API: `pnpm --filter @settlepass/api start:dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Test: `pnpm test`
- Build: `pnpm build`

## Hard rules
- Implement one task at a time.
- Do not implement future tasks.
- Do not add dependencies without approval.
- Do not access or print `.env`, `.env.local`, or production secrets.
- Do not store alien registration number, resident registration number, passport number, nationality, full address, raw visa status, ID images, or contract originals.
- Do not put Prisma, NestJS, HTTP clients, CLOVA OCR SDK, OpenAI SDK, OmniOne CX calls, or chain clients in `domain/`.
- Do not put business logic in controllers or React page components.
- All external integrations must be behind application-layer ports and infrastructure adapters.
- Mock values must include `mock`, `fixture`, or `phase1` in names or metadata.
- `mockTxHash` must never be represented as a real chain transaction hash.
- API changes must update `packages/api-contracts` and `docs/engineering/API.md`.
- Data model changes must update `docs/engineering/DATA_MODEL.md`.

## Work protocol
Before editing:
1. State which files will be touched.
2. State the exact task being implemented.
3. State which documents were read.
4. Stop if requirements are ambiguous.

After editing:
1. Summarize changed files.
2. List validation commands run.
3. List failed or skipped checks.
4. Update relevant docs or implementation logs.
5. Report remaining risks.

## Definition of done
A task is done only when:
- scope matches one task
- no architecture boundary violation exists
- no forbidden data is stored or logged
- relevant tests or fixtures are updated
- `pnpm lint`, `pnpm typecheck`, and relevant tests are considered
- documentation is updated when contracts, schema, or module rules change
