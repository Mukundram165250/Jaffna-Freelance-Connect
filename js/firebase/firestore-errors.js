/**
 * Standardized Firestore Error Handler conforming to Firebase Integration Skill
 */

const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write'
};

function handleFirestoreError(error, operationType, path, authInstance = null) {
  const currentUser = authInstance ? authInstance.currentUser : null;
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email
      })) || []
    },
    operationType,
    path
  };

  console.error('Firestore Error:', JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

if (typeof window !== "undefined") {
  window.handleFirestoreError = handleFirestoreError;
  window.FirestoreOperationType = OperationType;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { handleFirestoreError, OperationType };
}
