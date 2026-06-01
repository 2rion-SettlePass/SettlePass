# identity Invariants

- Raw alien registration number, resident registration number, passport number, nationality, full address, raw visa status, and ID images are never stored or returned.
- All external CX calls are hidden behind `MobileIdentityProviderPort`.
- Mock results must be marked as `CX_MOCK_WITH_FOREIGNER_CLAIM_MOCK`.
- Real CX pipeline with mock foreigner claims must be marked as `CX_REAL_WITH_FOREIGNER_CLAIM_MOCK`.
- Domain and application layers must not import HTTP clients or CX SDK code.
