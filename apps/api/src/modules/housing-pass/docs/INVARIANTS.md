# housing-pass Invariants

- Housing Pass contains only minimum housing claims.
- Private claims are never included in credentialSubject.
- `documentHash` is not part of Housing Pass.
- Credential JSON must be deterministic enough for later hashing and presentation.
