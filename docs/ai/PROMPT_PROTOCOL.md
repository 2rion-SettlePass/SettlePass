# SettlePass Prompt Protocol

## Development-readiness request

```text
Read first:
- AGENTS.md
- CLAUDE.md
- README.md
- docs/product/PRD.md
- docs/engineering/ARCHITECTURE.md
- docs/engineering/CODING_CONVENTIONS.md
- docs/engineering/API.md
- docs/engineering/SECURITY.md
- docs/engineering/DATA_MODEL.md

Task:
Do not implement application logic.
Review readiness for [feature/module].

Return:
1. missing requirements
2. missing API contracts
3. missing DB models
4. missing fixtures
5. affected files
6. recommended task order
7. validation commands
```

## Implementation request

```text
Read first:
- AGENTS.md
- CLAUDE.md
- docs/ai/ORCHESTRATION.md
- docs/product/PRD.md
- docs/engineering/ARCHITECTURE.md
- docs/engineering/CODING_CONVENTIONS.md
- docs/engineering/API.md
- docs/engineering/SECURITY.md
- apps/api/src/modules/[module]/docs/MODULE.md
- apps/api/src/modules/[module]/docs/INVARIANTS.md
- apps/api/src/modules/[module]/docs/DECISIONS.md
- apps/api/src/modules/[module]/docs/PORTS.md
- specs/[feature]/requirements.md
- specs/[feature]/design.md
- specs/[feature]/tasks.md

Task:
Implement only [TASK-ID].

Rules:
- Do not implement future tasks.
- Do not change public API unless required by the spec.
- Do not add dependencies without approval.
- Do not violate module invariants.
- Do not import infrastructure code into domain or application layer.
- Before editing, summarize affected files.
- After editing, run validation commands listed in tasks.md.
- Update implementation-log.md.
```

## Review request

```text
Review only.
Do not edit files.

Read:
- changed files
- AGENTS.md
- CLAUDE.md
- relevant module docs
- relevant spec files

Check:
1. architecture boundary violations
2. sensitive data leaks
3. API contract drift
4. missing tests
5. fixture/mock ambiguity
6. Phase 1 scope violations
```

## Stop conditions
Claude must stop and ask when:
- a requirement conflicts with `PRD.md`
- a task requires storing forbidden data
- a task requires Sui/Walrus/PTB/zkLogin in Phase 1
- an API shape is missing from `packages/api-contracts`
- a DB schema change requires migration generation
- an external credential or server URL is missing
