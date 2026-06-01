export const routes = {
  landing: '/',
  auth: '/auth',
  dashboard: '/dashboard',
  housingPass: '/housing-pass',
  consentRequest: (requestId: string) => `/verification/requests/${requestId}`,
  contractUpload: '/contract-review/upload',
  aiReview: (reviewId: string) => `/contract-review/${reviewId}`,
  reviewConfirm: (reviewId: string) => `/contract-review/${reviewId}/confirm`,
  auditLog: '/audit-log',
  landlordNewRequest: '/landlord/requests/new',
  landlordResult: (requestId: string) => `/landlord/results/${requestId}`,
};
