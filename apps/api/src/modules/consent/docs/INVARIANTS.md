# consent Invariants

- Only requested public claims can be consented.
- Consent must generate `consentHash` with nonce.
- Consent cannot disclose private claims.
- Rejected consent must not generate a presentation.
