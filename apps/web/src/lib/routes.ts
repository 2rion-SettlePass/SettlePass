export const routes = {
  landing: '/',
  auth: '/auth',
  dashboard: '/dashboard',
  housingPass: '/housing-pass',
  consentRequest: (requestId: string) => `/consent/${requestId}`,
  contractUpload: '/contract-review/upload',
  aiReview: (reviewId: string) => `/contract-review/${reviewId}`,
  reviewConfirm: (reviewId: string) => `/contract-review/${reviewId}/confirm`,
  auditLog: '/audit-log',
  verifierNewRequest: '/verifier/requests/new',
  verifierRequest: (requestId: string) => `/verifier/requests/${requestId}`,
};
