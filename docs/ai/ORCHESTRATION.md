# SettlePass AI Orchestration

## Purpose
This document controls how Claude and human developers move through SettlePass implementation.

## States

```text
DISCOVERY
→ REQUIREMENTS
→ DESIGN
→ TASKING
→ IMPLEMENTATION
→ VERIFICATION
→ REVIEW
→ DOCUMENTATION
→ DONE
```

## Global rules
- Code changes are forbidden during DISCOVERY, REQUIREMENTS, DESIGN, and TASKING.
- One implementation task maps to one PR-sized change.
- When a requirement is ambiguous, stop and mark `[NEEDS CLARIFICATION]`.
- Do not opportunistically refactor unrelated files.
- Do not implement Sui, Walrus, PTB, or zkLogin in Phase 1.
- Do not store sensitive identity or contract originals.

## DISCOVERY
Goal:
- Understand the target feature.
- Find related product, API, module, and source files.

Required inputs:
- `AGENTS.md`
- `CLAUDE.md`
- `docs/product/PRD.md`
- `docs/engineering/ARCHITECTURE.md`
- relevant module docs

Output:
- relevant files
- affected modules
- blockers
- missing docs

Code modification:
- forbidden

## REQUIREMENTS
Goal:
- Convert a feature into testable requirements.

Output:
- `requirements.md`
- acceptance criteria
- edge cases
- non-goals

Code modification:
- forbidden

## DESIGN
Goal:
- Decide implementation strategy.

Output:
- `design.md`
- API contract
- data model impact
- port/adapter impact
- test plan

Code modification:
- forbidden

## TASKING
Goal:
- Split design into atomic tasks.

Task requirements:
- each task has file scope
- each task has acceptance criteria
- each task has validation commands
- each task is independently reviewable

Code modification:
- forbidden

## IMPLEMENTATION
Goal:
- Implement exactly one task.

Required inputs:
- relevant `requirements.md`
- relevant `design.md`
- relevant `tasks.md`
- relevant module docs
- relevant API/data model docs

Rules:
- no future task implementation
- no dependency addition without approval
- no architecture boundary violation
- no sensitive data persistence
- no raw external SDK calls outside adapters

## VERIFICATION
Required checks:
- `pnpm lint`
- `pnpm typecheck`
- relevant `pnpm test`
- relevant app build if route/API changed

If a command cannot be run, record why.

## REVIEW
Checklist:
- requirement satisfied
- API contract consistent
- DB schema consistent
- no sensitive data stored
- no module invariant violation
- tests/fixtures meaningful
- mock/real distinction clear

## DOCUMENTATION
Update when applicable:
- `docs/engineering/API.md`
- `docs/engineering/DATA_MODEL.md`
- `docs/engineering/SECURITY.md`
- module `DECISIONS.md`
- module `PORTS.md`
- feature `tasks.md`
- feature `implementation-log.md`

## DONE
Done requires:
- implementation complete
- verification done or explicitly blocked
- docs updated
- remaining risks listed
