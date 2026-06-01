# audit-log Invariants

- All hashes must include nonce.
- `mockTxHash` must be clearly fake and Phase 1 only.
- `documentHash` must not become the primary audit value.
- No sensitive raw payload is stored in AuditLog.
